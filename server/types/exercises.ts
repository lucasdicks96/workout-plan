export interface Exercise {
  id: number;
  title: string;
  description: string;
}

export interface UserExercise extends Exercise {
  uid: number;
}

export interface CombinedExercise {
  compositeKey: string; // unique key, z.b., "pushup-1"
  originalId: number;
  title: string;
  description: string;
  isUserCreated: boolean;
}

export interface ExerciseForWorkout extends CombinedExercise {
  repetitions: number;
  sets: number;
  weight: number;
}

export interface FinishedExercise extends ExerciseForWorkout {
  workoutId: number;
}
