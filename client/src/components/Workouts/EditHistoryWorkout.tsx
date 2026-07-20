// src/components/Workouts/EditHistoryWorkout.tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useNotification } from "../../hooks/useNotification";
import { apiService } from "../../services/apiService";
import { Exercise } from "../../schemas/exercise.schema";
import {
  CompletedWorkout,
  WorkoutExercises,
} from "../../schemas/workout.schema";
import SharedWorkoutEditor from "./SharedWorkoutEditor";
import { getApiErrorMessage } from "../../util/errorHelper";

// ==========================================
// Hauptkomponente: EditHistoryWorkout
// ==========================================

/**
 * EditHistoryWorkout
 *
 * Diese Komponente ermöglicht die nachträgliche Bearbeitung eines bereits in der 
 * Vergangenheit absolvierten Workouts (aus dem Trainingsverlauf bzw. der Historie).
 * 
 * Sie steuert den gesamten Datenfluss für diesen Bereich:
 * - Extrahiert die eindeutige Historien-ID aus den URL-Parametern (`useParams`).
 * - Lädt asynchron die spezifischen Daten des abgeschlossenen Workouts.
 * - Lädt parallel den vollständigen Übungskatalog (`allExercises`), damit der Nutzer 
 *   dem alten Verlauf bei Bedarf neue Übungen hinzufügen kann.
 * - Übergibt alle Daten an den modularen `SharedWorkoutEditor` und verarbeitet das Abspeichern.
 *
 * @returns {JSX.Element} Entweder einen Ladehinweis, eine Fehlermeldung oder den aktiven Workout-Editor.
 */
export default function EditHistoryWorkout() {
  // Extrahiert die History-ID direkt aus der URL (z. B. /history/edit/123)
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  // --- State-Management ---
  /** Das geladene, abgeschlossene Workout, das aktuell bearbeitet wird. */
  const [completedWorkout, setCompletedWorkout] =
    useState<CompletedWorkout | null>(null);
  /** Die Master-Liste aller im System existierenden Übungen (für den Editor-Auswahlmodus). */
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  /** Globaler Ladezustand für die asynchronen Datenabfragen. */
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Lädt die Master-Liste aller verfügbaren Übungen einmalig beim Mounten.
   * Fehler werden direkt abgefangen und über das Notification-System ausgegeben.
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
      }
    };
    fetchAllExercises();
  }, [showNotification]);

  /**
   * Lädt die spezifischen Daten des abgeschlossenen Workouts anhand der URL-ID.
   * Beendet den Ladezustand im `finally`-Block unabhängig von Erfolg oder Fehler.
   */
  useEffect(() => {
    const fetchCompletedWorkout = async () => {
      if (!id) return;
      try {
        const response = await apiService.getCompletedWorkout(id);
        setCompletedWorkout(response.data);
      } catch (error) {
        console.error("Fehler beim Laden des Verlaufs:", error);
        showNotification(
          getApiErrorMessage(error, "Fehler beim Abrufen der Historie"),
          "error",
          3000,
        );
      } finally {
        // Ladezustand wird unabhängig von Erfolg oder Fehler beendet
        setIsLoading(false);
      }
    };
    fetchCompletedWorkout();
  }, [id, showNotification]);

  /**
   * Verarbeitet den Speicher-Vorgang aus dem `SharedWorkoutEditor`:
   * Führt die modifizierten Daten (Titel und Übungsstruktur/Sätze) mit den 
   * unveränderlichen Metadaten des Verlaufs (wie Dauer, Start- und Endzeit) 
   * zusammen und überträgt das aktualisierte Objekt an die API.
   *
   * @async
   * @param {string} title - Der (potenziell) geänderte Name des Workouts.
   * @param {WorkoutExercises[]} exercises - Die aktualisierte Liste der Übungen und Sätze.
   * @returns {Promise<void>}
   */
  const handleSave = async (title: string, exercises: WorkoutExercises[]) => {
    try {
      if (!id || !completedWorkout) return;

      // Merge: Bestehende Historien-Metadaten behalten, aber Titel und Übungen aktualisieren
      const updatedWorkout: CompletedWorkout = {
        ...completedWorkout,
        title,
        exercises,
      };

      const response = await apiService.putCompletedWorkout(updatedWorkout);

      // Zeigt Erfolgsmeldung und navigiert direkt zurück zur Verlauf-Übersicht
      if (response.status === "success") {
        showNotification("Verlauf erfolgreich aktualisiert!", "success");
        navigate("/history");
      }
    } catch (error) {
      showNotification(
        getApiErrorMessage(error, "Fehler beim Aktualisieren"),
        "error",
        3000,
      );
    }
  };

  // --- Render-Bedingungen ---

  if (isLoading) return <p>Lade Workout-Daten...</p>;
  if (!completedWorkout) return <p>Workout nicht gefunden.</p>;

  // --- Haupt-Render ---

  return (
    <>
      {/* 
        Der SharedWorkoutEditor ist eine generische Komponente, die sowohl für das 
        Erstellen neuer Pläne als auch für das Editieren von Historien-Einträgen genutzt wird.
      */}
      <SharedWorkoutEditor
        initialTitle={completedWorkout.title}
        initialExercises={completedWorkout.exercises}
        allExercises={allExercises}
        onSave={handleSave}
        onCancel={() => navigate("/history")}
      />
    </>
  );
}