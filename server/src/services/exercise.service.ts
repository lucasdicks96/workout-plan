import * as exerciseRepository from "../repositories/exercise.repository";
import { CombinedExercise, Exercise } from "../types/exercise.types";

export async function getCombinedExercisesForUser(
  userId: string
): Promise<CombinedExercise[]> {
  const [systemExercises, userExercises] = await Promise.all([
    exerciseRepository.findSystemExercises(),
    exerciseRepository.findExercisesByUserId(userId),
  ]);

  const transformedSystemExercises = systemExercises.map((ex) =>
    transformToCombined(ex, false)
  );
  const transformedUserExercises = userExercises.map((ex) =>
    transformToCombined(ex, true)
  );
  return [...transformedSystemExercises, ...transformedUserExercises];
}

export async function getExercisesForUser(
  userId: string
): Promise<CombinedExercise[]> {
  const userExercises = await exerciseRepository.findExercisesByUserId(userId);
  if (!userExercises) {
    throw new Error("Fehler beim Laden der Übungen.");
  }
  const transformedUserExercises = userExercises.map((ex) =>
    transformToCombined(ex, true)
  );
  return transformedUserExercises;
}

export async function createNewExercise(
  title: string,
  description: string,
  userId: string
): Promise<Exercise> {
  return await exerciseRepository.createExercise(title, description, userId);
}

export async function updateUserExercise(
  id: number,
  title: string,
  description: string,
  userId: string
): Promise<{ message: string }> {
  const updatedExercise = await exerciseRepository.updateExercise(
    id,
    title,
    description,
    userId
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

function transformToCombined(
  exercise: Exercise,
  isUserCreated: boolean
): CombinedExercise {
  return {
    compositeKey: `${isUserCreated ? "user" : "system"}-${exercise.id}`,
    id: exercise.id,
    userId: exercise.userId,
    title: exercise.title,
    description: exercise.description,
    isUserCreated: isUserCreated,
  };
}
