import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { UnauthorizedError } from "../types/errors.types";

/** Zod-Schema zur strengen Validierung, dass die Benutzer-ID im UUID-Format vorliegt. */
const userIdSchema = z.uuid();

/**
 * Express-Middleware: `isAuthenticated`
 * 
 * Prüft, ob der aktuelle Client erfolgreich authentifiziert ist und über eine gültige Sitzung verfügt.
 * 
 * Ablauf der Validierung:
 * 1. Prüft, ob Passport eine aktive Sitzung verifiziert hat (`req.isAuthenticated()`) und ob ein `req.user`-Objekt existiert.
 * 2. Validiert die im Benutzer-Objekt hinterlegte ID (`req.user.id`) gegen das `userIdSchema` (UUID-Prüfung).
 * 
 * Schlägt eine der Bedingungen fehl, wird ein `UnauthorizedError` an die zentrale Fehlerbehandlung übergeben.
 * Sind alle Prüfungen erfolgreich, wird der Request per `next()` an die nächste Middleware oder Route weitergereicht.
 *
 * @param {Request} req - Das Express-Request-Objekt.
 * @param {Response} res - Das Express-Response-Objekt.
 * @param {NextFunction} next - Die Express-Next-Funktion zur Übergabe an den nächsten Handler.
 */
export function isAuthenticated(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!req.isAuthenticated() || !req.user) {
    return next(new UnauthorizedError("Nicht authentifiziert"));
  }

  const parsedUserId = userIdSchema.safeParse(req.user.id);
  if (!parsedUserId.success) {
    return next(new UnauthorizedError("Ungültige User-ID in Session"));
  }

  next();
}