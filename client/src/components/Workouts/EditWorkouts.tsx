import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSetTitle } from "../../hooks/useSetTitle";
import { apiService } from "../../services/apiService";
import stylesButton from "../../styles/Button.module.css";
import styles from "../../styles/Exercises.module.css";
import { Exercise } from "../../types/exercises";
import {
  Workout,
  WorkoutExercises as WorkoutExercisesType,
} from "../../types/workouts";
import ReturnButton from "../Buttons/ReturnButton";
import Popup, { PopupRef } from "../Popup";
import SharedWorkoutEditor from "./SharedWorkoutEditor";
import { WorkoutList as WorkoutPlans } from "./Workouts";

// ==========================================
// Hauptkomponente: EditWorkouts
// ==========================================

/**
 * EditWorkouts
 *
 * Diese Komponente verwaltet das Bearbeiten und Löschen von Trainingsplänen.
 * Sie besitzt zwei visuelle Hauptzustände:
 * 1. Listenansicht: Zeigt alle verfügbaren Pläne an (Auswählen oder Löschen).
 * 2. Editor-Ansicht: Zeigt den `SharedWorkoutEditor` für den ausgewählten Plan an.
 */
export default function EditWorkouts() {
  // --- Routing & Globale Hooks ---
  const navigate = useNavigate();
  useSetTitle("Trainingspläne bearbeiten");

  // --- Refs ---
  const popupRef = useRef<PopupRef>(null);

  // --- State-Management ---
  // Daten für die Listenansicht
  const [workoutPlans, setWorkoutPlans] = useState<Workout[]>([]);

  // Stammdaten: Alle existierenden Übungen (werden an den Editor weitergereicht)
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);

  // Steuert, welcher View angezeigt wird. Null = Liste, Nummer = Editor für diese ID
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<number | null>(
    null,
  );

  // Spezifische Daten des aktuell ausgewählten Workouts
  const [workoutExercises, setWorkoutExercises] = useState<
    WorkoutExercisesType[]
  >([]);
  const [workoutName, setWorkoutName] = useState("");

  const [isLoading, setIsLoading] = useState(true);

  // --- Daten laden (Data Fetching) ---

  /**
   * Lädt einmalig beim Mounten der Komponente die Liste aller verfügbaren Übungen.
   * Diese wird später für das Dropdown/die Auswahl im Editor benötigt.
   */
  useEffect(() => {
    const fetchAllExercises = async () => {
      try {
        const response = await apiService.getExercises();
        setAllExercises(response.data);
      } catch (error) {
        console.error("Fehler beim Abrufen aller Übungen:", error);
      }
    };
    fetchAllExercises();
  }, []);

  /**
   * Lädt die Liste aller Trainingspläne des Nutzers.
   * Mit useCallback gewrappt, damit sie als sichere Abhängigkeit im useEffect genutzt
   * und nach einem Speichervorgang manuell wieder aufgerufen werden kann.
   */
  const loadAllWorkouts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiService.getWorkouts();
      setWorkoutPlans(response.data);
    } catch (error) {
      console.error("Fehler beim Abrufen der Workouts:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initiales Laden der Trainingspläne
  useEffect(() => {
    loadAllWorkouts();
  }, [loadAllWorkouts]);

  /**
   * Lädt die detaillierten Übungen und den Namen für ein spezifisches Workout.
   * Wird nur aufgerufen, wenn der Nutzer einen Plan aus der Liste anklickt.
   */
  const loadExercises = useCallback(async () => {
    if (selectedWorkoutId === null) return;
    setIsLoading(true);
    try {
      const response = await apiService.getWorkout(selectedWorkoutId);
      setWorkoutExercises(response.data.exercises);
      setWorkoutName(response.data.title);
    } catch (error) {
      console.error("Fehler beim Laden der Workout-Übungen:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedWorkoutId]);

  // Reagiert auf Änderungen der selectedWorkoutId
  useEffect(() => {
    if (selectedWorkoutId !== null) {
      loadExercises();
    } else {
      // Cleanup: Wenn wir zur Liste zurückkehren, leeren wir den Namen des alten Workouts
      setWorkoutName("");
    }
  }, [selectedWorkoutId, loadExercises]);

  // --- Handler-Funktionen ---

  /**
   * Speichert die Änderungen am ausgewählten Trainingsplan in der Datenbank.
   */
  const handleSaveWorkout = async (
    title: string,
    exercises: WorkoutExercisesType[],
  ) => {
    try {
      if (selectedWorkoutId === null) throw new Error();

      const response = await apiService.putWorkout({
        title,
        workoutId: selectedWorkoutId,
        exercises,
      });

      if (response.status === "success") {
        popupRef.current?.show(
          "Trainingsplan erfolgreich gespeichert!",
          "success",
        );
      }
    } catch (error) {
      popupRef.current?.show(
        "Fehler beim Speichern des Trainingsplans",
        "fail",
      );
    }
  };

  /**
   * Setzt die ID des gewählten Plans und leitet damit den Wechsel zum Editor ein.
   */
  const handlePlanSelect = (workoutId: number) => {
    setSelectedWorkoutId(workoutId);
  };

  /**
   * Bricht die Bearbeitung ab und kehrt zur Listenansicht zurück.
   */
  const handleBackToList = () => {
    setSelectedWorkoutId(null);
  };

  /**
   * Wird aufgerufen, wenn das Erfolgs-Popup nach dem Speichern schließt.
   * Lädt die Liste neu (damit Namensänderungen sichtbar werden) und verlässt den Editor.
   */
  const handleClosePopup = () => {
    loadAllWorkouts();
    handleBackToList();
  };

  /**
   * Löscht einen Trainingsplan komplett aus der Datenbank.
   */
  const handleDelete = async (workoutId: number) => {
    try {
      await apiService.deleteWorkout(workoutId);
      popupRef.current?.show("Trainingsplan erfolgreich gelöscht!", "success");
      // Fallback, falls wir gerade den Plan löschen, der evtl. noch im State hing
      setSelectedWorkoutId(null);
    } catch (error) {
      popupRef.current?.show("Fehler beim Löschen des Plans", "fail");
      console.error("Fehler beim Löschen des Plans", error);
    }
  };

  // --- Render ---
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
      }}
    >
      {/* Globales Popup für Erfolgs- und Fehlermeldungen */}
      <Popup
        ref={popupRef}
        duration={1500}
        onClose={handleClosePopup}
        showBackdrop={true}
      />

      {/* Bedingtes Rendern: Editor-Ansicht ODER Listen-Ansicht */}
      {selectedWorkoutId ? (
        /* --- ANSICHT 1: Der Editor (wird nur gezeigt, wenn Daten fertig geladen sind) --- */
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
        /* --- ANSICHT 2: Die Listenübersicht --- */
        <>
          <div className={styles.exerciseList}>
            {/* WorkoutPlans rendert die Karten für jeden vorhandenen Plan */}
            <WorkoutPlans
              isLoading={isLoading}
              workoutList={workoutPlans}
              onClick={handlePlanSelect} // Klick auf die Karte -> Öffne Editor
              onDelete={handleDelete} // Klick auf Löschen -> API Delete
            />
          </div>

          <div className={stylesButton.buttonContainerNonRelative}>
            {/* Button verlässt die "Bearbeiten"-Ansicht komplett und geht zurück zum Hub */}
            <ReturnButton
              onBack={() => navigate("/workouts")}
              className={`${stylesButton.button}`}
            />
          </div>
        </>
      )}
    </div>
  );
}
