import { ApiResponse } from "@workout/shared"; // Geändert zu ApiResponse
import { NextFunction, Request, Response, Router } from "express";
import passport from "passport";
import { isAuthenticated } from "../middlewares/isAuthenticated";
import * as userService from "../services/user.service";
import { InternalServerError, UnauthorizedError } from "../types/errors.types";
import { UserWithoutPassword } from "../types/user.types";
import {
  AuthenticatedRequest,
  authenticatedHandler,
} from "../utils/auth.utils";
import { verifyTurnstile } from "../middlewares/turnstile";

import {
  AuthCredentialsBody,
  authCredentialsSchema,
} from "../schemas/user.schema";

const router = Router();

const logInAsync = (req: Request, user: Express.User) =>
  new Promise<void>((resolve, reject) => {
    req.logIn(user, (err) => (err ? reject(err) : resolve()));
  });

router.post(
  "/register",
  verifyTurnstile,
  async (
    req: Request<any, any, AuthCredentialsBody>,
    res: Response<ApiResponse<UserWithoutPassword>>,
    next: NextFunction,
  ) => {
    try {
      const { email, password } = authCredentialsSchema.parse(req.body);
      const user = await userService.createUser(email, password);

      await logInAsync(req, user);

      return res.status(201).json({
        status: "success",
        data: user,
        message: "Benutzer erstellt und eingeloggt",
      });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/login",
  (
    req: Request<any, any, AuthCredentialsBody>,
    res: Response<ApiResponse<UserWithoutPassword>>,
    next: NextFunction,
  ) => {
    // Pre-Validierung vor Passport
    try {
      authCredentialsSchema.parse(req.body);
    } catch (error) {
      return next(error);
    }

    passport.authenticate("local", async (err: any, user: any, info: any) => {
      try {
        if (err) {
          return next(err);
        }
        if (!user) {
          return res.status(401).json({
            status: "fail",
            message: info?.message || "Ungültige Anmeldedaten.",
          });
        }

        await logInAsync(req, user);

        return res.status(200).json({
          status: "success",
          data: req.user as UserWithoutPassword,
          message: "Login erfolgreich",
        });
      } catch (err) {
        return next(err);
      }
    })(req, res, next);
  },
);

router.get(
  "/status",
  isAuthenticated,
  authenticatedHandler(
    async (
      req: AuthenticatedRequest<any, ApiResponse<UserWithoutPassword>, never>,
      res: Response<ApiResponse<UserWithoutPassword>>,
    ) => {
      if (!req.user) {
        throw new UnauthorizedError("Nicht autorisiert.");
      }

      return res.status(200).json({
        status: "success",
        data: req.user,
      });
    },
  ),
);

router.post(
  "/logout",
  async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    try {
      // 1. Session direkt in PostgreSQL zerstören (ersetzt req.logout komplett)
      await new Promise<void>((resolve, reject) => {
        if (!req.session) return resolve();

        req.session.destroy((err) =>
          err
            ? reject(
                new InternalServerError("Session konnte nicht beendet werden"),
              )
            : resolve(),
        );
      });

      const isProduction = process.env.NODE_ENV === "production";

      // 2. Session-Cookie im Browser löschen (mit exakten Optionen!)
      res.clearCookie("connect.sid", {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: isProduction,
      });

      // 3. NEU: Auch das CSRF-Cookie löschen
      const csrfCookieName = isProduction ? "__Host-xsrf-token" : "xsrf-token";
      res.clearCookie(csrfCookieName, {
        path: "/",
        sameSite: "lax",
        secure: isProduction,
      });

      return res.status(200).json({
        status: "success",
        message: "Logout erfolgreich",
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
