import { ErrorRequestHandler } from "express";
import errorLogger from "./logger";

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  const status = err.statusCode || 500;
  const message = err.message || "Interner Serverfehler";

  errorLogger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  res.status(status).json({
    error: {
      message,
      ...(process.env.NODE_ENV === "development" ? { stack: err.stack } : {}),
    },
  });
};

export default errorHandler;
