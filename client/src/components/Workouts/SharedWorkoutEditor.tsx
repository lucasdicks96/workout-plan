import { useState } from "react";
import { useWorkoutManager } from "../../hooks/useWorkoutManager";
import WorkoutExercises from "./WorkoutExercises";
import ExerciseSelectionList from "../Exercises/ExerciseSelectionList";
import AddButton from "../Buttons/AddButton";
import ConfirmButton from "../Buttons/ConfirmButton";
import ReturnButton from "../Buttons/ReturnButton";
import stylesButton from "../../styles/Button.module.css";
import { WorkoutExercises as WorkoutExercisesType } from "../../schemas/workout.schema";
import { Exercise } from "../../schemas/exercise.schema";

// ==========================================
// Schnittstellen (Interfaces)
// ==========================================

/**
 * Props für den SharedWorkoutEditor
 * Diese Komponente ist generisch aufgebaut, damit sie von verschiedenen übergeordneten
 * Komponenten (z.B. "Neuen Plan erstellen" oder "Historie bearbeiten") genutzt werden kann.
 */
interface SharedWorkoutEditorProps {
  /** Der anfängliche Name des Workouts (leer bei Neu-Erstellung, befüllt bei Editierung) */
  initialTitle: string;
  /** Die Liste der bereits vorhandenen Übungen und Sätze */
  initialExercises: WorkoutExercisesType[];
  /** Die Master-Liste aller existierenden Übungen (für den Auswahl-Bildschirm) */
  allExercises: Exercise[];
  /** Callback, der ausgelöst wird, wenn der Nutzer speichert und alle Validierungen bestanden sind */
  onSave: (title: string, exercises: WorkoutExercisesType[]) => Promise<void>;
  /** Callback, der ausgelöst wird, wenn der Nutzer die Bearbeitung abbricht */
  onCancel: () => void;
}

// ==========================================
// Hauptkomponente: SharedWorkoutEditor
// ==========================================

/**
 * SharedWorkoutEditor
 *
 * Das visuelle Herzstück für die Workout-Bearbeitung.
 * Kapselt die UI für die Eingabe des Namens, das Auflisten der Übungen (inkl. Sätze, Reps, Gewicht),
 * die Validierung vor dem Speichern und das Umschalten zur Übungsauswahl.
 */
export default function SharedWorkoutEditor({
  initialTitle,
  initialExercises,
  allExercises,
  onSave,
  onCancel,
}: SharedWorkoutEditorProps) {
  // --- Lokaler State ---
  const [workoutName, setWorkoutName] = useState(initialTitle);
  const [error, setError] = useState<string | null>(null);

  // --- Custom Hook für die Workout-Logik ---
  // Lagert die komplexe Logik (Hinzufügen/Entfernen von Sätzen, Reordering etc.) aus der UI aus.
  const {
    workoutList,
    isSelecting,
    setIsSelecting,
    updateExerciseInWorkout,
    handleAddSet,
    handleRemoveSet,
    removeExerciseFromWorkout,
    addExerciseToWorkout,
    reorderWorkoutList,
  } = useWorkoutManager(initialExercises);

  // --- Aktionen ---

  /**
   * handleConfirm
   * Prüft die Benutzereingaben auf Gültigkeit, bevor die Daten an die
   * Eltern-Komponente (`onSave`) übergeben werden.
   */
  const handleConfirm = async () => {
    // 1. Validierung: Hat das Workout einen Namen?
    if (workoutName.trim().length === 0) {
      return setError("Trainingsname darf nicht leer sein.");
    }

    // 2. Validierung: Wurden überhaupt Übungen hinzugefügt?
    if (workoutList.length === 0) {
      return setError("Trainingsplan muss mindestens eine Übung enthalten.");
    }

    // 3. Validierung: Haben alle hinzugefügten Übungen mindestens einen Satz?
    if (workoutList.some((ex) => ex.sets.length === 0)) {
      return setError("Jede Übung muss mindestens einen Satz enthalten.");
    }

    // Wenn alles okay ist: Fehler zurücksetzen und Speichervorgang einleiten
    setError(null);
    await onSave(workoutName, workoutList);
  };

  // --- Bedingtes Rendering ---

  // Wenn der Nutzer auf "Übung hinzufügen" geklickt hat, zeigen wir nur den Auswahl-Bildschirm.
  if (isSelecting) {
    return (
      <ExerciseSelectionList
        allExercises={allExercises}
        onBack={() => setIsSelecting(false)} // Bricht die Auswahl ab und kehrt zum Editor zurück
        workoutList={workoutList}
        onSelectExercise={addExerciseToWorkout} // Fügt die gewählte Übung dem aktuellen Workout hinzu
      />
    );
  }

  // Standard-Ansicht: Der Workout-Editor
  return (
    <>
      {/* Anzeige von Validierungsfehlern (z.B. fehlender Name) */}
      {error && <p style={{ color: "var(--c-danger)" }}>{error}</p>}

      {/* Eingabefeld für den Workout-Namen */}
      <input
        className="input"
        name="name"
        style={{ maxWidth: "20rem" }}
        type="text"
        placeholder="Name des Trainingsplans"
        value={workoutName}
        onChange={(e) => setWorkoutName(e.target.value)}
      />

      {/* 
        WorkoutExercises
        Verwaltet das Rendern der einzelnen Übungsblöcke (inklusive Drag & Drop Reordering).
      */}
      <WorkoutExercises
        onReorderWorkoutList={reorderWorkoutList}
        onRemove={removeExerciseFromWorkout}
        onUpdate={(key, setIndex, field, value) => {
          // Typkonvertierung: Input-Felder liefern Strings, aber wir speichern Gewichte/Reps als Numbers
          const numericValue = Number(value);
          if (!isNaN(numericValue)) {
            updateExerciseInWorkout(key, setIndex, field, numericValue);
          }
        }}
        workoutList={workoutList}
        onAddSet={handleAddSet}
        onRemoveSet={handleRemoveSet}
      />

      {/* Aktionsleiste am unteren Rand */}
      <div className={stylesButton["button-container"]}>
        <ReturnButton
          onBack={onCancel}
          className={`${stylesButton.left} ${stylesButton.button}`}
        />
        {/* Aktiviert den Auswahl-Modus (isSelecting = true), wodurch die Ansicht wechselt */}
        <AddButton onAdd={() => setIsSelecting(true)} />
        <ConfirmButton
          onConfirm={handleConfirm}
          className={`${stylesButton.right} ${stylesButton.button}`}
        />
      </div>
    </>
  );
}
