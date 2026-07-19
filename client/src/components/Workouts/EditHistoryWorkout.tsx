// src/components/Workouts/EditHistoryWorkout.tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useNotification } from "../../hooks/useNotification";
import { apiService } from "../../services/apiService";
import { Exercise } from "../../types/exercises";
import { CompletedWorkout, WorkoutExercises } from "../../types/workouts";
import SharedWorkoutEditor from "./SharedWorkoutEditor";
import { getApiErrorMessage } from "../../util/errorHelper";

// ==========================================
// Hauptkomponente: EditHistoryWorkout
// ==========================================

/**
 * EditHistoryWorkout
 *
 * Diese Komponente dient dazu, ein bereits in der Vergangenheit absolviertes
 * Workout (aus dem Verlauf/History) nachträglich zu bearbeiten.
 * Sie lädt die spezifischen Workout-Daten anhand der URL-ID, holt parallel
 * alle verfügbaren Übungen für den Editor und reicht diese an den
 * `SharedWorkoutEditor` weiter.
 */
export default function EditHistoryWorkout() {
  // Extrahiert die History-ID direkt aus der URL (z.B. /history/edit/123)
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  // --- State-Management ---
  const [completedWorkout, setCompletedWorkout] =
    useState<CompletedWorkout | null>(null);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Lädt die Master-Liste aller verfügbaren Übungen.
   * Wird benötigt, damit der User im Editor neue Übungen zum alten Workout hinzufügen kann.
   */
  useEffect(() => {
    try {
      const fetchAllExercises = async () => {
        const response = await apiService.getExercises();
        setAllExercises(response.data);
      };
      fetchAllExercises();
    } catch (error) {
      showNotification(
        getApiErrorMessage(error, "Fehler beim Abrufen der Übungen"),
        "error",
        3000,
      );
    }
  }, []);

  /**
   * Lädt die spezifischen Daten des abgeschlossenen Workouts anhand der URL-ID.
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
  }, [id]);

  /**
   * handleSave
   * Wird vom `SharedWorkoutEditor` aufgerufen, wenn der Nutzer auf "Speichern" klickt.
   * Führt die geänderten Daten (Titel und Sätze/Übungen) mit den unveränderlichen
   * Historien-Daten (wie Dauer oder Startzeit) zusammen und sendet sie an die API.
   *
   * @param title Der (potenziell) geänderte Name des Workouts
   * @param exercises Die aktualisierte Liste der Übungen und Sätze
   */
  const handleSave = async (title: string, exercises: WorkoutExercises[]) => {
    try {
      if (!id || !completedWorkout) return;

      // Merge: Bestehende Daten behalten (Dauer, Start-/Endzeit), aber Titel und Übungen überschreiben
      const updatedWorkout = {
        ...completedWorkout,
        title,
        exercises,
      };

      const response = await apiService.putCompletedWorkout(updatedWorkout);

      // Zeigt Erfolgsmeldung; Navigation zurück zur Historie erfolgt über onClose des Popups
      if (response.status === "success") {
        showNotification("Verlauf erfolgreich aktualisiert!", "success");
        navigate("/history"); // Direkt zurück zur Historie navigieren
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
        Erstellen von Plänen als auch für das Editieren von Historien-Einträgen genutzt wird.
      */}
      <SharedWorkoutEditor
        initialTitle={completedWorkout.planTitle}
        initialExercises={completedWorkout.exercises}
        allExercises={allExercises}
        onSave={handleSave}
        // Wenn der Nutzer abbricht, geht es direkt zurück zur Verlauf-Seite
        onCancel={() => navigate("/history")}
      />
    </>
  );
}
