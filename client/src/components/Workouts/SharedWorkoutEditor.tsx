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
 * Die Eigenschaften (Props) für den SharedWorkoutEditor.
 * 
 * Diese Komponente ist modular und generisch aufgebaut, damit sie flexibel
 * von verschiedenen übergeordneten Ansichten (z. B. "Neuen Plan erstellen", "Plan bearbeiten" 
 * oder "Historie nachträglich korrigieren") wiederverwendet werden kann.
 */
export interface SharedWorkoutEditorProps {
  /** Der anfängliche Name des Workouts (leer bei Neu-Erstellung, vorausgefüllt bei Editierung). */
  initialTitle: string;
  /** Die Liste der bereits im Workout vorhandenen Übungen und Sätze. */
  initialExercises: WorkoutExercisesType[];
  /** Die vollständige Master-Liste aller existierenden Übungen (wird für den Auswahl-Bildschirm benötigt). */
  allExercises: Exercise[];
  /** Asynchrone Callback-Funktion, die beim Klick auf Bestätigen nach erfolgreicher Validierung ausgelöst wird. */
  onSave: (title: string, exercises: WorkoutExercisesType[]) => Promise<void>;
  /** Callback-Funktion, die beim Abbrechen der Bearbeitung (Zurück-Button) ausgeführt wird. */
  onCancel: () => void;
}

// ==========================================
// Hauptkomponente: SharedWorkoutEditor
// ==========================================

/**
 * SharedWorkoutEditor
 *
 * Das visuelle Herzstück und der zentrale Editor für die Erstellung und Bearbeitung von Workouts.
 * 
 * Kapselt die gesamte Benutzeroberfläche und Steuerung für:
 * - Die Eingabe des Trainingsplan-Namens.
 * - Das Verwalten, Sortieren (Drag & Drop) und Bearbeiten von Übungsblöcken und Sätzen (via `useWorkoutManager`).
 * - Umfassende Frontend-Validierungen vor dem Abspeichern (Name vorhanden, mindestens 1 Übung, mindestens 1 Satz pro Übung).
 * - Das Umschalten zwischen dem Editor und dem Übungs-Auswahlkatalog (`ExerciseSelectionList`).
 *
 * @param {SharedWorkoutEditorProps} props - Die Eigenschaften der Komponente.
 * @returns {JSX.Element} Entweder den Übungs-Auswahlbildschirm oder den aktiven Workout-Editor.
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
  // Lagert die komplexe Logik (Hinzufügen/Entfernen von Sätzen, Reordering, State-Mutationen) aus der UI aus.
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
   * Prüft die Benutzereingaben auf vollständige Gültigkeit, bevor die Daten
   * an die übergeordnete `onSave`-Funktion übergeben werden.
   * 
   * Validierungsregeln:
   * 1. Der Workout-Name darf nach dem Trimmen nicht leer sein.
   * 2. Das Workout muss mindestens eine Übung enthalten.
   * 3. Jede einzelne Übung muss mindestens einen aktiven Satz besitzen.
   *
   * @async
   * @returns {Promise<void>}
   */
  const handleConfirm = async () => {
    // 1. Validierung: Hat das Workout einen gültigen Namen?
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

    // Wenn alle Prüfungen bestanden sind: Fehler zurücksetzen und Speichervorgang einleiten
    setError(null);
    await onSave(workoutName, workoutList);
  };

  // --- Bedingtes Rendering ---

  // Wenn der Nutzer auf "Übung hinzufügen" geklickt hat, wird temporär nur der Auswahl-Bildschirm angezeigt.
  if (isSelecting) {
    return (
      <ExerciseSelectionList
        allExercises={allExercises}
        onBack={() => setIsSelecting(false)} // Schließt die Auswahl und kehrt zum Editor zurück
        workoutList={workoutList}
        onSelectExercise={addExerciseToWorkout} // Fügt die gewählte Übung dem aktuellen Workout hinzu
      />
    );
  }

  // Standard-Ansicht: Der eigentliche Workout-Editor
  return (
    <>
      {/* Anzeige von Validierungsfehlern (z. B. bei leerem Namen oder fehlenden Sätzen) */}
      {error && <p style={{ color: "var(--c-danger)" }}>{error}</p>}

      {/* Eingabefeld für den Namen des Trainingsplans */}
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
        Verwaltet das Rendern der einzelnen Übungsblöcke und Sätze (inklusive Drag-&-Drop-Reordering).
      */}
      <WorkoutExercises
        onReorderWorkoutList={reorderWorkoutList}
        onRemove={removeExerciseFromWorkout}
        onUpdate={(key, setIndex, field, value) => {
          // Typkonvertierung: HTML-Input-Felder liefern Strings, aber wir speichern Gewichte/Reps als Numbers
          const numericValue = Number(value);
          if (!isNaN(numericValue)) {
            updateExerciseInWorkout(key, setIndex, field, numericValue);
          }
        }}
        workoutList={workoutList}
        onAddSet={handleAddSet}
        onRemoveSet={handleRemoveSet}
      />

      {/* Aktionsleiste am unteren Bildschirmrand */}
      <div className={stylesButton["button-container"]}>
        <ReturnButton
          onBack={onCancel}
          className={`${stylesButton.left} ${stylesButton.button}`}
        />
        {/* Aktiviert den Auswahl-Modus (isSelecting = true), wodurch die Ansicht auf die Übungsliste wechselt */}
        <AddButton onAdd={() => setIsSelecting(true)} />
        <ConfirmButton
          onConfirm={handleConfirm}
          className={`${stylesButton.right} ${stylesButton.button}`}
        />
      </div>
    </>
  );
}