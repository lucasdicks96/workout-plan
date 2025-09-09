import { CombinedExercise } from "./exercises";

export interface Workout {
  workoutId: number;
  userId: number;
  title: string;
  exercises: WorkoutExercises[];
}

export interface FinishedWorkout extends Workout {
  date: string;
  duration: number; // in minutes
  startTime: number;
  endTime: number;
  pauseTime: number;
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
