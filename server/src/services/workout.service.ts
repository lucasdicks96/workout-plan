import * as workoutRepository from "../repositories/workout.repository";
import {
  CompletedWorkout,
  Workout,
  WorkoutExercises,
} from "../types/workout.types";

export async function createWorkoutPlan(
  title: string,
  userId: string,
  exercises: WorkoutExercises[]
) {
  try {
    if (!exercises) throw new Error("Workout Daten fehlen");
    if (!userId) throw new Error("Benutzer ID fehlt");
    if (!title) throw new Error("Workout Titel fehlt");
    if (!exercises || exercises.length === 0)
      throw new Error("Workout Übungen fehlen");
    const newWorkout = await workoutRepository.createWorkoutPlan(
      title,
      userId,
      exercises
    );
    if (!newWorkout) throw new Error("Fehler beim Erstellen des Workouts");
    return newWorkout;
  } catch (error) {
    throw error;
  }
}

export async function getAllWorkouts(userId: string) {
  try {
    const workouts = await workoutRepository.findAllWorkouts(userId);
    if (!workouts) {
      throw new Error("Keine Workouts gefunden");
    }
    return workouts;
  } catch (error) {
    throw error;
  }
}

export async function getWorkoutById(
  workoutId: number,
  userId: string
): Promise<Workout> {
  try {
    const workout = await workoutRepository.findWorkoutById(workoutId, userId);
    if (!workout) {
      throw new Error("Workout nicht gefunden");
    }
    return workout;
  } catch (error) {
    throw error;
  }
}

export async function getWorkoutExercises(workoutId: number, userId: string) {
  try {
    const workout = await workoutRepository.findWorkoutById(workoutId, userId);
    if (!workout) {
      throw new Error("Workout nicht gefunden");
    }
    // let exercises: WorkoutExercises[] = [];
    // for (const exercise of workout.exercises) {
    //   exercises.push(exercise);
    // }
    return { exercises: workout.exercises, title: workout.title };
  } catch (error) {
    throw error;
  }
}

export async function getCompletedWorkouts(userId: string) {
  try {
    const completedWorkouts = await workoutRepository.findCompletedWorkouts(
      userId
    );
    if (!completedWorkouts)
      throw new Error("Keine abgeschlossenen Workouts gefunden");
    return completedWorkouts;
  } catch (error) {
    throw error;
  }
}

export async function saveCompletedWorkout(
  workoutId: number,
  userId: string,
  startTime: number,
  pauseTime: number,
  duration: number,
  exercises: WorkoutExercises[],
  title: string
) {
  try {
    const endTime = Date.now();
    const result = await workoutRepository.saveCompletedWorkout(
      userId,
      workoutId,
      title,
      startTime,
      endTime,
      duration,
      pauseTime,
      exercises
    );
    if (!result)
      throw new Error("Fehler beim Speichern des abgeschlossenen Workouts");
    return result;
  } catch (error) {
    throw error;
  }
}

export async function deleteWorkout(workoutId: number, userId: string) {
  try {
    const workout = await workoutRepository.findWorkoutById(workoutId, userId);
    if (workout.userId !== userId)
      throw new Error(
        "Benutzer hat nicht die Rechte, dieses Workout zu bearbeiten."
      );
    const deletedAt = Date.now();
    const result = await workoutRepository.deleteWorkout(
      workoutId,
      userId,
      deletedAt
    );
    if (!result) throw new Error("Fehler beim Löschen des Workouts");
    return result;
  } catch (error) {
    throw error;
  }
}

export async function updateWorkout(
  workoutId: number,
  userId: string,
  title: string,
  exercises: WorkoutExercises[]
) {
  try {
    const result = await workoutRepository.updateWorkout(
      workoutId,
      userId,
      title,
      exercises
    );

    if (!result) throw new Error("Fehler beim Aktualisieren des Workouts");
    return result;
  } catch (error) {
    throw error;
  }
}
