import AppError from "../utils/appError.js";

export const validate = (schema, source = "body") => {
  return (req, res, next) => {
    const dataToValidate = req[source];

    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const details = error.details.reduce((acc, err) => {
        acc[err.path.join(".")] = err.message;
        return acc;
      }, {});

      return next(
        new AppError("Validation failed", 400, "VALIDATION_ERROR", details)
      );
    }

    req[source] = value;
    next();
  };
};
