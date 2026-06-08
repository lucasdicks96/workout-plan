import { z } from "zod";

// 1. Schema für das Erstellen (POST)
export const createExerciseBodySchema = z.object({
  title: z
    .string({ message: "Titel ist erforderlich und muss ein Text sein." })
    .trim()
    .min(1, "Titel darf nicht leer sein."),

  description: z.string().optional().default(""),

  categories: z
    .array(
      z.coerce
        .number({
          message: "Muss mindestens eine gültige Kategorie enthalten.",
        })
        .int()
        .positive(),
    )
    .min(1),
});

export type CreateExerciseBody = z.infer<typeof createExerciseBodySchema>;

// 2. Schema für das Updaten (PUT)
export const updateExerciseBodySchema = createExerciseBodySchema.extend({
  id: z.coerce
    .number({ message: "ID ist erforderlich und muss eine Zahl sein." })
    .int()
    .positive("Ungültige Übungs-ID."),
});

export type UpdateExerciseBody = z.infer<typeof updateExerciseBodySchema>;

// 3. Schema für URL-Parameter (z.B. /exercise/:id)
export const exerciseIdParamSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, "ID muss eine gültige Zahl sein.")
    .transform(Number),
});
