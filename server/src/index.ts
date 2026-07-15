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
env.config();

const app = express();
app.use(helmet());

export const { doubleCsrfProtection, generateCsrfToken } = doubleCsrf({
  getSecret: () =>
    process.env.CSRF_SECRET || "ein-sehr-geheimes-langes-passwort",
  getSessionIdentifier: (req) => {
    // Verknüpft den Schutz unzertrennlich mit deiner Postgres-Session
    return req.session.id;
  },
  cookieName:
    process.env.NODE_ENV === "production" ? "__Host-xsrf-token" : "xsrf-token",
  cookieOptions: {
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" ? true : false,
  },
});

// Route zum Abholen des Tokens
app.get("/csrf-token", (req, res) => {
  res.json({ csrfToken: generateCsrfToken(req, res) });
});

app.set("trust proxy", "172.19.0.0/16");

app.use((req, res, next) => {
  console.log("--------------------------------");
  console.log("Incoming Request:", req.method, req.url);
  console.log("Remote IP:", req.ip);
  console.log("X-Forwarded-For Header:", req.headers["x-forwarded-for"]);
  console.log("--------------------------------");
  next();
});

const PostgresqlStore = pgSession(session);

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 5 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    res.status(options.statusCode).json({
      status: "error",
      message:
        "Zu viele Registrierungs- oder Login-Versuche. Bitte versuchen Sie es in einer Stunde erneut.",
      code: 429,
    });
  },
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  handler: (req, res, next, options) => {
    res.status(options.statusCode).json({
      status: "error",
      message:
        "Zu viele API-Anfragen. Bitte versuchen Sie es in einer Stunde erneut.",
      code: 429,
    });
  },
});

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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/csrf-token", (req, res) => {
  const csrfToken = generateCsrfToken(req, res);
  res.json({ csrfToken });
});

app.use(doubleCsrfProtection);

// 1. Definiere die Optionen separat
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
    // Exakte Typisierung
    sameSite: (process.env.NODE_ENV === "production" ? "none" : "lax") as
      | "none"
      | "lax",
  },
};

app.use(session(sessionConfig));

app.use(passport.initialize());
app.use(passport.session());

app.use("/user/register", authLimiter);
app.use("/user/login", authLimiter);
app.use("/workout", apiLimiter);
app.use("/exercise", apiLimiter);

app.use("/user", userRoute);
app.use("/exercise", exerciseRoute);
app.use("/workout", workoutRoute);

app.use(errorHandler);

export default app;
