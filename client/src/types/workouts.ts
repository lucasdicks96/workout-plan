
export interface Workout {
  id: number;
  userId: string;
  title: string;
  exercises: WorkoutExercises[];
}

export interface CompletedWorkout {
  id: string;
  userId: string;
  workoutId: number;
  title: string;
  planTitle: string;
  duration: number;
  startTime: Date;
  endTime: Date;
  pauseTime: number;
  exercises: WorkoutExercises[];
  // date: string;
}

export interface WorkoutExercises {
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
