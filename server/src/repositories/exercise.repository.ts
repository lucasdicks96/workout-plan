import { PoolClient } from "pg";
import pool from "../config/db";
import { Category, Exercise } from "../types/exercise.types";

/**
 * Ruft alle globalen Übungen (bei denen `user_id IS NULL` ist) sowie die vom angegebenen
 * Benutzer individuell erstellten Übungen ab.
 *
 * Verknüpft die Übungen per Left Join mit zugehörigen Kategorien und aggregiert diese
 * als JSON-Array, alphabetisch sortiert nach Kategorienamen.
 *
 * @async
 * @param {string} userId - Die eindeutige UUID des aktuell authentifizierten Benutzers.
 * @returns {Promise<Exercise[]>} Eine alphabetisch nach Titel sortierte Liste aller verfügbaren Übungen.
 */
export async function getExercises(userId: string): Promise<Exercise[]> {
  const result = await pool.query(
    `SELECT
      exercises.id,
      exercises.title,
      exercises.description,
      exercises.user_id,
      COALESCE(
        JSON_AGG(
          JSON_BUILD_OBJECT('id', categories.id, 'name', categories.name, 'parent_id', categories.parent_id)
          ORDER BY categories.name
        ) FILTER (WHERE categories.id IS NOT NULL), '[]'
      ) AS category
    FROM exercises
    LEFT JOIN exercise_categories ON exercises.id = exercise_categories.exercise_id
    LEFT JOIN categories ON exercise_categories.category_id = categories.id
    WHERE (user_id IS NULL OR user_id = $1)
      AND deleted_at IS NULL
    GROUP BY exercises.id, exercises.title, exercises.description, exercises.user_id
    ORDER BY title ASC;`,
    [userId],
  );

  return result.rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    userId: row.user_id,
    category: row.category,
  }));
}

/**
 * Ruft exklusiv die vom angegebenen Benutzer selbst erstellten Übungen ab
 * (schließt globale Systemübungen aus).
 *
 * Inkludiert ebenfalls die zugehörigen Kategorien als aggregiertes JSON-Array.
 *
 * @async
 * @param {string} userId - Die eindeutige UUID des Benutzers.
 * @returns {Promise<Exercise[]>} Eine alphabetisch sortierte Liste der benutzerdefinierten Übungen.
 */
export async function getUserExercises(userId: string): Promise<Exercise[]> {
  const result = await pool.query(
    `SELECT
      exercises.id,
      exercises.title,
      exercises.description,
      exercises.user_id,
      COALESCE(
        JSON_AGG(
          JSON_BUILD_OBJECT('id', categories.id, 'name', categories.name, 'parent_id', categories.parent_id)
          ORDER BY categories.name
        ) FILTER (WHERE categories.id IS NOT NULL), '[]'
      ) AS category
    FROM exercises
    LEFT JOIN exercise_categories ON exercises.id = exercise_categories.exercise_id
    LEFT JOIN categories ON exercise_categories.category_id = categories.id
    WHERE (user_id = $1)
      AND deleted_at IS NULL
    GROUP BY exercises.id, exercises.title, exercises.description, exercises.user_id
    ORDER BY title ASC;`,
    [userId],
  );

  return result.rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    userId: row.user_id,
    category: row.category,
  }));
}

/**
 * Ruft über eine SQL-CTE (Common Table Expression) exakt die absolvierten Sätze
 * aus dem allerletzten Training ab, in dem der Benutzer eine bestimmte Übung ausgeführt hat.
 *
 * @async
 * @param {string} userId - Die eindeutige ID des Benutzers.
 * @param {number} exerciseId - Die eindeutige ID der abzufragenden Übung.
 * @returns {Promise<Array<{ set_number: number; weight: string | number; repetitions: number }>>}
 *          Ein Promise, das das Array der Datenbank-Zeilen mit Satznummer, Gewicht und Wiederholungen auflöst.
 */
export async function getLastExercisePerformance(
  userId: string,
  exerciseId: number,
) {
  const result = await pool.query(
    `WITH latest_workout AS (
      -- 1. Finde exakt das allerletzte Workout, in dem diese Übung absolviert wurde
      SELECT cs.completed_workout_id
      FROM completed_sets cs
      JOIN completed_workouts cw ON cs.completed_workout_id = cw.id
      WHERE cw.user_id = $1 AND cs.exercise_id = $2
      ORDER BY cw.end_time DESC
      LIMIT 1
    )
    -- 2. Lade alle Sätze genau dieses einen letzten Trainings für diese Übung
    SELECT 
      cs.set_number,
      cs.weight,
      cs.repetitions
    FROM completed_sets cs
    JOIN latest_workout lw ON cs.completed_workout_id = lw.completed_workout_id
    WHERE cs.exercise_id = $2
    ORDER BY cs.set_number ASC;`,
    [userId, exerciseId],
  );
  return result.rows;
}

// --- ATOMARE SCHREIB-OPERATIONEN (Nutzen den Client aus dem Service) ---

/**
 * Erstellt einen neuen Übungseintrag in der Datenbank.
 *
 * *Hinweis: Diese Methode ist für die Verwendung innerhalb einer aktiven Transaktion vorgesehen.*
 *
 * @async
 * @param {PoolClient} client - Der aktive PostgreSQL-Transaktionsclient.
 * @param {string} title - Der Titel der neuen Übung.
 * @param {string} description - Die detaillierte Beschreibung der Übung.
 * @param {string} userId - Die UUID des Erstellers.
 * @returns {Promise<any>} Das frisch eingefügte Datenbank-Row-Objekt der Übung.
 */
export async function insertExercise(
  client: PoolClient,
  title: string,
  description: string,
  userId: string,
) {
  const result = await client.query(
    "INSERT INTO exercises (title, description, user_id) VALUES ($1, $2, $3) RETURNING *",
    [title, description, userId],
  );
  return result.rows[0];
}

/**
 * Aktualisiert Titel und Beschreibung einer bestehenden Übung,
 * sofern diese dem Benutzer gehört und nicht als gelöscht markiert wurde.
 *
 * *Hinweis: Teil einer atomaren Transaktionskette.*
 *
 * @async
 * @param {PoolClient} client - Der aktive PostgreSQL-Transaktionsclient.
 * @param {number} id - Die ID der zu aktualisierenden Übung.
 * @param {string} title - Der aktualisierte Titel.
 * @param {string} description - Die aktualisierte Beschreibung.
 * @param {string} userId - Die UUID des Eigentümers zur Berechtigungsprüfung.
 * @returns {Promise<any>} Das aktualisierte Datenbank-Row-Objekt oder `undefined`, falls keine berechtigte Übung gefunden wurde.
 */
export async function updateExercise(
  client: PoolClient,
  id: number,
  title: string,
  description: string,
  userId: string,
) {
  const result = await client.query(
    `UPDATE exercises
     SET title = $1, description = $2
     WHERE id = $3 AND user_id = $4 AND deleted_at IS NULL
     RETURNING *;`,
    [title, description, id, userId],
  );
  return result.rows[0]; // Ist undefined, wenn nicht gefunden oder keine Berechtigung vorliegt
}

/**
 * Verknüpft eine Übung in einer Batch-Operation mit mehreren Kategorien
 * in der Relationstabelle `exercise_categories`.
 *
 * *Hinweis: Teil einer atomaren Transaktionskette.*
 *
 * @async
 * @param {PoolClient} client - Der aktive PostgreSQL-Transaktionsclient.
 * @param {number} exerciseId - Die ID der Übung.
 * @param {number[]} categories - Ein Array von Kategorie-IDs, die zugewiesen werden sollen.
 * @returns {Promise<void>}
 */
export async function insertExerciseCategories(
  client: PoolClient,
  exerciseId: number,
  categories: number[],
) {
  if (!categories || categories.length === 0) return;

  const insertValues = categories.map((_, i) => `($1, $${i + 2})`).join(", ");
  await client.query(
    `INSERT INTO exercise_categories (exercise_id, category_id) VALUES ${insertValues};`,
    [exerciseId, ...categories],
  );
}

/**
 * Löscht sämtliche Kategorie-Verknpfungen für eine bestimmte Übung
 * aus der Relationstabelle (wird üblicherweise vor einer Neuzuordnung beim Update ausgeführt).
 *
 * *Hinweis: Teil einer atomaren Transaktionskette.*
 *
 * @async
 * @param {PoolClient} client - Der aktive PostgreSQL-Transaktionsclient.
 * @param {number} exerciseId - Die ID der Übung, deren Verknüpfungen gelöscht werden sollen.
 * @returns {Promise<void>}
 */
export async function deleteExerciseCategories(
  client: PoolClient,
  exerciseId: number,
) {
  await client.query(
    "DELETE FROM exercise_categories WHERE exercise_id = $1;",
    [exerciseId],
  );
}

// ------------------------------------------------------------------------

/**
 * Führt einen Soft Delete (logische Löschung) für eine benutzerspezifische Übung aus,
 * indem der `deleted_at`-Zeitstempel auf den aktuellen Zeitpunkt gesetzt wird.
 *
 * @async
 * @param {number} id - Die ID der zu löschenden Übung.
 * @param {string} userId - Die UUID des Eigentümers zur Absicherung.
 * @returns {Promise<Exercise | null>} Das als gelöscht markierte Übungsobjekt oder `null`, falls es nicht gefunden wurde.
 */
export async function softDeleteExercise(
  id: number,
  userId: string,
): Promise<Exercise | null> {
  const result = await pool.query(
    "UPDATE exercises SET deleted_at = NOW() WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL RETURNING *",
    [id, userId],
  );
  return result.rows[0] || null;
}

/**
 * Ruft alle im System verfügbaren Kategorien ab.
 * Sortiert primär nach dem übergeordneten Element (`parent_id NULLS FIRST`) und sekundär alphabetisch nach Namen.
 *
 * @async
 * @returns {Promise<Category[]>} Eine strukturierte Liste aller Kategorien.
 */
export async function categories(): Promise<Category[]> {
  const result = await pool.query(
    "SELECT id, name, parent_id FROM categories ORDER BY parent_id NULLS FIRST, name",
  );
  return result.rows;
}

/**
 * Sucht eine spezifische Kategorie anhand ihrer eindeutigen ID.
 *
 * @async
 * @param {number} id - Die ID der gesuchten Kategorie.
 * @returns {Promise<Category | null>} Das Kategorie-Objekt oder `null`, falls keine Kategorie mit dieser ID existiert.
 */
export async function getCategoryById(id: number): Promise<Category | null> {
  const result = await pool.query(
    "SELECT id, name, parent_id FROM categories WHERE id = $1",
    [id],
  );
  return result.rows[0] || null;
}
