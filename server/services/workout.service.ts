import * as workoutRepository from "../repositories/workout.repository";
import {
  CompletedWorkout,
  Workout,
  WorkoutExercises,
} from "../types/workout.types";

export async function createWorkoutPlan(workout: Workout) {
  try {
    if (!workout) throw new Error("Workout Daten fehlen");
    if (!workout.userId) throw new Error("Benutzer ID fehlt");
    if (!workout.title) throw new Error("Workout Titel fehlt");
    if (!workout.exercises || workout.exercises.length === 0)
      throw new Error("Workout Übungen fehlen");
    const newWorkout = await workoutRepository.createWorkoutPlan(workout);
    if (!newWorkout) throw new Error("Fehler beim Erstellen des Workouts");
    return newWorkout;
  } catch (error) {
    throw error;
  }
}

export async function getAllWorkouts(userId: string) {
  try {
    if (!userId) {
      throw new Error("Benutzer ID fehlt");
    }
    const workouts = await workoutRepository.findAllWorkouts(userId);
    if (!workouts) {
      throw new Error("Keine Workouts gefunden");
    }
    return workouts;
  } catch (error) {
    throw error;
  }
}

export async function getWorkoutById(userId: string, workoutId: number) {
  try {
    if (!userId || !workoutId) {
      throw new Error("Benutzer ID oder Workout ID fehlt");
    }
    const workout = await workoutRepository.findWorkoutById(userId, workoutId);
    if (!workout) {
      throw new Error("Workout nicht gefunden");
    }
  } catch (error) {
    throw error;
  }
}

export async function getWorkoutExercises(userId: string, workoutId: number) {
  try {
    if (!userId || !workoutId) {
      throw new Error("Benutzer ID oder Workout ID fehlt");
    }
    const workout = await workoutRepository.findWorkoutById(userId, workoutId);
    if (!workout) {
      throw new Error("Workout nicht gefunden");
    }
    let exercises: WorkoutExercises[] = [];
    for (const exercise of workout.exercises) {
      exercises.push(exercise);
    }
    return exercises;
  } catch (error) {
    throw error;
  }
}

export async function getCompletedWorkouts(userId: string) {
  try {
    if (!userId) throw new Error("Benutzer ID fehlt");
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

export async function saveCompletedWorkout(completedWorkout: CompletedWorkout) {
  try {
    if (!completedWorkout) throw new Error("Abgeschlossenes Workout fehlt");
    if (!completedWorkout.userId) throw new Error("Benutzer ID fehlt");
    if (!completedWorkout.workoutId) throw new Error("Workout ID fehlt");
    if (!completedWorkout.title) throw new Error("Workout Titel fehlt");
    if (!completedWorkout.exercises || completedWorkout.exercises.length === 0)
      throw new Error("Übungen fehlen");
    if (!completedWorkout.duration) throw new Error("Dauer des Workouts fehlt");
    if (!completedWorkout.startTime)
      throw new Error("Startzeit des Workouts fehlt");
    if (!completedWorkout.endTime)
      throw new Error("Endzeit des Workouts fehlt");
    if (
      completedWorkout.pauseTime === undefined ||
      completedWorkout.pauseTime === null
    )
      throw new Error("Pausenzeit des Workouts fehlt");
    const result = await workoutRepository.saveCompletedWorkout(
      completedWorkout
    );
    if (!result)
      throw new Error("Fehler beim Speichern des abgeschlossenen Workouts");
    return result;
  } catch (error) {
    throw error;
  }
}

export async function deleteWorkout(userId: string, workoutId: number) {
  try {
    if (!workoutId || !userId) throw new Error("Workout ID oder User ID fehlt");
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

export async function updateWorkout(workoutData: Workout) {
  try {
    if (!workoutData) throw new Error("Workout Daten fehlen");
    if (!workoutData.id || !workoutData.userId)
      throw new Error("Workout ID oder User ID fehlt");

    const result = await workoutRepository.updateWorkout(workoutData);

    if (!result) throw new Error("Fehler beim Aktualisieren des Workouts");
    return result;
  } catch (error) {
    throw error;
  }
}
