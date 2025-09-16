import pool from "../config/db";
import { Exercise } from "../types/exercise.types";

export async function findSystemExercises(): Promise<Exercise[]> {
  const result = await pool.query(
    "SELECT id, title, description, user_id FROM exercises WHERE user_id IS NULL AND deleted_at IS NULL ORDER BY title ASC"
  );
  const exercises: Exercise[] = result.rows;
  return exercises;
}

export async function findExercisesByUserId(
  userId: number
): Promise<Exercise[]> {
  const result = await pool.query(
    "SELECT id, title, description, user_id FROM exercises WHERE user_id = $1 AND deleted_at IS NULL ORDER BY title ASC;",
    [userId]
  );
  const userExercises: Exercise[] = result.rows;
  return userExercises;
}

export async function createExercise(
  title: string,
  description: string,
  userId: number
): Promise<Exercise> {
  const result = await pool.query(
    "INSERT INTO exercises (title, description, user_id) VALUES ($1, $2, $3) RETURNING *",
    [title, description, userId]
  );
  const newExercise: Exercise = result.rows[0];
  return newExercise;
}

export async function updateExercise(
  id: number,
  title: string,
  description: string,
  userId: number
): Promise<Exercise | null> {
  const result = await pool.query(
    "UPDATE exercises SET title = $1, description = $2 WHERE id = $3 AND user_id = $4 AND deleted_at IS NULL RETURNING *",
    [title, description, id, userId]
  );
  return result.rows[0] || null;
}

export async function softDeleteExercise(
  id: number,
  userId: number
): Promise<Exercise | null> {
  const result = await pool.query(
    "UPDATE exercises SET deleted_at = NOW() WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL RETURNING *",
    [id, userId]
  );
  return result.rows[0] || null;
}
