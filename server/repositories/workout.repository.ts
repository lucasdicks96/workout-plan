import pool from "../config/db";
import {
  CompletedWorkout,
  Workout
} from "../types/workout.types";

export async function findAllWorkouts(userId: string): Promise<Workout[]> {
  try {
    const result = await pool.query(
      "SELECT * FROM workouts WHERE user_id = $1",
      [userId]
    );
    const workouts: Workout[] = result.rows;
    return workouts;
  } catch (dbError) {
    console.error("Fehler beim Abrufen aller Workouts:", dbError);
    throw dbError;
  }
}

export async function findWorkoutById(
  userId: string,
  workoutId: number
): Promise<Workout> {
  try {
    const result = await pool.query(
      "SELECT * FROM workouts WHERE workout_id = $1 AND user_id = $2",
      [workoutId, userId]
    );
    const workout: Workout = result.rows[0];
    return workout;
  } catch (dbError) {
    console.error("Fehler beim Abrufen des einzelnen Workouts:", dbError);
    throw dbError;
  }
}

export async function createWorkoutPlan(
  workout: Workout
): Promise<{ message: string }> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const planResult = await client.query(
      "INSERT INTO workout_plans (user_id, title) VALUES ($1, $2) RETURNING id",
      [workout.userId, workout.title]
    );
    const planId = planResult.rows[0].id;

    for (let i = 0; i < workout.exercises.length; i++) {
      const exerciseResult = await client.query(
        "INSERT INTO plan_exercises (workout_plan_id, exercise_id, display_order) VALUES ($1, $2, $3) RETURNING id",
        [planId, workout.exercises[i].id, i]
      );
      const planExerciseId = exerciseResult.rows[0].id;

      for (let j = 0; j < workout.exercises[i].sets.length; j++) {
        await client.query(
          "INSERT INTO exercise_sets (plan_exercise_id, set_number, target_weight, target_repetitions) VALUES ($1, $2, $3, $4)",
          [
            planExerciseId,
            workout.exercises[i].sets[j].setNumber,
            workout.exercises[i].sets[j].weight,
            workout.exercises[i].sets[j].repetitions,
          ]
        );
      }
    }
    await client.query("COMMIT");
    return { message: "Workout Plan erfolgreich erstellt" };
  } catch (dbError) {
    await client.query("ROLLBACK");
    console.error(
      "Fehler bei der Erstellung des Workout-Plans, Transaktion zurückgerollt:",
      dbError
    );
    throw dbError;
  } finally {
    client.release();
  }
}

export async function findCompletedWorkouts(
  userId: string
): Promise<CompletedWorkout> {
  // const client = await pool.connect();
  try {
    const result = await pool.query(
      "SELECT * FROM completed_workouts WHERE user_id = $1",
      [userId]
    );
    const completedWorkouts: CompletedWorkout = result.rows[0];
    return completedWorkouts;
  } catch (dbError) {
    throw dbError;
  }
}

export async function saveCompletedWorkout(
  completedWorkout: CompletedWorkout
): Promise<{ message: string }> {
  const client = await pool.connect();
  try {
    await pool.query("BEGIN");
    const completedPlanResults = await client.query(
      "INSERT INTO completed_workouts (user_id, workout_plan_id, title, start_time, end_time, duration_seconds, pause_seconds) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id",
      [
        completedWorkout.userId,
        completedWorkout.workoutId,
        completedWorkout.title,
        completedWorkout.startTime,
        completedWorkout.endTime,
        completedWorkout.duration,
        completedWorkout.pauseTime,
      ]
    );
    const completedPlanId = completedPlanResults.rows[0].id;
    for (const exercise of completedWorkout.exercises) {
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
  } catch (dbError) {
    await client.query("ROLLBACK");
    console.error(
      "Fehler beim Speichern des abgeschlossonen Workouts:",
      dbError
    );
    throw dbError;
  } finally {
    client.release();
  }
  4;
}

export async function deleteWorkout(
  workoutId: number,
  userId: string,
  deletedAt: number
): Promise<{ message: string }> {
  try {
    await pool.query(
      "INSER INTO workout_plans (deleted_at) VALUES ($1) WHERE id = $2 AND user_id = $3",
      [deletedAt, workoutId, userId]
    );
    return { message: "Workout erfolgreich gelöscht " };
  } catch (dbError) {
    throw dbError;
  }
}

export async function updateWorkout(workoutData: Workout) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const ownerCheck = await client.query(
      "SELECT user_id FROM workout_plans WHERE id = $1",
      [workoutData.id]
    );
    if (
      ownerCheck.rows.length === 0 ||
      ownerCheck.rows[0].user_id !== workoutData.id
    ) {
      throw new Error(
        "Workout nicht gefunden oder Benutzer ist nicht autorisiert."
      );
    }

    await client.query(
      "UPDATE workout_plan SET title = $1 WHERE id = $2 AND user_id = $3",
      [workoutData.title, workoutData.id, workoutData.userId]
    );
    await client.query(
      "DELETE FROM plan_exercises WHERE workout_plan_id = $1",
      [workoutData.id]
    );

    for (const exercise of workoutData.exercises) {
      const exerciseResults = await client.query(
        "INSERT INTO plan_exercises (workout_plan_id, exercise_id, display_order) VALUES ($1, $2, $3) RETURNING id",
        [workoutData.id, exercise.id, exercise.displayOrder]
      );
      const planExerciseId = exerciseResults.rows[0].id;
      for (const set of exercise.sets) {
        await client.query(
          "INSERT INTO plan_sets(plan_exercise_id, set_number, target_repetition, target_weight VALUES ($1, $2, $3, $4)",
          [planExerciseId, set.setNumber, set.repetitions, set.weight]
        );
      }
    }
    await client.query("COMMIT");
    return { message: "Workout erfolgreich Aktualisiert" };
  } catch (dbError) {
    await client.query("ROLLBACK");
    console.error("Fehler beim Aktualisieren des Workout-Plans", dbError);
    throw dbError;
  } finally {
    client.release();
  }
}

export async function filterCompletedWorkouts() {}
