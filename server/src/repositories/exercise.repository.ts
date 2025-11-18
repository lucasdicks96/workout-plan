import pool from "../config/db";
import { Category, Exercise } from "../types/exercise.types";

export async function findSystemExercises(): Promise<Exercise[]> {
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
JOIN exercise_categories ON exercises.id = exercise_categories.exercise_id
JOIN categories ON exercise_categories.category_id = categories.id
WHERE user_id IS NULL 
AND deleted_at IS NULL
GROUP BY exercises.id, exercises.title, exercises.description, exercises.user_id
ORDER BY title ASC;`
  );
  const exercises: Exercise[] = result.rows;
  return exercises;
}

export async function findExercisesByUserId(
  userId: string
): Promise<Exercise[]> {
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
JOIN exercise_categories ON exercises.id = exercise_categories.exercise_id
JOIN categories ON exercise_categories.category_id = categories.id
WHERE (user_id = $1)
AND deleted_at IS NULL
GROUP BY exercises.id, exercises.title, exercises.description, exercises.user_id
ORDER BY title ASC;`,
    [userId]
  );
  const userExercises: Exercise[] = result.rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    userId: row.user_id,
    category: row.category,
  }));
  return userExercises;
}

export async function createExercise(
  title: string,
  description: string,
  userId: string,
  categories: number[]
): Promise<Exercise> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      "INSERT INTO exercises (title, description, user_id) VALUES ($1, $2, $3) RETURNING *",
      [title, description, userId]
    );
    const exData = result.rows[0];
    const ex = {
      id: exData.id,
      userId: exData.user_id,
      title: exData.title,
      description: exData.description,
    };

    for (const cat of categories) {
      await client.query(
        "INSERT INTO exercise_categories (exercise_id, category_id) VALUES ($1, $2)",
        [exData.id, (cat as any).id ?? (cat as any)]
      );
    }

    const newExercise: Exercise = { ...ex, category: categories as any };
    await client.query("COMMIT");
    return newExercise;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function updateExercise(
  id: number,
  title: string,
  description: string,
  userId: string,
  categories: number[]
): Promise<Exercise | null> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const updateResult = await client.query(
      `
        UPDATE exercises
        SET title = $1,
            description = $2
        WHERE exercises.id = $3
          AND user_id = $4
          AND deleted_at IS NULL
        RETURNING *;
      `,
      [title, description, id, userId]
    );

    const updatedExercise = updateResult.rows[0];
    if (!updatedExercise) {
      await client.query("ROLLBACK");
      return null;
    }

    await client.query(
      `
        DELETE FROM exercise_categories
        WHERE exercise_id = $1;
      `,
      [id]
    );

    if (categories && categories.length > 0) {
      const insertValues = categories
        .map((_, i) => `($1, $${i + 2})`)
        .join(", ");

      await client.query(
        `INSERT INTO exercise_categories (exercise_id, category_id)
         VALUES ${insertValues};`,
        [id, ...categories]
      );
    }

    await client.query("COMMIT");
    return updatedExercise;
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Fehler beim Aktualisieren der Übung:", error);
    throw error;
  } finally {
    client.release();
  }
}

export async function softDeleteExercise(
  id: number,
  userId: string
): Promise<Exercise | null> {
  const result = await pool.query(
    "UPDATE exercises SET deleted_at = NOW() WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL RETURNING *",
    [id, userId]
  );
  return result.rows[0] || null;
}
export async function categories(): Promise<Category[]> {
  const result = await pool.query(
    "SELECT id, name, parent_id FROM categories ORDER BY parent_id NULLS FIRST, name"
  );
  return result.rows;
}

export async function categoriesById() {
  const result = await pool.query("SELECT ");
}
