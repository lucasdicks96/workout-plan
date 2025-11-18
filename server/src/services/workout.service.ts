import * as workoutRepository from "../repositories/workout.repository";
import {
  BadRequestError,
  InternalServerError,
  UnauthorizedError,
} from "../types/errors.types";
import {
  Workout,
  WorkoutExercises,
  CompletedWorkout,
} from "../types/workout.types";

export async function createWorkoutPlan(
  title: string,
  userId: string,
  exercises: WorkoutExercises[]
) {
  if (!exercises || exercises.length === 0)
    throw new BadRequestError("Workout Daten fehlen");
  if (!userId) throw new UnauthorizedError("Benutzer ID fehlt");
  if (!title) throw new BadRequestError("Workout Titel fehlt");

  const databaseFormat = transformWorkoutExercisesToDatabaseFormat(
    exercises,
    userId,
    true,
    true
  );

  const newWorkout = await workoutRepository.createWorkoutPlan(
    title,
    userId,
    databaseFormat
  );
  return newWorkout;
}

export async function getAllWorkouts(userId: string) {
  const workouts = await workoutRepository.findAllWorkouts(userId);
  return workouts;
}

export async function getWorkoutById(
  workoutId: number,
  userId: string
): Promise<Workout> {
  if (!workoutId) throw new BadRequestError("Workout ID fehlt.");

  const owner = await workoutRepository.ownerCheck(workoutId, userId);

  if (!owner) throw new UnauthorizedError("Nicht berechtigt das zu tun.");

  const workoutData = await workoutRepository.findWorkoutById(workoutId);

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

  const exerciseMap = new Map<number, WorkoutExercises>();
  workoutData.forEach((item) => {
    const exerciseId = item.exercise_id;
    let exercise = exerciseMap.get(exerciseId);

    if (!exercise) {
      exercise = {
        id: exerciseId,
        userId: item.user_id,
        compositeKey: `${item.user_id ? "user" : "system"}-${exerciseId}`,
        title: item.title,
        displayOrder: item.display_order,
        sets: [],
      };
      exerciseMap.set(exerciseId, exercise);
    }

    exercise.sets.push({
      setNumber: item.set_number,
      repetitions: item.target_repetitions,
      weight: item.target_weight,
    });
  });

  newWorkout.exercises = Array.from(exerciseMap.values()).sort(
    (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)
  );

  return newWorkout;
}

export async function getLastWorkout(
  workoutId: number,
  userId: string
): Promise<Workout> {
  if (!workoutId) throw new BadRequestError("Workout ID fehlt.");

  const owner = await workoutRepository.ownerCheck(workoutId, userId);

  if (!owner) throw new UnauthorizedError("Nicht berechtigt das zu tun.");

  const workoutData = await workoutRepository.findLastCompletedWorkout(
    workoutId,
    userId
  );

  

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

  const exerciseMap = new Map<number, WorkoutExercises>();
  workoutData.forEach((item) => {
    const exerciseId = item.exercise_id;
    let exercise = exerciseMap.get(exerciseId);

    if (!exercise) {
      exercise = {
        id: exerciseId,
        userId: item.user_id,
        compositeKey: `${item.user_id ? "user" : "system"}-${exerciseId}`,
        title: item.title,
        displayOrder: item.display_order,
        sets: [],
      };
      exerciseMap.set(exerciseId, exercise);
    }

    exercise.sets.push({
      setNumber: item.set_number,
      repetitions: item.target_repetitions,
      weight: item.target_weight,
    });
  });

  newWorkout.exercises = Array.from(exerciseMap.values()).sort(
    (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)
  );
  console.log("GET LAST WORKOUT DATA: ", newWorkout);
  return newWorkout;
}

export async function getCompletedWorkouts(userId: string) {
  const completedWorkouts = await workoutRepository.findCompletedWorkouts(
    userId
  );

  return completedWorkouts;
}

export async function saveCompletedWorkout(
  workoutId: number,
  userId: string,
  startTime: number,
  endTime: number,
  pauseTime: number,
  duration: number,
  exercises: WorkoutExercises[],
  title: string
) {
  const transformed = transformWorkoutExercisesToDatabaseFormat(
    exercises,
    userId,
    false,
    false
  );

  const pgStartTime = convertMsToPgTimestamp(startTime);
  const pgEndTime = convertMsToPgTimestamp(endTime);
  const durationInSeconds = Math.floor(duration / 1000);
  const pauseTimeInSeconds = Math.floor(pauseTime / 1000);

  const result = await workoutRepository.saveCompletedWorkout(
    userId,
    workoutId,
    title,
    pgStartTime,
    pgEndTime,
    durationInSeconds,
    pauseTimeInSeconds,
    transformed
  );
  if (!result)
    throw new InternalServerError(
      "Fehler beim Speichern des abgeschlossenen Workouts"
    );
  return result;
}

export async function deleteWorkout(workoutId: number, userId: string) {
  const owner = await workoutRepository.ownerCheck(workoutId, userId);
  if (!owner)
    throw new Error(
      "Benutzer hat nicht die Rechte, dieses Workout zu bearbeiten."
    );

  const result = await workoutRepository.deleteWorkout(workoutId, userId);
  if (!result)
    throw new InternalServerError("Fehler beim Löschen des Workouts");
  return result;
}

export async function updateWorkout(
  workoutId: number,
  userId: string,
  title: string,
  exercises: WorkoutExercises[]
) {
  const transformed = transformWorkoutExercisesToDatabaseFormat(
    exercises,
    userId,
    false,
    true
  );

  const result = await workoutRepository.updateWorkout(
    workoutId,
    userId,
    title,
    transformed
  );

  if (!result)
    throw new InternalServerError("Fehler beim Aktualisieren des Workouts");
  return result;
}

function transformWorkoutExercisesToDatabaseFormat(
  exercises: WorkoutExercises[],
  userId: string,
  description: boolean,
  displayOrder: boolean
): WorkoutExercises[] {
  let transformed: WorkoutExercises[] = [];

  if (description && displayOrder) {
    for (const ex of exercises) {
      for (const s of ex.sets) {
        transformed.push({
          id: ex.id,
          userId: userId ? userId : null,
          title: ex.title,
          description: ex.description,
          displayOrder: ex.displayOrder,
          sets: [
            {
              setNumber: s.setNumber,
              repetitions: s.repetitions,
              weight: s.weight,
            },
          ],
        });
      }
    }
  } else if (!description && displayOrder) {
    for (const ex of exercises) {
      for (const s of ex.sets) {
        transformed.push({
          id: ex.id,
          userId: userId ? userId : null,
          title: ex.title,
          displayOrder: ex.displayOrder,
          sets: [
            {
              setNumber: s.setNumber,
              repetitions: s.repetitions,
              weight: s.weight,
            },
          ],
        });
      }
    }
  } else if (description && !displayOrder) {
    for (const ex of exercises) {
      for (const s of ex.sets) {
        transformed.push({
          id: ex.id,
          userId: userId ? userId : null,
          title: ex.title,
          description: ex.description,
          sets: [
            {
              setNumber: s.setNumber,
              repetitions: s.repetitions,
              weight: s.weight,
            },
          ],
        });
      }
    }
  } else {
    for (const ex of exercises) {
      for (const s of ex.sets) {
        transformed.push({
          id: ex.id,
          userId: userId ? userId : null,
          title: ex.title,
          sets: [
            {
              setNumber: s.setNumber,
              repetitions: s.repetitions,
              weight: s.weight,
            },
          ],
        });
      }
    }
  }

  return transformed;
}

// Konvertierungs-Hilfsfunktion
const convertMsToPgTimestamp = (ms: number) => {
  if (!ms || isNaN(ms)) {
    throw new BadRequestError("Ungültiger Timestamp (ms): " + ms);
  }
  const date = new Date(ms); // Erstellt UTC-Date-Objekt
  if (isNaN(date.getTime())) {
    throw new BadRequestError("Ungültiges Date-Objekt aus ms: " + ms);
  }
  return date.toISOString(); // 'YYYY-MM-DDTHH:MM:SS.mmmZ' – PostgreSQL-kompatibel
};
