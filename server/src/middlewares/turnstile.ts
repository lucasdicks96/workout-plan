import { Request, Response, NextFunction } from "express";

/**
 * Express-Middleware: `verifyTurnstile`
 *
 * Validiert das Cloudflare Turnstile Bot-Abwehr-Token, das vom Client im Request-Body
 * (unter dem Schlüssel `turnstileToken`) mitgesendet wird.
 *
 * Ablauf der Überprüfung:
 * 1. Prüft, ob das Token im Request-Body vorhanden ist (andernfalls 400 Bad Request).
 * 2. Sendet eine Verifizierungsanfrage an die Cloudflare Siteverify-API (`https://challenges.cloudflare.com/turnstile/v0/siteverify`)
 *    unter Verwendung des geheimen Schlüssels (`TURNSTILE_SECRET_KEY`) und optional der Client-IP (`remoteip`).
 * 3. Prüft das Antwort-Ergebnis von Cloudflare. Bei ungültigem Token wird die Anfrage mit einem 403 (Forbidden) abgelehnt.
 * 4. Bei erfolgreicher Verifizierung wird die Anfrage per `next()` an den nächsten Handler (z. B. Zod-Validierung oder Controller) weitergereicht.
 * 5. Fängt Netzwerk- oder Serverfehler ab und gibt einen 500er (Internal Server Error) zurück.
 *
 * @async
 * @param {Request} req - Das Express-Request-Objekt (erwartet `req.body.turnstileToken` und optional `req.ip`).
 * @param {Response} res - Das Express-Response-Objekt.
 * @param {NextFunction} next - Die Express-Next-Funktion zur Weiterleitung bei erfolgreicher Prüfung.
 * @returns {Promise<Response | void>}
 */
export const verifyTurnstile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Wir erwarten, dass das Frontend den Token im Body als "turnstileToken" mitsendet
  const { turnstileToken } = req.body;

  if (!turnstileToken) {
    return res.status(400).json({
      status: "error",
      message: "Bot-Schutz Token fehlt. Bitte lade die Seite neu.",
      code: "TURNSTILE_MISSING",
    });
  }

  try {
    const formData = new URLSearchParams();
    formData.append("secret", process.env.TURNSTILE_SECRET_KEY || "");
    formData.append("response", turnstileToken);
    if (req.ip) {
      formData.append("remoteip", req.ip);
    }

    // Cloudflare-API abfragen (nutzt das native fetch von Node.js)
    const cfResponse = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: formData,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      },
    );

    const data = await cfResponse.json();

    if (!data.success) {
      console.warn("Turnstile Validierung abgelehnt:", data["error-codes"]);
      return res.status(403).json({
        status: "error",
        message:
          "Die Bot-Überprüfung ist fehlgeschlagen. Bitte versuche es erneut.",
        code: "TURNSTILE_FAILED",
      });
    }

    // Token ist gültig -> ab zum nächsten Schritt (Zod-Validierung / Controller)
    next();
  } catch (error) {
    console.error("Fehler bei der Cloudflare Turnstile Abfrage:", error);
    return res.status(500).json({
      status: "error",
      message:
        "Ein interner Fehler bei der Sicherheitsüberprüfung ist aufgetreten.",
      code: "TURNSTILE_SERVICE_ERROR",
    });
  }
};
