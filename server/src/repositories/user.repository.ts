import pool from "../config/db";
import { User, UserWithoutPassword } from "../types/user.types";

export async function getUserById(id: string): Promise<User> {
  const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
  const user: User = result.rows[0];
  return user;
}

export async function getUserByEmail(email: string): Promise<User> {
  const result = await pool.query("SELECT * FROM users WHERE email = $1", [
    email,
  ]);

  const user: User = result.rows[0];
  return user;
}

export async function postUser(
  email: string,
  hashedPassword: string,
): Promise<UserWithoutPassword> {
  const result = await pool.query(
    "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email, role",
    [email, hashedPassword],
  );
  const user: UserWithoutPassword = result.rows[0];
  return user;
}

// Fehlende Repository-Methoden für User-Management
export async function updateUser(
  id: string,
  email: string,
  hashedPassword: string,
): Promise<UserWithoutPassword | null> {
  const result = await pool.query(
    "UPDATE users SET email = $1, password = $2 WHERE id = $3 RETURNING id, email, role",
    [email, hashedPassword, id],
  );
  return result.rows[0] || null;
}

export async function deleteUser(id: string): Promise<boolean> {
  const result = await pool.query(
    "DELETE FROM users WHERE id = $1 RETURNING id",
    [id],
  );
  return result.rowCount && result.rowCount === 0 ? true : false;
}

export async function getUserStats(userId: string): Promise<{
  totalWorkouts: number;
  totalExercises: number;
  totalSets: number;
}> {
  const result = await pool.query(
    `SELECT 
      COUNT(DISTINCT completed_workouts.id) as total_workouts,
      COUNT(DISTINCT exercises.id) as total_exercises,
      COUNT(DISTINCT plan_sets.id) as total_sets
    FROM users
    LEFT JOIN workout_plans ON users.id = workout_plans.user_id
    LEFT JOIN plan_exercises ON workout_plans.id = plan_exercises.workout_plan_id
    LEFT JOIN exercises ON plan_exercises.exercise_id = exercises.id
    LEFT JOIN plan_sets ON plan_exercises.id = plan_sets.plan_exercise_id
    LEFT JOIN completed_workouts ON workout_plans.id = completed_workouts.workout_plan_id
    WHERE users.id = $1`,
    [userId],
  );
  return result.rows[0];
}
