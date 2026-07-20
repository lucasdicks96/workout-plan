import { memo } from "react";
import styles from "../../styles/Exercises.module.css";
import stylesModal from "../../styles/Modal.module.css";
import SearchInput from "../SearchInput";
import CategoryDropDown from "../CategoryDropDown";
import { useExercises } from "../../hooks/useExercises";
import { Exercise } from "../../schemas/exercise.schema";
import { WorkoutExercises } from "../../schemas/workout.schema";
import { useSetTitle } from "../../hooks/useSetTitle";

/**
 * Die Eigenschaften (Props) für die ExerciseSelectionList-Komponente.
 */
export type ExerciseSelectionListProps = {
  /** Optionale Master-Liste aller verfügbaren Übungen (wird primär über den useExercises-Hook verwaltet). */
  allExercises?: Exercise[];
  /** Die Liste der bereits im aktuellen Workout vorhandenen Übungen (wird zur Duplikatsprüfung genutzt). */
  workoutList: WorkoutExercises[];
  /** Callback-Funktion, die beim Auswählen einer Übung ausgelöst wird. */
  onSelectExercise: (exercise: Exercise) => void;
  /** Callback-Funktion für den Zurück-Button (verlässt den Auswahl-Modus). */
  onBack: () => void;
};

/**
 * ExerciseSelectionList
 *
 * Eine interaktive Auswahlliste, die den globalen Übungskatalog anzeigt,
 * damit der Benutzer Übungen zu einem Trainingsplan hinzufügen kann.
 *
 * Bietet folgende Kernfunktionen:
 * - Dynamische Filterung über Suchbegriff (`SearchInput`) und Kategorie-Filter (`CategoryDropDown`) via `useExercises`-Hook.
 * - Visuelle Erkennung und Deaktivierung von Übungen, die sich bereits im aktuellen Workout befinden (`exercisesInWorkout`).
 * - Setzt den globalen Seitentitel automatisch auf "Wähle eine Übung aus".
 * - Memoisiert (`memo`), um unnötige Renders bei Filteränderungen zu minimieren.
 *
 * @param {ExerciseSelectionListProps} props - Die Eigenschaften der Komponente.
 * @returns {JSX.Element} Die gerenderte Übungsauswahlseite mit Filtern und Zurück-Button.
 */
function ExerciseSelectionList({
  workoutList,
  onSelectExercise,
  onBack,
}: ExerciseSelectionListProps) {
  /**
   * Erstellt ein Set aus den IDs aller bereits im Workout enthaltenen Übungen
   * für blitzschnelle O(1)-Prüfungen bei der Duplikats-Markierung.
   */
  const exercisesInWorkout = new Set(workoutList.map((ex) => ex.id));

  // Setzt den Seitentitel im globalen Layout-Context
  useSetTitle("Wähle eine Übung aus");

  // Holt Filter-Zustände und gefilterte Übungen aus dem Custom Hook
  const {
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    filteredExercises,
  } = useExercises();

  return (
    <>
      {/* Filter-Leiste (Kategorie-Dropdown und Live-Suchfeld) */}
      <div>
        <CategoryDropDown
          selectedCategory={selectedCategory}
          onCategoryChange={(value) =>
            setSelectedCategory(value as number | "Alle")
          }
        />
        <SearchInput
          value={searchTerm}
          onChange={(setSearchTextWithHandler) =>
            setSearchTerm(setSearchTextWithHandler)
          }
          placeholder="Übung suchen..."
        />
      </div>

      {/* Liste der gefilterten Übungskarten */}
      <div className={styles["exercise-list"]}>
        {filteredExercises.map((exercise) => {
          const isAdded = exercisesInWorkout.has(exercise.id);
          return (
            <div
              key={exercise.id}
              className={`${styles.card} ${isAdded ? styles.disabled : ""}`}
              onClick={() => !isAdded && onSelectExercise(exercise)}
            >
              {isAdded && (
                <div
                  className={stylesModal["close-button"]}
                  style={{
                    position: "absolute",
                    backgroundColor: "transparent",
                  }}
                >
                  +
                </div>
              )}
              <h3>{exercise.title}</h3>
              <div className={styles["exercise-card-description"]}>
                {exercise.description}
              </div>
            </div>
          );
        })}
      </div>

      {/* Zurück-Button zum Verlassen der Übungsauswahl */}
      <button className="button" onClick={onBack} style={{ marginTop: "1rem" }}>
        Zurück
      </button>
    </>
  );
}

export default memo(ExerciseSelectionList);
