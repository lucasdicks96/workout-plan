import pool from "../config/db";
import * as workoutRepository from "../repositories/workout.repository";
import {
  AppError,
  InternalServerError,
  NotFoundError,
  UnauthorizedError,
  BadRequestError,
} from "../types/errors.types";
import {
  CompletedWorkout,
  Workout,
  WorkoutExercise,
} from "../types/workout.types";
import {
  buildCompletedWorkouts,
  buildWorkout,
  buildWorkoutPlansList,
  buildMergedWorkout,
} from "../utils/workout.utils";

/**
 * Erstellt einen neuen Trainingsplan mitsamt Übungen und Sätzen innerhalb einer Transaktion.
 *
 * @async
 * @param {string} title - Der Titel des neuen Trainingsplans.
 * @param {string} userId - Die UUID des Benutzers.
 * @param {WorkoutExercise[]} exercises - Die Liste der enthaltenen Übungen und Sätze.
 * @returns {Promise<Workout>} Der frisch erstellte und aufgebaute Trainingsplan.
 * @throws {InternalServerError} Wenn bei der Erstellung ein technischer Fehler auftritt.
 */
export async function createWorkoutPlan(
  title: string,
  userId: string,
  exercises: WorkoutExercise[],
) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const newWorkoutId = await workoutRepository.postWorkoutPlan(
      client,
      title,
      userId,
      exercises,
    );

    await client.query("COMMIT");

    const newWorkout = await getWorkoutById(newWorkoutId, userId);

    return newWorkout;
  } catch (error) {
    await client.query("ROLLBACK");
    if (error instanceof AppError) throw error;
    throw new InternalServerError(
      "Fehler bei der Erstellung des Workout-Plans.",
      error,
    );
  } finally {
    client.release();
  }
}

/**
 * Ruft alle aktiven Trainingspläne eines Benutzers ab und formatiert sie in eine strukturierte Liste.
 *
 * @async
 * @param {string} userId - Die UUID des Benutzers.
 * @returns {Promise<any[]>} Eine Liste aller strukturierten Workout-Pläne.
 * @throws {InternalServerError} Bei Datenbank- oder Verarbeitungsfehlern.
 */
export async function getAllWorkouts(userId: string) {
  try {
    const workoutData = await workoutRepository.getWorkouts(userId);

    const workouts = buildWorkoutPlansList(workoutData);

    return workouts;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new InternalServerError("Fehler beim Abrufen der Workouts.", error);
  }
}

/**
 * Ruft einen spezifischen Trainingsplan anhand seiner ID ab und prüft zuvor die Zugriffsberechtigung.
 *
 * @async
 * @param {number} workoutId - Die ID des Workout-Plans.
 * @param {string} userId - Die UUID des Benutzers zur Eigentümerprüfung.
 * @returns {Promise<Workout>} Das strukturierte Workout-Objekt.
 * @throws {NotFoundError} Wenn das Workout nicht existiert oder keine Berechtigung vorliegt.
 * @throws {BadRequestError} Wenn keine Datensätze gefunden wurden.
 * @throws {InternalServerError} Bei unerwarteten Fehlern.
 */
export async function getWorkoutById(
  workoutId: number,
  userId: string,
): Promise<Workout> {
  try {
    const owner = await workoutRepository.ownerCheck(workoutId, userId, pool);
    if (!owner) throw new NotFoundError("Workout nicht gefunden.");

    const workoutData = await workoutRepository.getWorkout(workoutId);

    if (!Array.isArray(workoutData) || workoutData.length === 0) {
      throw new BadRequestError("Keine Workout-Daten gefunden.");
    }

    const completedRows = await workoutRepository.getLastCompletedWorkout(
      workoutId,
      userId,
    );

    const workout = buildMergedWorkout(
      workoutId,
      workoutData,
      completedRows || [],
    );

    return workout;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new InternalServerError("Fehler beim Abrufen des Workouts.", error);
  }
}

/**
 * Lädt die Plan-Vorlage eines Workouts und führt sie mit der Historie des letzten
 * absolvierten Trainings zusammen (für Referenzgewichte).
 *
 * @async
 * @param {number} workoutId - Die ID des Workout-Plans.
 * @param {string} userId - Die UUID des Benutzers.
 * @returns {Promise<Workout>} Das zusammengeführte Workout-Objekt inklusive Historie.
 * @throws {NotFoundError} Wenn das Workout oder die Vorlage nicht gefunden wird.
 * @throws {InternalServerError} Bei Verarbeitungsfehlern.
 */
export async function getLastWorkout(
  workoutId: number,
  userId: string,
): Promise<Workout> {
  try {
    const owner = await workoutRepository.ownerCheck(workoutId, userId, pool);
    if (!owner) throw new NotFoundError("Workout nicht gefunden.");

    // 1. Lade immer die Plan-Vorlage (Das Pflicht-Gerüst)
    const planRows = await workoutRepository.getWorkout(workoutId);
    if (!planRows || planRows.length === 0) {
      throw new NotFoundError("Trainingsplan nicht gefunden.");
    }

    // 2. Lade die Historie (Kann leer sein, wenn noch nie trainiert wurde)
    const completedRows = await workoutRepository.getLastCompletedWorkout(
      workoutId,
      userId,
    );

    // 3. Führe Vorlage und Historie zusammen
    const newWorkout = buildMergedWorkout(
      workoutId,
      planRows,
      completedRows || [],
    );

    return newWorkout;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new InternalServerError(
      "Fehler beim Abrufen des letzten Workouts.",
      error,
    );
  }
}

/**
 * Ruft die Historie aller von einem Benutzer absolvierten Workouts ab.
 *
 * @async
 * @param {string} userId - Die UUID des Benutzers.
 * @returns {Promise<CompletedWorkout[]>} Eine Liste aller absolvierten Workouts.
 * @throws {InternalServerError} Bei Fehlern während des Abrufs.
 */
export async function getCompletedWorkouts(
  userId: string,
): Promise<CompletedWorkout[]> {
  try {
    const flatData = await workoutRepository.getCompletedWorkouts(userId);

    if (!Array.isArray(flatData) || flatData.length === 0) {
      return [];
    }

    const completedWorkouts = buildCompletedWorkouts(flatData);

    return completedWorkouts;
  } catch (error) {
    throw new InternalServerError(
      "Fehler beim Abrufen der abgeschlossenen Workouts.",
      error,
    );
  }
}

/**
 * Ruft die Details eines spezifischen absolvierten Workouts über seine UUID ab.
 *
 * @async
 * @param {string} userId - Die UUID des Benutzers.
 * @param {string} workoutId - Die UUID des absolvierten Workouts.
 * @returns {Promise<CompletedWorkout>} Das strukturierte, abgeschlossene Workout.
 * @throws {NotFoundError} Wenn kein passendes Workout gefunden wurde.
 * @throws {BadRequestError} Wenn keine Daten vorliegen.
 * @throws {InternalServerError} Bei technischen Fehlern.
 */
export async function getCompletedWorkout(
  userId: string,
  workoutId: string,
): Promise<CompletedWorkout> {
  try {
    const owner = await workoutRepository.ownerCheck(workoutId, userId, pool);
    if (!owner) throw new NotFoundError("Kein Workout gefunden.");

    const flatData = await workoutRepository.getCompletedWorkout(
      userId,
      workoutId,
    );

    if (!Array.isArray(flatData) || flatData.length === 0) {
      throw new BadRequestError(
        "Keine Daten für das abgeschlossene Workout gefunden.",
      );
    }

    const completedWorkouts = buildCompletedWorkouts(flatData);

    return completedWorkouts[0];
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new InternalServerError(
      "Fehler beim Abrufen des abgeschlossenen Workouts",
      error,
    );
  }
}

/**
 * Speichert ein erfolgreich absolviertes Training in einer atomaren Transaktion.
 * Konvertiert Millisekunden in Sekunden für Dauer und Pausenzeiten.
 *
 * @async
 * @param {number} workoutId - Die ID des zugrundeliegenden Plans.
 * @param {string} userId - Die UUID des Benutzers.
 * @param {Date} startTime - Startzeitpunkt.
 * @param {Date} endTime - Endzeitpunkt.
 * @param {number} pauseTime - Pausenzeit in Millisekunden.
 * @param {number} duration - Gesamtdauer in Millisekunden.
 * @param {WorkoutExercise[]} exercises - Die absolvierten Übungen und Sätze.
 * @param {string} title - Titel des Workouts.
 * @returns {Promise<CompletedWorkout>} Das gespeicherte, fertige Workout-Objekt.
 * @throws {NotFoundError} Wenn der Workout-Plan nicht existiert.
 * @throws {InternalServerError} Bei Fehlern während des Speicherns.
 */
export async function postCompletedWorkout(
  workoutId: number,
  userId: string,
  startTime: Date,
  endTime: Date,
  pauseTime: number,
  duration: number,
  exercises: WorkoutExercise[],
  title: string,
): Promise<CompletedWorkout> {
  const durationInSeconds = Math.floor(duration / 1000);
  const pauseTimeInSeconds = Math.floor(pauseTime / 1000);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const owner = await workoutRepository.ownerCheck(workoutId, userId, client);
    if (!owner) throw new NotFoundError("Workout nicht gefunden.");

    const planId = await workoutRepository.postCompletedWorkout(
      client,
      userId,
      workoutId,
      title,
      startTime,
      endTime,
      durationInSeconds,
      pauseTimeInSeconds,
      exercises,
    );

    await client.query("COMMIT");

    const workout = await getCompletedWorkout(userId, planId);

    return workout;
  } catch (error) {
    await client.query("ROLLBACK");
    if (error instanceof AppError) throw error;
    throw new InternalServerError(
      "Fehler beim Speichern des abgeschlossenen Workouts",
      error,
    );
  } finally {
    client.release();
  }
}

/**
 * Führt einen Soft Delete für einen Trainingsplan innerhalb einer Transaktion aus.
 *
 * @async
 * @param {number} workoutId - Die ID des zu löschenden Workouts.
 * @param {string} userId - Die UUID des Benutzers zur Berechtigungsprüfung.
 * @returns {Promise<{ deletedId: number; message: string }>} Das Ergebnis der Löschung.
 * @throws {UnauthorizedError} Wenn der Benutzer keine Berechtigung besitzt.
 * @throws {InternalServerError} Bei Transaktionsfehlern.
 */
export async function deleteWorkout(workoutId: number, userId: string) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const owner = await workoutRepository.ownerCheck(workoutId, userId, client);
    if (!owner) {
      throw new UnauthorizedError(
        "Benutzer hat nicht die Rechte, dieses Workout zu bearbeiten.",
      );
    }

    const result = await workoutRepository.deleteWorkout(
      client,
      workoutId,
      userId,
    );

    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    if (error instanceof AppError) throw error;
    throw new InternalServerError("Fehler beim Löschen des Workouts", error);
  } finally {
    client.release();
  }
}

/**
 * Aktualisiert einen bestehenden Trainingsplan (Titel, Übungen und Sätze) atomar.
 *
 * @async
 * @param {number} workoutId - Die ID des zu aktualisierenden Plans.
 * @param {string} userId - Die UUID des Benutzers.
 * @param {string} title - Der neue Titel.
 * @param {WorkoutExercise[]} exercises - Die aktualisierte Übungsliste.
 * @returns {Promise<Workout>} Das aktualisierte Workout-Objekt.
 * @throws {NotFoundError} Wenn das Workout nicht gefunden wurde.
 * @throws {InternalServerError} Bei technischen Fehlern.
 */
export async function putWorkout(
  workoutId: number,
  userId: string,
  title: string,
  exercises: WorkoutExercise[],
): Promise<Workout> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const isOwner = await workoutRepository.ownerCheck(
      workoutId,
      userId,
      client,
    );
    if (!isOwner) {
      throw new NotFoundError("Workout nicht gefunden.");
    }

    const planId = await workoutRepository.putWorkout(
      client,
      workoutId,
      title,
      exercises,
    );

    await client.query("COMMIT");

    const workout = await getWorkoutById(planId, userId);

    return workout;
  } catch (error) {
    await client.query("ROLLBACK");
    if (error instanceof AppError) throw error;
    throw new InternalServerError(
      "Fehler beim Aktualisieren des Workouts",
      error,
    );
  } finally {
    client.release();
  }
}

/**
 * Aktualisiert ein bereits absolviertes Workout (Metadaten und Sätze) innerhalb einer Transaktion.
 *
 * @async
 * @param {CompletedWorkout} workout - Das aktualisierte Completed-Workout-Objekt.
 * @returns {Promise<CompletedWorkout>} Das frisch aktualisierte absolvierte Workout.
 * @throws {NotFoundError} Wenn das Workout nicht gefunden wurde.
 * @throws {InternalServerError} Bei Fehlern während des Aktualisierungsprozesses.
 */
export async function putCompletedWorkout(
  workout: CompletedWorkout,
): Promise<CompletedWorkout> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const isOwner = await workoutRepository.ownerCheck(
      workout.workoutId,
      workout.userId,
      client,
    );
    if (!isOwner) {
      throw new NotFoundError("Workout nicht gefunden.");
    }

    const result = await workoutRepository.putCompletedWorkout(client, workout);

    await client.query("COMMIT");

    const completedWorkout = await getCompletedWorkout(
      result.userId,
      result.workoutId,
    );

    return completedWorkout;
  } catch (error) {
    await client.query("ROLLBACK");
    if (error instanceof AppError) throw error;
    throw new InternalServerError(
      "Fehler beim Aktualisieren des Workouts",
      error,
    );
  } finally {
    client.release();
  }
}

/**
 * Ermittelt allgemeine Workout-Statistiken für einen Benutzer (Anzahl Pläne, absolviert, aktiv).
 *
 * @async
 * @param {string} userId - Die UUID des Benutzers.
 * @returns {Promise<{ totalPlans: number; completedWorkouts: number; activeWorkouts: number }>} Die Statistikdaten.
 * @throws {InternalServerError} Bei Datenbankfehlern.
 */
export async function getWorkoutStats(userId: string): Promise<{
  totalPlans: number;
  completedWorkouts: number;
  activeWorkouts: number;
}> {
  try {
    return await workoutRepository.getWorkoutStats(userId);
  } catch (error) {
    throw new InternalServerError(
      "Fehler beim Abrufen der Workout-Statistiken.",
      error,
    );
  }
}

/**
 * Berechnet den prozentualen Fortschritt eines spezifischen Workout-Plans.
 *
 * @async
 * @param {number} workoutId - Die ID des Workout-Plans.
 * @param {string} userId - Die UUID des Benutzers.
 * @returns {Promise<{ totalSets: number; completedSets: number; progress: number }>} Die Fortschrittskennzahlen.
 * @throws {InternalServerError} Bei Abruf- oder Berechnungsfehlern.
 */
export async function getWorkoutProgress(
  workoutId: number,
  userId: string,
): Promise<{
  totalSets: number;
  completedSets: number;
  progress: number;
}> {
  try {
    return await workoutRepository.getWorkoutProgress(workoutId, userId);
  } catch (error) {
    throw new InternalServerError(
      "Fehler beim Abrufen des Workout-Fortschritts.",
      error,
    );
  }
}
