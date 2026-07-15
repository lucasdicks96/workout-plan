import { Request, Response, NextFunction } from "express";

export const verifyTurnstile = async (
  req: Request,
  res: Response,
  next: NextFunction
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
      }
    );

    const data = await cfResponse.json();

    if (!data.success) {
      console.warn("Turnstile Validierung abgelehnt:", data["error-codes"]);
      return res.status(403).json({
        status: "error",
        message: "Die Bot-Überprüfung ist fehlgeschlagen. Bitte versuche es erneut.",
        code: "TURNSTILE_FAILED",
      });
    }

    // Token ist gültig -> ab zum nächsten Schritt (Zod-Validierung / Controller)
    next();
  } catch (error) {
    console.error("Fehler bei der Cloudflare Turnstile Abfrage:", error);
    return res.status(500).json({
      status: "error",
      message: "Ein interner Fehler bei der Sicherheitsüberprüfung ist aufgetreten.",
      code: "TURNSTILE_SERVICE_ERROR",
    });
  }
};