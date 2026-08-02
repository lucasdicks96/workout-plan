import { csrfSync } from "csrf-sync";

/**
 * CSRF-Schutz-Konfiguration.
 * csrfSync bietet synchronisierten CSRF-Schutz für Express-Anwendungen.
 * 1. CSRF-Token wird automatisch in req.session.csrfToken gespeichert.
 * 2. Token kann über den Header 'x-csrf-token' vom Frontend gesendet werden.
 * 3. Globale Middleware prüft POST, PUT, PATCH und DELETE Requests auf gültigen Token.
 */
export const { csrfSynchronisedProtection, generateToken } = csrfSync({
  // Standardmäßig wird das Token aus dem Header 'x-csrf-token' gelesen.
  getTokenFromRequest: (req) => req.headers["x-csrf-token"] as string,
});
