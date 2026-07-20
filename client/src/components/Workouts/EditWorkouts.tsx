import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../../hooks/useNotification";
import { useSetTitle } from "../../hooks/useSetTitle";
import { apiService } from "../../services/apiService";
import stylesButton from "../../styles/Button.module.css";
import styles from "../../styles/Exercises.module.css";
import { Exercise } from "../../schemas/exercise.schema";
import {
  Workout,
  WorkoutExercises as WorkoutExercisesType,
} from "../../schemas/workout.schema";
import ReturnButton from "../Buttons/ReturnButton";
import SharedWorkoutEditor from "./SharedWorkoutEditor";
import { WorkoutList as WorkoutPlans } from "./Workouts";
import { getApiErrorMessage } from "../../util/errorHelper";

// ==========================================
// Hauptkomponente: EditWorkouts
// ==========================================

/**
 * EditWorkouts
 *
 * Verwaltet das Bearbeiten und Löschen von bestehenden Trainingsplänen.
 * Die Komponente schaltet je nach Zustand zwischen zwei Hauptansichten um:
 * 1. **Listenansicht**: Zeigt alle vorhandenen Pläne des Nutzers an, um einen Plan zum Bearbeiten auszuwählen oder direkt zu löschen.
 * 2. **Editor-Ansicht**: Bindet den `SharedWorkoutEditor` ein, um den Titel und die Übungsstruktur des selektierten Plans anzupassen.
 *
 * @returns {JSX.Element} Entweder die Plan-Übersichtsliste oder den aktiven Workout-Editor.
 */
export default function EditWorkouts() {
  // --- Routing & Globale Hooks ---
  const navigate = useNavigate();
  useSetTitle("Trainingspläne bearbeiten");

  const { showNotification } = useNotification();

  // --- State-Management ---
  /** Liste aller geladenen Trainingspläne für die Übersichts-Ansicht. */
  const [workoutPlans, setWorkoutPlans] = useState<Workout[]>([]);

  /** Master-Liste aller im System existierenden Übungen (wird an den Editor für die Auswahl übergeben). */
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);

  /** 
   * Steuert die aktive Ansicht. 
   * `null` = Zeigt die Übersichtsliste. 
   * `number` = Zeigt den Editor für die entsprechende Workout-ID.
   */
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<number | null>(
    null,
  );

  /** Die spezifischen Übungen und Sätze des aktuell im Editor ausgewählten Workouts. */
  const [workoutExercises, setWorkoutExercises] = useState<
    WorkoutExercisesType[]
  >([]);
  /** Der Titel des aktuell im Editor ausgewählten Workouts. */
  const [workoutName, setWorkoutName] = useState("");

  /** Globaler Ladezustand für API-Anfragen. */
  const [isLoading, setIsLoading] = useState(true);

  // --- Daten laden (Data Fetching) ---

  /**
   * Lädt einmalig beim Mounten der Komponente den vollständigen Übungskatalog,
   * der für das Hinzufügen von Übungen im Editor benötigt wird.
   */
  useEffect(() => {
    const fetchAllExercises = async () => {
      try {
        const response = await apiService.getExercises();
        setAllExercises(response.data);
      } catch (error) {
        showNotification(
          getApiErrorMessage(error, "Fehler beim Abrufen der Übungen"),
          "error",
          3000,
        );
        console.error("Fehler beim Abrufen aller Übungen:", error);
      }
    };
    fetchAllExercises();
  }, [showNotification]);

  /**
   * Lädt die Liste aller Trainingspläne des Benutzers vom Server.
   * Mit `useCallback` gewrappt, damit die Funktion als stabile Abhängigkeit in Effects
   * und nach erfolgreichen Speicher- oder Löschvorgängen verwendet werden kann.
   *
   * @async
   * @returns {Promise<void>}
   */
  const loadAllWorkouts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiService.getWorkouts();
      setWorkoutPlans(response.data);
    } catch (error) {
      showNotification(
        getApiErrorMessage(error, "Fehler beim Abrufen der Workouts"),
        "error",
        3000,
      );
      console.error("Fehler beim Abrufen der Workouts:", error);
    } finally {
      setIsLoading(false);
    }
  }, [showNotification]);

  // Initiales Laden der Trainingspläne beim Mounten
  useEffect(() => {
    loadAllWorkouts();
  }, [loadAllWorkouts]);

  /**
   * Lädt die detaillierten Übungsdaten und den Namen für ein spezifisch ausgewähltes Workout.
   * Wird ausgelöst, sobald `selectedWorkoutId` einen gültigen Wert annimmt.
   *
   * @async
   * @returns {Promise<void>}
   */
  const loadExercises = useCallback(async () => {
    if (selectedWorkoutId === null) return;
    setIsLoading(true);
    try {
      const response = await apiService.getWorkout(selectedWorkoutId);
      setWorkoutExercises(response.data.exercises);
      setWorkoutName(response.data.title);
    } catch (error) {
      showNotification(
        getApiErrorMessage(error, "Fehler beim Abrufen der Workout-Übungen"),
        "error",
        3000,
      );
      console.error("Fehler beim Laden der Workout-Übungen:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedWorkoutId, showNotification]);

  // Reagiert auf Änderungen der ausgewählten Workout-ID (Öffnen/Schließen des Editors)
  useEffect(() => {
    if (selectedWorkoutId !== null) {
      loadExercises();
    } else {
      // Cleanup: Setzt den Workout-Namen beim Verlassen des Editors zurück
      setWorkoutName("");
    }
  }, [selectedWorkoutId, loadExercises]);

  // --- Handler-Funktionen ---

  /**
   * Speichert die vorgenommenen Änderungen am aktiven Trainingsplan in der Datenbank.
   * Zeigt bei Erfolg eine Benachrichtigung an und triggert den Schließvorgang.
   *
   * @async
   * @param {string} title - Der aktualisierte Name des Trainingsplans.
   * @param {WorkoutExercisesType[]} exercises - Die aktualisierte Liste der Übungen und Sätze.
   * @returns {Promise<void>}
   */
  const handleSaveWorkout = async (
    title: string,
    exercises: WorkoutExercisesType[],
  ) => {
    try {
      if (selectedWorkoutId === null) throw new Error("Keine Workout-ID vorhanden");

      const response = await apiService.putWorkout({
        title,
        workoutId: selectedWorkoutId,
        exercises,
      });

      if (response.status === "success") {
        showNotification("Trainingsplan erfolgreich gespeichert!", "success");
        handleClosePopup();
      }
    } catch (error) {
      showNotification(
        getApiErrorMessage(error, "Fehler beim Speichern des Trainingsplans"),
        "error",
        3000,
      );
    }
  };

  /**
   * Setzt die ID des ausgewählten Plans und leitet damit den Wechsel zur Editor-Ansicht ein.
   *
   * @param {number} workoutId - Die ID des anzuklickenden Trainingsplans.
   */
  const handlePlanSelect = (workoutId: number) => {
    setSelectedWorkoutId(workoutId);
  };

  /**
   * Bricht die Bearbeitung ab und kehrt zur Übersichtsliste zurück.
   */
  const handleBackToList = () => {
    setSelectedWorkoutId(null);
  };

  /**
   * Cleanup nach erfolgreichem Speichern oder Löschen:
   * Lädt die Plan-Liste neu (damit Änderungen sofort sichtbar sind) und springt zurück zur Übersicht.
   */
  const handleClosePopup = () => {
    loadAllWorkouts();
    handleBackToList();
  };

  /**
   * Löscht einen Trainingsplan unwiderruflich aus der Datenbank.
   * Setzt den Selektions-State zurück und aktualisiert die Ansicht.
   *
   * @async
   * @param {number} workoutId - Die ID des zu löschenden Trainingsplans.
   * @returns {Promise<void>}
   */
  const handleDelete = async (workoutId: number) => {
    try {
      await apiService.deleteWorkout(workoutId);
      showNotification("Trainingsplan erfolgreich gelöscht!", "success");
      setSelectedWorkoutId(null);
      handleClosePopup();
    } catch (error) {
      showNotification(
        getApiErrorMessage(error, "Fehler beim Löschen des Plans"),
        "error",
        3000,
      );
      handleClosePopup();
    }
  };

  // --- Render ---
  return (
    <>
      {/* Bedingtes Rendern: Editor-Ansicht ODER Listen-Übersichtsansicht */}
      {selectedWorkoutId ? (
        /* --- ANSICHT 1: Der Editor (wird erst gerendert, wenn die Daten fertig geladen sind) --- */
        !isLoading && (
          <SharedWorkoutEditor
            initialTitle={workoutName}
            initialExercises={workoutExercises}
            allExercises={allExercises}
            onSave={handleSaveWorkout}
            onCancel={handleBackToList}
          />
        )
      ) : (
        /* --- ANSICHT 2: Die Listen-Übersicht --- */
        <>
          <div className={styles["exercise-list"]}>
            {/* WorkoutPlans rendert die kartenbasierte Liste aller vorhandenen Pläne */}
            <WorkoutPlans
              isLoading={isLoading}
              workoutList={workoutPlans}
              onClick={handlePlanSelect} // Klick auf die Karte -> Öffnet den Editor
              onDelete={handleDelete} // Klick auf Löschen -> Startet den API-Löschvorgang
            />
          </div>

          <div className={stylesButton["button-container-non-relative"]}>
            {/* Button verlässt den Bearbeitungs-Modus komplett und kehrt zum Haupt-Hub zurück */}
            <ReturnButton
              onBack={() => navigate("/workouts")}
              className={`${stylesButton.button}`}
            />
          </div>
        </>
      )}
    </>
  );
}