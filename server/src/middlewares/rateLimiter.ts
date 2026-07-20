import rateLimit, { ipKeyGenerator } from "express-rate-limit";

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
