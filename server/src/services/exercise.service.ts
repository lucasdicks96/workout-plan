import pool from "../config/db";
import * as exerciseRepository from "../repositories/exercise.repository";
import {
  AppError,
  InternalServerError,
  NotFoundError,
} from "../types/errors.types";
import { Category, Exercise } from "../types/exercise.types";

/**
 * Ruft alle für den Benutzer sichtbaren Übungen ab und reichert diese
 * mit dem vollständigen, hierarchischen Kategoriebaum an.
 *
 * @async
 * @param {string} userId - Die UUID des authentifizierten Benutzers.
 * @returns {Promise<Exercise[]>} Eine Liste aller transformierten Übungen.
 * @throws {InternalServerError} Wenn beim Laden oder Transformieren ein Fehler auftritt.
 */
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

/**
 * Ruft exklusiv die vom Benutzer erstellten Übungen ab und verknüpft sie mit dem Kategoriebaum.
 *
 * @async
 * @param {string} userId - Die UUID des Benutzers.
 * @returns {Promise<Exercise[]>} Eine Liste der benutzerdefinierten Übungen.
 * @throws {InternalServerError} Bei Datenbank- oder Verarbeitungsfehlern.
 */
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

export async function getLastExercisePerformance(
  userId: string,
  exerciseId: number,
) {
  try {
    const rows = await exerciseRepository.getLastExercisePerformance(
      userId,
      exerciseId,
    );
    if (!rows || rows.length === 0) return [];

    return rows.map((r) => ({
      setNumber: Number(r.set_number),
      weight: Number(r.weight),
      repetitions: Number(r.repetitions),
    }));
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new InternalServerError(
      "Fehler beim Abrufen der Übungshistorie.",
      error,
    );
  }
}

/**
 * Erstellt eine neue Übung mitsamt Kategorie-Zuordnungen innerhalb einer atomaren Transaktion.
 *
 * @async
 * @param {string} title - Der Titel der Übung.
 * @param {string} description - Die Beschreibung der Übung.
 * @param {string} userId - Die UUID des Erstellers.
 * @param {number[]} categories - Ein Array von zugewiesenen Kategorie-IDs.
 * @returns {Promise<{ message: string }>} Eine Bestätigungsmeldung bei Erfolg.
 * @throws {InternalServerError} Wenn die Transaktion fehlschlägt.
 */
export async function postExercise(
  title: string,
  description: string,
  userId: string,
  categories: number[],
): Promise<{ message: string; id: number }> {
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

    return {
      message: "Übung erfolgreich erstellt.",
      id: exData.id,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw new InternalServerError("Fehler beim Erstellen der Übung.", error);
  } finally {
    client.release();
  }
}

/**
 * Aktualisiert eine bestehende Übung sowie deren Kategorie-Zuordnungen in einer Transaktion.
 *
 * @async
 * @param {number} id - Die ID der zu aktualisierenden Übung.
 * @param {string} title - Der neue Titel.
 * @param {string} description - Die neue Beschreibung.
 * @param {string} userId - Die UUID des Benutzers zur Berechtigungsprüfung.
 * @param {number[]} categories - Die aktualisierten Kategorie-IDs.
 * @returns {Promise<{ message: string }>} Eine Bestätigungsmeldung.
 * @throws {NotFoundError} Wenn die Übung nicht existiert oder keine Berechtigung vorliegt.
 * @throws {InternalServerError} Bei technischen Fehlern während des Update-Vorgangs.
 */
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

/**
 * Führt einen Soft Delete für eine benutzerdefinierte Übung aus.
 *
 * @async
 * @param {number} id - Die ID der Übung.
 * @param {string} userId - Die UUID des Eigentümers.
 * @returns {Promise<{ message: string }>} Eine Bestätigungsmeldung.
 * @throws {NotFoundError} Wenn die Übung nicht gefunden wurde oder keine Berechtigung besteht.
 * @throws {InternalServerError} Bei unerwarteten Fehlern.
 */
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

/**
 * Ruft alle flachen Kategorien aus dem Repository ab.
 *
 * @async
 * @returns {Promise<Category[]>} Eine flache Liste aller Kategorien.
 * @throws {InternalServerError} Bei Datenbankfehlern.
 */
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

/**
 * Erstellt einen strukturierten, hierarchischen Kategoriebaum aus den flachen Kategoriedaten.
 *
 * @async
 * @returns {Promise<Category[]>} Die Root-Kategorien inklusive ihrer verschachtelten Unterkategorien.
 * @throws {InternalServerError} Wenn beim Aufbau des Baums ein Fehler auftritt.
 */
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

/**
 * Transformiert ein rohes Übungsobjekt, indem die zugewiesenen Kategorien anhand
 * des globalen Kategoriebaums gefiltert und strukturiert werden.
 *
 * @param {Exercise} exercise - Das zu transformierende Übungsobjekt.
 * @param {Category[]} categoryTree - Der vollständige hierarchische Kategoriebaum.
 * @returns {Exercise} Das bereinigte und strukturierte Übungsobjekt.
 */
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

/**
 * Hilfsfunktion: Wandelt eine flache Liste von Kategorien in eine Baumstruktur (Parent-Children) um.
 *
 * @param {Category[]} categories - Die flachen Kategoriedaten.
 * @returns {Category[]} Ein Array von Root-Kategorien mit gefüllten `children`-Eigenschaften.
 */
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

/**
 * Hilfsfunktion: Filtert einen Kategoriebaum rekursiv anhand einer Liste erlaubter IDs.
 *
 * @param {Category[]} tree - Der zu filternde Baum oder Teilbaum.
 * @param {number[]} ids - Eine Liste von Kategorie-IDs, die behalten werden sollen.
 * @returns {Category[]} Der gefilterte Teilbaum.
 */
function filterCategoryTreeByIds(tree: Category[], ids: number[]): Category[] {
  return tree
    .filter((cat) => ids.includes(cat.id))
    .map((cat) => ({
      ...cat,
      children: cat.children ? filterCategoryTreeByIds(cat.children, ids) : [],
    }));
}
