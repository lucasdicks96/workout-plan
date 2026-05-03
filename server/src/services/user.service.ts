import { DatabaseError } from "pg";
import * as userRepository from "../repositories/user.repository";
import { ConflictError, InternalServerError } from "../types/errors.types";
import { hashPassword } from "./auth.service";
import { UserWithoutPassword } from "../types/user.types";

export async function createUser(email: string, password: string) {
  try {
    const hashedPassword = await hashPassword(password);
    const user = await userRepository.postUser(email, hashedPassword);

    return user;
  } catch (error) {
    if (error instanceof DatabaseError) {
      if (error.code === "23505") {
        throw new ConflictError("Benutzer mit dieser E-Mail existiert bereits");
      }
    }
    throw new InternalServerError("Fehler beim Erstellen des Benutzers");
  }
}

// Fehlende Service-Methoden für User-Management
export async function updateUser(
  id: string,
  email: string,
  password: string,
): Promise<UserWithoutPassword | null> {
  try {
    const hashedPassword = await hashPassword(password);
    const user = await userRepository.updateUser(id, email, hashedPassword);
    return user;
  } catch (error) {
    if (error instanceof DatabaseError) {
      if (error.code === "23505") {
        throw new ConflictError("Benutzer mit dieser E-Mail existiert bereits");
      }
    }
    throw new InternalServerError("Fehler beim Aktualisieren des Benutzers");
  }
}

export async function deleteUser(id: string): Promise<boolean> {
  try {
    const deleted = await userRepository.deleteUser(id);
    return deleted;
  } catch (error) {
    throw new InternalServerError("Fehler beim Löschen des Benutzers");
  }
}

export async function getUserStats(userId: string): Promise<{
  totalWorkouts: number;
  totalExercises: number;
  totalSets: number;
}> {
  try {
    const stats = await userRepository.getUserStats(userId);
    return stats;
  } catch (error) {
    throw new InternalServerError(
      "Fehler beim Abrufen der Benutzerstatistiken",
    );
  }
}
