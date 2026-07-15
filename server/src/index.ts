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
env.config();

const app = express();

const PostgresqlStore = pgSession(session);

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: {
    error:
      "Zu viele Registrierungs- oder Login-Versuche. Bitte versuchen Sie es in einer Stunde erneut.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    error: "Zu viele Anfragen. Versuche es später erneut.",
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

app.set("trust proxy", 1);

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
