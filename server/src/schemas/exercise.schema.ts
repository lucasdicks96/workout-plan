import { z } from "zod";

const preprocessNumber = (val: unknown) => {
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (trimmed === "") return undefined;

    const parsed = Number(trimmed);

    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return val;
};

// 1. Schema für das Erstellen (POST)
export const createExerciseBodySchema = z.object({
  title: z
    .string({ message: "Titel ist erforderlich und muss ein Text sein." })
    .trim()
    .min(1, "Titel darf nicht leer sein."),

  description: z.string().default(""),

  categories: z
    .array(
      z.preprocess(
        preprocessNumber,
        z
          .number({
            message: "Muss mindestens eine gültige Kategorie enthalten.",
          })
          .int("Kategorie-ID muss eine ganze Zahl sein.")
          .positive("Kategorie-ID muss größer als 0 sein."),
      ),
    )
    .min(1, "Muss mindestens eine Kategorie enthalten."),
});

export type CreateExerciseBody = z.infer<typeof createExerciseBodySchema>;

// 2. Schema für das Updaten (PUT)
export const updateExerciseBodySchema = createExerciseBodySchema.extend({
  id: z.preprocess(
    preprocessNumber,
    z
      .number({ message: "ID ist erforderlich und muss eine Zahl sein." })
      .int("ID muss eine ganze Zahl sein.")
      .positive("Ungültige Übungs-ID."),
  ),
});

export type UpdateExerciseBody = z.infer<typeof updateExerciseBodySchema>;

// 3. Schema für URL-Parameter (z.B. /exercise/:id)
export const exerciseIdParamSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, "ID muss eine gültige Zahl sein.")
    .transform(Number),
});
