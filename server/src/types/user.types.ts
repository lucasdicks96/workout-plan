/**
 * Repräsentiert das vollständige Benutzerobjekt in der Datenbank, 
 * inklusive des sensiblen Passwort-Hashes. 
 * 
 * Erweitert das `UserWithoutPassword`-Interface.
 */
export interface User extends UserWithoutPassword {
  /** Der sicher verschlüsselte bcrypt-Passwort-Hash des Benutzers. */
  password: string;
}

/**
 * Repräsentiert ein reduziertes Benutzerobjekt ohne sensible Daten (ohne Passwort-Hash), 
 * das sicher für API-Antworten und Sessions verwendet wird.
 */
export interface UserWithoutPassword {
  /** Die eindeutige UUID des Benutzers. */
  id: string;
  /** Die E-Mail-Adresse des Benutzers. */
  email: string;
  /** Die Berechtigungsrolle des Benutzers im System (entweder `"user"` oder `"admin"`). */
  role: "user" | "admin";
}