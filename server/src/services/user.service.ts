import { hashPassword } from "./auth.service";
import * as userRepository from "../repositories/user.repository";

export async function createUser(email: string, password: string) {
  const hashedPassword = await hashPassword(password);
  const user = await userRepository.createUser(email, hashedPassword);

  return user;
}
