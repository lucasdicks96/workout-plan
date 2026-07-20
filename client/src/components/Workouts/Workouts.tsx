import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSetTitle } from "../../hooks/useSetTitle";
import { apiService } from "../../services/apiService";
import styles from "../../styles/Exercises.module.css";
import stylesButton from "../../styles/Button.module.css";
import { Workout as IWorkout } from "../../schemas/workout.schema";
import AddButton from "../Buttons/AddButton";
import DeleteButton from "../Buttons/DeleteButton";
import EditButton from "../Buttons/EditButton";
import PlayPauseButton from "../Buttons/PlayPauseButton";

/**
 * Die Eigenschaften (Props) für die WorkoutList-Komponente.
 *
 * @property {boolean} isLoading - Gibt an, ob die Trainingspläne aktuell von der API geladen werden.
 * @property {IWorkout[]} workoutList - Array der darzustellenden Trainingspläne.
 * @property {(workoutId: number) => void} [onClick] - Optionale Callback-Funktion, die beim Klick auf Bearbeiten/Auswählen eines Planners aufgerufen wird.
 * @property {(workoutId: number) => void} [onDelete] - Optionale Callback-Funktion zum Löschen eines Trainingsplans.
 */
export interface WorkoutListProps {
  isLoading: boolean;
  workoutList: IWorkout[];
  onClick?: (workoutId: number) => void;
  onDelete?: (workoutId: number) => void;
}

/**
 * Die Eigenschaften (Props) für die WorkoutCard-Komponente.
 *
 * @property {string} title - Der Name des Trainingsplans (z. B. "Push Day" oder "Ganzkörper").
 * @property {number} workoutId - Die eindeutige Datenbank-ID des Trainingsplans.
 * @property {(workoutId: number) => void} [onClick] - Optionale Callback-Funktion, die beim Klick auf den Bearbeiten-Button ausgeführt wird.
 * @property {(workoutId: number) => void} [onDelete] - Optionale Callback-Funktion, die nach Bestätigung des Löschvorgangs ausgeführt wird.
 */
export interface WorkoutCardProps {
  title: string;
  workoutId: number;
  onClick?: (workoutId: number) => void;
  onDelete?: (workoutId: number) => void;
}

/**
 * Hauptkomponente: Workout
 *
 * Dient als zentrale Dashboard-Übersicht aller verfügbaren Trainingspläne des Nutzers.
 * Versteuert das initiale Laden der Daten von der API und bietet globale Navigations-Buttons
 * zum Erstellen neuer Pläne sowie zum Wechseln in den Bearbeitungsmodus.
 *
 * @returns {JSX.Element} Die gerenderte Trainingsplan-Übersicht mit Aktionsleiste.
 */
export default function Workout() {
  const [workoutList, setWorkoutList] = useState<IWorkout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Setzt den Seitentitel im globalen Layout
  useSetTitle("Trainingspläne");

  /**
   * Lädt alle verfügbaren Workouts asynchron über den API-Service.
   * Das Ergebnis wird im State abgelegt; bei Fehlern wird eine leere Liste gefallbackt.
   *
   * @async
   * @returns {Promise<void>}
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
 * Übernimmt das Mapping der geladenen Workout-Daten auf einzelne Karten-Komponenten (`WorkoutCard`).
 * Handhabt automatische UI-Fallbacks für den Ladezustand sowie für eine leere Trainingsplanliste.
 *
 * @param {WorkoutListProps} props - Die Eigenschaften der Komponente.
 * @returns {JSX.Element} Die Liste der Workout-Karten oder ein entsprechender Status-Hinweis.
 */
export function WorkoutList({
  isLoading,
  workoutList,
  onClick,
  onDelete,
}: WorkoutListProps) {
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
 * Repräsentiert eine einzelne Übung als interaktive Karte im Grid/List-Layout.
 * Passt ihr Verhalten und ihre Buttons dynamisch an die aktuelle Seiten-Route an:
 * - Auf der Standard-Übersicht: Zeigt einen Play-Button zum Starten des Trainings und ein "In Arbeit"-Badge.
 * - Auf der Editier-Seite: Zeigt Buttons zum Bearbeiten der Struktur oder zum Löschen des Plans.
 *
 * @param {WorkoutCardProps} props - Die Eigenschaften der Komponente.
 * @returns {JSX.Element} Die gerenderte Workout-Karte.
 */
function WorkoutCard({
  title,
  workoutId,
  onClick,
  onDelete,
}: WorkoutCardProps) {
  const navigate = useNavigate();
  const location = useLocation();

  // Kontext-Variables für UI-Zustände je nach aktueller Route
  const isEditPage: boolean = location.pathname.includes("edit-workouts");
  const isInProgress = localStorage.getItem("workoutInProgressState");
  const startedWorkoutId = localStorage.getItem("startWorkoutId");

  /**
   * Typsicheres Parsen der ID des aktuell laufenden Trainings aus dem LocalStorage.
   * Verhindert `NaN`-Fehler, falls der Schlüssel nicht existiert oder `null` ist.
   */
  const startedId = startedWorkoutId
    ? Number(JSON.parse(startedWorkoutId))
    : null;

  // State für das Aufklappen der Inline-Löschbestätigung
  const [deleteIsOpen, setDeleteIsOpen] = useState(false);

  /**
   * Behandelt den Start- oder Fortsetzungs-Klick für diesen Trainingsplan:
   * - Fall 1 (Kein aktives Training): Initialisiert die ID im Speicher und navigiert zur Live-Ansicht.
   * - Fall 2 (Anderes Training aktiv): Warnt den Nutzer vor Datenverlust durch ein `window.confirm`.
   *   Bei Bestätigung wird das alte Training überschrieben und das neue gestartet.
   * - Fall 3 (Dieses Training aktiv): Navigiert direkt zur Ausführung, um nahtlos weiterzutrainieren.
   */
  const onStart = () => {
    // Falls noch gar kein Workout ausgewählt wurde oder kein Live-Fortschritt existiert
    if (!startedWorkoutId || (startedWorkoutId && !isInProgress)) {
      localStorage.setItem("startWorkoutId", JSON.stringify(workoutId));
      navigate("start-workouts");
      return;
    }

    // Logik, wenn bereits ein aktiver Fortschritt im Speicher existiert
    if (isInProgress) {
      try {
        const progressState = JSON.parse(isInProgress);
        const progressId = Number(progressState.startedWorkoutId);

        // Falls die ID des laufenden Workouts von der geklickten Karte abweicht
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

        // Falls es dasselbe Workout ist, einfach direkt zur Ausführung navigieren
        if (progressId === startedId) {
          navigate("start-workouts");
          return;
        }
      } catch (error) {
        console.error("Fehler beim Prüfen des laufenden Workouts:", error);
        // Fallback bei beschädigtem JSON im Speicher: Neu starten
        localStorage.setItem("startWorkoutId", JSON.stringify(workoutId));
        navigate("start-workouts");
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

      {/* Statusanzeige: Wenn genau dieser Trainingsplan aktuell in Ausführung ist */}
      {!isEditPage && isInProgress && workoutId === startedId && (
        <span className={styles["in-progress-badge"]}>In Arbeit</span>
      )}

      {/* Play-Button zum Starten/Fortsetzen (nur auf der Hauptübersicht sichtbar) */}
      {!isEditPage && (
        <PlayPauseButton
          onStart={onStart}
          className={`${stylesButton["button-rounded"]} ${stylesButton["start-button"]}`}
        />
      )}
    </div>
  );
}