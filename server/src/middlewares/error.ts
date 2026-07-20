import { ErrorRequestHandler } from "express";
import { z, ZodError } from "zod";
import { AppError } from "../types/errors.types";
import errorLogger from "./logger";

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  // 1. Zod v4 Error Handling (Ist sicher, betrifft nur Validierung)
  if (err instanceof ZodError) {
    // A) Ziehe die allererste, konkrete Fehlermeldung für das Notification-Popup heraus:
    const firstErrorMessage =
      err.issues[0]?.message || "Validierungsfehler bei den gesendeten Daten.";

    const fieldErrors: Record<string, string[]> = {};

    for (const issue of err.issues) {
      // Wenn ein Feld verschachtelt ist (z.B. ['user', 'name']), wird daraus "user.name"
      const fieldName = issue.path.join(".") || "_global";
      if (!fieldErrors[fieldName]) {
        fieldErrors[fieldName] = [];
      }
      fieldErrors[fieldName].push(issue.message);
    }

    return res.status(400).json({
      status: "fail",
      message: firstErrorMessage, // <-- Schickt "Muss mindestens eine Kategorie enthalten.1" direkt ans Popup
      data: {
        errors: fieldErrors, // <-- Flaches, sauberes DTO ohne Deprecation!
      },
    });
  }

  // 2. CSRF Fehler abfangen und sicher als 403 (Forbidden) zurückgeben!
  if (
    err?.name === "ForbiddenError" ||
    err?.message === "invalid csrf token" ||
    err?.code === "EBADCSRFTOKEN" // Zusätzliches Fallback für manche Express-CSRF Versionen
  ) {
    return res.status(403).json({
      status: "error",
      message: "CSRF-Token ungültig oder abgelaufen.",
      code: "CSRF_ERROR",
    });
  }

  // 3. LOGGING FÜR DICH (Intern): Wir loggen IMMER die echten Details
  errorLogger.error({
    message: err.message || "Unbekannter Fehler",
    stack: err.stack,
    cause: err.cause, // Dein "blinder Passagier" aus dem Service
    path: req.path,
    method: req.method,
  });

  // 4. ANTWORT AN DEN CLIENT (Extern): Sicherheits-Check!

  // Ist es ein von dir kontrollierter Fehler (z.B. NotFound, Unauthorized)?
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      // Status dynamisch berechnen: 4xx = fail, 5xx = error
      status: err.statusCode >= 400 && err.statusCode < 500 ? "fail" : "error",
      message: err.message, // Sicher, weil du den Text geschrieben hast
      data: null,
    });
  }

  // 5. FALLBACK FÜR ALLES ANDERE: Der Fehler ist nicht von dir kontrolliert!
  return res.status(500).json({
    status: "error",
    message: "Interner Serverfehler", // Harter Fallback, überschreibt err.message
    data: null,
  });
};

export default errorHandler;
