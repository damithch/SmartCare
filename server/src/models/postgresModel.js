import crypto from "crypto";
import { pool } from "../config/db.js";

const registry = new Map();

const clone = (value) => {
  if (value === undefined || value === null) return value;
  return JSON.parse(JSON.stringify(value));
};

const newId = () => crypto.randomBytes(12).toString("hex");

const toComparable = (value) => {
  if (value instanceof Date) return value.getTime();
  if (typeof value === "string") {
    const time = Date.parse(value);
    if (!Number.isNaN(time) && /\d{4}-\d{2}-\d{2}/.test(value)) return time;
  }
  return value;
};

const getPath = (obj, path) =>
  path.split(".").reduce((acc, key) => {
    if (acc === undefined || acc === null) return undefined;
    if (Array.isArray(acc) && /^\d+$/.test(key)) return acc[Number(key)];
    if (Array.isArray(acc)) return acc.map((item) => item?.[key]).flat();
    return acc[key];
  }, obj);

const setPath = (obj, path, value) => {
  const keys = path.split(".");
  let target = obj;
  for (let index = 0; index < keys.length - 1; index += 1) {
    const key = keys[index];
    if (!target[key]) return;
    target = target[key];
  }
  target[keys.at(-1)] = value;
};

const valuesEqual = (left, right) => {
  if (left?.toString && typeof left !== "string") left = left.toString();
  if (right?.toString && typeof right !== "string") right = right.toString();
  return String(left) === String(right);
};

const matchesOperator = (actual, operator, expected) => {
  const actualValue = toComparable(actual);
  const expectedValue = toComparable(expected);

  if (operator === "$gte") return actualValue >= expectedValue;
  if (operator === "$gt") return actualValue > expectedValue;
  if (operator === "$lte") return actualValue <= expectedValue;
  if (operator === "$lt") return actualValue < expectedValue;
  if (operator === "$ne") return !valuesEqual(actual, expected);
  if (operator === "$in") return expected.some((item) => valuesEqual(actual, item));
  if (operator === "$nin") return !expected.some((item) => valuesEqual(actual, item));
  if (operator === "$exists") return expected ? actual !== undefined : actual === undefined;
  if (operator === "$regex") return new RegExp(expected, "i").test(String(actual ?? ""));
  return false;
};

const matchesField = (actual, expected) => {
  if (Array.isArray(actual)) return actual.some((item) => matchesField(item, expected));
  if (expected instanceof RegExp) return expected.test(String(actual ?? ""));
  if (expected && typeof expected === "object" && !(expected instanceof Date)) {
    if (expected.$regex) {
      return new RegExp(expected.$regex, expected.$options || "").test(String(actual ?? ""));
    }
    return Object.entries(expected).every(([operator, value]) => matchesOperator(actual, operator, value));
  }
  return valuesEqual(actual, expected);
};

const matchesExpr = (doc, expr) => {
  const operator = expr?.$lte ? "$lte" : expr?.$lt ? "$lt" : null;
  if (!operator) return true;
  const [left, right] = expr[operator].map((part) =>
    typeof part === "string" && part.startsWith("$") ? getPath(doc, part.slice(1)) : part
  );
  return operator === "$lte" ? Number(left) <= Number(right) : Number(left) < Number(right);
};

const matchesQuery = (doc, query = {}) =>
  Object.entries(query).every(([field, expected]) => {
    if (field === "$or") return expected.some((branch) => matchesQuery(doc, branch));
    if (field === "$expr") return matchesExpr(doc, expected);
    const actual = field === "_id" ? doc._id : getPath(doc, field);
    return matchesField(actual, expected);
  });

const normalizePopulate = (path, select) => {
  if (Array.isArray(path)) return path.map((entry) => normalizePopulate(entry)).flat();
  if (typeof path === "object") return [{ path: path.path, select: path.select, populate: normalizePopulate(path.populate || []) }];
  return path ? [{ path, select, populate: [] }] : [];
};

const applySelect = (doc, select) => {
  if (!doc || !select) return doc;
  const fields = String(select).split(/\s+/).filter(Boolean);
  if (fields.length === 0) return doc;
  if (fields.every((field) => field.startsWith("+"))) return doc;
  const plain = typeof doc.toObject === "function" ? doc.toObject() : clone(doc);
  if (fields.every((field) => field.startsWith("-"))) {
    fields.forEach((field) => delete plain[field.slice(1)]);
    return plain;
  }
  const selected = { _id: plain._id };
  fields
    .map((field) => field.replace(/^\+/, ""))
    .forEach((field) => {
      if (plain[field] !== undefined) selected[field] = plain[field];
    });
  return selected;
};

const collectionForPath = (model, path) => model.refs[path] || model.refs[path.split(".").at(-1)];

const attachArrayHelpers = (value) => {
  if (!Array.isArray(value)) return value;
  if (!Object.prototype.hasOwnProperty.call(value, "id")) {
    Object.defineProperty(value, "id", {
      value: (id) => value.find((item) => String(item?._id) === String(id)),
      enumerable: false,
      configurable: true
    });
  }
  if (!Object.prototype.hasOwnProperty.call(value, "pull")) {
    Object.defineProperty(value, "pull", {
      value: (id) => {
        const index = value.findIndex((item) => String(item?._id) === String(id));
        if (index >= 0) value.splice(index, 1);
        return value;
      },
      enumerable: false,
      configurable: true
    });
  }
  value.forEach(attachDocumentHelpers);
  return value;
};

const attachDocumentHelpers = (value) => {
  if (!value || typeof value !== "object") return value;
  if (Array.isArray(value)) return attachArrayHelpers(value);
  Object.values(value).forEach(attachDocumentHelpers);
  return value;
};

const depopulateRefs = (plain, refs) => {
  Object.keys(refs || {}).forEach((path) => {
    if (path.includes(".")) return;
    const value = getPath(plain, path);
    if (value && typeof value === "object" && value._id) {
      setPath(plain, path, value._id);
    }
  });
  return plain;
};

class Document {
  constructor(model, data = {}, isNew = true) {
    Object.defineProperty(this, "__model", { value: model, enumerable: false });
    Object.defineProperty(this, "__isNew", { value: isNew, writable: true, enumerable: false });
    Object.defineProperty(this, "__original", { value: clone(data), writable: true, enumerable: false });
    Object.assign(this, clone(data));
    attachDocumentHelpers(this);
  }

  get id() {
    return this._id;
  }

  isModified(field) {
    return JSON.stringify(this[field]) !== JSON.stringify(this.__original?.[field]);
  }

  toObject() {
    const plain = {};
    Object.keys(this).forEach((key) => {
      plain[key] = clone(this[key]);
    });
    return plain;
  }

  toJSON() {
    return this.toObject();
  }

  async save() {
    await this.__model.saveDocument(this);
    this.__isNew = false;
    this.__original = this.toObject();
    return this;
  }

  async deleteOne() {
    await pool.query("DELETE FROM smartcare_documents WHERE collection = $1 AND id = $2", [
      this.__model.collection,
      this._id
    ]);
  }

  populate(path, select) {
    let chain = this.__model.populateOne(this, normalizePopulate(path, select).flat());
    const wrapper = {
      populate: (nextPath, nextSelect) => {
        chain = chain.then(() => this.__model.populateOne(this, normalizePopulate(nextPath, nextSelect)));
        return wrapper;
      },
      then: (resolve, reject) => chain.then(() => this).then(resolve, reject),
      catch: (reject) => chain.then(() => this).catch(reject)
    };
    return wrapper;
  }
}

class Query {
  constructor(model, type, query) {
    this.model = model;
    this.type = type;
    this.query = query;
    this.sortSpec = null;
    this.skipCount = 0;
    this.limitCount = null;
    this.selectSpec = null;
    this.populates = [];
  }

  sort(spec) {
    this.sortSpec = spec;
    return this;
  }

  skip(count) {
    this.skipCount = Number(count) || 0;
    return this;
  }

  limit(count) {
    this.limitCount = Number(count);
    return this;
  }

  select(spec) {
    this.selectSpec = spec;
    return this;
  }

  populate(path, select) {
    this.populates.push(...normalizePopulate(path, select).flat());
    return this;
  }

  async exec() {
    let docs = await this.model.findMatching(this.query);
    if (this.sortSpec) {
      const entries = Object.entries(this.sortSpec);
      docs.sort((left, right) => {
        for (const [field, direction] of entries) {
          const a = toComparable(getPath(left, field));
          const b = toComparable(getPath(right, field));
          if (a < b) return direction < 0 ? 1 : -1;
          if (a > b) return direction < 0 ? -1 : 1;
        }
        return 0;
      });
    }
    if (this.type === "one") docs = docs.slice(0, 1);
    if (this.skipCount) docs = docs.slice(this.skipCount);
    if (this.limitCount !== null) docs = docs.slice(0, this.limitCount);

    let result = this.type === "one" ? docs[0] || null : docs;
      if (this.populates.length) result = await this.model.populateResult(result, this.populates);
    if (this.selectSpec) {
      result = Array.isArray(result)
        ? result.map((doc) => applySelect(doc, this.selectSpec))
        : applySelect(result, this.selectSpec);
    }
    return result;
  }

  then(resolve, reject) {
    return this.exec().then(resolve, reject);
  }

  catch(reject) {
    return this.exec().catch(reject);
  }
}

export const createJsonModel = (name, options = {}) => {
  class Model extends Document {
    constructor(data) {
      super(Model, { ...clone(options.defaults || {}), ...clone(data), _id: data?._id || newId() }, true);
    }

    static get collection() {
      return name;
    }

    static get refs() {
      return options.refs || {};
    }

    static async all() {
      const { rows } = await pool.query(
        "SELECT id, data, created_at, updated_at FROM smartcare_documents WHERE collection = $1",
        [name]
      );
      return rows.map((row) =>
        new Model.DocumentClass({
          ...row.data,
          _id: row.id,
          createdAt: row.data.createdAt || row.created_at,
          updatedAt: row.data.updatedAt || row.updated_at
        }, false)
      );
    }

    static async findMatching(query = {}) {
      return (await this.all()).filter((doc) => matchesQuery(doc, query));
    }

    static find(query = {}) {
      return new Query(this, "many", query);
    }

    static findOne(query = {}) {
      return new Query(this, "one", query);
    }

    static findById(id) {
      return new Query(this, "one", { _id: String(id) });
    }

    static async create(data) {
      const doc = new this(data);
      await doc.save();
      return doc;
    }

    static async countDocuments(query = {}) {
      return (await this.findMatching(query)).length;
    }

    static async findByIdAndUpdate(id, update, opts = {}) {
      const doc = await this.findById(id);
      if (!doc) return null;
      Object.assign(doc, update);
      await doc.save();
      return opts.new === false ? null : doc;
    }

    static async findOneAndUpdate(query, update, opts = {}) {
      let doc = await this.findOne(query);
      if (!doc && opts.upsert) {
        doc = new this({ ...query, ...update });
      }
      if (!doc) return null;
      Object.assign(doc, update);
      await doc.save();
      return doc;
    }

    static async updateMany(query, update) {
      const docs = await this.findMatching(query);
      await Promise.all(docs.map((doc) => Object.assign(doc, update).save()));
      return { matchedCount: docs.length, modifiedCount: docs.length };
    }

    static async aggregate(pipeline = []) {
      let docs = (await this.all()).map((doc) => doc.toObject());
      for (const stage of pipeline) {
        if (stage.$match) docs = docs.filter((doc) => matchesQuery(doc, stage.$match));
        if (stage.$group) {
          const field = stage.$group._id.replace(/^\$/, "");
          const grouped = new Map();
          docs.forEach((doc) => {
            const key = getPath(doc, field);
            grouped.set(key, (grouped.get(key) || 0) + 1);
          });
          docs = [...grouped.entries()].map(([_id, count]) => ({ _id, count }));
        }
        if (stage.$sort) {
          const [[field, direction]] = Object.entries(stage.$sort);
          docs.sort((a, b) => (a[field] < b[field] ? -direction : direction));
        }
      }
      return docs;
    }

    static async saveDocument(doc) {
      if (!doc.createdAt) doc.createdAt = new Date().toISOString();
      doc.updatedAt = new Date().toISOString();
      if (options.beforeSave) await options.beforeSave(doc, this);
      attachDocumentHelpers(doc);
      const plain = depopulateRefs(doc.toObject(), this.refs);
      await pool.query(
        `INSERT INTO smartcare_documents (collection, id, data, created_at, updated_at)
         VALUES ($1, $2, $3::jsonb, COALESCE($4, NOW()), NOW())
         ON CONFLICT (collection, id)
         DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
        [name, doc._id, JSON.stringify(plain), doc.createdAt]
      );
    }

    static async populateResult(result, populates) {
      if (!result) return result;
      if (Array.isArray(result)) return Promise.all(result.map((doc) => this.populateOne(doc, populates)));
      return this.populateOne(result, populates);
    }

    static async populateOne(doc, populates) {
      for (const populate of populates) {
        const refName = collectionForPath(this, populate.path);
        const refModel = registry.get(refName);
        if (!refModel) continue;
        await populatePath(doc, populate.path.split("."), refModel, populate.select, populate.populate);
      }
      return doc;
    }
  }

  Model.DocumentClass = class extends Model {
    constructor(data, isNew) {
      super(data);
      this.__isNew = isNew;
      this.__original = clone(data);
    }
  };

  registry.set(name, Model);
  return Model;
};

const populatePath = async (target, keys, refModel, select, nestedPopulates = []) => {
  if (!target || keys.length === 0) return;
  const [key, ...rest] = keys;
  if (Array.isArray(target)) {
    await Promise.all(target.map((item) => populatePath(item, keys, refModel, select)));
    return;
  }
  if (rest.length > 0) {
    await populatePath(target[key], rest, refModel, select, nestedPopulates);
    return;
  }
  const id = target[key];
  if (!id || typeof id === "object") return;
  const doc = await refModel.findById(id);
  if (doc && nestedPopulates?.length) {
    await refModel.populateOne(doc, nestedPopulates);
  }
  target[key] = applySelect(doc, select);
};
