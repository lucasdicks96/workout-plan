import { UserWithoutPassword as CustomUser } from "../user.types";

// Erweitere die globalen Typen von Express
declare global {
  namespace Express {
    // Erweitere das User-Interface von Passport.
    // Sage TypeScript, dass Passport's User-Objekt die gleiche Struktur wie dein eigener User-Typ hat.
    export interface User extends CustomUser {}

    // Füge die 'user'-Eigenschaft zum Request-Interface hinzu.
    export interface Request {
      // Das Fragezeichen '?' macht die Eigenschaft optional, da sie bei
      // nicht-authentifizierten Anfragen nicht vorhanden ist.
      user?: User;
    }
  }
}
