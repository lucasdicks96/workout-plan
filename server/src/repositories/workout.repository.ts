import { PoolClient } from "pg";
import pool from "../config/db";
import {
  CompletedWorkout,
  FlatCompletedWorkoutRow,
  FlatWorkoutRow,
  WorkoutExercise,
} from "../types/workout.types";

// --- LESE-OPERATIONEN (Nutzen direkt den Pool oder einen Client) ---

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
    LEFT JOIN workout_plans -- GEÄNDERT: LEFT JOIN, falls ein Workout ohne Plan gestartet wurde
    ON        completed_workouts.workout_plan_id = workout_plans.id
    LEFT JOIN (             -- GEÄNDERT: LEFT JOIN, damit neu hinzugefügte Übungen nicht rausfliegen
    SELECT    workout_plan_id, exercise_id, MIN(display_order) as display_order
    FROM      plan_exercises
    GROUP BY  workout_plan_id, exercise_id)
    AS        unique_plan_exercises
    ON        completed_sets.exercise_id = unique_plan_exercises.exercise_id 
    AND       completed_workouts.workout_plan_id = unique_plan_exercises.workout_plan_id -- GEÄNDERT: Direkt auf completed_workouts prüfen
    WHERE     completed_workouts.user_id = $1
    AND       completed_workouts.id = $2
    ORDER BY  COALESCE(completed_sets.display_order, unique_plan_exercises.display_order) ASC NULLS LAST,
              completed_sets.set_number ASC;`,
    [userId, workoutId],
  );
  return result.rows;
}

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
    LEFT JOIN workout_plans -- GEÄNDERT: LEFT JOIN für Workouts ohne Plan
    ON        completed_workouts.workout_plan_id = workout_plans.id
    LEFT JOIN (             -- GEÄNDERT: LEFT JOIN, damit nachträgliche Übungen nicht gefiltert werden
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

export async function getLastCompletedWorkout(
  workoutId: number,
  userId: string,
): Promise<FlatCompletedWorkoutRow[] | []> {
  const planIdResult = await pool.query(
    `SELECT   id
      FROM      completed_workouts
      WHERE     user_id = $1
      AND       workout_plan_id = $2
      ORDER BY  end_time DESC
      LIMIT 1`,
    [userId, workoutId],
  );

  if (planIdResult.rows.length === 0) {
    console.log("Kein letztes Completed-Workout gefunden.");
    return [];
  }
  const lastWorkoutID: string = planIdResult.rows[0].id;

  const result = await pool.query(
    `WITH     unique_plan_exercises 
      AS (
      SELECT   workout_plan_id,
                exercise_id,
                MIN(display_order) as display_order
      FROM     plan_exercises
      WHERE    workout_plan_id = $1
      GROUP BY workout_plan_id, exercise_id
      )
      SELECT 
                completed_workouts.start_time AS last_workout_date,
                completed_workouts.title AS plan_title,
                exercises.id,
                exercises.title,
                completed_sets.set_number,
                completed_sets.*, 
                unique_plan_exercises.display_order
      FROM      completed_workouts
      JOIN      completed_sets
      ON        completed_workouts.id = completed_sets.completed_workout_id
      JOIN      exercises
      ON        completed_sets.exercise_id = exercises.id
      JOIN      unique_plan_exercises
      ON        completed_sets.exercise_id = unique_plan_exercises.exercise_id 
      AND       completed_workouts.workout_plan_id = unique_plan_exercises.workout_plan_id
      WHERE     completed_workouts.id = $2
      ORDER BY  unique_plan_exercises.display_order ASC, 
                completed_sets.set_number ASC;`,
    [workoutId, lastWorkoutID],
  );
  return result.rows;
}

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
