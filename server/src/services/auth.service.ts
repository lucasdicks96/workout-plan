import bcrypt from "bcrypt";
import * as userRepositories from "../repositories/user.repository";
import { UserWithoutPassword } from "../types/user.types";

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 15;
  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
  } catch (error) {
    throw new Error("Fehler beim Hashen des Passworts");
  }
}

export async function verifyUserCredentials(
  email: string,
  plainTextPassword: string
): Promise<UserWithoutPassword> {
  try {
    const user = await userRepositories.findUserByEmail(email);
    if (!user) {
      throw new Error("Benutzer nicht gefudnen");
    }

    const isMatch = await bcrypt.compare(plainTextPassword, user.password);

    if (!isMatch) {
      throw new Error("Passwörter stimmen nicht überein");
    }
    const userWithoutPassword: UserWithoutPassword = user;
    return userWithoutPassword;
  } catch (error) {
    throw new Error("Fehler bei der Überprüfung der Anmeldeinformationen");
  }
}
