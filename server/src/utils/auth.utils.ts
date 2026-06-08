import { RequestHandler, Request, Response } from "express";
import { UserWithoutPassword } from "../types/user.types";

// Die gleichen Generics wie Express (P = Params, ResBody = Response, ReqBody = RequestBody, ReqQuery = Query)
// Die = any sorgen dafür, dass sie optional sind, genau wie beim Original.
export type AuthenticatedRequest<
  P = any,
  ResBody = any,
  ReqBody = any,
  ReqQuery = any,
> = Request<P, ResBody, ReqBody, ReqQuery> & { user: UserWithoutPassword };

// Generische Wrapper-Funktion, damit die Typen aus dem Controller gecached und weiterleitet werden können
export function authenticatedHandler<
  P = any,
  ResBody = any,
  ReqBody = any,
  ReqQuery = any,
>(
  handler: (
    req: AuthenticatedRequest<P, ResBody, ReqBody, ReqQuery>,
    res: Response<ResBody>,
  ) => Promise<any>,
): RequestHandler<P, ResBody, ReqBody, ReqQuery> {
  return async (req, res, next) => {
    // Fängt Fehler aus dem async Handler ab und leitet sie an Express weiter, damit sie im Error Middleware landen
    try {
      await handler(
        req as AuthenticatedRequest<P, ResBody, ReqBody, ReqQuery>,
        res,
      );
    } catch (error) {
      next(error);
    }
  };
}
