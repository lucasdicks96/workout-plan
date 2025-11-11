export interface CombinedExercise {
  compositeKey: string;
  id: number;
  userId: string | null;
  title: string;
  description: string;
  category?: Category[];
}

export interface ExerciseForWorkout extends CombinedExercise {
  set: number;
  repetitions: number;
  weight: number;
}

export interface FinishedExercise extends ExerciseForWorkout {
  workoutId: number;
}

export interface Category {
  id: number;
  name: string;
  parent_id: number | null;
  children?: Category[];
}
