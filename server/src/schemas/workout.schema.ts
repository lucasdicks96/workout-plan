import { z } from "zod";

// --- PREPROCESSOR HELPER ---

/**
 * Konvertiert unbekannte Eingangswerte (z. B. Strings aus Formularen) sicher in Zahlen.
 * Leere Strings oder ungültige Konvertierungen geben `undefined` zurück.
 *
 * @param {unknown} val - Der zu konvertierende Wert.
 * @returns {number | unknown} Die konvertierte Zahl, `undefined` oder der Originalwert.
 */
const preprocessNumber = (val: unknown) => {
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (trimmed === "") return undefined;

    const parsed = Number(trimmed);

    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return val;
};

/**
 * Konvertiert Strings, Timestamps (Zahlen) oder Date-Instanzen sicher in ein JavaScript-`Date`-Objekt.
 *
 * @param {unknown} val - Der zu konvertierende Wert.
 * @returns {Date | unknown} Das erzeugte Datumsobjekt oder den Originalwert.
 */
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

/**
 * Zod-Schema für einzelne Trainingssätze (Sets) innerhalb einer Übung.
 * Validiert Set-Nummer, Gewicht und Wiederholungen (jeweils mit Vorverarbeitung).
 */
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

/**
 * Zod-Schema für Übungen innerhalb eines Workouts (inklusive verknüpfter Sätze).
 */
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

/**
 * Zod-Schema zur Validierung von numerischen Workout-IDs in URL-Parametern.
 */
export const workoutIdParamSchema = z.object({
  workoutId: z
    .string()
    .regex(/^\d+$/, "Workout ID muss eine gültige Zahl sein.")
    .transform(Number),
});

/**
 * Zod-Schema zur Validierung von UUID-basierten Workout-IDs in URL-Parametern.
 */
export const stringIdParamSchema = z.object({
  workoutId: z.uuid("Workout ID muss eine gültige UUID sein."),
});

// --- BODY SCHEMAS (Requests) ---

/**
 * Zod-Schema zur Validierung des Request-Bodys beim Erstellen eines neuen Workout-Plans.
 */
export const createWorkoutBodySchema = z.object({
  title: z
    .string({ message: "Titel ist erforderlich." })
    .min(1, "Titel darf nicht leer sein."),
  exercises: z
    .array(workoutExerciseSchema)
    .min(1, "Es muss mindestens eine Übung vorhanden sein."),
});

/** TypeScript-Typ abgeleitet aus dem `createWorkoutBodySchema`. */
export type CreateWorkoutBody = z.infer<typeof createWorkoutBodySchema>;

/**
 * Zod-Schema zur Validierung des Request-Bodys beim Speichern eines absolvierten Workouts.
 */
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

/** TypeScript-Typ abgeleitet aus dem `postCompletedWorkoutBodySchema`. */
export type PostCompletedWorkoutBody = z.infer<
  typeof postCompletedWorkoutBodySchema
>;

/**
 * Zod-Schema zur Validierung des Request-Bodys beim Aktualisieren eines absolvierten Workouts (PUT).
 */
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

/** TypeScript-Typ abgeleitet aus dem `completedWorkoutSchema` für Aktualisierungs-Payloads. */
export type PutCompletedWorkoutBody = z.infer<typeof completedWorkoutSchema>;