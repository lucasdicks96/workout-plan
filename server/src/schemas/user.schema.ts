import { z } from "zod";

export const authCredentialsSchema = z.object({
  email: z.email("Muss eine gültige E-Mail-Adresse sein."),
  password: z
    .string({ message: "Passwort ist erforderlich." })
    .min(4, "Das Passwort muss mindestens 4 Zeichen lang sein."),
});

export type AuthCredentialsBody = z.infer<typeof authCredentialsSchema>;
