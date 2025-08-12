import { CombinedExercise } from "./exercises";

export interface Workout {
  id: number;
  uid: number;
  title: string;
  exercises: WorkoutExercises[];
}

export interface FinishedWorkout extends Workout {
  date: string;
  duration: number; // in minutes
  startTime: string; // ISO format
  endTime: string; // ISO format
}

export interface WorkoutExercises extends CombinedExercise {
  // workoutId: number;
  // userId: number;
  sets: WorkoutExerciseSets[];
}

export interface WorkoutExerciseSets {
  setNumber: number;
  weight: number;
  repetitions: number;
}
