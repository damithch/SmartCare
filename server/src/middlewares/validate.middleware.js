import AppError from "../utils/appError.js";

export const validate = (validator, source = "body") => (req, res, next) => {
  const payload = req[source] || {};
  const { value, errors } = validator(payload);

  if (errors.length > 0) {
    return next(new AppError("Validation failed", 400, "VALIDATION_ERROR", errors));
  }

  req[source] = value;
  return next();
};
