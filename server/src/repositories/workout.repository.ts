import { PoolClient } from "pg";
import pool from "../config/db";
import {
  CompletedWorkout,
  FlatCompletedWorkoutRow,
  FlatWorkoutRow,
  WorkoutExercise,
} from "../types/workout.types";

// --- LESE-OPERATIONEN (Nutzen direkt den Pool oder einen Client) ---

/**
 * Überprüft, ob ein bestimmtes Workout (entweder ein Trainingsplan per ID oder ein absolviertes Workout per UUID)
 * dem angegebenen Benutzer gehört.
 *
 * @async
 * @param {number | string} workoutId - Die ID des Workouts (Zahl für `workout_plans`, String/UUID für `completed_workouts`).
 * @param {string} userId - Die UUID des Benutzers zur Berechtigungsprüfung.
 * @param {typeof pool | PoolClient} db - Die zu verwendende Datenbankverbindung (Pool oder aktiver Transaktionsclient).
 * @returns {Promise<boolean>} Gibt `true` zurück, wenn der Benutzer der Eigentümer ist, ansonsten `false`.
 */
export async function ownerCheck(
  workoutId: number | string,
  userId: string,
  db: typeof pool | PoolClient,
): Promise<boolean> {
  switch (typeof workoutId) {
    case "number": {
      const result = await db.query(
        "SELECT user_id FROM workout_plans WHERE id = $1 AND user_id = $2",
        [workoutId, userId],
      );
      return result.rowCount !== null && result.rowCount > 0;
    }

    case "string": {
      const result = await db.query(
        "SELECT user_id FROM completed_workouts WHERE id = $1 AND user_id = $2",
        [workoutId, userId],
      );
      return result.rowCount !== null && result.rowCount > 0;
    }

    default:
      return false;
  }
}

/**
 * Ruft alle aktiven Trainingspläne inklusive der zugehörigen Übungen und Sätze für einen bestimmten Benutzer ab.
 *
 * Sortiert primär nach Plantitel, sekundär nach Anzeigereihenfolge der Übungen und Tertiär nach Satznummer.
 *
 * @async
 * @param {string} userId - Die UUID des Benutzers.
 * @returns {Promise<FlatWorkoutRow[]>} Eine Liste flacher Zeilenstrukturen aller Workout-Pläne.
 */
export async function getWorkouts(userId: string): Promise<FlatWorkoutRow[]> {
  const result = await pool.query(
    `SELECT workout_plans.title AS plan_title,
            workout_plans.user_id AS plan_user_id,
            workout_plans.id AS plan_id,
            plan_exercises.display_order,
            plan_sets.set_number,
            plan_sets.repetitions,
            plan_sets.weight,
            exercises.title,
            exercises.id AS exercise_id
      FROM  workout_plans
      JOIN  plan_exercises
      ON    workout_plans.id = plan_exercises.workout_plan_id
      JOIN  exercises
      ON    exercises.id = plan_exercises.exercise_id
      JOIN  plan_sets
      ON    plan_sets.plan_exercise_id = plan_exercises.id
      WHERE workout_plans.user_id = $1 AND workout_plans.deleted_at IS NULL 
      ORDER BY workout_plans.title ASC, plan_exercises.display_order ASC, plan_sets.set_number ASC`,
    [userId],
  );
  return result.rows;
}

/**
 * Ruft einen spezifischen Trainingsplan anhand seiner ID mitsamt allen Übungen und Sätzen ab.
 *
 * @async
 * @param {number} workoutId - Die ID des Workout-Plans.
 * @returns {Promise<FlatWorkoutRow[]>} Die flache Zeilenstruktur der Übungen und Sätze des Plans.
 */
export async function getWorkout(workoutId: number): Promise<FlatWorkoutRow[]> {
  const result = await pool.query(
    `SELECT   workout_plans.title as plan_title,
              workout_plans.user_id as plan_user_id,
              workout_plans.id AS plan_id,
              exercises.title,
              plan_exercises.exercise_id,
              plan_exercises.display_order,
              plan_sets.set_number,
              plan_sets.repetitions,
              plan_sets.weight 
      FROM    workout_plans  
      JOIN    plan_exercises 
      ON      workout_plans.id = plan_exercises.workout_plan_id 
      JOIN    exercises 
      ON      exercises.id = plan_exercises.exercise_id 
      JOIN    plan_sets 
      ON      plan_sets.plan_exercise_id = plan_exercises.id
      WHERE   workout_plans.id = $1
      ORDER BY  plan_exercises.display_order, plan_sets.set_number ASC`,
    [workoutId],
  );
  return result.rows;
}

/**
 * Ruft ein spezifisches absolviertes Workout anhand seiner UUID und der Benutzer-ID ab.
 *
 * Verwendet Left Joins und COALESCE-Ausdrücke, um auch bei Workouts ohne verknüpften Plan
 * oder bei nachträglich hinzugefügten Übungen konsistente Daten zu liefern.
 *
 * @async
 * @param {string} userId - Die UUID des Benutzers.
 * @param {string} workoutId - Die UUID des absolvierten Workouts.
 * @returns {Promise<FlatCompletedWorkoutRow[]>} Die flachen Zeilen des absolvierten Workouts.
 */
export async function getCompletedWorkout(
  userId: string,
  workoutId: string,
): Promise<FlatCompletedWorkoutRow[]> {
  const result = await pool.query(
    `SELECT   completed_workouts.id AS workout_id,
              completed_workouts.workout_plan_id AS plan_id,
              completed_workouts.title AS workout_title,
              COALESCE(workout_plans.title, completed_workouts.title) AS plan_title,
              completed_workouts.user_id AS plan_user_id,
              completed_workouts.duration_seconds,
              completed_workouts.start_time,
              completed_workouts.end_time,
              completed_workouts.pause_seconds,
              completed_sets.exercise_id,
              exercises.title,
              COALESCE(completed_sets.display_order, unique_plan_exercises.display_order) AS display_order,
              completed_sets.set_number,
              completed_sets.weight,
              completed_sets.repetitions
    FROM      completed_workouts
    JOIN      completed_sets
    ON        completed_workouts.id = completed_sets.completed_workout_id
    JOIN      exercises
    ON        completed_sets.exercise_id = exercises.id
    LEFT JOIN workout_plans 
    ON        completed_workouts.workout_plan_id = workout_plans.id
    LEFT JOIN (             
    SELECT    workout_plan_id, exercise_id, MIN(display_order) as display_order
    FROM      plan_exercises
    GROUP BY  workout_plan_id, exercise_id)
    AS        unique_plan_exercises
    ON        completed_sets.exercise_id = unique_plan_exercises.exercise_id 
    AND       completed_workouts.workout_plan_id = unique_plan_exercises.workout_plan_id 
    WHERE     completed_workouts.user_id = $1
    AND       completed_workouts.id = $2
    ORDER BY  COALESCE(completed_sets.display_order, unique_plan_exercises.display_order) ASC NULLS LAST,
              completed_sets.set_number ASC;`,
    [userId, workoutId],
  );
  return result.rows;
}

/**
 * Ruft alle von einem Benutzer absolvierten Workouts ab, sortiert nach Startzeit absteigend (neueste zuerst).
 *
 * @async
 * @param {string} userId - Die UUID des Benutzers.
 * @returns {Promise<FlatCompletedWorkoutRow[]>} Eine Liste aller absolvierten Workout-Datensätze im flachen Format.
 */
export async function getCompletedWorkouts(
  userId: string,
): Promise<FlatCompletedWorkoutRow[]> {
  const result = await pool.query(
    `SELECT   completed_workouts.id AS workout_id,
              completed_workouts.start_time,
              completed_workouts.workout_plan_id AS plan_id,
              completed_workouts.user_id as plan_user_id,
              completed_workouts.duration_seconds,
              completed_workouts.pause_seconds,
              completed_workouts.end_time,
              completed_workouts.title AS workout_title,
              COALESCE(workout_plans.title, completed_workouts.title) AS plan_title,
              completed_sets.exercise_id,
              completed_sets.set_number,
              completed_sets.repetitions,
              completed_sets.weight,
              exercises.title,
    COALESCE  (completed_sets.display_order, unique_plan_exercises.display_order) AS display_order
    FROM      completed_workouts
    JOIN      completed_sets
    ON        completed_workouts.id = completed_sets.completed_workout_id
    JOIN      exercises
    ON        completed_sets.exercise_id = exercises.id
    LEFT JOIN workout_plans 
    ON        completed_workouts.workout_plan_id = workout_plans.id
    LEFT JOIN (             
    SELECT    workout_plan_id, exercise_id, MIN(display_order) as display_order
    FROM      plan_exercises
    GROUP BY  workout_plan_id, exercise_id)
    AS        unique_plan_exercises
    ON        completed_sets.exercise_id = unique_plan_exercises.exercise_id 
    AND       completed_workouts.workout_plan_id = unique_plan_exercises.workout_plan_id
    WHERE     completed_workouts.user_id = $1
    ORDER BY  completed_workouts.start_time DESC,   
    COALESCE  (completed_sets.display_order, unique_plan_exercises.display_order) ASC NULLS LAST,
              completed_sets.set_number ASC;`,
    [userId],
  );
  return result.rows;
}

/**
 * Ermittelt das chronologisch letzte absolvierte Training zu einem bestimmten Workout-Plan,
 * um dem Benutzer die vorherigen Gewichte/Wiederholungen als Referenz anzuzeigen.
 *
 * @async
 * @param {number} workoutId - Die ID des zugrundeliegenden Workout-Plans.
 * @param {string} userId - Die UUID des Benutzers.
 * @returns {Promise<FlatCompletedWorkoutRow[] | []>} Die Sätze des letzten Durchlaufs oder ein leeres Array.
 */
export async function getLastCompletedWorkout(
  workoutId: number,
  userId: string,
): Promise<FlatCompletedWorkoutRow[] | []> {
  const result = await pool.query(
    `WITH plan_exercises_list AS (
      -- 1. Hole alle Übungen, die aktuell in diesem Trainingsplan definiert sind
      SELECT exercise_id 
      FROM plan_exercises 
      WHERE workout_plan_id = $1
    ),
    latest_workout_per_exercise AS (
      -- 2. Finde für jede dieser Übungen das chronologisch allerletzte Training (unabhängig vom Plan)
      SELECT DISTINCT ON (cs.exercise_id)
        cs.exercise_id,
        cs.completed_workout_id
      FROM completed_sets cs
      JOIN completed_workouts cw ON cs.completed_workout_id = cw.id
      WHERE cw.user_id = $2
        AND cs.exercise_id IN (SELECT exercise_id FROM plan_exercises_list)
      ORDER BY cs.exercise_id, cw.end_time DESC
    )
    -- 3. Lade alle Sätze genau dieser letzten Durchläufe pro Übung
    SELECT 
      cw.id AS workout_id,
      cw.workout_plan_id AS plan_id,
      cw.user_id AS plan_user_id,
      COALESCE(wp.title, cw.title) AS plan_title,
      cw.title AS workout_title,
      cw.duration_seconds,
      cw.start_time,
      cw.end_time,
      cw.pause_seconds,
      exercises.id AS exercise_id,
      exercises.title,
      COALESCE(cs.display_order, pe.display_order) AS display_order,
      cs.set_number,
      cs.weight,
      cs.repetitions
    FROM latest_workout_per_exercise lwpe
    JOIN completed_workouts cw ON lwpe.completed_workout_id = cw.id
    JOIN completed_sets cs ON cs.completed_workout_id = cw.id AND cs.exercise_id = lwpe.exercise_id
    JOIN exercises ON cs.exercise_id = exercises.id
    LEFT JOIN workout_plans wp ON cw.workout_plan_id = wp.id
    LEFT JOIN plan_exercises pe ON pe.workout_plan_id = cw.workout_plan_id AND pe.exercise_id = cs.exercise_id
    ORDER BY COALESCE(cs.display_order, pe.display_order) ASC NULLS LAST,
             cs.exercise_id ASC,
             cs.set_number ASC;`,
    [workoutId, userId],
  );

  if (result.rows.length === 0) {
    console.log("Keine Historie für die Übungen dieses Plans gefunden.");
    return [];
  }

  return result.rows;
}

/**
 * Berechnet aggregierte Statistiken zu den Workouts eines Benutzers
 * (Anzahl erstellter Pläne, absolvierte Workouts und noch offene/aktive Pläne).
 *
 * @async
 * @param {string} userId - Die UUID des Benutzers.
 * @returns {Promise<{ totalPlans: number; completedWorkouts: number; activeWorkouts: number }>} Ein Objekt mit den Kennzahlen.
 */
export async function getWorkoutStats(userId: string): Promise<{
  totalPlans: number;
  completedWorkouts: number;
  activeWorkouts: number;
}> {
  const result = await pool.query(
    `SELECT 
      COUNT(DISTINCT workout_plans.id) as total_plans,
      COUNT(DISTINCT completed_workouts.id) as completed_workouts,
      COUNT(DISTINCT workout_plans.id) - COUNT(DISTINCT completed_workouts.id) as active_workouts
    FROM users
    LEFT JOIN workout_plans ON users.id = workout_plans.user_id
    LEFT JOIN completed_workouts ON workout_plans.id = completed_workouts.workout_plan_id
    WHERE users.id = $1`,
    [userId],
  );
  return result.rows[0];
}

/**
 * Berechnet den prozentualen Fortschritt eines spezifischen Workout-Plans
 * basierend auf geplanten vs. absolvierten Sätzen.
 *
 * @async
 * @param {number} workoutId - Die ID des Workout-Plans.
 * @param {string} userId - Die UUID des Benutzers.
 * @returns {Promise<{ totalSets: number; completedSets: number; progress: number }>} Fortschrittskennzahlen.
 */
export async function getWorkoutProgress(
  workoutId: number,
  userId: string,
): Promise<{
  totalSets: number;
  completedSets: number;
  progress: number;
}> {
  const result = await pool.query(
    `SELECT 
      COUNT(DISTINCT plan_sets.id) as total_sets,
      COUNT(DISTINCT completed_sets.id) as completed_sets,
      ROUND(
        COUNT(DISTINCT completed_sets.id) * 100.0 / NULLIF(COUNT(DISTINCT plan_sets.id), 0),
        2
      ) as progress
    FROM workout_plans
    LEFT JOIN plan_exercises ON workout_plans.id = plan_exercises.workout_plan_id
    LEFT JOIN plan_sets ON plan_exercises.id = plan_sets.plan_exercise_id
    LEFT JOIN completed_workouts ON workout_plans.id = completed_workouts.workout_plan_id
    LEFT JOIN completed_sets ON plan_sets.id = completed_sets.plan_exercise_id
    WHERE workout_plans.id = $1 AND workout_plans.user_id = $2`,
    [workoutId, userId],
  );
  return result.rows[0];
}

// --- SCHREIB-OPERATIONEN (Nutzen den Client aus dem Service) ---

/**
 * Erstellt einen neuen Trainingsplan mitsamt zugehörigen Übungen und Sätzen in einer Transaktion.
 *
 * @async
 * @param {PoolClient} client - Der aktive PostgreSQL-Transaktionsclient.
 * @param {string} title - Der Titel des Trainingsplans.
 * @param {string} userId - Die UUID des Erstellers.
 * @param {WorkoutExercise[]} exercises - Ein Array von Übungen inklusive ihrer Sätze.
 * @returns {Promise<number>} Die generierte ID des neu erstellten Workout-Plans.
 */
export async function postWorkoutPlan(
  client: PoolClient,
  title: string,
  userId: string,
  exercises: WorkoutExercise[],
): Promise<number> {
  const planResult = await client.query(
    "INSERT INTO workout_plans (user_id, title) VALUES ($1, $2) RETURNING id",
    [userId, title],
  );
  const planId = planResult.rows[0].id;

  for (let i = 0; i < exercises.length; i++) {
    const exerciseResult = await client.query(
      "INSERT INTO plan_exercises (workout_plan_id, exercise_id, display_order) VALUES ($1, $2, $3) RETURNING id",
      [planId, exercises[i].id, exercises[i].displayOrder],
    );
    const planExerciseId = exerciseResult.rows[0].id;

    if (exercises[i].sets && exercises[i].sets.length > 0) {
      await client.query(
        `INSERT INTO plan_sets (plan_exercise_id, set_number, weight, repetitions)
        SELECT $1,* FROM UNNEST($2::int[], $3::float[], $4::int[])`,
        [
          planExerciseId,
          exercises[i].sets.map((set) => set.setNumber),
          exercises[i].sets.map((set) => set.weight),
          exercises[i].sets.map((set) => set.repetitions),
        ],
      );
    }
  }
  return Number(planId);
}

/**
 * Speichert ein erfolgreich absolviertes Workout mitsamt aller absolvierten Sätze in der Datenbank.
 *
 * @async
 * @param {PoolClient} client - Der aktive PostgreSQL-Transaktionsclient.
 * @param {string} userId - Die UUID des Benutzers.
 * @param {number} workoutId - Die ID des zugrundeliegenden Plans (oder 0, falls freies Training).
 * @param {string} title - Der Titel des absolvierten Workouts.
 * @param {Date} startTime - Startzeitpunkt des Trainings.
 * @param {Date} endTime - Endzeitpunkt des Trainings.
 * @param {number} duration - Gesamtdauer in Sekunden.
 * @param {number} pauseTime - Pausengesamtzeit in Sekunden.
 * @param {WorkoutExercise[]} exercises - Die absolvierten Übungen und Sätze.
 * @returns {Promise<string>} Die generierte UUID des gespeicherten Completed Workouts.
 */
export async function postCompletedWorkout(
  client: PoolClient,
  userId: string,
  workoutId: number,
  title: string,
  startTime: Date,
  endTime: Date,
  duration: number,
  pauseTime: number,
  exercises: WorkoutExercise[],
): Promise<string> {
  const completedPlanResults = await client.query(
    "INSERT INTO completed_workouts (user_id, workout_plan_id, title, start_time, end_time, duration_seconds, pause_seconds) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id",
    [userId, workoutId, title, startTime, endTime, duration, pauseTime],
  );
  const completedPlanId = completedPlanResults.rows[0].id;

  for (const exercise of exercises) {
    if (exercise.sets && exercise.sets.length > 0) {
      await client.query(
        `INSERT INTO completed_sets 
          (completed_workout_id, exercise_id, set_number, repetitions, weight)
            SELECT $1, $2,  * FROM UNNEST ($3::int[], $4::int[], $5::float[])`,
        [
          completedPlanId,
          exercise.id,
          exercise.sets.map((set) => set.setNumber),
          exercise.sets.map((set) => set.repetitions),
          exercise.sets.map((set) => set.weight),
        ],
      );
    }
  }
  return completedPlanId;
}

/**
 * Führt einen Soft Delete für einen Trainingsplan aus (setzt `deleted_at` auf den aktuellen Zeitpunkt).
 *
 * @async
 * @param {PoolClient} client - Der aktive PostgreSQL-Transaktionsclient.
 * @param {number} workoutId - Die ID des zu löschenden Workout-Plans.
 * @param {string} userId - Die UUID des Eigentümers.
 * @returns {Promise<{ deletedId: number; message: string }>} Ein Bestätigungsobjekt mit der ID und Meldung.
 */
export async function deleteWorkout(
  client: PoolClient,
  workoutId: number,
  userId: string,
): Promise<{ deletedId: number; message: string }> {
  await client.query(
    "UPDATE workout_plans SET deleted_at = NOW() WHERE id = $1 AND user_id = $2",
    [workoutId, userId],
  );
  return { deletedId: workoutId, message: "Workout erfolgreich gelöscht" };
}

/**
 * Aktualisiert einen bestehenden Trainingsplan, indem alte Verknüpfungen bereinigt
 * und die übergebenen Übungen und Sätze neu eingefügt werden.
 *
 * @async
 * @param {PoolClient} client - Der aktive PostgreSQL-Transaktionsclient.
 * @param {number} workoutId - Die ID des zu aktualisierenden Workout-Plans.
 * @param {string} title - Der neue Titel des Plans.
 * @param {WorkoutExercise[]} exercises - Die aktualisierte Liste der Übungen und Sätze.
 * @returns {Promise<number>} Die ID des aktualisierten Workouts.
 */
export async function putWorkout(
  client: PoolClient,
  workoutId: number,
  title: string,
  exercises: WorkoutExercise[],
): Promise<number> {
  await client.query("UPDATE workout_plans SET title = $1 WHERE id = $2", [
    title,
    workoutId,
  ]);

  await client.query("DELETE FROM plan_exercises WHERE workout_plan_id = $1", [
    workoutId,
  ]);

  for (const exercise of exercises) {
    const exerciseResults = await client.query(
      "INSERT INTO plan_exercises (workout_plan_id, exercise_id, display_order) VALUES ($1, $2, $3) RETURNING id",
      [workoutId, exercise.id, exercise.displayOrder],
    );
    const planExerciseId = exerciseResults.rows[0].id;

    if (exercise.sets && exercise.sets.length > 0) {
      await client.query(
        `INSERT INTO plan_sets (plan_exercise_id, set_number, repetitions, weight) 
          SELECT $1, * FROM UNNEST($2::int[], $3::int[], $4::float[])`,
        [
          planExerciseId,
          exercise.sets.map((set) => set.setNumber),
          exercise.sets.map((set) => set.repetitions),
          exercise.sets.map((set) => set.weight),
        ],
      );
    }
  }
  return workoutId;
}

/**
 * Aktualisiert ein bereits abgeschlossenes Workout (Metadaten sowie zugehörige Sätze).
 *
 * @async
 * @param {PoolClient} client - Der aktive PostgreSQL-Transaktionsclient.
 * @param {CompletedWorkout} workout - Das aktualisierte Workout-Objekt.
 * @returns {Promise<{ workoutId: string; userId: string; message: string }>} Metadaten zur Bestätigung der Aktualisierung.
 */
export async function putCompletedWorkout(
  client: PoolClient,
  workout: CompletedWorkout,
): Promise<{ workoutId: string; userId: string; message: string }> {
  const result = await client.query(
    `UPDATE completed_workouts SET title = $1, start_time = $2, end_time = $3, duration_seconds = $4 
      WHERE id = $5 AND user_id = $6 RETURNING id, user_id`,
    [
      workout.title,
      workout.startTime,
      workout.endTime,
      workout.duration,
      workout.id,
      workout.userId,
    ],
  );

  await client.query(
    "DELETE FROM completed_sets WHERE completed_workout_id = $1 ",
    [workout.id],
  );

  for (const exercise of workout.exercises) {
    console.log("PUT COMPLETED WORKOUT REPO TEST: ", workout.exercises);
    if (exercise.sets && exercise.sets.length > 0) {
      await client.query(
        `INSERT INTO completed_sets (completed_workout_id, exercise_id, display_order, set_number, repetitions, weight)
      SELECT $4, $5, $6, * FROM UNNEST($1::int[], $2::int[], $3::float[])`,
        [
          exercise.sets.map((s) => s.setNumber),
          exercise.sets.map((s) => s.repetitions),
          exercise.sets.map((s) => s.weight),
          workout.id,
          exercise.id,
          exercise.displayOrder,
        ],
      );
    }
  }
  return {
    workoutId: result.rows[0].id,
    userId: result.rows[0].user_id,
    message: "Workout erfolgreich Aktualisiert",
  };
}
