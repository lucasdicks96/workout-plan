import { z } from "zod";

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(), // Bonus: Validiert sofort, ob es eine echte E-Mail ist!
  password: z.string().optional(),
  role: z.enum(["user", "admin"]),
});

export type User = z.infer<typeof UserSchema>;

// Entfernt das Passwort aus dem Schema und generiert den passenden Typ dazu
export const UserWithoutPasswordSchema = UserSchema.omit({ password: true });

export type UserWithoutPassword = z.infer<typeof UserWithoutPasswordSchema>;