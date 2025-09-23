import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { UnauthorizedError } from "../types/errors.types";

const userIdSchema = z.uuid();

export function isAuthenticated(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.isAuthenticated() || !req.user) {
    throw new UnauthorizedError("Nicht authentifiziert");
  }

  const parsedUserId = userIdSchema.safeParse(req.user.id);
  if (!parsedUserId.success) {
    throw new UnauthorizedError("Ungültige User-ID in Session");
  }

  next();
}
