import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSetTitle } from "../../hooks/useSetTitle";
import { apiService } from "../../services/apiService";
import styles from "../../styles/Exercises.module.css";
import stylesButton from "../../styles/Button.module.css";
import { Workout as IWorkout } from "../../types/workouts";
import AddButton from "../Buttons/AddButton";
import DeleteButton from "../Buttons/DeleteButton";
import EditButton from "../Buttons/EditButton";
import PlayPauseButton from "../Buttons/PlayPauseButton";

/**
 * Hauptkomponente: Workout
 *
 * Diese Komponente dient als Übersicht aller verfügbaren Trainingspläne.
 * Sie lädt die Workouts beim Mounten und bietet Navigationsmöglichkeiten zum
 * Erstellen oder Bearbeiten von Plänen.
 */
export default function Workout() {
  const [workoutList, setWorkoutList] = useState<IWorkout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Setzt den Seitentitel im globalen Layout
  useSetTitle("Trainingspläne");

  /**
   * Lädt alle verfügbaren Workouts vom API-Service.
   * useCallback wird verwendet, um die Referenz stabil zu halten und unnötige
   * Re-Re-renders im useEffect zu vermeiden.
   */
  const loadAllWorkouts = useCallback(async () => {
    try {
      const response = await apiService.getWorkouts();
      setWorkoutList(response.data);
    } catch (error) {
      setWorkoutList([]);
      console.error("Fehler beim Abrufen der Workouts:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllWorkouts();
  }, [loadAllWorkouts]);

  return (
    <>
      <div className={styles["exercise-list"]}>
        <WorkoutList isLoading={isLoading} workoutList={workoutList} />
      </div>

      {/* Aktionsleiste zum Bearbeiten und Hinzufügen von Plänen */}
      <div className={stylesButton["button-container"]}>
        <EditButton
          onEdit={() => navigate("edit-workouts")}
          className={`${stylesButton.left}, ${stylesButton.button}`}
        />
        <AddButton onAdd={() => navigate("create-workouts")} />
      </div>
    </>
  );
}

/**
 * Unterkomponente: WorkoutList
 *
 * Übernimmt das Mapping der Workout-Daten auf einzelne Karten.
 * Behandelt Ladezustände und Leerzustände.
 */
export function WorkoutList({
  isLoading,
  workoutList,
  onClick,
  onDelete,
}: {
  isLoading: boolean;
  workoutList: IWorkout[];
  onClick?: (workoutId: number) => void;
  onDelete?: (workoutId: number) => void;
}) {
  if (isLoading) {
    return <p className={styles["loading-text"]}>Lade Workouts...</p>;
  }

  if (workoutList.length === 0) {
    return <p className={styles["loading-text"]}>Keine Workouts verfügbar.</p>;
  }

  return (
    <>
      {workoutList.map((workout) => (
        <WorkoutCard
          key={workout.id}
          workoutId={workout.id}
          title={workout.title}
          onClick={onClick}
          onDelete={onDelete}
        />
      ))}
    </>
  );
}

/**
 * Unterkomponente: WorkoutCard
 *
 * Repräsentiert einen einzelnen Trainingsplan als Karte.
 * Enthält die Logik für:
 * 1. Anzeige (Titel, Status "In Arbeit")
 * 2. Editier-Modus (Löschen & Bearbeiten)
 * 3. Start-Logik (Prüfung auf bereits laufende Workouts im LocalStorage)
 */
function WorkoutCard({
  title,
  workoutId,
  onClick,
  onDelete,
}: {
  title: string;
  workoutId: number;
  onClick?: (workoutId: number) => void;
  onDelete?: (workoutId: number) => void;
}) {
  const navigate = useNavigate();
  const location = window.location.pathname;

  // Kontext-Variablen für UI-Zustände
  const isEditPage: boolean = location.includes("edit-workouts");
  const isInProgress = localStorage.getItem("workoutInProgressState");
  const startedWorkoutId = localStorage.getItem("startWorkoutId");

  // Konvertierung der ID aus dem Speicher
  const startedId = parseInt(JSON.parse(startedWorkoutId || "null"));

  // State für die Bestätigungsansicht des Löschvorgangs
  const [deleteIsOpen, setDeleteIsOpen] = useState(false);

  /**
   * Behandelt den Start eines Workouts.
   * Prüft, ob bereits ein anderes Workout aktiv ist und bittet ggf. um Bestätigung,
   * um Datenverlust zu vermeiden.
   */
  const onStart = () => {
    // Falls noch gar kein Workout ausgewählt wurde oder kein Fortschritt existiert
    if (!startedWorkoutId || (startedWorkoutId && !isInProgress)) {
      localStorage.setItem("startWorkoutId", JSON.stringify(workoutId));
      navigate("start-workouts");
    }

    // Logik, wenn bereits ein aktiver Fortschritt im Speicher existiert
    if (isInProgress) {
      const progressState = JSON.parse(isInProgress);
      const progressId = parseInt(progressState.startedWorkoutId);

      // Falls die ID des laufenden Workouts von der aktuellen Karte abweicht
      if (progressId !== workoutId) {
        const confirmNew = window.confirm(
          "Es ist bereits ein Workout im Gange. Wenn du ein neues startest, gehen die Daten des aktuellen Workouts verloren. Möchtest du wirklich ein neues Workout starten?",
        );
        if (!confirmNew) {
          return;
        } else {
          // Alten Zustand verwerfen und neues Workout initialisieren
          localStorage.removeItem("workoutInProgressState");
          localStorage.setItem("startWorkoutId", JSON.stringify(workoutId));
          navigate("start-workouts");
        }
      }

      // Falls es dasselbe Workout ist, einfach zur Ausführung navigieren
      if (progressId === startedId) {
        navigate("start-workouts");
        return;
      }
    }
  };

  return (
    <div className={styles.card}>
      <h3 className={styles["workout-card-title"]}>{title}</h3>

      {/* Ansicht für die Bearbeitungsseite */}
      {isEditPage && (
        <div className={stylesButton["button-container-non-relative"]}>
          <DeleteButton
            isOpen={deleteIsOpen}
            onDelete={() => {
              onDelete?.(workoutId);
              setDeleteIsOpen(false);
            }}
            onToggleVisibility={setDeleteIsOpen}
            className={`${stylesButton["button-rounded"]}`}
          />

          {!deleteIsOpen && (
            <EditButton
              onEdit={() => onClick?.(workoutId)}
              className={`${stylesButton["button-rounded"]}, ${stylesButton["left"]}`}
            />
          )}
        </div>
      )}

      {/* Statusanzeige: Wenn dieses spezielle Workout aktuell aktiv ist */}
      {!isEditPage && isInProgress && workoutId === startedId && (
        <span className={styles["in-progress-badge"]}>In Arbeit</span>
      )}

      {/* Play-Button zum Starten/Fortsetzen (nur auf der Hauptübersicht) */}
      {!isEditPage && (
        <PlayPauseButton
          onStart={onStart}
          className={`${stylesButton["button-rounded"]} ${stylesButton["start-button"]}`}
        />
      )}
    </div>
  );
}
