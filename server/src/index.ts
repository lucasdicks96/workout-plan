import cookieParser from "cookie-parser";
import cors from "cors";
import env from "dotenv";
import express from "express";
import session from "express-session";
import helmet from "helmet";
import { corsConfig } from "./config/cors";
import { csrfSynchronisedProtection, generateToken } from "./config/csrf";
import passport from "./config/passport";
import { sessionConfig } from "./config/session";
import errorHandler from "./middlewares/error";
import { apiLimiter } from "./middlewares/rateLimiter";
import { requestLogger } from "./middlewares/requestLogger";
import userRoute from "./routes/auth.route";
import exerciseRoute from "./routes/exercise.route";
import workoutRoute from "./routes/workout.route";

// Lädt die Umgebungsvariablen aus der .env-Datei
env.config();

/**
 * Express-Anwendungsinstanz.
 * Konfiguriert Sicherheitseinstellungen, Session-Management,
 * Rate-Limiting, CSRF-Schutz und Anwendungs-Routen.
 */
const app = express();

/** Aktiviert grundlegende Sicherheits-Header via Helmet. */
app.use(helmet());

/**
 * Vertraut dem Reverse-Proxy im angegebenen Docker/Container-Netzwerk-Subnetz.
 * Erforderlich für die korrekte Ermittlung von `req.ip` und HTTPS-Erkennung hinter einem Proxy.
 */
app.set("trust proxy", "172.19.0.0/16");

/**
 * Middleware für Request-Logging im Produktionsmodus.
 * Protokolliert HTTP-Methode, Ziel-URL, Client-IP sowie `X-Forwarded-For`-Header.
 */
app.use(requestLogger);

/**
 * CORS-Konfiguration.
 * Erlaubt Anfragen von definierten Origins und aktiviert die Übertragung von Anmeldeinformationen (Cookies/Sessions).
 */
app.use(cors(corsConfig));

/** Body-Parser Middleware für JSON und URL-encoded Payloads. */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/** Aktiviert die Session-Verarbeitung. */
app.use(session(sessionConfig));

/** Cookie-Parser Middleware zum Auslesen von Anfragen-Cookies. */
app.use(cookieParser());

/** Initialisiert Passport.js für die Benutzerauthentifizierung und Session-Verwaltung. */
app.use(passport.initialize());
app.use(passport.session());

/**
 * Endpoint zum Abrufen eines CSRF-Tokens für das Frontend.
 * generateToken(req) speichert das Token automatisch in req.session.csrfToken
 * und gibt den String zurück.
 */
app.get("/csrf-token", (req, res) => {
  res.json({ csrfToken: generateToken(req) });
});

/** 3. Globale CSRF Protection (prüft POST, PUT, PATCH, DELETE)
 * nur in nicht-Testumgebungen aktivieren, da Tests sonst fehlschlagen.
 */
if (process.env.NODE_ENV !== "test") {
  app.use(csrfSynchronisedProtection);
}

/**
 * Rate-Limiting-Zuordnungen.
 * Schützt sensible Endpunkte (Authentifizierung, API-Abfragen) vor Brute-Force- und Denial-of-Service-Angriffen.
 */

app.use("/workout", apiLimiter);
app.use("/exercise", apiLimiter);

/**
 * Routen-Einbindungen.
 */
app.use("/user", userRoute);
app.use("/exercise", exerciseRoute);
app.use("/workout", workoutRoute);

/** Zentrale Fehlerbehandlungs-Middleware (catch-all for AppErrors and unexpected exceptions). */
app.use(errorHandler);

export default app;
