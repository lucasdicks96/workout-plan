import { DatabaseError } from "pg";
import * as userRepository from "../repositories/user.repository";
import { ConflictError, InternalServerError } from "../types/errors.types";
import { hashPassword } from "./auth.service";
import { UserWithoutPassword } from "../types/user.types";

/**
 * Erstellt einen neuen Benutzer, indem das Passwort sicher verschlüsselt 
 * und der Datensatz in der Datenbank gespeichert wird.
 * 
 * Fängt PostgreSQL-spezifische Fehler ab (wie Verletzungen von Unique-Constraints, Code `23505`) 
 * und wandelt diese in einen sauberen `ConflictError` um.
 *
 * @async
 * @param {string} email - Die E-Mail-Adresse des neuen Benutzers.
 * @param {string} password - Das Klartext-Passwort, das vor dem Speichern gehasht wird.
 * @returns {Promise<UserWithoutPassword>} Das erstellte Benutzerobjekt (ohne Passwort-Hash).
 * @throws {ConflictError} Wenn die E-Mail-Adresse bereits im System registriert ist.
 * @throws {InternalServerError} Bei unerwarteten Datenbank- oder Serverfehlern.
 */
export async function createUser(email: string, password: string) {
  try {
    const hashedPassword = await hashPassword(password);
    const user = await userRepository.postUser(email, hashedPassword);

    return user;
  } catch (error) {
    if (error instanceof DatabaseError) {
      if (error.code === "23505") {
        throw new ConflictError("Benutzer mit dieser E-Mail existiert bereits");
      }
    }
    throw new InternalServerError("Fehler beim Erstellen des Benutzers", error);
  }
}

/**
 * Aktualisiert die Anmeldedaten (E-Mail und Passwort) eines bestehenden Benutzers.
 * 
 * Verschlüsselt das neue Passwort und fängt eventuelle Unique-Constraint-Verletzungen 
 * bei der E-Mail-Adresse ab.
 *
 * @async
 * @param {string} id - Die UUID des zu aktualisierenden Benutzers.
 * @param {string} email - Die neue E-Mail-Adresse.
 * @param {string} password - Das neue Klartext-Passwort (wird neu gehasht).
 * @returns {Promise<UserWithoutPassword | null>} Das aktualisierte Benutzerobjekt oder `null`, falls kein passender Datensatz gefunden wurde.
 * @throws {ConflictError} Wenn die neue E-Mail-Adresse bereits von einem anderen Benutzer verwendet wird.
 * @throws {InternalServerError} Bei technischen Fehlern während des Aktualisierungsprozesses.
 */
export async function updateUser(
  id: string,
  email: string,
  password: string,
): Promise<UserWithoutPassword | null> {
  try {
    const hashedPassword = await hashPassword(password);
    const user = await userRepository.updateUser(id, email, hashedPassword);
    return user;
  } catch (error) {
    if (error instanceof DatabaseError) {
      if (error.code === "23505") {
        throw new ConflictError("Benutzer mit dieser E-Mail existiert bereits");
      }
    }
    throw new InternalServerError(
      "Fehler beim Aktualisieren des Benutzers",
      error,
    );
  }
}

/**
 * Löscht einen Benutzer anhand seiner UUID aus der Datenbank.
 *
 * @async
 * @param {string} id - Die UUID des zu löschenden Benutzers.
 * @returns {Promise<boolean>} Gibt `true` zurück, wenn der Löschvorgang erfolgreich war.
 * @throws {InternalServerError} Wenn beim Löschen ein unerwarteter Fehler auftritt.
 */
export async function deleteUser(id: string): Promise<boolean> {
  try {
    const deleted = await userRepository.deleteUser(id);
    return deleted;
  } catch (error) {
    throw new InternalServerError("Fehler beim Löschen des Benutzers", error);
  }
}

/**
 * Ruft aggregierte statistische Kennzahlen für einen bestimmten Benutzer ab 
 * (z. B. Gesamtzahl absolvierter Workouts, genutzter Übungen und Sätze).
 *
 * @async
 * @param {string} userId - Die UUID des Benutzers.
 * @returns {Promise<{ totalWorkouts: number; totalExercises: number; totalSets: number }>} Ein Objekt mit den Statistikdaten.
 * @throws {InternalServerError} Wenn beim Abrufen der Statistiken ein Fehler auftritt.
 */
export async function getUserStats(userId: string): Promise<{
  totalWorkouts: number;
  totalExercises: number;
  totalSets: number;
}> {
  try {
    const stats = await userRepository.getUserStats(userId);
    return stats;
  } catch (error) {
    throw new InternalServerError(
      "Fehler beim Abrufen der Benutzerstatistiken",
      error,
    );
  }
}