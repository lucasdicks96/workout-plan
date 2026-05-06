import { ZodError } from "zod";
import { ErrorRequestHandler } from "express";
import errorLogger from "./logger";

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  // Fängt Zod-Fehler ab und macht daraus eine schöne, lesbare Nachricht
  if (err instanceof ZodError) {
    // Macht aus dem Array einen schönen Text: "email: Email ist erforderlich."
    const errorMessages = err.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join(" | ");

    return res.status(400).json({
      status: "fail",
      message: `Validierungsfehler: ${errorMessages}`,
    });
  }
  const statusCode = err.statusCode || 500;
  // 400er sind "fail" (Client-Fehler), 500er sind "error" (Server-Fehler)
  const status = statusCode >= 400 && statusCode < 500 ? "fail" : "error";
  const message = err.message || "Interner Serverfehler";

  errorLogger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Einheitliches Antwortformat!
  res.status(statusCode).json({
    status,
    message,
    data: null, // oder eventuelle Validierungsfehler
    ...(process.env.NODE_ENV === "development" ? { stack: err.stack } : {}),
  });
};

export default errorHandler;
