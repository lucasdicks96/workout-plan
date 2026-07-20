import { z } from "zod";

// 1. Category (mit rekursiver Typisierung für children)
export type Category = {
  id: number;
  name: string;
  parent_id: number | null;
  children?: Category[];
};

export const CategorySchema: z.ZodType<Category> = z.lazy(() =>
  z.object({
    id: z.coerce.number(),
    name: z.string(),
    parent_id: z.coerce.number().nullable(),
    children: z.array(CategorySchema).optional(),
  })
);

// 2. Exercise
export const ExerciseSchema = z.object({
  id: z.coerce.number(),
  userId: z.string().nullable(),
  title: z.string(),
  description: z.string(),
  category: z.array(CategorySchema).optional(),
});

export type Exercise = z.infer<typeof ExerciseSchema>;

// 3. ExerciseSets (erweitert Exercise wie in deinem Interface)
export const ExerciseSetsSchema = ExerciseSchema.extend({
  set: z.coerce.number(),
  repetitions: z.coerce.number(),
  weight: z.coerce.number(),
});

export type ExerciseSets = z.infer<typeof ExerciseSetsSchema>;