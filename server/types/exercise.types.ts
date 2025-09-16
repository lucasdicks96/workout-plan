export interface Exercise {
  id: number;
  userId: string | null;
  title: string;
  description: string;
}

export interface CombinedExercise {
  compositeKey?: string;
  id: number;
  userId: string | null;
  title: string;
  description: string;
  isUserCreated?: boolean;
}

export interface ExerciseForWorkout extends CombinedExercise {
  set: number;
  repetitions: number;
  weight: number;
}

export interface FinishedExercise extends ExerciseForWorkout {
  workoutId: number;
}
