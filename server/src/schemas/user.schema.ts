import { z } from "zod";

/**
 * Zod-Schema zur Validierung von Authentifizierungsdaten (wird für Registrierung und Login verwendet).
 * 
 * Validierungsregeln:
 * - `email`: Muss eine gültige und wohlgeformte E-Mail-Adresse sein.
 * - `password`: Muss ein Textstring sein und eine Mindestlänge von 4 Zeichen aufweisen.
 */
export const authCredentialsSchema = z.object({
  email: z.email("Muss eine gültige E-Mail-Adresse sein."),
  password: z
    .string({ message: "Passwort ist erforderlich." })
    .min(4, "Das Passwort muss mindestens 4 Zeichen lang sein."),
});

/** TypeScript-Typ abgeleitet aus dem `authCredentialsSchema` für Authentifizierungs-Payloads im Request-Body. */
export type AuthCredentialsBody = z.infer<typeof authCredentialsSchema>;