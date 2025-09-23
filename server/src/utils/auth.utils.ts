import { RequestHandler } from "express";
import { Request, Response } from "express";
import { UserWithoutPassword } from "../types/user.types";

type AuthenticatedRequest = Request & { user: UserWithoutPassword };

// castet Request zu AuthenticatedRequest
export function authenticatedHandler(
  handler: (req: AuthenticatedRequest, res: Response) => Promise<void>
): RequestHandler {
  return async (req, res, next) => {
    try {
      await handler(req as AuthenticatedRequest, res);
    } catch (error) {
      next(error);
    }
  };
}
