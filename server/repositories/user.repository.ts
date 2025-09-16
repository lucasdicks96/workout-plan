import pool from "../config/db";
import User, { UserWithoutPassword } from "../types/user.types";

export async function findUserById(id: string): Promise<User> {
  try {
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
    const user: User = result.rows[0];
    return user;
  } catch (dbError) {
    throw dbError;
  }
}

export async function findUserByEmail(email: string): Promise<User> {
  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    const user: User = result.rows[0];
    return user;
  } catch (dbError) {
    throw dbError;
  }
}

export async function createUser(
  email: string,
  hashedPassword: string
): Promise<UserWithoutPassword> {
  try {
    const result = await pool.query(
      "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email, role",
      [email, hashedPassword]
    );
    const newUser: UserWithoutPassword = result.rows[0];
    return newUser;
  } catch (dbError) {
    throw dbError;
  }
}
