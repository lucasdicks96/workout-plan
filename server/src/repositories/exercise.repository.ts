import { PoolClient } from "pg";
import pool from "../config/db";
import { Category, Exercise } from "../types/exercise.types";

export async function getExercises(userId: string): Promise<Exercise[]> {
  const result = await pool.query(
    `SELECT
      exercises.id,
      exercises.title,
      exercises.description,
      exercises.user_id,
      COALESCE(
        JSON_AGG(
          JSON_BUILD_OBJECT('id', categories.id, 'name', categories.name, 'parent_id', categories.parent_id)
          ORDER BY categories.name
        ) FILTER (WHERE categories.id IS NOT NULL), '[]'
      ) AS category
    FROM exercises
    LEFT JOIN exercise_categories ON exercises.id = exercise_categories.exercise_id
    LEFT JOIN categories ON exercise_categories.category_id = categories.id
    WHERE (user_id IS NULL OR user_id = $1)
      AND deleted_at IS NULL
    GROUP BY exercises.id, exercises.title, exercises.description, exercises.user_id
    ORDER BY title ASC;`,
    [userId],
  );

  return result.rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    userId: row.user_id,
    category: row.category,
  }));
}

export async function getUserExercises(userId: string): Promise<Exercise[]> {
  const result = await pool.query(
    `SELECT
      exercises.id,
      exercises.title,
      exercises.description,
      exercises.user_id,
      COALESCE(
        JSON_AGG(
          JSON_BUILD_OBJECT('id', categories.id, 'name', categories.name, 'parent_id', categories.parent_id)
          ORDER BY categories.name
        ) FILTER (WHERE categories.id IS NOT NULL), '[]'
      ) AS category
    FROM exercises
    LEFT JOIN exercise_categories ON exercises.id = exercise_categories.exercise_id
    LEFT JOIN categories ON exercise_categories.category_id = categories.id
    WHERE (user_id = $1)
      AND deleted_at IS NULL
    GROUP BY exercises.id, exercises.title, exercises.description, exercises.user_id
    ORDER BY title ASC;`,
    [userId],
  );

  return result.rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    userId: row.user_id,
    category: row.category,
  }));
}

// --- ATOMARE SCHREIB-OPERATIONEN (Nutzen den Client aus dem Service) ---

export async function insertExercise(
  client: PoolClient,
  title: string,
  description: string,
  userId: string,
) {
  const result = await client.query(
    "INSERT INTO exercises (title, description, user_id) VALUES ($1, $2, $3) RETURNING *",
    [title, description, userId],
  );
  return result.rows[0];
}

export async function updateExercise(
  client: PoolClient,
  id: number,
  title: string,
  description: string,
  userId: string,
) {
  const result = await client.query(
    `UPDATE exercises
     SET title = $1, description = $2
     WHERE id = $3 AND user_id = $4 AND deleted_at IS NULL
     RETURNING *;`,
    [title, description, id, userId],
  );
  return result.rows[0]; // Ist undefined, wenn nicht gefunden
}

export async function insertExerciseCategories(
  client: PoolClient,
  exerciseId: number,
  categories: number[],
) {
  if (!categories || categories.length === 0) return;

  const insertValues = categories.map((_, i) => `($1, $${i + 2})`).join(", ");
  await client.query(
    `INSERT INTO exercise_categories (exercise_id, category_id) VALUES ${insertValues};`,
    [exerciseId, ...categories],
  );
}

export async function deleteExerciseCategories(
  client: PoolClient,
  exerciseId: number,
) {
  await client.query(
    "DELETE FROM exercise_categories WHERE exercise_id = $1;",
    [exerciseId],
  );
}

// ------------------------------------------------------------------------

export async function softDeleteExercise(
  id: number,
  userId: string,
): Promise<Exercise | null> {
  const result = await pool.query(
    "UPDATE exercises SET deleted_at = NOW() WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL RETURNING *",
    [id, userId],
  );
  return result.rows[0] || null;
}

export async function categories(): Promise<Category[]> {
  const result = await pool.query(
    "SELECT id, name, parent_id FROM categories ORDER BY parent_id NULLS FIRST, name",
  );
  return result.rows;
}

export async function getCategoryById(id: number): Promise<Category | null> {
  const result = await pool.query(
    "SELECT id, name, parent_id FROM categories WHERE id = $1",
    [id],
  );
  return result.rows[0] || null;
}
