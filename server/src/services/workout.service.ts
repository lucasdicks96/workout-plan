import * as workoutRepository from "../repositories/workout.repository";
import {
  BadRequestError,
  InternalServerError,
  UnauthorizedError,
} from "../types/errors.types";
import { Workout, WorkoutExercises } from "../types/workout.types";

export async function createWorkoutPlan(
  title: string,
  userId: string,
  exercises: WorkoutExercises[],
) {
  if (!exercises || exercises.length === 0)
    throw new BadRequestError("Workout Daten fehlen");
  if (!userId) throw new UnauthorizedError("Benutzer ID fehlt");
  if (!title) throw new BadRequestError("Workout Titel fehlt");

  const newWorkout = await workoutRepository.postWorkoutPlan(
    title,
    userId,
    exercises,
  );
  return newWorkout;
}

export async function getAllWorkouts(userId: string) {
  const workouts = await workoutRepository.getWorkouts(userId);
  return workouts;
}

export async function getWorkoutById(
  workoutId: number,
  userId: string,
): Promise<Workout> {
  if (!workoutId) throw new BadRequestError("Workout ID fehlt.");

  const owner = await workoutRepository.ownerCheck(workoutId, userId);

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

  const exerciseMap = new Map<number, WorkoutExercises>();
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
      repetitions: item.target_repetitions,
      weight: item.target_weight,
    });
  });

  newWorkout.exercises = Array.from(exerciseMap.values()).sort(
    (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
  );

  return newWorkout;
}

export async function getLastWorkout(
  workoutId: number,
  userId: string,
): Promise<Workout> {
  if (!workoutId) throw new BadRequestError("Workout ID fehlt.");

  const owner = await workoutRepository.ownerCheck(workoutId, userId);

  if (!owner) throw new UnauthorizedError("Nicht berechtigt das zu tun.");

  const workoutData = await workoutRepository.getLastCompletedWorkout(
    workoutId,
    userId,
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
  console.log("GET LAST WORKOUT DATA: ", newWorkout);
  return newWorkout;
}

export async function getCompletedWorkouts(userId: string) {
  const completedWorkouts =
    await workoutRepository.getCompletedWorkouts(userId);

  return completedWorkouts;
}

export async function postCompletedWorkout(
  workoutId: number,
  userId: string,
  startTime: number,
  endTime: number,
  pauseTime: number,
  duration: number,
  exercises: WorkoutExercises[],
  title: string,
) {
  const pgStartTime = convertMsToPgTimestamp(startTime);
  const pgEndTime = convertMsToPgTimestamp(endTime);
  const durationInSeconds = Math.floor(duration / 1000);
  const pauseTimeInSeconds = Math.floor(pauseTime / 1000);

  const result = await workoutRepository.postCompletedWorkout(
    userId,
    workoutId,
    title,
    pgStartTime,
    pgEndTime,
    durationInSeconds,
    pauseTimeInSeconds,
    exercises,
  );
  if (!result)
    throw new InternalServerError(
      "Fehler beim Speichern des abgeschlossenen Workouts",
    );
  return result;
}

export async function deleteWorkout(workoutId: number, userId: string) {
  const owner = await workoutRepository.ownerCheck(workoutId, userId);
  if (!owner)
    throw new Error(
      "Benutzer hat nicht die Rechte, dieses Workout zu bearbeiten.",
    );

  const result = await workoutRepository.deleteWorkout(workoutId, userId);
  if (!result)
    throw new InternalServerError("Fehler beim Löschen des Workouts");
  return result;
}

export async function putWorkout(
  workoutId: number,
  userId: string,
  title: string,
  exercises: WorkoutExercises[],
) {
  const result = await workoutRepository.putWorkout(
    workoutId,
    userId,
    title,
    exercises,
  );

  if (!result)
    throw new InternalServerError("Fehler beim Aktualisieren des Workouts");
  return result;
}

const buildWorkout = () => {};

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
