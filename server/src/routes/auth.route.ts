import env from "dotenv";
import { NextFunction, Request, Response, Router } from "express";
import passport from "passport";
import { isAuthenticated } from "../middlewares/isAuthenticated";
import * as userService from "../services/user.service";
import {
  BadRequestError,
  ConflictError,
  InternalServerError,
  UnauthorizedError,
} from "../types/errors.types";

const router = Router();
env.config();

router.post(
  "/register",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        throw new BadRequestError("Email und Passwort sind erforderlich");
      }
      const newUser = await userService.createUser(email, password);

      req.logIn(newUser, (err) => {
        if (err) {
          return next(err);
        }

        res.status(201).json({
          message: "Benutzer erstellt und eingeloggt",
        });
      });
    } catch (error) {
      if (error instanceof ConflictError) {
        return res.status(409).json({ message: error.message });
      }
      next(error);
    }
  }
);
router.post("/login", (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate("local", (err: any, user: any, info: any) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res
        .status(401)
        .json({ message: info?.message || "Ungültige Anmeldedaten." });
    }

    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }

      return res.status(200).json({
        message: "Login erfolgreich",
        user: req.user,
      });
    });
  })(req, res, next);
});

router.get("/status", isAuthenticated, (req: Request, res: Response) => {
  const userWithoutPassword = req.user;
  if (!req.user) {
    throw new UnauthorizedError("Nicht authorisiert.");
  }
  return res.status(200).json({ user: userWithoutPassword });
});

router.post("/logout", (req: Request, res: Response, next: NextFunction) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.session.regenerate((err) => {
      if (err) return next(err);

      req.session.destroy((err) => {
        if (err) {
          throw new InternalServerError("Logout fehlgeschlagen");
        }
        res.clearCookie("connect.sid", { path: "/" });
        return res.status(200).json({ message: "Logout erfolgreich" });
      });
    });
  });
});

export default router;
