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

export interface IUserExercise extends IExercise {
  uid: number;
}

export interface IUserExerciseForWorkout extends IExerciseForWorkout {
  uid: number;
}

export interface IFinishedExercise
  extends IExerciseForWorkout,
    IUserExerciseForWorkout {
  workoutId: number;
}
