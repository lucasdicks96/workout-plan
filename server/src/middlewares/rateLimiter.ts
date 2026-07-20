import rateLimit, { ipKeyGenerator } from "express-rate-limit";

/**
 * Strenger Rate-Limiter für sicherheitsrelevante Authentifizierungs-Endpunkte (Login & Registrierung).
 * 
 * Schützt den Server vor Brute-Force-Angriffen und Credential Stuffing.
 * 
 * Konfiguration:
 * - **KeyGenerator**: Erzeugt einen spezifischen Präfix-Schlüssel (`rl_auth:<ip>`) basierend auf der Client-IP.
 * - **Zeitfenster (windowMs)**: 1 Stunde (`60 * 60 * 1000`).
 * - **Maximale Versuche (max)**: Maximal 5 Versuche pro IP innerhalb des Zeitfensters.
 * - **Test-Bypass (skip)**: Im Testmodus (`NODE_ENV === "test"`) wird der Limiter standardmäßig übersprungen, 
 *   es sei denn, der Request enthält den Header `x-test-rate-limit: true`.
 * - **Custom Handler**: Gibt bei Überschreitung des Limits eine strukturierte 429-Fehlermeldung im JSON-Format zurück.
 */
export const authLimiter = rateLimit({
  // Nutzt automatisch den blitzschnellen, internen MemoryStore
  keyGenerator: (req) => `rl_auth:${ipKeyGenerator(req.ip || "127.0.0.1")}`,
  windowMs: 60 * 60 * 1000, // 1 Stunde
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  // Deine Weiche für die Jest-Tests bleibt erhalten:
  skip: (req) => {
    if (process.env.NODE_ENV === "test") {
      return req.headers["x-test-rate-limit"] !== "true";
    }
    return false;
  },
  handler: (req, res, next, options) => {
    res.status(options.statusCode).json({
      status: "error",
      message:
        "Zu viele Registrierungs- oder Login-Versuche. Bitte versuchen Sie es in einer Stunde erneut.",
      code: 429,
    });
  },
});

/**
 * Allgemeiner API-Rate-Limiter zum Schutz der regulären Endpunkte vor Überlastung (DDoS, Spam oder Scraping).
 * 
 * Konfiguration:
 * - **KeyGenerator**: Generiert einen isolierten Schlüssel (`rl_api:<ip>`) pro Client-IP.
 * - **Zeitfenster (windowMs)**: Dynamisch konfiguriert (15 Minuten in der Produktion, 1 Sekunde in der lokalen Entwicklung / bei Tests).
 * - **Maximale Anfragen (max)**: Erlaubt bis zu 200 Anfragen im definierten Zeitfenster.
 * - **Test-Bypass (skip)**: Wird in automatisierten Tests (`NODE_ENV === "test"`) vollständig deaktiviert.
 * - **Custom Handler**: Liefert eine standardisierte 429-Fehlermeldung bei Überschreitung.
 */
export const apiLimiter = rateLimit({
  keyGenerator: (req) => `rl_api:${ipKeyGenerator(req.ip || "127.0.0.1")}`,
  windowMs: process.env.NODE_ENV === "production" ? 15 * 60 * 1000 : 1 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === "test",
  handler: (req, res, next, options) => {
    res.status(options.statusCode).json({
      status: "error",
      message: "Zu viele API-Anfragen. Bitte versuchen Sie es später erneut.",
      code: 429,
    });
  },
});