import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSetTitle } from "../../hooks/useSetTitle";
import { apiService } from "../../services/apiService";
import { Exercise } from "../../schemas/exercise.schema";
import { ExerciseList } from "./Exercises";
import ReturnButton from "../Buttons/ReturnButton";

// ==========================================
// Hauptkomponente: EditExercise
// ==========================================

/**
 * EditExercise
 *
 * Verwaltet die Ansicht zur Auswahl und Bearbeitung von **benutzerspezifisch erstellten** Übungen.
 * 
 * Kernfunktionen:
 * - Lädt asynchron alle vom aktuellen Benutzer angelegten Übungen über `apiService.getUserExercises()`.
 * - Bindet die wiederverwendbare `ExerciseList`-Komponente ein, um die Übungen im Grid-Layout anzuzeigen 
 *   und das Bearbeitungs-Modal beim Klick auf eine Übung zu triggern.
 * - Setzt den Seitentitel im Header auf "Übung bearbeiten".
 * - Bietet eine Fallback-Ansicht, falls keine eigenen Übungen gefunden wurden, sowie einen Zurück-Button.
 *
 * @returns {JSX.Element} Entweder die Liste der eigenen Übungen mit Bearbeitungsoption oder einen leeren Hinweis-Text.
 */
export default function EditExercise() {
  /** Die Liste der vom Benutzer selbst erstellten Übungen. */
  const [userExercisesList, setUserExercisesList] = useState<Exercise[]>([]);
  /** Globaler Ladezustand für das Abrufen der Benutzer-Übungen. */
  const [isLoading, setIsLoading] = useState(true);
  
  const navigate = useNavigate();

  // Setzt den globalen Seitentitel im Header (via TitleContext)
  useSetTitle("Übung bearbeiten");

  /**
   * Lädt die benutzerspezifischen Übungen asynchron vom Server.
   * Aktualisiert den `userExercisesList`-State bei Erfolg oder fängt Fehler kontrolliert ab.
   * Beendet den Ladezustand im `finally`-Block.
   *
   * @async
   * @returns {Promise<void>}
   */
  const fetchUserExercises = useCallback(async () => {
    try {
      const response = await apiService.getUserExercises();

      if (response.status === "success") {
        setUserExercisesList(response.data);
      } else {
        setUserExercisesList([]);
      }
    } catch (error) {
      console.error("Error fetching user exercises:", error);
      setUserExercisesList([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initiales Laden der Benutzer-Übungen beim Mounten der Komponente
  useEffect(() => {
    fetchUserExercises();
  }, [fetchUserExercises]);

  // Fallback-Ansicht, falls der Benutzer noch keine eigenen Übungen erstellt hat
  if (!userExercisesList || userExercisesList.length === 0) {
    return (
      <>
        <p>Keine Übungen gefunden</p>
        <div className="button-container">
          <ReturnButton onBack={() => navigate("/exercises")} />
        </div>
      </>
    );
  }

  return (
    <>
      {/* 
        Verwendet die wiederverwendbare ExerciseList. 
        onUpdateSuccess triggert ein automatisches Refetching der Daten nach erfolgreichen Modal-Änderungen.
      */}
      <ExerciseList
        exerciseList={userExercisesList}
        isLoading={isLoading}
        onUpdateSuccess={fetchUserExercises}
      />
      <div className="button-container">
        <ReturnButton onBack={() => navigate("/exercises")} />
      </div>
    </>
  );
}