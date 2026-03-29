import * as workoutRepository from "../repositories/workout.repository";
import {
  BadRequestError,
  InternalServerError,
  UnauthorizedError,
} from "../types/errors.types";
import {
  CompletedWorkout,
  Workout,
  WorkoutExercise,
} from "../types/workout.types";

export async function createWorkoutPlan(
  title: string,
  userId: string,
  exercises: WorkoutExercise[],
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
  console.log("GET LAST WORKOUT DATA: ", newWorkout);
  return newWorkout;
}

export async function getCompletedWorkouts(
  userId: string,
): Promise<CompletedWorkout[]> {
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
}

export async function postCompletedWorkout(
  workoutId: number,
  userId: string,
  startTime: number,
  endTime: number,
  pauseTime: number,
  duration: number,
  exercises: WorkoutExercise[],
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
  exercises: WorkoutExercise[],
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

// Fehlende Service-Methoden für Workouts
export async function getWorkoutStats(userId: string): Promise<{
  totalPlans: number;
  completedWorkouts: number;
  activeWorkouts: number;
}> {
  const stats = await workoutRepository.getWorkoutStats(userId);
  return stats;
}

export async function getWorkoutProgress(
  workoutId: number,
  userId: string,
): Promise<{
  totalSets: number;
  completedSets: number;
  progress: number;
}> {
  const progress = await workoutRepository.getWorkoutProgress(workoutId, userId);
  return progress;
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
