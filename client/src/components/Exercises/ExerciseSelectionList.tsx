import { memo } from "react";
import styles from "../../styles/Exercises.module.css";
import stylesModal from "../../styles/Modal.module.css";
import SearchInput from "../SearchInput";
import CategoryDropDown from "../CategoryDropDown";
import { useExercises } from "../../hooks/useExercises";
import { Exercise } from "../../types/exercises";
import { WorkoutExercises } from "../../types/workouts";
import { useSetTitle } from "../../hooks/useSetTitle";
import type { Exercise } from "../../types/exercises";

type ExerciseSelectionListProps = {
  allExercises?: Exercise[];
  workoutList: WorkoutExercises[];
  onSelectExercise: (exercise: Exercise) => void;
  onBack: () => void;
};

function ExerciseSelectionList({
  workoutList,
  onSelectExercise,
  onBack,
}: ExerciseSelectionListProps) {
  const exercisesInWorkout = new Set(workoutList.map((ex) => ex.id));
  useSetTitle("Wähle eine Übung aus");
  const {
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    filteredExercises,
  } = useExercises();
  return (
    <>
      <div>
        <CategoryDropDown
          selectedCategory={selectedCategory}
          onCategoryChange={(value) =>
            setSelectedCategory(value as number | "Alle")
          }
        />
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Übung suchen..."
        />
      </div>
      <div className={styles.exerciseList}>
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
                  className={stylesModal.closeButton}
                  style={{ position: "absolute" }}
                >
                  +
                </div>
              )}
              <h3>{exercise.title}</h3>
              <div className={styles.exerciseCardDescription}>
                {exercise.description}
              </div>
            </div>
          );
        })}
      </div>
      <button className="button" onClick={onBack} style={{ marginTop: "1rem" }}>
        Zurück
      </button>
    </>
  );
}

export default memo(ExerciseSelectionList);
