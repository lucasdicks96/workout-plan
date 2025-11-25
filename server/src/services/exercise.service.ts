import * as exerciseRepository from "../repositories/exercise.repository";
import { InternalServerError } from "../types/errors.types";
import {
  Category,
  CombinedExercise,
  Exercise
} from "../types/exercise.types";

export async function getCombinedExercisesForUser(
  userId: string
): Promise<CombinedExercise[]> {
  const [systemExercises, userExercises, categoryTree] = await Promise.all([
    exerciseRepository.findSystemExercises(),
    exerciseRepository.findExercisesByUserId(userId),
    getCategoryTree(),
  ]);

  const transformedSystemExercises = systemExercises.map((ex) =>
    transformToCombined(ex, categoryTree)
  );
  const transformedUserExercises = userExercises.map((ex) =>
    transformToCombined(ex, categoryTree)
  );

  return [...transformedSystemExercises, ...transformedUserExercises];
}

export async function getExercisesForUser(
  userId: string
): Promise<CombinedExercise[]> {
  const [userExercises, categoryTree] = await Promise.all([
    exerciseRepository.findExercisesByUserId(userId),
    getCategoryTree(),
  ]);
  // if (!userExercises) {
  //   throw new Error("Fehler beim Laden der Übungen.");
  // }
  if (!userExercises || userExercises.length === 0) {
    return [];
  }
  const transformedUserExercises = userExercises.map((ex) =>
    transformToCombined(ex, categoryTree)
  );

  return transformedUserExercises;
}

export async function createNewExercise(
  title: string,
  description: string,
  userId: string,
  categories: number[]
): Promise<Exercise> {
  return await exerciseRepository.createExercise(
    title,
    description,
    userId,
    categories
  );
}

export async function updateUserExercise(
  id: number,
  title: string,
  description: string,
  userId: string,
  categories: number[]
): Promise<{ message: string }> {
  const updatedExercise = await exerciseRepository.updateExercise(
    id,
    title,
    description,
    userId,
    categories
  );
  if (!updatedExercise) {
    throw new Error("Übung nicht gefunden oder fehlende Berechtigung.");
  }
  return { message: "Übung erfolgreich aktualisiert" };
}

export async function deleteUserExercise(
  id: number,
  userId: string
): Promise<{ message: string }> {
  const deletedExercise = await exerciseRepository.softDeleteExercise(
    id,
    userId
  );
  if (!deletedExercise) {
    throw new Error("Übung nicht gefunden oder fehlende Berechtigung.");
  }
  return { message: "Löschen erfolgreich" };
}

export async function getCategories(): Promise<Category[]> {
  const result = await exerciseRepository.categories();
  if (!result)
    throw new InternalServerError("Fehler beim Abrufen der Übungskategorien");
  return result;
}

export async function getCategoryTree(): Promise<Category[]> {
  const flatCategories = await getCategories();

  return buildCategoryTree(flatCategories);
}

export function transformToCombined(
  exercise: Exercise,
  categoryTree: Category[]
): CombinedExercise {
  const catIds = exercise.category.map((c) =>
    typeof c === "object" ? c.id : c
  );

  const filteredCategories = filterCategoryTreeByIds(categoryTree, catIds);
  return {
    compositeKey: `${exercise.userId ? "user" : "system"}-${exercise.id}`,
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
