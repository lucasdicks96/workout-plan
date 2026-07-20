import { UserWithoutPassword as CustomUser } from "../user.types";

/**
 * Globale Typenerweiterung für das Express-Framework.
 * 
 * Erweitert die integrierten Express-Typen um die applikationsspezifische Benutzerstruktur (`CustomUser`),
 * sodass `req.user` sowie Passport-Authentifizierungsmechanismen in der gesamten Anwendung 
 * typsicher zur Verfügung stehen.
 */
declare global {
  namespace Express {
    /** Repräsentiert das authentifizierte Benutzerobjekt in der Express-Session (ohne Passwort-Hash). */
    export interface User extends CustomUser {}
    
    /** Erweitert das standardmäßige Express-Request-Objekt um die optionale `user`-Eigenschaft. */
    export interface Request {
      user?: User;
    }
  }
}

export {};