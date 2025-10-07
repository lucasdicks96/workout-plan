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
  onAddSet?: (key: string) => void;
  onRemoveSet?: (key: string) => void;
  onRemove?: (key: string) => void;
  onBack?: () => void;
  onReorderWorkoutList?: (workoutList: WorkoutExercisesType[]) => void;
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
  onReorderWorkoutList,
}: // onBack,
WorkoutExercisesProps) {
  // const navigate = useNavigate();
  const [activeInput, setActiveInput] = useState<ActiveInput | null>(null);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  const onDragStart =
    (index: number) => (event: React.DragEvent<HTMLDivElement>) => {
      setDraggedIdx(index);
      event.dataTransfer.effectAllowed = "move";
    };

  const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  const onDrop =
    (index: number) => (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      if (draggedIdx === null || draggedIdx === index) return;

      const newList = [...workoutList];
      const draggedItem = newList[draggedIdx];

      newList.splice(draggedIdx, 1);
      newList.splice(index, 0, draggedItem);

      // setWorkoutList(newList);
      onReorderWorkoutList && onReorderWorkoutList(newList);

      setDraggedIdx(null);
    };

  if (!workoutList || workoutList.length === 0) {
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
        {workoutList.map((exercise, idx) => (
          <div
            key={exercise.compositeKey}
            draggable
            onDragStart={onDragStart(idx)}
            onDragOver={onDragOver}
            onDrop={onDrop(idx)}
            className={stylesWorkoutExercises.card}
            style={{
              minHeight: "fit-content",
              boxShadow:
                draggedIdx === idx ? "0 4px 12px rgba(0, 0, 0, 0.3)" : "none",
              border: draggedIdx === idx ? "2px solid #2196f3" : undefined,
              opacity: draggedIdx === idx ? 0.8 : 1,
              transition: "box-shadow 0.2s, border 0.2s, opacity 0.2s",
            }}
          >
            {onRemove && (
              <button
                className={stylesModal.closeButton}
                onClick={() => onRemove && onRemove(exercise.compositeKey)}
              >
                &times;
              </button>
            )}

            <>
              <h3>{exercise.title}</h3>

              <div
                style={{
                  maxWidth: "100%",
                  display: "inline-flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <span>Sätze</span>
                <span className={stylesWorkoutExercises.input}>
                  {exercise.sets.length}
                </span>
                <button
                  className="button sm rounded"
                  onClick={() =>
                    onRemoveSet && onRemoveSet(exercise.compositeKey)
                  }
                >
                  -
                </button>
                <button
                  className="button sm rounded"
                  onClick={() => onAddSet && onAddSet(exercise.compositeKey)}
                >
                  +
                </button>
              </div>
            </>
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
