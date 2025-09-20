import { CombinedExercise } from "./exercise.types";

export interface Workout {
  id: number;
  userId: string;
  title: string;
  exercises: WorkoutExercises[];
}

export interface CompletedWorkout {
  id: string;
  userId: string;
  workoutId: number;
  title: string;
  duration: number;
  startTime: number;
  endTime: number;
  pauseTime: number;
  exercises: WorkoutExercises[];
  // date: string;
}

export interface WorkoutExercises extends CombinedExercise {
  displayOrder: number;
  sets: WorkoutExerciseSets[];
}

export interface WorkoutExerciseSets {
  setNumber: number;
  weight: number;
  repetitions: number;
}
