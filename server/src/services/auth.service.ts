import bcrypt from "bcrypt";
import * as userRepositories from "../repositories/user.repository";
import { User, UserWithoutPassword } from "../types/user.types";
import { BadRequestError } from "../types/errors.types";

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 15;

  const hashedPassword = await bcrypt.hash(password, saltRounds);
  return hashedPassword;
}

export async function verifyUserCredentials(
  email: string,
  plainTextPassword: string
): Promise<UserWithoutPassword> {
  const user = await userRepositories.findUserByEmail(email);
  if (!user) {
    throw new BadRequestError("Benutzer nicht gefunden");
  }

  const isMatch = await bcrypt.compare(plainTextPassword, user.password);

  if (!isMatch) {
    throw new BadRequestError("Passwörter stimmen nicht überein");
  }
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
}
