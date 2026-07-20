import { createLogger, transports, format } from "winston";

/**
 * Liste aller sicherheitskritischen Schlüsselwörter (als reguläre Ausdrücke).
 * Eigenschaften, deren Schlüsselname auf eines dieser Muster passt (z. B. "password", 
 * "turnstileToken", "authorization"), werden im Log automatisch unkenntlich gemacht.
 */
const sensitiveKeys = [/password/i, /token/i, /secret/i, /credential/i, /cookie/i, /authorization/i, /turnstile/i];

/**
 * Ein benutzerdefinierter Winston-Formatter (Data Scrubbing), der Log-Objekte rekursiv 
 * nach sensiblen Schlüsseln durchsucht und deren Werte durch den Platzhalter `"[REDACTED]"` ersetzt.
 * Dies verhindert zuverlässig das versehentliche Loggen von Passwörtern, Tokens oder Auth-Headern.
 */
const redactSensitiveData = format((info) => {
  /**
   * Rekursive Hilfsfunktion zum Durchlaufen und Bereinigen von Objekten.
   * 
   * @param {any} obj - Das aktuell zu prüfende Objekt oder Element.
   */
  const scrub = (obj: any) => {
    if (!obj || typeof obj !== "object") return;
    
    for (const key of Object.keys(obj)) {
      // Wenn der Schlüsselname (z. B. "turnstileToken" oder "password") passt -> Zensieren!
      if (sensitiveKeys.some((regex) => regex.test(key))) {
        obj[key] = "[REDACTED]";
      } else if (typeof obj[key] === "object") {
        // Rekursiver Abstieg in verschachtelte Objekte (z. B. in Fehlerursachen wie `err.cause`)
        scrub(obj[key]);
      }
    }
  };

  scrub(info);
  return info;
});

/**
 * Der zentrale Winston-Fehlerlogger (`errorLogger`).
 * 
 * Konfiguration:
     * - Erfasst Logs ab dem Log-Level `"error"`.
 * - Wendet direkt an erster Stelle im Format-Pipeline-Combine den `redactSensitiveData`-Formatter an, 
 *   um sensible Daten vor jeglicher Ausgabe zu bereinigen.
 * - Fügt einen exakten Zeitstempel hinzu und formatiert die Ausgabe als strukturiertes JSON.
 * - Leitet die Protokolle an zwei Transportwege weiter: die Standardkonsole (`Console`) sowie eine lokale `error.log`-Datei.
 */
const errorLogger = createLogger({
  level: "error",
  // redactSensitiveData() wird als erster Schritt im Format-Combine ausgeführt, um den Schutz vor dem Schreiben sicherzustellen
  format: format.combine(
    redactSensitiveData(),
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: "error.log" }),
  ],
});

export default errorLogger;