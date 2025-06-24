import bcrypt from "bcrypt";
import { NextFunction, Request, Response, Router } from "express";
import passport from "passport";
import pool from "../config/db";
// import { IUserModel } from "../types/userModel";

const router = Router();

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
      if (err) {
        return next(err);
      }

      // User-ID in der Session speichern (falls du es dort auch brauchst)
      req.session.sessionUser = { id: user.id, email: user.email };

      // User-ID in das Cookie setzen
      res.cookie("userId", user.id, {
        httpOnly: true, // Verhindert den Zugriff durch JavaScript im Browser
        secure: false, // Setze es auf `true` in der Produktion, wenn HTTPS verwendet wird
        maxAge: 1000 * 60 * 30, // Cookie-Gültigkeit (hier 30 Minuten)
        sameSite: "strict", // Verhindert Cross-Site Request Forgery
      });

      return res.status(200).json({ message: "Login successful", user });
    });
  })(req, res, next);
});

router.get("/users", isAuthenticated, (req: Request, res: Response) => {
  res.json({ message: "Willkommen" });
});

router.get("/id", (req: Request, res: Response) => {
  if (req.cookies.userId) {
    return res.json({ uid: req.cookies.userId });
  } else {
    return res.status(400).json({ message: "User not authenticated" });
  }
});

router.post("/logout", (req: Request, res: Response) => {
  req.logout(() => {
    res.json({ message: "logged out" });
  });
});

function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: "Not authorized. Please login" });
}

export default router;
