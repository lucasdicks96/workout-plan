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

export interface FlattenedCompletedWorkout {
  workout_id: string;
  user_id: string;
  workout_plan_id: number;
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
}
