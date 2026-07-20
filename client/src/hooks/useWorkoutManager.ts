import { useState } from "react";
import { Exercise } from "../schemas/exercise.schema";
import {
  WorkoutExerciseSets,
  WorkoutExercises as WorkoutExercisesType,
} from "../schemas/workout.schema";
import { apiService } from "../services/apiService";

/**
 * Custom Hook zur zentralen Verwaltung der Übungs- und Satz-Logik innerhalb eines Trainingsplans.
 *
 * Kapselt sämtliche Statusänderungen für das Erstellen, Bearbeiten und Sortieren von Workouts:
 * - Hinzufügen, Bearbeiten und Entfernen von Übungen und einzelnen Sätzen.
 * - Automatische Normalisierung der Sortierreihenfolge (`displayOrder`) bei Listenänderungen.
 * - Steuerung des UI-Sichtbarkeitszustands für den Übungs-Auswahlkatalog (`isSelecting`).
 * - Garantiert nach dem React-Prinzip der Immutabilität bei jeder Mutation die Erstellung neuer Array- und Objekt-Referenzen.
 *
 * @param {WorkoutExercisesType[]} [initialWorkoutList=[]] - Optionale initiale Übungsliste (z. B. beim Bearbeiten eines bestehenden Plans oder Hydrieren aus dem LocalStorage).
 * @returns Ein Objekt mit reaktiven Zuständen, Setter-Funktionen und Mutations-Headern für das Workout.
 */
export function useWorkoutManager(
  initialWorkoutList: WorkoutExercisesType[] = [],
) {
  /** Hauptzustand: Die aktuelle, sequenzielle Liste der Übungen inklusive ihrer Sätze. */
  const [workoutList, setWorkoutList] =
    useState<WorkoutExercisesType[]>(initialWorkoutList);

  /** Hilfszustand: Steuert, ob das Modal oder die Ansicht zur Übungsauswahl geöffnet ist. */
  const [isSelecting, setIsSelecting] = useState<boolean>(false);

  /**
   * Aktualisiert zielgenau einen spezifischen numerischen Wert (Gewicht oder Wiederholungen)
   * in einem einzelnen Satz einer Übung.
   *
   * @param {number} key - Die eindeutige ID der betroffenen Übung.
   * @param {number} setIdx - Der 0-basierte Array-Index des zu modifizierenden Satzes.
   * @param {keyof WorkoutExerciseSets} field - Das zu ändernde Eigenschaftsfeld (`weight` oder `repetitions`).
   * @param {number} value - Der neue numerische Wert, der eingetragen werden soll.
   */
  const updateExerciseInWorkout = (
    key: number,
    setIdx: number,
    field: keyof WorkoutExerciseSets,
    value: number,
  ) => {
    setWorkoutList((current) =>
      current.map((ex) =>
        ex.id === key
          ? {
              ...ex,
              sets: ex.sets.map((set, idx) =>
                idx === setIdx ? { ...set, [field]: value } : set,
              ),
            }
          : ex,
      ),
    );
  };

  /**
   * Hängt einen neuen Satz an das Ende der Satzliste einer bestimmten Übung an.
   * Initialisiert den neuen Satz automatisch mit Standardwerten (10 Wiederholungen, 10 kg)
   * und berechnet die fortlaufende Satznummer (`setNumber`) anhand der neuen Array-Länge.
   *
   * @param {number} key - Die eindeutige ID der betroffenen Übung.
   */
  const handleAddSet = (key: number) => {
    setWorkoutList((current) =>
      current.map((ex) =>
        ex.id === key
          ? {
              ...ex,
              sets: [
                ...ex.sets,
                {
                  setNumber: ex.sets.length + 1,
                  repetitions: 10,
                  weight: 10,
                },
              ],
            }
          : ex,
      ),
    );
  };

  /**
   * Entfernt den letzten Satz aus der Satzliste einer bestimmten Übung.
   *
   * Schutzmechanismus: Verhindert das Entfernen, wenn nur noch ein einziger Satz übrig ist
   * (`ex.sets.length > 1`), damit eine Übung im Workout niemals völlig satzlos verbleibt.
   *
   * @param {number} key - Die eindeutige ID der betroffenen Übung.
   */
  const handleRemoveSet = (key: number) => {
    setWorkoutList((current) =>
      current.map((ex) => {
        if (ex.id === key && ex.sets.length > 1) {
          return {
            ...ex,
            sets: ex.sets.slice(0, -1),
          };
        }
        return ex;
      }),
    );
  };

  /**
   * Entfernt eine komplette Übung inklusive aller Sätze aus dem aktuellen Trainingsplan
   * und schickt die verbleibende Liste zur Neukalibrierung durch `updateDisplayOrder`.
   *
   * @param {number} key - Die eindeutige ID der zu löschenden Übung.
   */
  const removeExerciseFromWorkout = (key: number) => {
    setWorkoutList((current) => {
      const newList = current.filter((ex) => ex.id !== key);
      return updateDisplayOrder(newList);
    });
  };

  /**
   * Hilfsfunktion: Synchronisiert die Eigenschaft `displayOrder` jeder Übung
   * exakt mit ihrem aktuellen physischen Index im Array.
   * Unerlässlich für die Datenkonsistenz vor und nach Drag-&-Drop-Operationen.
   *
   * @param {WorkoutExercisesType[]} workoutExercises - Die rohe, unsynchronisierte Übungsliste.
   * @returns {WorkoutExercisesType[]} Ein neues Array, in dem die Reihenfolge exakt indiziert ist.
   */
  function updateDisplayOrder(workoutExercises: WorkoutExercisesType[]) {
    return workoutExercises.map((ex, idx) => ({
      ...ex,
      displayOrder: idx,
    }));
  }

  /**
   * Ersetzt die gesamte aktuelle Übungsliste (z. B. nach einer manuellen Sortierung durch Drag & Drop)
   * und garantiert über `updateDisplayOrder` eine lückenlose Indexierung der neuen Reihenfolge.
   *
   * @param {WorkoutExercisesType[]} newList - Das neu sortierte Array der Trainingsübungen.
   */
  const reorderWorkoutList = (newList: WorkoutExercisesType[]) => {
    setWorkoutList(updateDisplayOrder(newList));
  };

  /**
   * Konvertiert eine allgemeine Basis-Übung aus dem Übungskatalog (`Exercise`) in eine
   * Workout-spezifische Übungsstruktur (`WorkoutExercisesType`) und fügt sie dem Plan hinzu:
   * - Lädt im Hintergrund die letzten historischen Leistungssätze für diese Übung über die API.
   * - Falls Historie existiert, werden diese Sätze als Vorbelegung genutzt. Ansonsten greifen Standardwerte.
   * - Setzt die `displayOrder` ans aktuelle Listenende.
   * - Schließt automatisch das Auswahl-Modal (`setIsSelecting(false)`).
   *
   * @param {Exercise} exercise - Das aus dem Katalog gewählte Übungsobjekt.
   */
  const addExerciseToWorkout = async (exercise: Exercise) => {
    let initialSets = [{ setNumber: 1, repetitions: 10, weight: 10 }];

    try {
      // API-Aufruf mit der neuen Methode
      const response = await apiService.getLastPerformance(exercise.id);

      if (response && response.data && response.data.length > 0) {
        initialSets = response.data;
      }
    } catch (error) {
      // Falls der Abruf fehlschlägt (z. B. Netzwerkfehler), greifen stillschweigend die Standardwerte
      console.error(
        "Konnte Übungshistorie nicht laden, nutze Standardwerte.",
        error,
      );
    }

    setWorkoutList((current) => {
      const newList = [
        ...current,
        {
          ...exercise,
          displayOrder: current.length,
          sets: initialSets,
        },
      ];
      return updateDisplayOrder(newList);
    });

    // Nach der Auswahl wird die Liste automatisch geschlossen
    setIsSelecting(false);
  };

  return {
    workoutList,
    setWorkoutList,
    isSelecting,
    setIsSelecting,
    updateExerciseInWorkout,
    handleAddSet,
    handleRemoveSet,
    removeExerciseFromWorkout,
    addExerciseToWorkout,
    updateDisplayOrder,
    reorderWorkoutList,
  };
}
