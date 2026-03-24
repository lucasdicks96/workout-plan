import pool from "../config/db";
import { InternalServerError, UnauthorizedError } from "../types/errors.types";
import {
  CompletedWorkout,
  Workout,
  WorkoutExercise,
} from "../types/workout.types";

export async function ownerCheck(
  workoutId: number,
  userId: string,
  db: any = pool,
): Promise<boolean> {
  const result = await db.query(
    "SELECT user_id FROM workout_plans WHERE id = $1 AND user_id = $2",
    [workoutId, userId],
  );
  return result.rowCount !== null && result.rowCount > 0;
}

export async function getWorkouts(userId: string): Promise<Workout[]> {
  const result = await pool.query(
    "SELECT * FROM workout_plans WHERE user_id = $1 AND deleted_at IS NULL ORDER BY title ASC",
    [userId],
  );
  const workouts: Workout[] = result.rows;
  return workouts;
}

export async function getWorkout(workoutId: number): Promise<any> {
  const exerciseResult = await pool.query(
    `SELECT   workout_plans.title as plan_title,
                workout_plans.user_id as plan_user_id,
                exercises.title,
                exercises.user_id,
                plan_exercises.exercise_id,
                plan_exercises.display_order,
                plan_sets.set_number,
                plan_sets.target_repetitions,
                plan_sets.target_weight 
      FROM      plan_exercises 
      JOIN      exercises 
      ON        plan_exercises.exercise_id = exercises.id 
      JOIN      plan_sets 
      ON        plan_exercises.id = plan_sets.plan_exercise_id 
	    JOIN      workout_plans 
      ON        plan_exercises.workout_plan_id = workout_plans.id 
      WHERE     plan_exercises.workout_plan_id = $1
      ORDER BY  plan_exercises.display_order, plan_sets.set_number ASC`,
    [workoutId],
  );

  return exerciseResult.rows;
}

export async function postWorkoutPlan(
  title: string,
  userId: string,
  exercises: WorkoutExercise[],
): Promise<{ message: string }> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
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

      await client.query(
        `INSERT INTO plan_sets (plan_exercise_id, set_number, target_weight, target_repetitions)
        SELECT $1,* 
        FROM UNNEST($2::int[], $3::float[], $4::int[])`,
        [
          planExerciseId,
          exercises[i].sets.map((set) => set.setNumber),
          exercises[i].sets.map((set) => set.weight),
          exercises[i].sets.map((set) => set.repetitions),
        ],
      );
    }
    await client.query("COMMIT");
    return { message: "Workout Plan erfolgreich erstellt" };
  } catch (error) {
    await client.query("ROLLBACK");
    // console.error(error);
    throw new InternalServerError(
      "Fehler bei der Erstellung des Workout-Plans.",
    );
  } finally {
    client.release();
  }
}

export async function getCompletedWorkouts(userId: string) {
  const result = await pool.query(
    `SELECT   completed_workouts.id AS workout_id,
              completed_workouts.start_time,
              completed_workouts.workout_plan_id,
              completed_workouts.duration_seconds,
              completed_workouts.pause_seconds,
              completed_workouts.end_time,
              workout_plans.title AS plan_title,
              completed_sets.exercise_id,
              completed_sets.set_number,
              completed_sets.performed_repetitions AS repetitions,
			        completed_sets.performed_weight AS weight,
              exercises.title,
              exercises.user_id,
              unique_plan_exercises.display_order
    FROM      completed_workouts
    JOIN      completed_sets
    ON        completed_workouts.id = completed_sets.completed_workout_id
    JOIN      exercises
    ON        completed_sets.exercise_id = exercises.id
    JOIN      workout_plans
    ON        completed_workouts.workout_plan_id = workout_plans.id
    JOIN (
    SELECT    workout_plan_id, exercise_id, MIN(display_order) as display_order
    FROM      plan_exercises
    GROUP BY  workout_plan_id, exercise_id)
    AS        unique_plan_exercises
    ON        completed_sets.exercise_id = unique_plan_exercises.exercise_id 
    AND       workout_plans.id = unique_plan_exercises.workout_plan_id

    WHERE     completed_workouts.user_id = $1
    ORDER BY 
              completed_workouts.start_time DESC,   
              unique_plan_exercises.display_order ASC,
              completed_sets.set_number ASC;`,
    [userId],
  );
  return result.rows;
}

export async function getLastCompletedWorkout(
  workoutId: number,
  userId: string,
) {
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
    // Fallback: Kein Completed-Workout -> Hole Plan-Daten
    console.log(
      "Kein letztes Completed-Workout gefunden. Fallback zu findWorkoutById.",
    );
    const planData = await getWorkout(workoutId);
    return planData;
  }
  const lastWorkoutID: string = planIdResult.rows[0].id;

  console.log("LAST WORKOUT ID: ", lastWorkoutID);

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
                exercises.id AS exercise_id,
                exercises.name AS exercise_name,
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

export async function postCompletedWorkout(
  userId: string,
  workoutId: number,
  title: string,
  startTime: string,
  endTime: string,
  duration: number,
  pauseTime: number,
  exercises: WorkoutExercise[],
): Promise<{ message: string }> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const completedPlanResults = await client.query(
      "INSERT INTO completed_workouts (user_id, workout_plan_id, title, start_time, end_time, duration_seconds, pause_seconds) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id",
      [userId, workoutId, title, startTime, endTime, duration, pauseTime],
    );
    const completedPlanId = completedPlanResults.rows[0].id;

    for (const exercise of exercises) {
      await client.query(
        `INSERT INTO completed_sets 
          (completed_workout_id, exercise_id, set_number, performed_repetitions, performed_weight)
           SELECT $1,* 
           FROM UNNEST ($2::int[], $3::int[], $4::int[], $5::float[])`,
        [
          completedPlanId,
          exercise.id,
          exercise.sets.map((set) => set.setNumber),
          exercise.sets.map((set) => set.repetitions),
          exercise.sets.map((set) => set.weight),
        ],
      );
    }
    await client.query("COMMIT");
    return { message: "Abgeschlossenes Workout erfolgreich gespeichert" };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    throw new InternalServerError(
      "Fehler beim Speichern des abgeschlossenen Workouts.",
    );
  } finally {
    client.release();
  }
}

export async function deleteWorkout(
  workoutId: number,
  userId: string,
): Promise<{ message: string }> {
  const isOwner = await ownerCheck(workoutId, userId, pool);
  if (!isOwner) {
    throw new UnauthorizedError(
      "Workout nicht gefunden oder Benutzer ist nicht autorisiert.",
    );
  }
  await pool.query(
    "UPDATE workout_plans SET deleted_at = NOW() WHERE id = $1 AND user_id = $2",
    [workoutId, userId],
  );

  return { message: `Workout erfolgreich gelöscht ${workoutId}` };
}

export async function putWorkout(
  workoutId: number,
  userId: string,
  title: string,
  exercises: WorkoutExercise[],
) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const isOwner = await ownerCheck(workoutId, userId, client);

    if (!isOwner) {
      throw new UnauthorizedError(
        "Workout nicht gefunden oder Benutzer ist nicht autorisiert.",
      );
    }

    await client.query("UPDATE workout_plans SET title = $1 WHERE id = $2", [
      title,
      workoutId,
    ]);

    await client.query(
      "DELETE FROM plan_exercises WHERE workout_plan_id = $1",
      [workoutId],
    );

    for (const exercise of exercises) {
      const exerciseResults = await client.query(
        "INSERT INTO plan_exercises (workout_plan_id, exercise_id, display_order) VALUES ($1, $2, $3) RETURNING id",
        [workoutId, exercise.id, exercise.displayOrder],
      );
      const planExerciseId = exerciseResults.rows[0].id;

      if (exercise.sets && exercise.sets.length > 0) {
        await client.query(
          `INSERT INTO plan_sets (plan_exercise_id, set_number, target_repetitions, target_weight) 
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
    await client.query("COMMIT");
    return { message: "Workout erfolgreich Aktualisiert" };
  } catch (error) {
    await client.query("ROLLBACK");
    if (error instanceof UnauthorizedError) {
      throw error;
    }

    console.error("Error in updateWorkout:", error);

    throw new InternalServerError(
      "Fehler beim Aktualisieren des Workout-Plans",
    );
  } finally {
    client.release();
  }
}
