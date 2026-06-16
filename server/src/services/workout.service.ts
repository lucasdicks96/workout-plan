import pool from "../config/db";
import * as workoutRepository from "../repositories/workout.repository";
import {
  AppError,
  InternalServerError,
  NotFoundError,
  UnauthorizedError,
  BadRequestError,
} from "../types/errors.types";
import {
  CompletedWorkout,
  Workout,
  WorkoutExercise,
} from "../types/workout.types";
import {
  buildCompletedWorkouts,
  buildWorkout,
  buildWorkoutPlansList,
} from "../utils/workout.utils";

export async function createWorkoutPlan(
  title: string,
  userId: string,
  exercises: WorkoutExercise[],
) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const newWorkoutId = await workoutRepository.postWorkoutPlan(
      client,
      title,
      userId,
      exercises,
    );

    await client.query("COMMIT");

    const newWorkout = await getWorkoutById(newWorkoutId, userId);

    return newWorkout;
  } catch (error) {
    await client.query("ROLLBACK");
    if (error instanceof AppError) throw error;
    throw new InternalServerError(
      "Fehler bei der Erstellung des Workout-Plans.",
      error,
    );
  } finally {
    client.release();
  }
}

export async function getAllWorkouts(userId: string) {
  try {
    const workoutData = await workoutRepository.getWorkouts(userId);

    const workouts = buildWorkoutPlansList(workoutData);

    return workouts;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new InternalServerError("Fehler beim Abrufen der Workouts.", error);
  }
}

export async function getWorkoutById(
  workoutId: number,
  userId: string,
): Promise<Workout> {
  try {
    const owner = await workoutRepository.ownerCheck(workoutId, userId, pool);
    if (!owner) throw new NotFoundError("Workout nicht gefunden.");

    const workoutData = await workoutRepository.getWorkout(workoutId);

    if (!Array.isArray(workoutData) || workoutData.length === 0) {
      throw new BadRequestError("Keine Workout-Daten gefunden.");
    }

    const workout = buildWorkout(workoutId, workoutData);

    return workout;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new InternalServerError("Fehler beim Abrufen des Workouts.", error);
  }
}

export async function getLastWorkout(
  workoutId: number,
  userId: string,
): Promise<Workout> {
  try {
    const owner = await workoutRepository.ownerCheck(workoutId, userId, pool);
    if (!owner) throw new NotFoundError("Workout nicht gefunden.");

    const workoutData = await workoutRepository.getLastCompletedWorkout(
      workoutId,
      userId,
    );
    // Da Fallback auf getWorkoutById wenn kein lastCompletedWorkout. Somit Fehler wenn kein Last Completed und ById gefunden wurde
    if (!Array.isArray(workoutData) || workoutData.length === 0) {
      throw new BadRequestError("Keine Workout-Daten gefunden.");
    }

    const newWorkout = buildWorkout(workoutId, workoutData);

    return newWorkout;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new InternalServerError(
      "Fehler beim Abrufen des letzten Workouts.",
      error,
    );
  }
}

export async function getCompletedWorkouts(
  userId: string,
): Promise<CompletedWorkout[]> {
  try {
    const flatData = await workoutRepository.getCompletedWorkouts(userId);

    if (!Array.isArray(flatData) || flatData.length === 0) {
      return [];
    }

    const completedWorkouts = buildCompletedWorkouts(flatData);

    return completedWorkouts;
  } catch (error) {
    throw new InternalServerError(
      "Fehler beim Abrufen der abgeschlossenen Workouts.",
      error,
    );
  }
}

export async function getCompletedWorkout(
  userId: string,
  workoutId: string,
): Promise<CompletedWorkout> {
  try {
    const owner = await workoutRepository.ownerCheck(workoutId, userId, pool);
    if (!owner) throw new NotFoundError("Kein Workout gefunden.");

    const flatData = await workoutRepository.getCompletedWorkout(
      userId,
      workoutId,
    );

    if (!Array.isArray(flatData) || flatData.length === 0) {
      throw new BadRequestError(
        "Keine Daten für das abgeschlossene Workout gefunden.",
      );
    }

    const completedWorkouts = buildCompletedWorkouts(flatData);

    return completedWorkouts[0];
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new InternalServerError(
      "Fehler beim Abrufen des abgeschlossenen Workouts",
      error,
    );
  }
}

export async function postCompletedWorkout(
  workoutId: number,
  userId: string,
  startTime: Date,
  endTime: Date,
  pauseTime: number,
  duration: number,
  exercises: WorkoutExercise[],
  title: string,
): Promise<CompletedWorkout> {
  const durationInSeconds = Math.floor(duration / 1000);
  const pauseTimeInSeconds = Math.floor(pauseTime / 1000);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const owner = await workoutRepository.ownerCheck(workoutId, userId, client);
    if (!owner) throw new NotFoundError("Workout nicht gefunden.");

    const planId = await workoutRepository.postCompletedWorkout(
      client,
      userId,
      workoutId,
      title,
      startTime,
      endTime,
      durationInSeconds,
      pauseTimeInSeconds,
      exercises,
    );

    await client.query("COMMIT");

    const workout = await getCompletedWorkout(userId, planId);

    return workout;
  } catch (error) {
    await client.query("ROLLBACK");
    if (error instanceof AppError) throw error;
    throw new InternalServerError(
      "Fehler beim Speichern des abgeschlossenen Workouts",
      error,
    );
  } finally {
    client.release();
  }
}

export async function deleteWorkout(workoutId: number, userId: string) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Check nutzt denselben Client, damit es innerhalb der Transaktion sicher ist
    const owner = await workoutRepository.ownerCheck(workoutId, userId, client);
    if (!owner) {
      throw new UnauthorizedError(
        "Benutzer hat nicht die Rechte, dieses Workout zu bearbeiten.",
      );
    }

    const result = await workoutRepository.deleteWorkout(
      client,
      workoutId,
      userId,
    );

    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    if (error instanceof AppError) throw error;
    throw new InternalServerError("Fehler beim Löschen des Workouts", error);
  } finally {
    client.release();
  }
}

export async function putWorkout(
  workoutId: number,
  userId: string,
  title: string,
  exercises: WorkoutExercise[],
): Promise<Workout> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const isOwner = await workoutRepository.ownerCheck(
      workoutId,
      userId,
      client,
    );
    if (!isOwner) {
      throw new NotFoundError("Workout nicht gefunden.");
    }

    const planId = await workoutRepository.putWorkout(
      client,
      workoutId,
      title,
      exercises,
    );

    await client.query("COMMIT");

    const workout = await getWorkoutById(planId, userId);

    return workout;
  } catch (error) {
    await client.query("ROLLBACK");
    if (error instanceof AppError) throw error;
    throw new InternalServerError(
      "Fehler beim Aktualisieren des Workouts",
      error,
    );
  } finally {
    client.release();
  }
}

export async function putCompletedWorkout(
  workout: CompletedWorkout,
): Promise<CompletedWorkout> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const isOwner = await workoutRepository.ownerCheck(
      workout.workoutId,
      workout.userId,
      client,
    );
    if (!isOwner) {
      throw new NotFoundError("Workout nicht gefunden.");
    }

    const result = await workoutRepository.putCompletedWorkout(client, workout);

    await client.query("COMMIT");

    const completedWorkout = await getCompletedWorkout(
      result.userId,
      result.workoutId,
    );

    return completedWorkout;
  } catch (error) {
    await client.query("ROLLBACK");
    if (error instanceof AppError) throw error;
    throw new InternalServerError(
      "Fehler beim Aktualisieren des Workouts",
      error,
    );
  } finally {
    client.release();
  }
}

export async function getWorkoutStats(userId: string): Promise<{
  totalPlans: number;
  completedWorkouts: number;
  activeWorkouts: number;
}> {
  try {
    return await workoutRepository.getWorkoutStats(userId);
  } catch (error) {
    throw new InternalServerError(
      "Fehler beim Abrufen der Workout-Statistiken.",
      error,
    );
  }
}

export async function getWorkoutProgress(
  workoutId: number,
  userId: string,
): Promise<{
  totalSets: number;
  completedSets: number;
  progress: number;
}> {
  try {
    return await workoutRepository.getWorkoutProgress(workoutId, userId);
  } catch (error) {
    throw new InternalServerError(
      "Fehler beim Abrufen des Workout-Fortschritts.",
      error,
    );
  }
}
