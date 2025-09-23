import { CombinedExercise } from "./exercises";

export interface Workout {
  id: number;
  userId: string;
  title: string;
  exercises: WorkoutExercises[];
}

export interface FinishedWorkout extends Workout {
  date: string;
  duration: number;
  startTime: number;
  endTime: number;
  pauseTime: number;
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
