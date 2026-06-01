import { z } from "zod";

// --- WIEDERVERWENDBARE SUB-SCHEMAS ---

export const workoutExerciseSetsSchema = z.object({
  setNumber: z.coerce.number().int().nonnegative(),
  weight: z.coerce.number().nonnegative(),
  repetitions: z.coerce.number().int().nonnegative(),
});

export const workoutExerciseSchema = z.object({
  id: z.coerce.number().int().positive(),
  title: z.string().min(1, "Übungstitel darf nicht leer sein."),
  displayOrder: z.coerce.number().int().nonnegative(),
  sets: z.array(workoutExerciseSetsSchema),
});

// --- PARAMETER SCHEMAS (URL) ---

export const workoutIdParamSchema = z.object({
  // Wandelt den URL-String (z.B. "/workout/123") sicher in die Zahl 123 um
  workoutId: z
    .string()
    .regex(/^\d+$/, "Workout ID muss eine gültige Zahl sein.")
    .transform(Number),
});

export const stringIdParamSchema = z.object({
  // Für completed-workouts, die anscheinend einen String/UUID als ID nutzen
  workoutId: z.string().min(1, "Workout ID fehlt."),
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
  workoutId: z.coerce
    .number()
    .int()
    .positive("Workout ID fehlt oder ist ungültig"),
  title: z.string().min(1, "Workout Titel fehlt"),
  startTime: z.coerce.date({ message: "Startzeit fehlt oder ist ungültig" }),
  endTime: z.coerce.date({ message: "Endzeit fehlt oder ist ungültig" }),
  pauseTime: z.coerce.number({ message: "Pausenzeit fehlt oder ist ungültig" }),
  duration: z.coerce.number({ message: "Dauer fehlt oder ist ungültig" }),
  exercises: z.array(workoutExerciseSchema).min(1, "Übungen fehlen"),
});
export type PostCompletedWorkoutBody = z.infer<
  typeof postCompletedWorkoutBodySchema
>;

export const completedWorkoutSchema = z.object({
  id: z.string().min(1, "ID fehlt"),
  userId: z.string(),
  workoutId: z.coerce.number().int().positive("Workout ID fehlerhaft."),
  title: z.string().min(1, "Titel darf nicht leer sein."),
  duration: z.coerce.number(),
  // coerce.date() nimmt den ISO-String aus dem JSON und macht ein echtes Date-Objekt daraus!
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  pauseTime: z.coerce.number(),
  exercises: z
    .array(workoutExerciseSchema)
    .min(1, "Es muss mindestens eine Übung vorhanden sein."),
});

export type PutCompletedWorkoutBody = z.infer<typeof completedWorkoutSchema>;
