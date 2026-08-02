import pgSession from "connect-pg-simple";
import session, { SessionOptions } from "express-session";
import pool from "./db";

/** PostgreSQL-basierter Session-Store für express-session. */
const PostgresqlStore = pgSession(session);

/**
 * Konfiguration des Session-Managements.
 * Speichert Sessions persistent in der PostgreSQL-Datenbank (`sessions`-Tabelle).
 * Konfiguriert Cookie-Sicherheitsparameter dynamisch je nach Ausführungsumgebung.
 */
export const sessionConfig: SessionOptions = {
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
