import Joi from "joi";

const isPostgresProvider = () => process.env.DATABASE_PROVIDER === "postgres";

const mongoObjectIdSchema = Joi.string().pattern(/^[0-9a-fA-F]{24}$/);

export const uuidSchema = Joi.string().guid({ version: ["uuidv4", "uuidv5"] });

export const createProviderAwareIdSchema = (invalidMessage, requiredMessage, { required = true } = {}) => {
  let schema = isPostgresProvider() ? uuidSchema : mongoObjectIdSchema;

  if (required) {
    schema = schema.required();
  } else {
    schema = schema.optional();
  }

  return schema.messages({
    "string.pattern.base": invalidMessage,
    "string.guid": invalidMessage,
    "string.empty": requiredMessage
  });
};
