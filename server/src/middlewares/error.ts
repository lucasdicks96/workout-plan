import { ErrorRequestHandler } from "express";
import { z, ZodError } from "zod";
import errorLogger from "./logger";
import { AppError } from "../types/errors.types";

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  // 1. Zod v4 Error Handling (Ist sicher, betrifft nur Validierung)
  if (err instanceof ZodError) {
    return res.status(400).json({
      status: "fail",
      message: "Validierungsfehler bei den gesendeten Daten.",
      data: z.treeifyError(err),
    });
  }

  // 2. LOGGING FÜR DICH (Intern): Wir loggen IMMER die echten Details
  errorLogger.error({
    message: err.message || "Unbekannter Fehler",
    stack: err.stack,
    cause: err.cause, // Dein "blinder Passagier" aus dem Service
    path: req.path,
    method: req.method,
  });

  // 3. ANTWORT AN DEN CLIENT (Extern): Sicherheits-Check!

  // Ist es ein von dir kontrollierter Fehler (z.B. NotFound, Unauthorized)?
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      // Status dynamisch berechnen: 4xx = fail, 5xx = error
      status: err.statusCode >= 400 && err.statusCode < 500 ? "fail" : "error",
      message: err.message, // Sicher, weil du den Text geschrieben hast
      data: null,
    });
  }

  // 4. FALLBACK FÜR ALLES ANDERE: Der Fehler ist nicht von dir kontrolliert!
  return res.status(500).json({
    status: "error",
    message: "Interner Serverfehler", // Harter Fallback, überschreibt err.message
    data: null,
  });
};

export default errorHandler;
