import bcrypt from "bcrypt";
import env from "dotenv";
import { NextFunction, Request, Response, Router } from "express";
import passport from "passport";
import pool from "../config/db";
import User from "../types/user";
import { isAuthenticated } from "../middlewares/auth.middleware";

const router = Router();
env.config();

router.post(
  "/register",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      const hashedPassword = await bcrypt.hash(password, 15);

      const result = await pool.query(
        "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email",
        [email, hashedPassword]
      );

      const newUser: User = result.rows[0];

      req.logIn(newUser, (err) => {
        console.log("login route 2", req.body);
        if (err) {
          return next(err);
        }

        res.cookie("userId", newUser.id, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          maxAge: 1000 * 60 * 120,
          sameSite: "strict",
        });

        res.status(201).json({
          message: "Benutzer erstellt und eingeloggt",
          user: { id: newUser.id, email: newUser.email },
        });
      });
    } catch (err: any) {
      if (err.code === "23505") {
        res
          .status(409)
          .json({ message: "Benutzer existiert bereits", error: err });
      } else {
        console.error(err);
        res.status(500).json({ message: "Interner Serverfehler", error: err });
      }
    }
  }
);
router.post("/login", (req: Request, res: Response, next: NextFunction) => {
  console.log("login route ", req.body);
  passport.authenticate("local", (err: any, user: any, info: any) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(401).json({ message: "Ungültige Zugangsdaten" });
    }

    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }

      res.cookie("userId", user.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 1000 * 60 * 60 * 12,
        sameSite: "strict",
      });

      return res.status(200).json({
        message: "Login erfolgreich",
        user: { id: user.id, email: user.email },
      });
    });
  })(req, res, next);
});

router.get("/status", isAuthenticated, async (req: Request, res: Response) => {
  const { password, ...userWithoutPassword } = req.user as User;
  return res.status(200).json({ user: userWithoutPassword });
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

      res.clearCookie("userId", { path: "/" });
      res.clearCookie("connect.sid", { path: "/" });
      return res.status(200).json({ message: "logged out" });
    });
  });
});

export default router;
