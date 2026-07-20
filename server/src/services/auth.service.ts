import bcrypt from "bcrypt";
import * as userRepositories from "../repositories/user.repository";
import { BadRequestError } from "../types/errors.types";
import { UserWithoutPassword } from "../types/user.types";

/**
 * Verschlüsselt ein Klartext-Passwort mithilfe von bcrypt und einer festen Anzahl von Salt-Runden (12).
 *
 * @async
 * @param {string} password - Das zu hashende Klartext-Passwort.
 * @returns {Promise<string>} Der generierte und sicher verschlüsselte bcrypt-Passwort-Hash.
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;

  const hashedPassword = await bcrypt.hash(password, saltRounds);
  return hashedPassword;
}

/**
 * Verifiziert die Anmeldedaten eines Benutzers anhand von E-Mail und Klartext-Passwort.
 * 
 * Ablauf der Verifizierung:
 * 1. Sucht den Benutzer über die E-Mail-Adresse im Repository.
 * 2. Wirft einen `BadRequestError`, falls kein passender Benutzer gefunden wird.
 * 3. Vergleicht das eingegebene Klartext-Passwort mit dem gespeicherten Hash (`bcrypt.compare`).
 * 4. Wirft einen `BadRequestError`, falls die Passwörter nicht übereinstimmen.
 * 5. Entfernt den sensiblen Passwort-Hash aus dem Objekt per Destructuring und gibt die restlichen Benutzerdaten zurück.
 *
 * @async
 * @param {string} email - Die E-Mail-Adresse des sich anmeldenden Benutzers.
 * @param {string} plainTextPassword - Das vom Client übermittelte Klartext-Passwort.
 * @returns {Promise<UserWithoutPassword>} Das Benutzerobjekt ohne Passwort-Hash bei erfolgreicher Authentifizierung.
 * @throws {BadRequestError} Wenn der Benutzer nicht existiert oder das Passwort ungültig ist.
 */
export async function verifyUserCredentials(
  email: string,
  plainTextPassword: string,
): Promise<UserWithoutPassword> {
  const user = await userRepositories.getUserByEmail(email);
  if (!user) {
    throw new BadRequestError("Benutzer nicht gefunden");
  }

  const isMatch = await bcrypt.compare(plainTextPassword, user.password);

  if (!isMatch) {
    throw new BadRequestError("Passwörter stimmen nicht überein");
  }
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
}