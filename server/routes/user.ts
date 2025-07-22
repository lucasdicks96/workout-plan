import bcrypt from "bcrypt";
import env from "dotenv";
import { NextFunction, Request, Response, Router } from "express";
import passport, { session } from "passport";
import pool from "../config/db";
import User from "../types/user";

const router = Router();
env.config();

router.post("/register", async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const { email, password } = req.body;

    const checkIfExists = await client.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    if (checkIfExists.rows.length > 0) {
      res.status(501).json({ message: "User already exists" });
    } else {
      const hashedPassword = await bcrypt.hash(password, 15);

      const result = await client.query(
        "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email",
        [email, hashedPassword]
      );
      res.status(201).json({ message: "User created", user: result.rows[0] });
    }
  } catch (err) {
    res.status(501).json({ message: "Registration error", error: err });
  } finally {
    client.release();
  }
});

router.post("/login", (req: Request, res: Response, next: NextFunction) => {
  console.log("login route ", req.body);
  passport.authenticate("local", (err: any, user: any, info: any) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res
        .status(401)
        .json({ message: info?.message || "Invalid credentials" });
    }

    req.logIn(user, (err) => {
      console.log("login route 2", req.body);
      if (err) {
        console.log("login route error", req.body);
        return next(err);
      }

      // User-ID in das Cookie setzen
      res.cookie("userId", user.id, {
        httpOnly: true, // Verhindert den Zugriff durch JavaScript im Browser
        secure: process.env.NODE_ENV === "production", // Setze es auf `true` in der Produktion, wenn HTTPS verwendet wird
        maxAge: 1000 * 60 * 120,
        sameSite: "strict", // Verhindert Cross-Site Request Forgery
      });

      return res.status(200).json({
        message: "Login successful",
        user: { id: user.id, email: user.email },
      });
    });
  })(req, res, next);
});

router.get("/status", async (req: Request, res: Response) => {
  // console.log("get status req.session:", req.session);
  if (!req.session || !req.session.id) {
    return res.status(401).json({ message: "Nicht autorisiert" });
  }
  // console.log("get status req.session.cookie:", req.cookies.userId);
  const client = await pool.connect();
  try {
    const result = await client.query(
      "SELECT id, email FROM users WHERE id = $1",
      [req.cookies.userId]
    );
    const user: User = result.rows[0];

    if (user) {
      // console.log("res.status(200):", user);
      return res.status(200).json({ user: user });
    } else {
      return res.status(401).json({ message: "Benutzer nicht gefunden" });
    }
  } catch (error) {
    console.error("Fehler bei der Überprüfung des Auth-Status:", error);
    return res.status(500).json({ message: "Interner Serverfehler" });
  } finally {
    client.release();
  }
});

router.get("/id", (req: Request, res: Response) => {
  if (req.cookies.userId) {
    return res.status(200).json({ uid: req.cookies.userId });
  } else {
    return res.status(400).json({ message: "User not authenticated" });
  }
});

router.post("/logout", (req: Request, res: Response, next: NextFunction) => {
  req.logout((err) => {
    if (err) {
      console.error("Fehler bei req.session.destroy:", err);
      return next(err);
    }
    req.session.destroy((err) => {
      if (err) {
        return res
          .status(500)
          .json({ message: "Logout fehlgeschlagen", error: err });
      }

      // Entfernt das Session-Cookie
      res.clearCookie("userId", { path: "/" });
      res.clearCookie("connect.sid", { path: "/" });
      return res.status(200).json({ message: "logged out" });
    });
  });
});

// function isAuthenticated(req: Request, res: Response, next: NextFunction) {
//   if (req.isAuthenticated()) {
//     return next();
//   }
//   return res.status(401).json({ message: "Not authorized. Please login" });
// }

// router.get("/users", isAuthenticated, (req: Request, res: Response) => {
//   res.json({ message: "Willkommen" });
// });

export default router;
