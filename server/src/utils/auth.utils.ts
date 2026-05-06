import { RequestHandler, Request, Response } from "express";
import { UserWithoutPassword } from "../types/user.types";

// 1. Wir geben deinem Typen die gleichen Generics wie Express (P = Params, ResBody = Response, ReqBody = RequestBody, ReqQuery = Query)
// Die = any sorgen dafür, dass sie optional sind, genau wie beim Original.
export type AuthenticatedRequest<
  P = any,
  ResBody = any,
  ReqBody = any,
  ReqQuery = any,
> = Request<P, ResBody, ReqBody, ReqQuery> & { user: UserWithoutPassword };

// 2. Wir machen die Wrapper-Funktion generisch, damit sie die Typen aus dem Controller "auffängt" und weiterleitet
export function authenticatedHandler<
  P = any,
  ResBody = any,
  ReqBody = any,
  ReqQuery = any,
>(
  handler: (
    req: AuthenticatedRequest<P, ResBody, ReqBody, ReqQuery>,
    res: Response<ResBody>,
  ) => Promise<void>,
): RequestHandler<P, ResBody, ReqBody, ReqQuery> {
  return async (req, res, next) => {
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
