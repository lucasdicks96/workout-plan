import pool from "../config/db";
import * as workoutRepository from "../repositories/workout.repository";
import {
  AppError,
  BadRequestError,
  InternalServerError,
  UnauthorizedError,
} from "../types/errors.types";
import {
  CompletedWorkout,
  FlattenedCompletedWorkout,
  Workout,
  WorkoutExercise,
} from "../types/workout.types";

export async function createWorkoutPlan(
  title: string,
  userId: string,
  exercises: WorkoutExercise[],
) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const newWorkout = await workoutRepository.postWorkoutPlan(
      client,
      title,
      userId,
      exercises,
    );

    await client.query("COMMIT");
    return newWorkout;
  } catch (error) {
    await client.query("ROLLBACK");
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
    return await workoutRepository.getWorkouts(userId);
  } catch (error) {
    throw new InternalServerError("Fehler beim Abrufen der Workouts.", error);
  }
}

export async function getWorkoutById(
  workoutId: number,
  userId: string,
): Promise<Workout> {
  try {
    const owner = await workoutRepository.ownerCheck(workoutId, userId, pool);
    if (!owner) throw new UnauthorizedError("Nicht berechtigt das zu tun.");

    const workoutData = await workoutRepository.getWorkout(workoutId);

    if (!Array.isArray(workoutData) || workoutData.length === 0) {
      throw new BadRequestError("Keine Workout-Daten gefunden.");
    }

    const { plan_title, plan_user_id } = workoutData[0];

    const newWorkout: Workout = {
      id: workoutId,
      title: plan_title,
      userId: plan_user_id,
      exercises: [],
    };

    const exerciseMap = new Map<number, WorkoutExercise>();
    workoutData.forEach((item) => {
      const exerciseId = item.exercise_id;
      let exercise = exerciseMap.get(exerciseId);

      if (!exercise) {
        exercise = {
          id: exerciseId,
          title: item.title,
          displayOrder: item.display_order,
          sets: [],
        };
        exerciseMap.set(exerciseId, exercise);
      }

      exercise.sets.push({
        setNumber: item.set_number,
        repetitions: item.repetitions,
        weight: item.weight,
      });
    });

    newWorkout.exercises = Array.from(exerciseMap.values()).sort(
      (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
    );

    return newWorkout;
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
    if (!owner) throw new UnauthorizedError("Nicht berechtigt das zu tun.");

    const workoutData: Workout =
      await workoutRepository.getLastCompletedWorkout(workoutId, userId);

    if (!Array.isArray(workoutData) || workoutData.length === 0) {
      throw new BadRequestError("Keine Workout-Daten gefunden.");
    }

    const { plan_title, plan_user_id } = workoutData[0];

    const newWorkout: Workout = {
      id: workoutId,
      title: plan_title,
      userId: plan_user_id,
      exercises: [],
    };

    const exerciseMap = new Map<number, WorkoutExercise>();
    workoutData.forEach((item) => {
      const exerciseId = item.exercise_id;
      let exercise = exerciseMap.get(exerciseId);

      if (!exercise) {
        exercise = {
          id: exerciseId,
          title: item.title,
          displayOrder: item.display_order,
          sets: [],
        };
        exerciseMap.set(exerciseId, exercise);
      }

      exercise.sets.push({
        setNumber: item.set_number,
        repetitions: item.repetitions,
        weight: item.weight,
      });
    });

    newWorkout.exercises = Array.from(exerciseMap.values()).sort(
      (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
    );

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

    const workoutGroupMap = new Map<
      string,
      {
        workout: CompletedWorkout;
        exerciseMap: Map<number, WorkoutExercise>;
      }
    >();

    flatData.forEach((item) => {
      const completedWorkoutId = item.workout_id;

      let workoutEntry = workoutGroupMap.get(completedWorkoutId);

      if (!workoutEntry) {
        workoutEntry = {
          workout: {
            id: completedWorkoutId,
            userId: userId,
            workoutId: item.workout_plan_id,
            title: item.plan_title,
            duration: item.duration_seconds,
            startTime: item.start_time,
            endTime: item.end_time,
            pauseTime: item.pause_seconds,
            exercises: [],
          },
          exerciseMap: new Map<number, WorkoutExercise>(),
        };
        workoutGroupMap.set(completedWorkoutId, workoutEntry);
      }

      const exerciseId = item.exercise_id;
      let exercise = workoutEntry.exerciseMap.get(exerciseId);

      if (!exercise) {
        exercise = {
          id: exerciseId,
          title: item.title,
          displayOrder: item.display_order,
          sets: [],
        };
        workoutEntry.exerciseMap.set(exerciseId, exercise);
      }

      if (item.set_number != null) {
        exercise.sets.push({
          setNumber: item.set_number,
          weight: item.weight,
          repetitions: item.repetitions,
        });
      }
    });

    const completedWorkouts: CompletedWorkout[] = [];

    for (const { workout, exerciseMap } of workoutGroupMap.values()) {
      workout.exercises = Array.from(exerciseMap.values()).sort(
        (a, b) => a.displayOrder - b.displayOrder,
      );
      completedWorkouts.push(workout);
    }

    completedWorkouts.sort(
      (a, b) => b.startTime.getTime() - a.startTime.getTime(),
    );

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
    if (!owner) throw new UnauthorizedError("Nicht berechtigt das zu tun.");

    const flatData: FlattenedCompletedWorkout[] =
      await workoutRepository.getCompletedWorkout(userId, workoutId);

    if (!Array.isArray(flatData) || flatData.length === 0) {
      throw new BadRequestError(
        "Keine Daten für das abgeschlossene Workout gefunden.",
      );
    }

    const workoutGroupMap = new Map<
      string,
      {
        workout: CompletedWorkout;
        exerciseMap: Map<number, WorkoutExercise>;
      }
    >();

    flatData.forEach((item) => {
      const completedWorkoutId = item.workout_id;

      let workoutEntry = workoutGroupMap.get(completedWorkoutId);

      if (!workoutEntry) {
        workoutEntry = {
          workout: {
            id: completedWorkoutId,
            userId: userId,
            workoutId: item.workout_plan_id,
            title: item.plan_title,
            duration: item.duration_seconds,
            startTime: item.start_time,
            endTime: item.end_time,
            pauseTime: item.pause_seconds,
            exercises: [],
          },
          exerciseMap: new Map<number, WorkoutExercise>(),
        };
        workoutGroupMap.set(completedWorkoutId, workoutEntry);
      }

      const exerciseId = item.exercise_id;
      let exercise = workoutEntry.exerciseMap.get(exerciseId);

      if (!exercise) {
        exercise = {
          id: exerciseId,
          title: item.title,
          displayOrder: item.display_order,
          sets: [],
        };
        workoutEntry.exerciseMap.set(exerciseId, exercise);
      }

      if (item.set_number != null) {
        exercise.sets.push({
          setNumber: item.set_number,
          weight: item.weight,
          repetitions: item.repetitions,
        });
      }
    });

    let completedWorkouts: CompletedWorkout = {} as CompletedWorkout;

    for (const { workout, exerciseMap } of workoutGroupMap.values()) {
      workout.exercises = Array.from(exerciseMap.values()).sort(
        (a, b) => a.displayOrder - b.displayOrder,
      );
      completedWorkouts = workout;
    }

    return completedWorkouts;
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
) {
  const durationInSeconds = Math.floor(duration / 1000);
  const pauseTimeInSeconds = Math.floor(pauseTime / 1000);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const owner = await workoutRepository.ownerCheck(workoutId, userId, client);
    if (!owner) throw new UnauthorizedError("Nicht berechtigt das zu tun.");

    const result = await workoutRepository.postCompletedWorkout(
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
    return result;
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
) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const isOwner = await workoutRepository.ownerCheck(
      workoutId,
      userId,
      client,
    );
    if (!isOwner) {
      throw new UnauthorizedError(
        "Workout nicht gefunden oder Benutzer ist nicht autorisiert.",
      );
    }

    const result = await workoutRepository.putWorkout(
      client,
      workoutId,
      title,
      exercises,
    );

    await client.query("COMMIT");
    return result;
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

export async function putCompletedWorkout(workout: CompletedWorkout) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const isOwner = await workoutRepository.ownerCheck(
      workout.workoutId,
      workout.userId,
      client,
    );
    if (!isOwner) {
      throw new UnauthorizedError(
        "Workout nicht gefunden oder Benutzer ist nicht autorisiert.",
      );
    }

    const result = await workoutRepository.putCompletedWorkout(client, workout);

    await client.query("COMMIT");
    return result;
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
