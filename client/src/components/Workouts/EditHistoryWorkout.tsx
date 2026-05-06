// src/components/Workouts/EditHistoryWorkout.tsx
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiService } from "../../services/apiService";
import { Exercise } from "../../types/exercises";
import { CompletedWorkout, WorkoutExercises } from "../../types/workouts";
import Popup, { PopupRef } from "../Popup";
import SharedWorkoutEditor from "./SharedWorkoutEditor";

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
  const popupRef = useRef<PopupRef>(null);

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
    const fetchAllExercises = async () => {
      const response = await apiService.getExercises();
      setAllExercises(response.data);
    };
    fetchAllExercises();
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

      await apiService.putCompletedWorkout(updatedWorkout);

      // Zeigt Erfolgsmeldung; Navigation zurück zur Historie erfolgt über onClose des Popups
      popupRef.current?.show("Verlauf erfolgreich aktualisiert!");
    } catch (error) {
      popupRef.current?.show("Fehler beim Aktualisieren");
    }
  };

  // --- Render-Bedingungen ---

  if (isLoading) return <p>Lade Workout-Daten...</p>;
  if (!completedWorkout) return <p>Workout nicht gefunden.</p>;

  // --- Haupt-Render ---

  return (
    <>
      <Popup
        ref={popupRef}
        duration={1500}
        // WICHTIG: Sobald das Erfolgs-Popup schließt, leiten wir den User zurück zur Übersicht
        onClose={() => navigate("/history")}
        showBackdrop={true}
      />

      {/* 
        Der SharedWorkoutEditor ist eine generische Komponente, die sowohl für das 
        Erstellen von Plänen als auch für das Editieren von Historien-Einträgen genutzt wird.
      */}
      <SharedWorkoutEditor
        initialTitle={completedWorkout.title}
        initialExercises={completedWorkout.exercises}
        allExercises={allExercises}
        onSave={handleSave}
        // Wenn der Nutzer abbricht, geht es direkt zurück zur Verlauf-Seite
        onCancel={() => navigate("/history")}
      />
    </>
  );
}
