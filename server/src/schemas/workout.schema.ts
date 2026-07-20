import { z } from "zod";

// --- PREPROCESSOR HELPER ---
const preprocessNumber = (val: unknown) => {
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (trimmed === "") return undefined;

    const parsed = Number(trimmed);

    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return val;
};

const preprocessDate = (val: unknown) => {
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (trimmed === "") return undefined;
    return new Date(trimmed);
  }

  if (typeof val === "number") {
    return new Date(val);
  }

  if (val instanceof Date) return val;
  return val;
};

// --- WIEDERVERWENDBARE SUB-SCHEMAS ---

export const workoutExerciseSetsSchema = z.object({
  setNumber: z.preprocess(
    preprocessNumber,
    z
      .number({ message: "Set-Nummer fehlt oder ist keine gültige Zahl." })
      .int()
      .nonnegative()
      .min(1, "Set-Nummer muss mindestens 1 sein."),
  ),
  weight: z.preprocess(
    preprocessNumber,
    z.number({ message: "Gewicht fehlt oder ist keine Zahl." }).nonnegative(),
  ),
  repetitions: z.preprocess(
    preprocessNumber,
    z
      .number({ message: "Wiederholungen fehlen oder sind keine Zahl." })
      .int()
      .nonnegative(),
  ),
});

export const workoutExerciseSchema = z.object({
  id: z.preprocess(
    preprocessNumber,
    z
      .number({ message: "Übungs-ID fehlt oder ist keine Zahl." })
      .int()
      .positive(),
  ),
  title: z.string().min(1, "Übungstitel darf nicht leer sein."),
  displayOrder: z.preprocess(
    preprocessNumber,
    z
      .number({ message: "Display Order fehlt oder ist keine Zahl." })
      .int()
      .nonnegative(),
  ),
  sets: z.array(workoutExerciseSetsSchema),
});

// --- PARAMETER SCHEMAS (URL) ---

export const workoutIdParamSchema = z.object({
  workoutId: z
    .string()
    .regex(/^\d+$/, "Workout ID muss eine gültige Zahl sein.")
    .transform(Number),
});

export const stringIdParamSchema = z.object({
  workoutId: z.uuid("Workout ID muss eine gültige UUID sein."),
});

// --- BODY SCHEMAS (Requests) ---

export const createWorkoutBodySchema = z.object({
  title: z
    .string({ message: "Titel ist erforderlich." })
    .min(1, "Titel darf nicht leer sein."),
  exercises: z
    .array(workoutExerciseSchema)
    .min(1, "Es muss mindestens eine Übung vorhanden sein."),
});
export type CreateWorkoutBody = z.infer<typeof createWorkoutBodySchema>;

export const postCompletedWorkoutBodySchema = z.object({
  workoutId: z.preprocess(
    preprocessNumber,
    z
      .number({ message: "Workout ID fehlt oder ist keine Zahl." })
      .positive("Workout ID ist ungültig."),
  ),
  title: z.string().min(1, "Workout Titel fehlt"),
  startTime: z.preprocess(
    preprocessDate,
    z.date({ message: "Startzeit fehlt oder ist ungültig." }),
  ),
  endTime: z.preprocess(
    preprocessDate,
    z.date({ message: "Endzeit fehlt oder ist ungültig." }),
  ),
  pauseTime: z.preprocess(
    preprocessNumber,
    z.number({ message: "Pausenzeit fehlt oder ist keine Zahl." }),
  ),
  duration: z.preprocess(
    preprocessNumber,
    z.number({ message: "Dauer fehlt oder ist keine Zahl." }),
  ),
  exercises: z.array(workoutExerciseSchema).min(1, "Übungen fehlen"),
});
export type PostCompletedWorkoutBody = z.infer<
  typeof postCompletedWorkoutBodySchema
>;

export const completedWorkoutSchema = z.object({
  id: z.uuid("Ungültige ID"),
  userId: z.uuid("Ungültige User ID"),
  workoutId: z.preprocess(
    preprocessNumber,
    z
      .number({ message: "Workout ID fehlt oder ist keine Zahl." })
      .int()
      .positive("Workout ID fehlerhaft."),
  ),
  title: z.string().min(1, "Titel darf nicht leer sein."),
  planTitle: z.string().min(1, "Titel darf nicht leer sein."),
  duration: z.preprocess(
    preprocessNumber,
    z.number({ message: "Dauer fehlt oder ist keine Zahl." }),
  ),
  startTime: z.preprocess(
    preprocessDate,
    z.date({ message: "Startzeit fehlt oder ist ungültig." }),
  ),
  endTime: z.preprocess(
    preprocessDate,
    z.date({ message: "Endzeit fehlt oder ist ungültig." }),
  ),
  pauseTime: z.preprocess(
    preprocessNumber,
    z.number({ message: "Pausenzeit fehlt oder ist keine Zahl." }),
  ),
  exercises: z
    .array(workoutExerciseSchema)
    .min(1, "Es muss mindestens eine Übung vorhanden sein."),
});
export type PutCompletedWorkoutBody = z.infer<typeof completedWorkoutSchema>;
