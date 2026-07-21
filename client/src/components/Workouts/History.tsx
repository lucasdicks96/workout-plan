import { isAxiosError } from "axios";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useSetTitle } from "../../hooks/useSetTitle";
import { apiService } from "../../services/apiService";
import styles from "../../styles/Exercises.module.css";
import stylesButton from "../../styles/Button.module.css";
import { CompletedWorkout } from "../../schemas/workout.schema";
import EditButton from "../Buttons/EditButton";

/**
 * Die Eigenschaften (Props) für die HistoryItem-Komponente.
 *
 * @property {CompletedWorkout} workout - Das vollständige Objekt des absolvierten Workouts.
 */
export interface HistoryItemProps {
  workout: CompletedWorkout;
}

/**
 * Hauptkomponente: History
 *
 * Diese Seite zeigt eine chronologische Übersicht aller vom Benutzer erfolgreich absolvierten Workouts an.
 * Sie lädt die Verlaufsdaten beim Mounten über den `apiService` und behandelt potenzielle
 * Netzwerk- oder Serverfehler spezifisch über Axios-Fehlerprüfungen.
 *
 * @returns {JSX.Element} Die gerenderte Historien-Liste oder einen leeren Platzhalter-Hinweis.
 */
export default function History() {
  const [workouts, setWorkouts] = useState<CompletedWorkout[]>([]);
  const { user } = useAuth();

  // Setzt den Seitentitel im globalen Layout-Context
  useSetTitle("Trainingshistorie");

  /**
   * Lädt die Workout-Historie asynchron vom Server, sofern ein authentifizierter Nutzer vorliegt.
   * Fängt Fehler ab und unterscheidet dabei zwischen Axios-spezifischen Fehlermeldungen 
   * und allgemeinen Serverausfällen.
   *
   * @async
   * @returns {Promise<void>}
   */
  const loadWorkout = useCallback(async () => {
    try {
      if (!user) return;
      const response = await apiService.getCompletedWorkouts();

      setWorkouts(response.data);
    } catch (error) {
      // Spezifische Fehlerbehandlung für Axios-Anfragen
      if (isAxiosError(error)) {
        if (
          error.response &&
          error.response.data &&
          error.response.data.message
        ) {
          console.error(error.response.data.message);
        } else {
          console.error("Fehler beim Laden der Workouts");
        }
      } else {
        // Fallback für nicht-netzwerkbezogene oder unerwartete Fehler
        console.error("Interner Serverfehler");
      }
    }
  }, [user]);

  // Effekt zum initialen Laden der Verlaufsdaten beim Mounten oder Benutzerwechsel
  useEffect(() => {
    loadWorkout();
  }, [loadWorkout]);

  return (
    <>
      {/* Anzeige eines Platzhalters, falls noch keine Workouts absolviert wurden */}
      {!workouts || workouts.length === 0 ? (
        <div>Bisher wurden keine Workouts absolviert</div>
      ) : (
        <div className={styles["exercise-list"]}>
          {/* Mappen der abgeschlossenen Workouts auf einzelne HistoryItem-Karten */}
          {workouts.map((workout) => (
            <HistoryItem key={workout.id} workout={workout} />
          ))}
        </div>
      )}
    </>
  );
}

/**
 * Unterkomponente: HistoryItem
 *
 * Repräsentiert eine einzelne Karte im Trainingsverlauf.
 * Zeigt den Titel des abgeschlossenen Workouts sowie das lokalisierte Startdatum und die Uhrzeit an.
 * Bietet einen Bearbeitungs-Button, der zur Detailansicht/Korrektur dieses spezifischen Eintrags navigiert.
 *
 * @param {HistoryItemProps} props - Die Eigenschaften der Komponente.
 * @returns {JSX.Element} Die gerenderte Verlaufskarte.
 */
const HistoryItem = ({ workout }: HistoryItemProps) => {
  const navigate = useNavigate();

  // Konvertierung des ISO-Zeitstempels in ein lesbares JavaScript-Date-Objekt
  const date = new Date(workout.startTime);

  return (
    <div className={styles.card}>
      <h3 className={styles["workout-card-title"]}>{workout.title}</h3>

      {/* Anzeige von lokalisiertem Datum und Uhrzeit */}
      <div className={styles["history-date"]}>
        {date.toLocaleDateString()} -{" "}
        {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </div>

      {/* Navigiert zum Editor für diesen spezifischen Historien-Eintrag */}
      <EditButton
        onEdit={() => navigate(`/history/edit/${workout.id}`)}
        className={`${stylesButton} ${stylesButton["button-rounded"]}`}
      />
    </div>
  );
};