import pool from "../config/db";
import { InternalServerError, UnauthorizedError } from "../types/errors.types";
import {
  CompletedWorkout,
  Workout,
  WorkoutExercises,
} from "../types/workout.types";

export async function ownerCheck(
  workoutId: number,
  userId: string
): Promise<boolean> {
  const result = await pool.query(
    "SELECT user_id FROM workout_plans WHERE id = $1 AND user_id = $2",
    [workoutId, userId]
  );
  const owner = result.rows[0].user_id === userId ? true : false;
  return owner;
}

export async function findAllWorkouts(userId: string): Promise<Workout[]> {
  const result = await pool.query(
    "SELECT * FROM workout_plans WHERE user_id = $1 AND deleted_at IS NULL ORDER BY title ASC",
    [userId]
  );
  const workouts: Workout[] = result.rows;
  return workouts;
}

export async function findWorkoutById(workoutId: number): Promise<any> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN ");

    const exerciseResult = await pool.query(
      `SELECT workout_plans.title as plan_title, workout_plans.user_id as plan_user_id, exercises.title, exercises.user_id, plan_exercises.exercise_id, plan_exercises.display_order, plan_sets.set_number, plan_sets.target_repetitions, plan_sets.target_weight 
      FROM plan_exercises 
      JOIN exercises 
      ON plan_exercises.exercise_id = exercises.id 
      JOIN plan_sets 
      ON plan_exercises.id = plan_sets.plan_exercise_id 
	  JOIN workout_plans 
      ON plan_exercises.workout_plan_id = workout_plans.id 
      WHERE plan_exercises.workout_plan_id = $1
      ORDER BY plan_exercises.display_order, plan_sets.set_number ASC`,
      [workoutId]
    );

    return exerciseResult.rows;
  } catch (error) {
    await client.query("ROLLBACK");
    throw new InternalServerError("Fehler beim Abrufen der Workout-Daten.");
  } finally {
    client.release();
  }
}

export async function createWorkoutPlan(
  title: string,
  userId: string,
  exercises: WorkoutExercises[]
): Promise<{ message: string }> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const planResult = await client.query(
      "INSERT INTO workout_plans (user_id, title) VALUES ($1, $2) RETURNING id",
      [userId, title]
    );
    const planId = planResult.rows[0].id;

    for (let i = 0; i < exercises.length; i++) {
      const exerciseResult = await client.query(
        "INSERT INTO plan_exercises (workout_plan_id, exercise_id, display_order) VALUES ($1, $2, $3) RETURNING id",
        [planId, exercises[i].id, exercises[i].displayOrder]
      );
      const planExerciseId = exerciseResult.rows[0].id;

      for (let j = 0; j < exercises[i].sets.length; j++) {
        await client.query(
          "INSERT INTO plan_sets (plan_exercise_id, set_number, target_weight, target_repetitions) VALUES ($1, $2, $3, $4)",
          [
            planExerciseId,
            exercises[i].sets[j].setNumber,
            exercises[i].sets[j].weight,
            exercises[i].sets[j].repetitions,
          ]
        );
      }
    }
    await client.query("COMMIT");
    return { message: "Workout Plan erfolgreich erstellt" };
  } catch (error) {
    await client.query("ROLLBACK");
    // console.error(error);
    throw new InternalServerError(
      "Fehler bei der Erstellung des Workout-Plans."
    );
  } finally {
    client.release();
  }
}

export async function findCompletedWorkouts(
  userId: string
): Promise<CompletedWorkout[]> {
  const result = await pool.query(
    "SELECT (workout_plan_id, title, start_time, end_time, duration_seconds, pause_seconds) FROM completed_workouts WHERE user_id = $1",
    [userId]
  );
  const completedWorkouts: CompletedWorkout[] = result.rows;
  return completedWorkouts;
}

export async function findLastCompletedWorkout(
  workoutId: number,
  userId: string
) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const planIdResult = await pool.query(
      `SELECT id FROM completed_workouts
      WHERE user_id = $1 AND workout_plan_id = $2
      ORDER BY end_time DESC
      LIMIT 1`,
      [userId, workoutId]
    );

    if (planIdResult.rows.length === 0) {
      // Fallback: Kein Completed-Workout -> Hole Plan-Daten
      console.log(
        "Kein letztes Completed-Workout gefunden. Fallback zu findWorkoutById."
      );
      const planData = await findWorkoutById(workoutId);
      return planData;
    }
    const lastWorkoutID: string = planIdResult.rows[0].id;

    console.log("LAST WORKOUT ID: ", lastWorkoutID);

    const result = await pool.query(
      `SELECT DISTINCT ON (completed_sets.exercise_id, completed_sets.set_number) 
    completed_workouts.id,
    completed_workouts.user_id as plan_user_id,
    completed_workouts.workout_plan_id,
    completed_workouts.end_time,
    completed_workouts.title as plan_title,
    exercises.title,
    exercises.user_id,
    completed_sets.exercise_id,
    completed_sets.set_number,
    completed_sets.performed_repetitions as target_repetitions, 
    completed_sets.performed_weight as target_weight, 
    plan_exercises.display_order
FROM completed_workouts
JOIN completed_sets ON completed_workouts.id = completed_sets.completed_workout_id
JOIN plan_exercises ON (
    completed_sets.exercise_id = plan_exercises.exercise_id 
AND completed_workouts.workout_plan_id = plan_exercises.workout_plan_id)
JOIN exercises ON plan_exercises.exercise_id = exercises.id
WHERE completed_workouts.user_id = $1
AND completed_workouts.id = $2
ORDER BY  completed_sets.exercise_id ASC,         
    completed_sets.set_number ASC,            
    plan_exercises.display_order ASC;         
`,
      [userId, lastWorkoutID]
    );
    return result.rows;
  } catch (error) {
    await client.query("ROLLBACK");
    throw new InternalServerError("Fehler beim Abrufen der Workout-Daten.");
  } finally {
    client.release();
  }
}

export async function saveCompletedWorkout(
  userId: string,
  workoutId: number,
  title: string,
  startTime: string,
  endTime: string,
  duration: number,
  pauseTime: number,
  exercises: WorkoutExercises[]
): Promise<{ message: string }> {
  const client = await pool.connect();
  try {
    await pool.query("BEGIN");
    const completedPlanResults = await client.query(
      "INSERT INTO completed_workouts (user_id, workout_plan_id, title, start_time, end_time, duration_seconds, pause_seconds) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id",
      [userId, workoutId, title, startTime, endTime, duration, pauseTime]
    );
    const completedPlanId = completedPlanResults.rows[0].id;

    for (const exercise of exercises) {
      for (const set of exercise.sets) {
        await client.query(
          "INSERT INTO completed_sets (completed_workout_id, exercise_id, set_number, performed_repetitions, performed_weight) VALUES ($1, $2, $3, $4, $5)",
          [
            completedPlanId,
            exercise.id,
            set.setNumber,
            set.repetitions,
            set.weight,
          ]
        );
      }
    }
    await client.query("COMMIT");
    return { message: "Abgeschlossenes Workout erfolgreich gespeichert" };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    throw new InternalServerError(
      "Fehler beim Speichern des abgeschlossenen Workouts."
    );
  } finally {
    client.release();
  }
}

export async function deleteWorkout(
  workoutId: number,
  userId: string
): Promise<{ message: string }> {
  await pool.query(
    "UPDATE workout_plans SET deleted_at = NOW() WHERE id = $1 AND user_id = $2",
    [workoutId, userId]
  );

  return { message: `Workout erfolgreich gelöscht ${workoutId}` };
}

export async function updateWorkout(
  workoutId: number,
  userId: string,
  title: string,
  exercises: WorkoutExercises[]
) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const ownerCheck = await client.query(
      "SELECT user_id FROM workout_plans WHERE id = $1",
      [workoutId]
    );
    if (ownerCheck.rows.length === 0 || ownerCheck.rows[0].user_id !== userId) {
      throw new UnauthorizedError(
        "Workout nicht gefunden oder Benutzer ist nicht autorisiert."
      );
    }

    await client.query(
      "UPDATE workout_plans SET title = $1 WHERE id = $2 AND user_id = $3 RETURNING *",
      [title, workoutId, userId]
    );

    await client.query(
      "DELETE FROM plan_exercises WHERE workout_plan_id = $1",
      [workoutId]
    );

    for (const exercise of exercises) {
      const exerciseResults = await client.query(
        "INSERT INTO plan_exercises (workout_plan_id, exercise_id, display_order) VALUES ($1, $2, $3) RETURNING id",
        [workoutId, exercise.id, exercise.displayOrder]
      );
      const planExerciseId = exerciseResults.rows[0].id;
      for (const set of exercise.sets) {
        await client.query(
          "INSERT INTO plan_sets(plan_exercise_id, set_number, target_repetitions, target_weight) VALUES ($1, $2, $3, $4)",
          [planExerciseId, set.setNumber, set.repetitions, set.weight]
        );
      }
    }
    await client.query("COMMIT");
    return { message: "Workout erfolgreich Aktualisiert" };
  } catch (error) {
    await client.query("ROLLBACK");
    throw new InternalServerError(
      "Fehler beim Aktualisieren des Workout-Plans"
    );
  } finally {
    client.release();
  }
}
