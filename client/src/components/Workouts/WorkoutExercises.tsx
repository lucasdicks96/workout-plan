import { memo, useState } from "react";
import styles from "../../styles/Exercises.module.css";
import stylesModal from "../../styles/Modal.module.css";
import stylesWorkoutExercises from "../../styles/WorkoutExercises.module.css";
import {
  WorkoutExerciseSets,
  WorkoutExercises as WorkoutExercisesType,
} from "../../types/workouts";

type WorkoutExercisesProps = {
  workoutList: WorkoutExercisesType[];
  onUpdate?: (
    key: string,
    setIndex: number,
    field: keyof WorkoutExerciseSets,
    value: string
  ) => void;
  onAddSet: (key: string) => void;
  onRemoveSet: (key: string) => void;
  onRemove?: (key: string) => void;
  onBack?: () => void;
};

type ActiveInput = {
  exerciseKey: string;
  setIndex: number;
  field: keyof WorkoutExerciseSets;
};

function WorkoutExercises({
  workoutList,
  onUpdate,
  onRemove,
  onAddSet,
  onRemoveSet,
}: // onBack,
WorkoutExercisesProps) {
  // const navigate = useNavigate();
  const [activeInput, setActiveInput] = useState<ActiveInput | null>(null);

  // console.log("workoutexercises ", workoutList);
  if (workoutList.length === 0) {
    return <p>Dieses Workout enthält keine Übungen.</p>;
  }

  const handleValueChange = (amount: number) => {
    if (!activeInput || !onUpdate) return;

    const { exerciseKey, setIndex, field } = activeInput;

    const exercise = workoutList.find((ex) => ex.compositeKey === exerciseKey);
    const currentValue = exercise?.sets[setIndex]?.[field];

    if (currentValue !== undefined) {
      const newValue = Number(currentValue) + amount;
      // Verhindert, dass der Wert negativ wird
      if (newValue >= 0) {
        onUpdate(exerciseKey, setIndex, field, String(newValue));
      }
    }
  };

  return (
    <>
      {/* {onBack && (
        <button
          className="button"
          onClick={onBack}
          style={{ marginBottom: "1rem" }}
        >
          Zurück
        </button>
      )} */}
      <div className={styles.exerciseList}>
        {workoutList.map((exercise) => (
          <div
            key={exercise.compositeKey}
            className={stylesWorkoutExercises.card}
            style={{ minHeight: "fit-content" }}
          >
            {onRemove && (
              <button
                className={stylesModal.closeButton}
                onClick={() => onRemove && onRemove(exercise.compositeKey)}
              >
                &times;
              </button>
            )}

            <div className="">
              <h3>{exercise.title}</h3>

              <div className="">
                <span>Sätze</span>
                <span className={stylesWorkoutExercises.input}>
                  {exercise.sets.length}
                </span>
                <button
                  className="button sm rounded"
                  onClick={() => onRemoveSet(exercise.compositeKey)}
                >
                  -
                </button>
                <button
                  className="button sm rounded"
                  onClick={() => onAddSet(exercise.compositeKey)}
                >
                  +
                </button>
              </div>
            </div>
            {exercise.sets.map((set, setIdx) => (
              <div
                key={setIdx}
                className={stylesWorkoutExercises.cardContentContainer}
              >
                <div className={stylesWorkoutExercises.cardContentItem}>
                  <span>{setIdx + 1}</span>
                  <input
                    type="number"
                    className={stylesWorkoutExercises.input}
                    value={set.repetitions}
                    onChange={(e) =>
                      onUpdate &&
                      onUpdate &&
                      onUpdate(
                        exercise.compositeKey,
                        setIdx,
                        "repetitions",
                        e.target.value
                      )
                    }
                    onFocus={() =>
                      setActiveInput({
                        exerciseKey: exercise.compositeKey,
                        setIndex: setIdx,
                        field: "repetitions",
                      })
                    }
                  />
                  <span>x</span>
                  <input
                    type="number"
                    className={stylesWorkoutExercises.input}
                    value={set.weight}
                    onChange={(e) =>
                      onUpdate &&
                      onUpdate(
                        exercise.compositeKey,
                        setIdx,
                        "weight",
                        e.target.value
                      )
                    }
                    onFocus={() =>
                      setActiveInput({
                        exerciseKey: exercise.compositeKey,
                        setIndex: setIdx,
                        field: "weight",
                      })
                    }
                  />
                  <span>kg</span>
                  <button
                    className="button sm rounded"
                    onClick={() => handleValueChange(-1)}
                    disabled={
                      !activeInput ||
                      activeInput.exerciseKey !== exercise.compositeKey ||
                      activeInput.setIndex !== setIdx
                    }
                  >
                    -
                  </button>
                  <button
                    className="button sm rounded"
                    onClick={() => handleValueChange(1)}
                    disabled={
                      !activeInput ||
                      activeInput.exerciseKey !== exercise.compositeKey ||
                      activeInput.setIndex !== setIdx
                    }
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}

export default memo(WorkoutExercises);
