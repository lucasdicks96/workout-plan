import { isAxiosError } from "axios";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useSetTitle } from "../../hooks/useSetTitle";
import { apiService } from "../../services/apiService";
import styles from "../../styles/Exercises.module.css";
import stylesButton from "../../styles/Button.module.css";
import { CompletedWorkout } from "../../types/workouts";
import EditButton from "../Buttons/EditButton";

/**
 * Hauptkomponente: History
 *
 * Diese Seite zeigt eine chronologische Liste aller vom Benutzer absolvierten Workouts an.
 * Sie lädt die Daten beim Mounten über den apiService und behandelt potenzielle
 * Netzwerkfehler spezifisch für Axios oder allgemeine Serverfehler.
 */
export default function History() {
  // State für die Liste der abgeschlossenen Workouts
  const [workouts, setWorkouts] = useState<CompletedWorkout[]>([]);
  const { user } = useAuth();

  // Setzt den Titel im globalen Layout-Context
  useSetTitle("Verlauf");

  /**
   * Lädt die Workout-Historie vom Server.
   * useCallback stellt sicher, dass die Funktion nur neu erstellt wird,
   * wenn sich das User-Objekt ändert.
   */
  const loadWorkout = useCallback(async () => {
    try {
      if (!user) return;
      const response = await apiService.getCompletedWorkouts();

      setWorkouts(response.data);
    } catch (error) {
      // Spezifische Fehlerbehandlung für Axios-Requests
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
        // Fallback für nicht-netzwerkbezogene Fehler
        console.error("Interner Serverfehler");
      }
    }
  }, [user]);

  // Effekt zum initialen Laden der Daten
  useEffect(() => {
    loadWorkout();
  }, [loadWorkout]);

  return (
    <>
      {/* Anzeige eines Platzhalters, falls die Liste leer ist */}
      {!workouts || workouts.length === 0 ? (
        <div>Bisher wurden keine Workouts absolviert</div>
      ) : (
        <div className={styles.exerciseList}>
          {/* Mappen der Workouts auf die HistoryItem-Komponente */}
          {workouts.map((workout) => (
            <HistoryItem key={workout.id} workout={workout} />
          ))}
        </div>
      )}
    </>
  );
}

/**
 * Hilfskomponente: HistoryItem
 *
 * Repräsentiert eine einzelne Karte im Verlauf.
 * Zeigt den Titel des Workouts sowie das formatierte Datum und die Uhrzeit an.
 * Ermöglicht die Navigation zur Bearbeitungsseite des spezifischen Verlaufs-Eintrags.
 *
 * @param workout Das Objekt des abgeschlossenen Workouts
 */
const HistoryItem = ({ workout }: { workout: CompletedWorkout }) => {
  const navigate = useNavigate();

  // Konvertierung des ISO-Zeitstempels in ein JavaScript Date-Objekt
  const date = new Date(workout.startTime);

  return (
    <div className={styles.card}>
      <h3 className={styles.workoutCardTitle}>{workout.title}</h3>

      {/* Anzeige von lokalisiertem Datum und Uhrzeit */}
      <div className={styles.historyDate}>
        {date.toLocaleDateString()} -{" "}
        {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </div>

      {/* Navigiert zum Editor für diesen spezifischen Historien-Eintrag */}
      <EditButton
        onEdit={() => navigate(`/history/edit/${workout.id}`)}
        className={`${stylesButton} ${stylesButton.buttonRounded}`}
      />
    </div>
  );
};
