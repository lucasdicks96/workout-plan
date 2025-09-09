import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import User from "../types/user";
import pool from "./db";

passport.use(
  "local",
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    async (email: string, password: string, done: any) => {
      const client = await pool.connect();
      try {
        const result = await client.query(
          "SELECT * FROM users WHERE email = $1",
          [email]
        );
        const user: User = result.rows[0];

        if (!user) {
          return done(null, false, { message: "User not found" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return done(null, false, { message: "Wrong password" });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      } finally {
        client.release();
      }
    }
  )
);

passport.serializeUser(function (user: any, done: any) {
  return done(null, user.id);
});

passport.deserializeUser(async function (id: number, done: any) {
  const client = await pool.connect();
  try {
    const result = await client.query("SELECT * FROM users WHERE id = $1", [
      id,
    ]);
    if (result.rows.length > 0) {
      const user: User = result.rows[0];
      done(null, user);
    } else {
      done(new Error("User not found"), null);
    }
  } catch (err) {
    done(err);
  } finally {
    client.release();
  }
});

export default passport;
