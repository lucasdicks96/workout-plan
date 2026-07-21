import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../../hooks/useNotification";
import { useSetTitle } from "../../hooks/useSetTitle";
import { useWorkoutManager } from "../../hooks/useWorkoutManager";
import { apiService } from "../../services/apiService";
import stylesButton from "../../styles/Button.module.css";
import stylesExercises from "../../styles/Exercises.module.css";
import { Exercise } from "../../schemas/exercise.schema";
import AddButton from "../Buttons/AddButton";
import ConfirmButton from "../Buttons/ConfirmButton";
import ReturnButton from "../Buttons/ReturnButton";
import ExerciseSelectionList from "../Exercises/ExerciseSelectionList";
import WorkoutExercises from "./WorkoutExercises";
import { getApiErrorMessage } from "../../util/errorHelper";

/**
 * CreateWorkout
 *
 * Diese Komponente steuert den gesamten Erstellungsprozess eines neuen Trainingsplans.
 *
 * Kernfunktionen:
 * - **Draft-Persistenz im LocalStorage**: Speichert unvollständige Eingaben (Trainingsname und Übungsliste)
 *   automatisch im Hintergrund ab, damit bei versehentlichem Schließen oder Neuladen des Tabs keine Daten verloren gehen.
 * - **Modales Umschalten**: Ermöglicht das Wechseln in den Übungskatalog (`ExerciseSelectionList`)
 *   zum Hinzufügen neuer Übungen.
 * - **Validierung & API-Übertragung**: Prüft, ob ein Plan-Name vergeben wurde und ob mindestens eine Übung
 *   enthalten ist, bevor der Plan an das Backend gesendet wird.
 *
 * @returns {JSX.Element} Entweder den Ladebildschirm, die Übungsauswahl oder den Workout-Erstellungs-Editor.
 */
export default function CreateWorkout() {
  const {
    updateExerciseInWorkout,
    handleAddSet,
    handleRemoveSet,
    removeExerciseFromWorkout,
    workoutList,
    setWorkoutList,
    isSelecting,
    setIsSelecting,
    addExerciseToWorkout,
    reorderWorkoutList,
  } = useWorkoutManager();

  /** Die Master-Liste aller im System existierenden Übungen für den Auswahl-Bildschirm. */
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);

  /** Der Name des neu zu erstellenden Trainingsplans. */
  const [workoutName, setWorkoutName] = useState<string>("");
  /** Globaler Ladezustand für das initiale Abrufen des Übungskatalogs. */
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const navigate = useNavigate();
  useSetTitle("Plan erstellen");
  const { showNotification } = useNotification();

  /**
   * Initialer Hydrations-Effect: Versucht beim Laden der Komponente einen eventuell
   * zwischengespeicherten Entwurf ("createPlan" und "planName") aus dem LocalStorage wiederherzustellen.
   */
  useEffect(() => {
    const savedList = localStorage.getItem("createPlan");
    const savedName = localStorage.getItem("planName");

    if (savedList) setWorkoutList(JSON.parse(savedList));
    if (savedName) setWorkoutName(JSON.parse(savedName));
  }, [setWorkoutList]);

  /**
   * Auto-Save-Effect: Synchronisiert den aktuellen Bearbeitungsstand (Übungen und Name)
   * bei jeder Änderung kontinuierlich mit dem LocalStorage.
   */
  useEffect(() => {
    localStorage.setItem("createPlan", JSON.stringify(workoutList));
    localStorage.setItem("planName", JSON.stringify(workoutName));
  }, [workoutList, workoutName]);

  /**
   * Lädt den vollständigen Übungskatalog asynchron von der API,
   * damit der Nutzer beim Hinzufügen von Übungen aus allen verfügbaren Optionen wählen kann.
   *
   * @async
   * @returns {Promise<void>}
   */
  const loadAllExercises = useCallback(async () => {
    try {
      const response = await apiService.getExercises();
      setAllExercises(response.data);
    } catch (error) {
      showNotification(
        getApiErrorMessage(error, "Fehler beim Abrufen der Übungen"),
        "error",
        3000,
      );
      console.error("Fehler beim Abrufen der Übungen:", error);
    } finally {
      setIsLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    loadAllExercises();
  }, [loadAllExercises]);

  /**
   * Validiert die Formulardaten und sendet den neuen Trainingsplan an das Backend.
   *
   * Validierungsregeln:
   * 1. Der Plan-Name darf nicht leer sein (`workoutName.trim()`).
   * 2. Es muss mindestens eine Übung im Plan vorhanden sein.
   *
   * Nach erfolgreichem Speichern werden die Entwurfsdaten im LocalStorage bereinigt
   * und der Nutzer wird zur Workout-Übersicht weitergeleitet.
   *
   * @async
   * @returns {Promise<void>}
   */
  const handleCreateWorkout = async () => {
    if (!workoutName.trim()) {
      showNotification(
        "Bitte gib dem Trainingsplan einen Namen.",
        "error",
        3000,
      );
      return;
    }
    if (workoutList.length === 0) {
      showNotification(
        "Füge mindestens eine Übung zum Plan hinzu.",
        "error",
        3000,
      );
      return;
    }

    try {
      await apiService.postWorkout({
        title: workoutName,
        exercises: workoutList,
      });
      showNotification("Trainingsplan erstellt!", "success");

      // Cleanup des lokalen Entwurfs bei Erfolg
      localStorage.removeItem("createPlan");
      localStorage.removeItem("planName");

      navigate("/workouts");
    } catch (error) {
      showNotification(
        getApiErrorMessage(error, "Fehler beim Erstellen des Trainingsplans"),
        "error",
        3000,
      );
    }
  };

  /**
   * Bricht den Erstellungsprozess ab:
   * Verwirft den lokalen Entwurf im LocalStorage und navigiert zurück zur Workout-Übersicht.
   */
  const handleBack = () => {
    localStorage.removeItem("createPlan");
    localStorage.removeItem("planName");
    navigate("/workouts");
  };

  if (isLoading) {
    return <p>Lade Daten...</p>;
  }

  // Bedingtes Rendering: Wenn der Nutzer neue Übungen hinzufügen möchte, öffnet sich der Katalog
  if (isSelecting) {
    return (
      <ExerciseSelectionList
        allExercises={allExercises}
        workoutList={workoutList}
        onSelectExercise={addExerciseToWorkout}
        onBack={() => setIsSelecting(false)}
      />
    );
  }

  return (
    <>
      {/* Eingabefeld für den Titel des neuen Trainingsplans */}
      <input
        className={stylesExercises["search-input"]}
        name="title"
        style={{ maxWidth: "20rem" }}
        type="text"
        placeholder="Name des Trainingsplans..."
        value={workoutName}
        onChange={(e) => setWorkoutName(e.target.value)}
      />

      {/* Haupt-Komponente zur Verwaltung der Übungsblöcke, Sätze und des Drag-&-Drop-Reorderings */}
      <WorkoutExercises
        workoutList={workoutList}
        onUpdate={(key, setIndex, field, value) => {
          const numericValue = Number(value);
          if (!isNaN(numericValue)) {
            updateExerciseInWorkout(key, setIndex, field, numericValue);
          }
        }}
        onReorderWorkoutList={reorderWorkoutList}
        onRemove={removeExerciseFromWorkout}
        onAddSet={handleAddSet}
        onRemoveSet={handleRemoveSet}
      />

      {/* Aktionsleiste am unteren Bildschirmrand */}
      <div className={stylesButton.buttonContainer}>
        <ReturnButton
          onBack={handleBack}
          className={`${stylesButton.button}, ${stylesButton.left}`}
        />
        {/* Aktiviert den Auswahl-Modus (isSelecting = true) */}
        <AddButton onAdd={() => setIsSelecting(true)} />
        <ConfirmButton
          onConfirm={handleCreateWorkout}
          className={`${stylesButton.button}, ${stylesButton.right}`}
        />
      </div>
    </>
  );
}
