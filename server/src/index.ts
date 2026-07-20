import pgSession from "connect-pg-simple";
import cookieParser from "cookie-parser";
import cors from "cors";
import env from "dotenv";
import express from "express";
import session, { SessionOptions } from "express-session";
import pool from "./config/db";
import passport from "./config/passport";
import errorHandler from "./middlewares/error";
import userRoute from "./routes/auth.route";
import exerciseRoute from "./routes/exercise.route";
import workoutRoute from "./routes/workout.route";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { doubleCsrf } from "csrf-csrf";
import { apiLimiter, authLimiter } from "./middlewares/rateLimiter";

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
if (process.env.NODE_ENV === "production") {
  app.use((req, res, next) => {
    console.log("--------------------------------");
    console.log("Incoming Request:", req.method, req.url);
    console.log("Remote IP:", req.ip);
    console.log("X-Forwarded-For Header:", req.headers["x-forwarded-for"]);
    console.log("--------------------------------");
    next();
  });
}

/** PostgreSQL-basierter Session-Store für express-session. */
const PostgresqlStore = pgSession(session);

/**
 * CORS-Konfiguration.
 * Erlaubt Anfragen von definierten Origins und aktiviert die Übertragung von Anmeldeinformationen (Cookies/Sessions).
 */
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://192.168.50.154:8443",
      "https://lucaslabs.dev",
    ],
    optionsSuccessStatus: 200,
    credentials: true,
  }),
);

/** Body-Parser Middleware für JSON und URL-encoded Payloads. */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/** Cookie-Parser Middleware zum Auslesen von Anfragen-Cookies. */
app.use(cookieParser());

/**
 * Konfiguration des Session-Managements.
 * Speichert Sessions persistent in der PostgreSQL-Datenbank (`sessions`-Tabelle).
 * Konfiguriert Cookie-Sicherheitsparameter dynamisch je nach Ausführungsumgebung.
 */
const sessionConfig: SessionOptions = {
  store: new PostgresqlStore({
    pool: pool,
    tableName: "sessions",
    createTableIfMissing: false,
  }),
  secret: process.env.SESSION_SECRET || "default secret",
  resave: false,
  saveUninitialized: false,
  unset: "destroy",
  cookie: {
    path: "/",
    secure: process.env.NODE_ENV === "production" ? true : false,
    httpOnly: true,
    maxAge: 1000 * 3600 * 12,
    sameSite: (process.env.NODE_ENV === "production" ? "none" : "lax") as
      | "none"
      | "lax",
  },
};

/** Aktiviert die Session-Verarbeitung. */
app.use(session(sessionConfig));

/** Initialisiert Passport.js für die Benutzerauthentifizierung und Session-Verwaltung. */
app.use(passport.initialize());
app.use(passport.session());

/**
 * CSRF-Schutz-Konfiguration.
 * In Production: Nutzt `doubleCsrf` zur Validierung von Anti-CSRF-Tokens über gesicherte Cookies und Session-IDs.
 * In Development: Stellt ein Dummy-Token für vereinfachtes lokales Testen bereit.
 */
if (process.env.NODE_ENV === "production") {
  const { doubleCsrfProtection, generateCsrfToken } = doubleCsrf({
    getSecret: () =>
      process.env.CSRF_SECRET || "ein-sehr-geheimes-langes-passwort",
    getSessionIdentifier: (req) => {
      return req.session.id;
    },

    cookieName: "__Host-xsrf-token",
    cookieOptions: {
      sameSite: "lax",
      secure: true,
    },
  });

  /**
   * Endpunkt zur Bereitstellung eines frisch generierten CSRF-Tokens für den Client.
   * 
   * @route GET /csrf-token
   * @returns {{ csrfToken: string }} JSON-Objekt mit dem CSRF-Token.
   */
  app.get("/csrf-token", (req, res) => {
    (req.session as any).csrfInitialized = true;
    const csrfToken = generateCsrfToken(req, res);
    res.json({ csrfToken });
  });

  /** Globale Middleware zur Prüfung des CSRF-Tokens bei schreibenden Zugriffen. */
  app.use(doubleCsrfProtection);
} else {
  /**
   * Entwicklungs-Endpunkt für CSRF-Tokens.
   * 
   * @route GET /csrf-token
   * @returns {{ csrfToken: string }} Ein statisches Dummy-Token für lokale Tests.
   */
  app.get("/csrf-token", (req, res) => {
    res.json({ csrfToken: "local-dev-dummy-token" });
  });
}

/**
 * Rate-Limiting-Zuordnungen.
 * Schützt sensible Endpunkte (Authentifizierung, API-Abfragen) vor Brute-Force- und Denial-of-Service-Angriffen.
 */
app.use("/user/register", authLimiter);
app.use("/user/login", authLimiter);
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