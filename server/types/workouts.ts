import { IExerciseForWorkout } from "./exercises";

export interface IWorkout {
  id: number;
  uid: number;
  title: string;
  description: string;
  exercises: IExerciseForWorkout[];
}

export interface IFinishedWorkout extends IWorkout {
  date: string;
  duration: number; // in minutes
  startTime: string; // ISO format
  endTime: string; // ISO format
}
