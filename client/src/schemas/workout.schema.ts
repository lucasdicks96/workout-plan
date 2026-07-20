import { z } from "zod";

// 1. WorkoutExerciseSets
export const WorkoutExerciseSetsSchema = z.object({
  setNumber: z.coerce.number(),
  weight: z.coerce.number(),
  repetitions: z.coerce.number(),
});

export type WorkoutExerciseSets = z.infer<typeof WorkoutExerciseSetsSchema>;

// 2. WorkoutExercises
export const WorkoutExercisesSchema = z.object({
  id: z.coerce.number(),
  title: z.string(),
  displayOrder: z.coerce.number(),
  sets: z.array(WorkoutExerciseSetsSchema),
});

export type WorkoutExercises = z.infer<typeof WorkoutExercisesSchema>;

// 3. Workout
export const WorkoutSchema = z.object({
  id: z.coerce.number(),
  userId: z.string(),
  title: z.string(),
  exercises: z.array(WorkoutExercisesSchema),
});

export type Workout = z.infer<typeof WorkoutSchema>;

// 4. CompletedWorkout
export const CompletedWorkoutSchema = z.object({
  id: z.string(),
  userId: z.string(),
  workoutId: z.coerce.number(),
  title: z.string(),
  planTitle: z.string(),
  duration: z.coerce.number(),
  startTime: z.coerce.date(), // Macht aus ISO-Strings ("2026-07-20T...") echte Date-Objekte!
  endTime: z.coerce.date(),
  pauseTime: z.coerce.number(),
  exercises: z.array(WorkoutExercisesSchema),
});

export type CompletedWorkout = z.infer<typeof CompletedWorkoutSchema>;
