import { DatabaseError } from "pg";
import * as userRepository from "../repositories/user.repository";
import {
  ConflictError,
  InternalServerError
} from "../types/errors.types";
import { hashPassword } from "./auth.service";

export async function createUser(email: string, password: string) {
  try {
    const hashedPassword = await hashPassword(password);
    const user = await userRepository.createUser(email, hashedPassword);

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
