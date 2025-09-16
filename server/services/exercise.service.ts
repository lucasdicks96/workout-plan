import * as exerciseRepository from "../repositories/exercise.repository";
import { CombinedExercise, Exercise } from "../types/exercise.types";

export async function getCombinedExercisesForUser(
  userId: number
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

export async function createNewExercise(
  title: string,
  description: string,
  userId: number
): Promise<Exercise> {
  return await exerciseRepository.createExercise(title, description, userId);
}

export async function updateUserExercise(
  id: number,
  title: string,
  description: string,
  userId: number
): Promise<Exercise> {
  const updatedExercise = await exerciseRepository.updateExercise(
    id,
    title,
    description,
    userId
  );
  if (!updatedExercise) {
    throw new Error("Exercise not found or user not authorized.");
  }
  return updatedExercise;
}

export async function deleteUserExercise(
  id: number,
  userId: number
): Promise<void> {
  const deletedExercise = await exerciseRepository.softDeleteExercise(
    id,
    userId
  );
  if (!deletedExercise) {
    throw new Error("Exercise not found or user not authorized.");
  }
}

// Hilfsfunktion, um Datenbank-Objekte in das Frontend-Format umzuwandeln
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
