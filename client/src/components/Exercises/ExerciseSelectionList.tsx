import styles from "../Exercises/ExercisesList.module.css";
import { IExercisesList } from "../../types/exercises";

type ExerciseSelectionListProps = {
  exerciseList: IExercisesList[];
  existingExerciseIds: Set<number>;
  handleSelectNewExercise: (exercise: IExercisesList) => void;
  setShowExerciseSelection: (show: boolean) => void;
};

export default function ExerciseSelectionList({
  exerciseList,
  existingExerciseIds,
  handleSelectNewExercise,
  setShowExerciseSelection,
}: ExerciseSelectionListProps) {
  // ...
  return (
    <>
      <h2>Wähle eine Übung aus</h2>
      <div className={styles.exerciseList}>
        {exerciseList.map((item) => {
          const isAdded = existingExerciseIds.has(item.id);
          return (
            <div
              key={item.id}
              // Füge eine 'disabled' Klasse hinzu und ändere den Cursor
              className={`${styles.exerciseCardContainer} ${
                isAdded ? styles.disabled : ""
              }`}
              onClick={() => handleSelectNewExercise(item)}
            >
              {/* ... img, title etc. ... */}
              <h3>{item.title}</h3>
              {isAdded && <div className={styles.addedLabel}>Hinzugefügt</div>}
            </div>
          );
        })}
      </div>
      <button onClick={() => setShowExerciseSelection(false)}>
        Zurück zum Plan
      </button>
    </>
  );
}
