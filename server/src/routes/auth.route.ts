import { ApiFailResponse, ApiSuccessResponse } from "@workout/shared";
import { NextFunction, Request, Response, Router } from "express";
import passport from "passport";
import { isAuthenticated } from "../middlewares/isAuthenticated";
import * as userService from "../services/user.service";
import { InternalServerError, UnauthorizedError } from "../types/errors.types";
import { UserWithoutPassword } from "../types/user.types";

import {
  authCredentialsSchema,
  AuthCredentialsBody,
} from "../schemas/user.schema";

const router = Router();

const logInAsync = (req: Request, user: Express.User) =>
  new Promise<void>((resolve, reject) => {
    req.logIn(user, (err) => (err ? reject(err) : resolve()));
  });

router.post(
  "/register",
  async (
    req: Request<any, any, AuthCredentialsBody>,
    res: Response<ApiSuccessResponse<UserWithoutPassword> | ApiFailResponse>,
    next: NextFunction,
  ) => {
    try {
      const { email, password } = authCredentialsSchema.parse(req.body);

      const user = await userService.createUser(email, password);

      await logInAsync(req, user);

      res.status(201).json({
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
    res: Response<ApiSuccessResponse<UserWithoutPassword> | ApiFailResponse>,
    next: NextFunction,
  ) => {
    // Pre-Validierung vor Passport!
    try {
      authCredentialsSchema.parse(req.body);
    } catch (error) {
      // Wirft sofort den sauberen 400 Bad Request über deinen Error-Handler
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
  (
    req: Request,
    res: Response<ApiSuccessResponse<UserWithoutPassword> | ApiFailResponse>,
  ) => {
    if (!req.user) {
      throw new UnauthorizedError("Nicht autorisiert.");
    }
    return res.status(200).json({
      status: "success",
      data: req.user as UserWithoutPassword,
    });
  },
);

router.post(
  "/logout",
  async (
    req: Request,
    res: Response<ApiSuccessResponse>,
    next: NextFunction,
  ) => {
    try {
      await new Promise<void>((resolve, reject) => {
        req.logout((err) =>
          err
            ? reject(new InternalServerError("Logout fehlgeschlagen"))
            : resolve(),
        );
      });

      await new Promise<void>((resolve, reject) => {
        req.session.destroy((err) =>
          err
            ? reject(
                new InternalServerError("Session konnte nicht beendet werden"),
              )
            : resolve(),
        );
      });

      res.clearCookie("connect.sid", { path: "/" });

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
