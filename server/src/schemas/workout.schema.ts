import { z } from "zod";
import { WorkoutExercises } from "../types/workout.types";

export const createWorkoutSchema = z.object({
  id: z.number(),
  userId: z.uuid(),
  title: z.string().min(1).max(50),
  exercises: z.array(
    z.object({
      displayOrder: z.number().nonnegative(),
      sets: z.array(
        z.object({
          setNumber: z.number().nonnegative(),
          weight: z.number().nonnegative(),
          repetitions: z.number().nonnegative(),
        })
      ),
    })
  ),
});
