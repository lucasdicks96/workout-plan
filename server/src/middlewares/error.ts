import { ErrorRequestHandler } from "express";
import { z, ZodError } from "zod";
import { AppError } from "../types/errors.types";
import errorLogger from "./logger";

/**
 * Express Error-Handler Middleware (Zentraler Fehlerbehandlungs-Handler).
 * 
 * Fängt alle in der Anwendung auftretenden Fehler ab, verarbeitet sie je nach Typ 
 * und gibt eine sichere, strukturierte JSON-Antwort an den Client zurück:
 * 1. **ZodError**: Extrahiert Validierungsfehler für einzelne Felder und formatiert sie in ein klares DTO.
 * 2. **CSRF-Fehler**: Erkennt ungültige oder abgelaufene CSRF-Token und gibt einen 403 (Forbidden) Status zurück.
 * 3. **Internes Logging**: Protokolliert alle Fehler (inklusive Stacktrace und Ursache) über den `errorLogger`.
 * 4. **AppError**: Gibt kontrollierte Anwendungsfehler mit ihrem spezifischen Statuscode (4xx/5xx) aus.
 * 5. **Fallback**: Fängt alle übrigen, unkontrollierten Fehler ab und schützt vor dem Leak sensibler Details mit einem 500er (Internal Server Error).
 *
 * @type {ErrorRequestHandler}
 */
const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  // 1. Zod v4 Error Handling (Sichere Behandlung von Validierungsfehlern)
  if (err instanceof ZodError) {
    // A) Ziehe die allererste, konkrete Fehlermeldung für das Notification-Popup heraus
    const firstErrorMessage =
      err.issues[0]?.message || "Validierungsfehler bei den gesendeten Daten.";

    const fieldErrors: Record<string, string[]> = {};

    for (const issue of err.issues) {
      // Wenn ein Feld verschachtelt ist (z. B. ['user', 'name']), wird daraus "user.name"
      const fieldName = issue.path.join(".") || "_global";
      if (!fieldErrors[fieldName]) {
        fieldErrors[fieldName] = [];
      }
      fieldErrors[fieldName].push(issue.message);
    }

    return res.status(400).json({
      status: "fail",
      message: firstErrorMessage, // Schickt die präzise Fehlermeldung direkt an das UI-Popup
      data: {
        errors: fieldErrors, // Flaches, sauberes Fehler-DTO für die Formularvalidierung
      },
    });
  }

  // 2. CSRF-Fehler abfangen und sicher als 403 (Forbidden) zurückgeben
  if (
    err?.name === "ForbiddenError" ||
    err?.message === "invalid csrf token" ||
    err?.code === "EBADCSRFTOKEN" // Zusätzliches Fallback für verschiedene Express-CSRF-Versionen
  ) {
    return res.status(403).json({
      status: "error",
      message: "CSRF-Token ungültig oder abgelaufen.",
      code: "CSRF_ERROR",
    });
  }

  // 3. LOGGING: Protokollierung aller echten Fehlerdetails für Entwicklungs- und Diagnosezwecke
  errorLogger.error({
    message: err.message || "Unbekannter Fehler",
    stack: err.stack,
    cause: err.cause, // Interne Fehlerursache (z. B. aus Services)
    path: req.path,
    method: req.method,
  });

  // 4. ANTWORT AN DEN CLIENT (Sicherheits-Check für kontrollierte App-Fehler)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      // Status dynamisch berechnen: 4xx = fail, 5xx = error
      status: err.statusCode >= 400 && err.statusCode < 500 ? "fail" : "error",
      message: err.message, // Sicher, da der Text explizit von der Anwendung definiert wurde
    });
  }

  // 5. FALLBACK FÜR ALLES ANDERE: Der Fehler ist nicht kontrolliert oder unbekannt
  return res.status(500).json({
    status: "error",
    message: "Interner Serverfehler", // Harter Fallback zur Verhinderung von Info-Leaks
  });
};

export default errorHandler;