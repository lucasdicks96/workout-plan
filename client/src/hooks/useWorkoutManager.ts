import { useState } from "react";
import {
  WorkoutExerciseSets,
  WorkoutExercises as WorkoutExercisesType,
} from "../types/workouts";
import { Exercise } from "../types/exercises";

/**
 * useWorkoutManager
 *
 * Ein Custom Hook, der die gesamte Logik für die Erstellung und Bearbeitung eines Workouts kapselt.
 * Er verwaltet eine Liste von Übungen (einschließlich Sätzen) und bietet Funktionen
 * zum Manipulieren dieser Liste (Hinzufügen, Entfernen, Reordering).
 *
 * @param initialWorkoutList Die optionale initiale Liste der Übungen (z.B. beim Editieren)
 */
export function useWorkoutManager(
  initialWorkoutList: WorkoutExercisesType[] = [],
) {
  // Hauptzustand: Die Liste der Übungen im aktuellen Workout
  const [workoutList, setWorkoutList] =
    useState<WorkoutExercisesType[]>(initialWorkoutList);

  // Hilfszustand: Steuert, ob der User gerade in der Übungsauswahl ist
  const [isSelecting, setIsSelecting] = useState(false);

  /**
   * Aktualisiert ein spezifisches Feld (Gewicht oder Wiederholungen) innerhalb eines Satzes.
   *
   * @param key Die ID der Übung
   * @param setIdx Der Index des Satzes innerhalb der Übung
   * @param field Das zu aktualisierende Feld ('weight' oder 'repetitions')
   * @param value Der neue numerische Wert
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
   * Fügt einer spezifischen Übung einen neuen Satz mit Standardwerten hinzu.
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
   * Entfernt den letzten Satz einer Übung (sofern mehr als ein Satz vorhanden ist).
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
   * Entfernt eine komplette Übung aus dem Workout und aktualisiert die Sortierreihenfolge.
   */
  const removeExerciseFromWorkout = (key: number) => {
    setWorkoutList((current) => {
      const newList = current.filter((ex) => ex.id !== key);
      return updateDisplayOrder(newList);
    });
  };

  /**
   * Hilfsfunktion: Aktualisiert die Eigenschaft 'displayOrder' basierend auf der
   * aktuellen Index-Position im Array. Wichtig für Drag & Drop oder Reordering.
   */
  function updateDisplayOrder(workoutExercises: WorkoutExercisesType[]) {
    return workoutExercises.map((ex, idx) => ({
      ...ex,
      displayOrder: idx,
    }));
  }

  /**
   * Ersetzt die gesamte Liste (z.B. nach einer Drag & Drop Aktion)
   * und normalisiert die Sortierreihenfolge.
   */
  const reorderWorkoutList = (newList: WorkoutExercisesType[]) => {
    setWorkoutList(updateDisplayOrder(newList));
  };

  /**
   * Fügt eine neue Basis-Übung aus dem Übungskatalog dem Workout hinzu.
   * Initialisiert die Übung mit einem Standard-Satz.
   */
  const addExerciseToWorkout = (exercise: Exercise) => {
    setWorkoutList((current) => {
      const newList = [
        ...current,
        {
          ...exercise,
          displayOrder: current.length,
          sets: [{ setNumber: 1, repetitions: 10, weight: 10 }],
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
