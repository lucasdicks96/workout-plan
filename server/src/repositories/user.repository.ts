import pool from "../config/db";
import { User, UserWithoutPassword } from "../types/user.types";

/**
 * Sucht einen Benutzer anhand seiner eindeutigen ID.
 *
 * @async
 * @param {string} id - Die UUID des gesuchten Benutzers.
 * @returns {Promise<User>} Das vollständige Benutzerobjekt (inklusive des Passwort-Hashes).
 */
export async function getUserById(id: string): Promise<User> {
  const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
  const user: User = result.rows[0];
  return user;
}

/**
 * Sucht einen Benutzer anhand seiner E-Mail-Adresse (wird primär für den Login verwendet).
 *
 * @async
 * @param {string} email - Die E-Mail-Adresse des Benutzers.
 * @returns {Promise<User>} Das Benutzerobjekt inklusive des Passwort-Hashes.
 */
export async function getUserByEmail(email: string): Promise<User> {
  const result = await pool.query("SELECT * FROM users WHERE email = $1", [
    email,
  ]);

  const user: User = result.rows[0];
  return user;
}

/**
 * Erstellt einen neuen Benutzer in der Datenbank.
 *
 * Gibt aus Sicherheitsgründen ein reduziertes Objekt zurück, das den Passwort-Hash ausschließt.
 *
 * @async
 * @param {string} email - Die E-Mail-Adresse des neuen Benutzers.
 * @param {string} hashedPassword - Der sicher verschlüsselte Passwort-Hash.
 * @returns {Promise<UserWithoutPassword>} Das erstellte Benutzerobjekt (ID, E-Mail, Rolle).
 */
export async function postUser(
  email: string,
  hashedPassword: string,
): Promise<UserWithoutPassword> {
  const result = await pool.query(
    "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email, role",
    [email, hashedPassword],
  );
  const user: UserWithoutPassword = result.rows[0];
  return user;
}

/**
 * Aktualisiert die E-Mail-Adresse und das Passwort eines bestehenden Benutzers.
 *
 * @async
 * @param {string} id - Die UUID des zu aktualisierenden Benutzers.
 * @param {string} email - Die neue E-Mail-Adresse.
 * @param {string} hashedPassword - Der neu generierte Passwort-Hash.
 * @returns {Promise<UserWithoutPassword | null>} Das aktualisierte Benutzerobjekt oder `null`, falls kein passender Datensatz gefunden wurde.
 */
export async function updateUser(
  id: string,
  email: string,
  hashedPassword: string,
): Promise<UserWithoutPassword | null> {
  const result = await pool.query(
    "UPDATE users SET email = $1, password = $2 WHERE id = $3 RETURNING id, email, role",
    [email, hashedPassword, id],
  );
  return result.rows[0] || null;
}

/**
 * Löscht einen Benutzer anhand seiner UUID aus der Datenbank.
 *
 * @async
 * @param {string} id - Die UUID des zu löschenden Benutzers.
 * @returns {Promise<boolean>} Gibt basierend auf dem aktuellen Statement `true` zurück, wenn `rowCount === 0` ist.
 */
export async function deleteUser(id: string): Promise<boolean> {
  const result = await pool.query(
    "DELETE FROM users WHERE id = $1 RETURNING id",
    [id],
  );
  return result.rowCount && result.rowCount === 0 ? true : false;
}

/**
 * Ermittelt umfassende statistische Kennzahlen für einen bestimmten Benutzer
 * (Gesamtzahl absolvierter Workouts, genutzter Übungen und ausgeführter Sätze über relationale Joins).
 *
 * @async
 * @param {string} userId - Die UUID des Benutzers, dessen Statistiken berechnet werden sollen.
 * @returns {Promise<{ totalWorkouts: number; totalExercises: number; totalSets: number }>} Ein Objekt mit den aggregierten Kennzahlen.
 */
export async function getUserStats(userId: string): Promise<{
  totalWorkouts: number;
  totalExercises: number;
  totalSets: number;
}> {
  const result = await pool.query(
    `SELECT 
      COUNT(DISTINCT completed_workouts.id) as total_workouts,
      COUNT(DISTINCT exercises.id) as total_exercises,
      COUNT(DISTINCT plan_sets.id) as total_sets
    FROM users
    LEFT JOIN workout_plans ON users.id = workout_plans.user_id
    LEFT JOIN plan_exercises ON workout_plans.id = plan_exercises.workout_plan_id
    LEFT JOIN exercises ON plan_exercises.exercise_id = exercises.id
    LEFT JOIN plan_sets ON plan_exercises.id = plan_sets.plan_exercise_id
    LEFT JOIN completed_workouts ON workout_plans.id = completed_workouts.workout_plan_id
    WHERE users.id = $1`,
    [userId],
  );
  return result.rows[0];
}
