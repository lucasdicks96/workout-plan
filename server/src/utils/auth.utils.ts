import { RequestHandler, Request, Response } from "express";
import { UserWithoutPassword } from "../types/user.types";

/**
 * Erweitert das standardmäßige Express-`Request`-Objekt um ein zwingend vorhandenes, 
 * authentifiziertes Benutzerobjekt (`user`).
 * 
 * Nutzt die gleichen generischen Typparameter wie Express 
 * (`P` für Params, `ResBody` für Response, `ReqBody` für Request-Body, `ReqQuery` für Query-Parameter).
 */
export type AuthenticatedRequest<
  P = any,
  ResBody = any,
  ReqBody = any,
  ReqQuery = any,
> = Request<P, ResBody, ReqBody, ReqQuery> & { user: UserWithoutPassword };

/**
 * Generische Wrapper-Funktion (Higher-Order Function) für Express-Route-Handler, 
 * die eine erfolgreiche Authentifizierung voraussetzen.
 * 
 * Sie stellt sicher, dass das Request-Objekt als `AuthenticatedRequest` getypt ist 
 * und fängt automatisch alle in der asynchronen Handler-Funktion auftretenden Fehler auf, 
 * um sie an die zentrale Express-Fehler-Middleware (`next(error)`) weiterzuleiten.
 *
 * @template P - Typ der URL-Parameter (Params)
 * @template ResBody - Typ des Antwort-Bodys
 * @template ReqBody - Typ des Request-Bodys
 * @template ReqQuery - Typ der Query-Parameter
 * @param {function} handler - Die asynchrone Controller-Logik-Funktion.
 * @returns {RequestHandler<P, ResBody, ReqBody, ReqQuery>} Ein standardmäßiger Express-Request-Handler mit integriertem Error-Handling.
 */
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
    // Fängt Fehler aus dem async Handler ab und leitet sie an Express weiter, damit sie in der Error-Middleware landen
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