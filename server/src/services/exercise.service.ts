import pool from "../config/db";
import * as exerciseRepository from "../repositories/exercise.repository";
import {
  AppError,
  InternalServerError,
  NotFoundError,
} from "../types/errors.types";
import { Category, Exercise } from "../types/exercise.types";

export async function getExercises(userId: string): Promise<Exercise[]> {
  try {
    const [exercises, categoryTree] = await Promise.all([
      exerciseRepository.getExercises(userId),
      getCategoryTree(),
    ]);

    return exercises.map((ex) => transformToCombined(ex, categoryTree));
  } catch (error) {
    throw new InternalServerError("Fehler beim Abrufen der Übungen.", error);
  }
}

export async function getUserExercises(userId: string): Promise<Exercise[]> {
  try {
    const [userExercises, categoryTree] = await Promise.all([
      exerciseRepository.getUserExercises(userId),
      getCategoryTree(),
    ]);

    if (!userExercises || userExercises.length === 0) {
      return [];
    }

    return userExercises.map((ex) => transformToCombined(ex, categoryTree));
  } catch (error) {
    throw new InternalServerError(
      "Fehler beim Abrufen der Benutzer-Übungen.",
      error,
    );
  }
}

export async function postExercise(
  title: string,
  description: string,
  userId: string,
  categories: number[],
): Promise<Exercise> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Übung anlegen
    const exData = await exerciseRepository.insertExercise(
      client,
      title,
      description,
      userId,
    );

    // 2. Kategorien verknüpfen
    await exerciseRepository.insertExerciseCategories(
      client,
      exData.id,
      categories,
    );

    await client.query("COMMIT");

    const catTree = await getCategoryTree();

    const cat = filterCategoryTreeByIds(catTree, categories);

    return {
      id: exData.id,
      userId: exData.user_id,
      title: exData.title,
      description: exData.description,
      category: cat,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw new InternalServerError("Fehler beim Erstellen der Übung.", error);
  } finally {
    client.release();
  }
}

export async function putUserExercise(
  id: number,
  title: string,
  description: string,
  userId: string,
  categories: number[],
): Promise<{ message: string }> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Übung updaten
    const updatedExercise = await exerciseRepository.updateExercise(
      client,
      id,
      title,
      description,
      userId,
    );

    if (!updatedExercise) {
      await client.query("ROLLBACK");
      throw new NotFoundError(
        "Übung nicht gefunden oder fehlende Berechtigung.",
      );
    }

    // 2. Alte Kategorien löschen
    await exerciseRepository.deleteExerciseCategories(client, id);

    // 3. Neue Kategorien setzen
    await exerciseRepository.insertExerciseCategories(client, id, categories);

    await client.query("COMMIT");
    return { message: "Übung erfolgreich aktualisiert" };
  } catch (error) {
    await client.query("ROLLBACK");
    // Wenn es bereits unser eigener NotFoundError ist, werfen wir ihn unverändert weiter
    if (error instanceof AppError) throw error;

    throw new InternalServerError(
      "Fehler beim Aktualisieren der Übung.",
      error,
    );
  } finally {
    client.release();
  }
}

export async function deleteUserExercise(
  id: number,
  userId: string,
): Promise<{ message: string }> {
  try {
    const deletedExercise = await exerciseRepository.softDeleteExercise(
      id,
      userId,
    );
    if (!deletedExercise) {
      throw new NotFoundError(
        "Übung nicht gefunden oder fehlende Berechtigung.",
      );
    }
    return { message: "Löschen erfolgreich" };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new InternalServerError("Fehler beim Löschen der Übung.", error);
  }
}

export async function getCategories(): Promise<Category[]> {
  try {
    return await exerciseRepository.categories();
  } catch (error) {
    throw new InternalServerError(
      "Fehler beim Abrufen der Übungskategorien.",
      error,
    );
  }
}

export async function getCategoryTree(): Promise<Category[]> {
  try {
    const flatCategories = await getCategories();
    return buildCategoryTree(flatCategories);
  } catch (error) {
    throw new InternalServerError(
      "Fehler beim Erstellen des Kategorie-Baums.",
      error,
    );
  }
}

export function transformToCombined(
  exercise: Exercise,
  categoryTree: Category[],
): Exercise {
  const catIds = exercise.category.map((c) =>
    typeof c === "object" ? c.id : c,
  );

  const filteredCategories = filterCategoryTreeByIds(categoryTree, catIds);
  return {
    id: exercise.id,
    userId: exercise.userId ? exercise.userId : null,
    title: exercise.title,
    description: exercise.description,
    category: filteredCategories,
  };
}

function buildCategoryTree(categories: Category[]): Category[] {
  const map = new Map<number, Category>();
  const roots: Category[] = [];

  categories.forEach((cat) => map.set(cat.id, { ...cat, children: [] }));

  categories.forEach((cat) => {
    if (cat.parent_id) {
      const parent = map.get(cat.parent_id);
      if (parent) {
        parent.children!.push(map.get(cat.id)!);
      }
    } else {
      roots.push(map.get(cat.id)!);
    }
  });

  return roots;
}

function filterCategoryTreeByIds(tree: Category[], ids: number[]): Category[] {
  return tree
    .filter((cat) => ids.includes(cat.id))
    .map((cat) => ({
      ...cat,
      children: cat.children ? filterCategoryTreeByIds(cat.children, ids) : [],
    }));
}
