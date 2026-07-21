import { z } from "zod";
import { sanitizeEmail } from "../utils/formatter";

/**
 * Zod-Schema zur Validierung von Authentifizierungsdaten (wird für Registrierung und Login verwendet).
 *
 * Validierungsregeln:
 * - `email`: Wandelt Umlaute/ß zuerst um und prüft danach auf eine gültige E-Mail-Adresse.
 * - `password`: Muss ein Textstring sein und eine Mindestlänge von 10 Zeichen aufweisen.
 */
export const authCredentialsSchema = z.object({
  email: z
    .string({ message: "E-Mail ist erforderlich." })
    // 1. ZUERST: Eingabe bereinigen & 'ß' zu 'ss' umwandeln
    .transform((val) => sanitizeEmail(val))
    // 2. DANACH: Das transformierte Ergebnis an z.email() weiterleiten
    .pipe(z.email("Muss eine gültige E-Mail-Adresse sein.")),

  password: z
    .string({ message: "Passwort ist erforderlich." })
    .min(10, "Das Passwort muss mindestens 10 Zeichen lang sein."),
});

/** TypeScript-Typ abgeleitet aus dem `authCredentialsSchema` für Authentifizierungs-Payloads im Request-Body. */
export type AuthCredentialsBody = z.infer<typeof authCredentialsSchema>;
