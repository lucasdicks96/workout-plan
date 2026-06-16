export interface Workout {
  id: number;
  userId: string;
  title: string;
  exercises: WorkoutExercise[];
}

export interface CompletedWorkout {
  id: string;
  userId: string;
  workoutId: number;
  title: string;
  duration: number;
  startTime: Date;
  endTime: Date;
  pauseTime: number;
  exercises: WorkoutExercise[];
  // date: string;
}

export interface WorkoutExercise {
  id: number;
  title: string;
  displayOrder: number;
  sets: WorkoutExerciseSets[];
}

export interface WorkoutExerciseSets {
  setNumber: number;
  weight: number;
  repetitions: number;
}

export type FlatCompletedWorkoutRow = {
  workout_id: string;
  plan_id: number;
  plan_user_id: string;
  plan_title: string;
  duration_seconds: number;
  start_time: Date;
  end_time: Date;
  pause_seconds: number;
  exercise_id: number;
  title: string;
  display_order: number;
  set_number: number;
  weight: number;
  repetitions: number;
};

export type FlatWorkoutRow = {
  plan_title: string;
  plan_user_id: string;
  plan_id: number;
  title: string;
  exercise_id: number;
  display_order: number;
  set_number: number;
  repetitions: number;
  weight: number;
};

export type FlatAllWorkoutsRow = {
  plan_id: number;
  plan_title: string;
  plan_user_id: string;
  exercise_id: number;
  title: string;
  display_order: number;
  set_number: number;
  repetitions: number;
  weight: number;
};
