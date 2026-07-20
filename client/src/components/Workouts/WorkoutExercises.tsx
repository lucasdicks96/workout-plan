import { memo, useState } from "react";
import styles from "../../styles/Exercises.module.css";
import stylesModal from "../../styles/Modal.module.css";
import stylesWorkoutExercises from "../../styles/WorkoutExercises.module.css";
import {
  WorkoutExerciseSets,
  WorkoutExercises as WorkoutExercisesType,
} from "../../schemas/workout.schema";

type WorkoutExercisesProps = {
  workoutList: WorkoutExercisesType[];
  onUpdate?: (
    key: number,
    setIndex: number,
    field: keyof WorkoutExerciseSets,
    value: string,
  ) => void;
  onAddSet?: (key: number) => void;
  onRemoveSet?: (key: number) => void;
  onRemove?: (key: number) => void;
  onBack?: () => void;
  onReorderWorkoutList?: (workoutList: WorkoutExercisesType[]) => void;
};

type ActiveInput = {
  exerciseKey: number;
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
}: WorkoutExercisesProps) {
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

      onReorderWorkoutList && onReorderWorkoutList(newList);

      setDraggedIdx(null);
    };

  if (!workoutList || workoutList.length === 0) {
    return <p>Dieses Workout enthält keine Übungen.</p>;
  }

  const handleValueChange = (
    exerciseKey: number,
    setIndex: number,
    amount: number,
  ) => {
    if (!onUpdate) return;

    let targetField: keyof WorkoutExerciseSets = "repetitions";

    if (
      activeInput &&
      activeInput.exerciseKey === exerciseKey &&
      activeInput.setIndex === setIndex
    ) {
      targetField = activeInput.field;
    }

    const exercise = workoutList.find((ex) => ex.id === exerciseKey);
    const currentValue = exercise?.sets[setIndex]?.[targetField];

    if (currentValue !== undefined) {
      const newValue = Number(currentValue) + amount;
      if (newValue >= 0) {
        onUpdate(exerciseKey, setIndex, targetField, String(newValue));
      }
    }
  };

  return (
    <>
      <div className={styles["exercise-list"]}>
        {workoutList.map((exercise, idx) => (
          <div
            key={exercise.id}
            draggable
            onDragStart={onDragStart(idx)}
            onDragOver={onDragOver}
            onDrop={onDrop(idx)}
            className={`${stylesWorkoutExercises.card}`}
            style={{
              // minHeight: "fit-content",
              boxShadow:
                draggedIdx === idx ? "0 4px 12px rgba(0, 0, 0, 0.3)" : "none",
              border: draggedIdx === idx ? "2px solid #2196f3" : undefined,
              opacity: draggedIdx === idx ? 0.8 : 1,
              transition: "box-shadow 0.2s, border 0.2s, opacity 0.2s",
            }}
          >
            {onRemove && (
              <button
                className={stylesModal["close-button"]}
                onClick={() => onRemove && onRemove(exercise.id)}
              >
                &times;
              </button>
            )}
            <div className={stylesWorkoutExercises["card-content-container"]}>
              <>
                <h3>{exercise.title}</h3>

                <div className={stylesWorkoutExercises["card-content-item"]}>
                  <span className={`${stylesWorkoutExercises["card-span"]}`}>
                    Sätze
                  </span>
                  <span className={stylesWorkoutExercises.input}>
                    {exercise.sets.length}
                  </span>
                  <button
                    className="button sm rounded"
                    onClick={() => onRemoveSet && onRemoveSet(exercise.id)}
                  >
                    -
                  </button>
                  <button
                    className="button sm rounded"
                    onClick={() => onAddSet && onAddSet(exercise.id)}
                  >
                    +
                  </button>
                </div>
              </>
              {exercise.sets.map((set, setIdx) => (
                <div
                  key={setIdx}
                  className={stylesWorkoutExercises["card-content-container"]}
                >
                  <div className={stylesWorkoutExercises["card-content-item"]}>
                    <span className={`${stylesWorkoutExercises["card-span"]}`}>
                      {setIdx + 1}
                    </span>
                    <input
                      type="number"
                      className={stylesWorkoutExercises.input}
                      name="repetitions"
                      value={set.repetitions}
                      onChange={(e) =>
                        onUpdate &&
                        onUpdate(
                          exercise.id,
                          setIdx,
                          "repetitions",
                          e.target.value,
                        )
                      }
                      onFocus={() =>
                        setActiveInput({
                          exerciseKey: exercise.id,
                          setIndex: setIdx,
                          field: "repetitions",
                        })
                      }
                    />
                    <span className={`${stylesWorkoutExercises["card-span"]}`}>
                      x
                    </span>
                    <input
                      type="number"
                      className={stylesWorkoutExercises.input}
                      name="weight"
                      value={set.weight}
                      onChange={(e) =>
                        onUpdate &&
                        onUpdate(exercise.id, setIdx, "weight", e.target.value)
                      }
                      onFocus={() =>
                        setActiveInput({
                          exerciseKey: exercise.id,
                          setIndex: setIdx,
                          field: "weight",
                        })
                      }
                    />
                    <span className={`${stylesWorkoutExercises["card-span"]}`}>
                      kg
                    </span>
                    <button
                      className="button sm rounded"
                      onClick={() => handleValueChange(exercise.id, setIdx, -1)}
                    >
                      -
                    </button>
                    <button
                      className="button sm rounded"
                      onClick={() => handleValueChange(exercise.id, setIdx, 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default memo(WorkoutExercises);
