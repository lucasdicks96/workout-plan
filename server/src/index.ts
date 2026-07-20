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
env.config();

const app = express();

app.use(helmet());

app.set("trust proxy", "172.19.0.0/16");

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

const PostgresqlStore = pgSession(session);

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

  app.get("/csrf-token", (req, res) => {
    (req.session as any).csrfInitialized = true;
    const csrfToken = generateCsrfToken(req, res);
    res.json({ csrfToken });
  });

  app.use(doubleCsrfProtection);
} else {
  app.get("/csrf-token", (req, res) => {
    res.json({ csrfToken: "local-dev-dummy-token" });
  });
}

app.use("/user/register", authLimiter);
app.use("/user/login", authLimiter);
app.use("/workout", apiLimiter);
app.use("/exercise", apiLimiter);

app.use("/user", userRoute);
app.use("/exercise", exerciseRoute);
app.use("/workout", workoutRoute);

app.use(errorHandler);

export default app;
