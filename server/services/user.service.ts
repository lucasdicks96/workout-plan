import { hashPassword } from "../services/auth.service";
// import { createNewUser } from "../repositories/user.repository";
import * as userRepository from "../repositories/user.repository";

export async function createUser(email: string, password: string) {
  try {
    if (!email || !password) {
      throw new Error("Email und Passwort sind erforderlich");
    }
    const hashedPassword = await hashPassword(password);
    if (!hashedPassword) {
      throw new Error("Fehler beim Hashen des Passworts");
    }

    const user = await userRepository.createUser(email, hashedPassword);
    if (!user) {
      throw new Error("Fehler beim Erstellen des Benutzers");
    }
    return user;
  } catch (error) {
    throw error;
  }
}
