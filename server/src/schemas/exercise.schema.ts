import { z } from "zod";

/**
 * Preprocessing-Hilfsfunktion für Zod, um unbekannte Werte (z. B. Strings aus Formularen 
 * oder URL-Params) sicher in Ganzzahlen zu konvertieren. 
 * Leere Strings oder ungültige Werte werden in `undefined` aufgelöst.
 *
 * @param {unknown} val - Der zu konvertierende Eingangswert.
 * @returns {number | unknown} Die konvertierte Zahl, `undefined` oder den Originalwert, falls kein String vorliegt.
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
 * Zod-Schema zur Validierung des Request-Bodys beim Erstellen einer neuen Übung.
 * 
 * Validierungsregeln:
 * - `title`: Muss ein nicht-leerer String sein (wird automatisch getrimmt, maximal flexibel).
 * - `description`: Ein String (fällt standardmäßig auf einen leeren String zurück).
 * - `categories`: Ein Array von mindestens einer gültigen Kategorie-ID (wird vorab per `preprocessNumber` bereinigt).
 */
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

/** TypeScript-Typ abgeleitet aus dem `createExerciseBodySchema` für Erstellungs-Payloads. */
export type CreateExerciseBody = z.infer<typeof createExerciseBodySchema>;

/**
 * Zod-Schema zur Validierung des Request-Bodys beim Aktualisieren einer bestehenden Übung.
 * 
 * Erweitert das `createExerciseBodySchema` um eine zwingend erforderliche, positive numerische `id`.
 */
export const updateExerciseBodySchema = createExerciseBodySchema.extend({
  id: z.preprocess(
    preprocessNumber,
    z
      .number({ message: "ID ist erforderlich und muss eine Zahl sein." })
      .int("ID muss eine ganze Zahl sein.")
      .positive("Ungültige Übungs-ID."),
  ),
});

/** TypeScript-Typ abgeleitet aus dem `updateExerciseBodySchema` für Aktualisierungs-Payloads. */
export type UpdateExerciseBody = z.infer<typeof updateExerciseBodySchema>;

/**
 * Zod-Schema zur Validierung von URL-Parametern (z. B. `/exercise/:id`), 
 * die eine numerische Übungs-ID als String enthalten und direkt in eine Zahl transformieren.
 */
export const exerciseIdParamSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, "ID muss eine gültige Zahl sein.")
    .transform(Number),
});