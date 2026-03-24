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
