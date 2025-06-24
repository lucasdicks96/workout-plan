import { IExerciseForWorkout } from "../../types/exercises";
import styles from "../Exercises/ExercisesList.module.css";

type WorkoutListProps = {
  workoutList: IExerciseForWorkout[];
  onEditExercise: (exercise: IExerciseForWorkout) => void;
  onRemoveExercise: (exerciseId: number) => void;
};

export function WorkoutList({
  workoutList,
  onEditExercise,
  onRemoveExercise,
}: WorkoutListProps) {
  if (workoutList.length === 0) {
    return <p>Dein Trainingsplan ist noch leer.</p>;
  }

  return (
    <div className={styles.exerciseList}>
      {workoutList.map((item) => (
        <div
          key={item.id}
          className={styles.exerciseCardContainer}
          onClick={() => onEditExercise(item)}
          style={{ cursor: "pointer" }}
        >
          <button
            className={styles.deleteButton}
            aria-label="Übung entfernen"
            onClick={(e) => {
              e.stopPropagation();
              onRemoveExercise(item.id);
            }}
          >
            &times;
          </button>
          <div className={styles.exerciseCardBody}>
            <h3>{item.title}</h3>
            <div className={styles.workoutDetails}>
              <span>Sets: {item.sets}</span>
              <br />
              <span>Reps: {item.repetitions}</span>
              <br />
              <span>Weight: {item.weight}kg</span>
              <br />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
