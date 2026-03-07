import AppError from "../utils/appError.js";

export const notFoundHandler = (req, res) => {
  const error = new AppError(`Route not found: ${req.originalUrl}`, 404, "NOT_FOUND");
  return res.status(404).json({
    success: false,
    error: {
      code: error.code,
      message: error.message,
      details: error.details
    }
  });
};

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const code = err.code || (statusCode === 500 ? "INTERNAL_ERROR" : "REQUEST_ERROR");
  const message = err.message || "Internal server error";
  const details = err.details || null;

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details
    }
  });
};
