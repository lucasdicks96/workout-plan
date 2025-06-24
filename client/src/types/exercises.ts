export interface IExercise {
  id: number;
  title: string;
}

export interface IExercisesList extends IExercise {
  description?: string;
  img_path?: string;
}

export interface IExerciseForWorkout extends IExercise {
  repetitions: number;
  sets: number;
  weight: number;
}
