export interface Exercise {
  id: number;
  title: string;
  description: string;
}

export interface UserExercise extends Exercise {
  userId: string;
}

export interface CombinedExercise {
  compositeKey: string; // unique key, z.b., "pushup-1"
  id: number;
  title: string;
  description: string;
  isUserCreated: boolean;
}

export interface ExerciseForWorkout extends CombinedExercise {
  set: number;
  repetitions: number;
  weight: number;
}

export interface FinishedExercise extends ExerciseForWorkout {
  workoutId: number;
}
