import { createLogger, transports, format } from "winston";

// Liste aller Schlüsselwörter (als Regex), die niemals im Klartext im Log landen dürfen
const sensitiveKeys = [/password/i, /token/i, /secret/i, /credential/i, /cookie/i, /authorization/i, /turnstile/i];

// Custom Winston Formatter für Data Scrubbing
const redactSensitiveData = format((info) => {
  const scrub = (obj: any) => {
    if (!obj || typeof obj !== "object") return;
    
    for (const key of Object.keys(obj)) {
      // Wenn der Schlüsselname (z.B. "turnstileToken" oder "password") passt -> Zensieren!
      if (sensitiveKeys.some((regex) => regex.test(key))) {
        obj[key] = "[REDACTED]";
      } else if (typeof obj[key] === "object") {
        // Rekursiv weiter in verschachtelte Objekte reinschauen (z.B. in err.cause)
        scrub(obj[key]);
      }
    }
  };

  scrub(info);
  return info;
});

const errorLogger = createLogger({
  level: "error",
  // NEU: redactSensitiveData() direkt an erster Stelle im Format-Combine einfügen
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