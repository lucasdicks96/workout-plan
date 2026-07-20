import { memo, useState } from "react";
import styles from "../../styles/Exercises.module.css";
import stylesModal from "../../styles/Modal.module.css";
import stylesWorkoutExercises from "../../styles/WorkoutExercises.module.css";
import {
  WorkoutExerciseSets,
  WorkoutExercises as WorkoutExercisesType,
} from "../../schemas/workout.schema";

/**
 * Die Eigenschaften (Props) für die WorkoutExercises-Komponente.
 */
type WorkoutExercisesProps = {
  /** Die Liste aller im aktuellen Workout enthaltenen Übungen und Sätze. */
  workoutList: WorkoutExercisesType[];
  /** Callback-Funktion zum Aktualisieren eines spezifischen Feldes (Gewicht oder Wiederholungen). */
  onUpdate?: (
    key: number,
    setIndex: number,
    field: keyof WorkoutExerciseSets,
    value: string,
  ) => void;
  /** Callback-Funktion zum Hinzufügen eines neuen Satzes zu einer bestimmten Übung. */
  onAddSet?: (key: number) => void;
  /** Callback-Funktion zum Löschen des letzten Satzes einer Übung. */
  onRemoveSet?: (key: number) => void;
  /** Optionaler Callback zum Entfernen einer kompletten Übung aus dem Workout. */
  onRemove?: (key: number) => void;
  /** Optionaler Callback für den Zurück-Button. */
  onBack?: () => void;
  /** Callback zum Aktualisieren der Reihenfolge nach einer erfolgreichen Drag-&-Drop-Operation. */
  onReorderWorkoutList?: (workoutList: WorkoutExercisesType[]) => void;
};

/**
 * Repräsentiert das aktuell im Fokus stehende Eingabefeld, 
 * damit die +/- Quick-Buttons wissen, ob gerade Wiederholungen oder Gewicht angepasst werden sollen.
 */
type ActiveInput = {
  exerciseKey: number;
  setIndex: number;
  field: keyof WorkoutExerciseSets;
};

/**
 * Eine performante, interaktive Komponenten-Ansicht zur Verwaltung der Übungen und Sätze in einem Workout.
 * 
 * Bietet folgende Kernfunktionen:
 * - HTML5 Drag & Drop zum intuitiven Umsortieren der Übungsreihenfolge (`onReorderWorkoutList`).
 * - Direktes Bearbeiten von Wiederholungen und Gewichten in Eingabefeldern.
 * - Quick-Increment/Decrement Buttons (+/-) für die schnelle Bedienung am Smartphone.
 * - Memoisiert (`memo`), um unnötige Re-Renders bei reinen Timer- oder UI-Änderungen in Elternkomponenten zu verhindern.
 *
 * @param {WorkoutExercisesProps} props - Die Eigenschaften der Komponente.
 * @returns {JSX.Element} Die gerenderte Liste aller Workout-Übungen oder einen leeren Hinweis-Text.
 */
function WorkoutExercises({
  workoutList,
  onUpdate,
  onRemove,
  onAddSet,
  onRemoveSet,
  onReorderWorkoutList,
}: WorkoutExercisesProps) {
  /** Speichert das aktuell fokussierte Input-Feld für die +/- Steuerung. */
  const [activeInput, setActiveInput] = useState<ActiveInput | null>(null);
  /** Speichert den Array-Index des Übungskartenelements, das gerade per Drag & Drop bewegt wird. */
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  /**
   * Event-Handler beim Start des Drag-Vorgangs einer Übungskarte.
   * 
   * @param {number} index - Der Index der gezogenen Übung.
   * @returns Ein React DragEvent-Listener.
   */
  const onDragStart =
    (index: number) => (event: React.DragEvent<HTMLDivElement>) => {
      setDraggedIdx(index);
      event.dataTransfer.effectAllowed = "move";
    };

  /**
   * Verhindert das Standardverhalten beim Ziehen über ein gültiges Drop-Ziel,
   * damit das Drop-Event ausgelöst werden darf.
   */
  const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  /**
   * Event-Handler beim Loslassen (Drop) einer Übungskarte an einer neuen Position.
   * Berechnet die neue Array-Reihenfolge und stößt die Neusortierung an.
   *
   * @param {number} index - Der Ziel-Index an der Drop-Position.
   * @returns Ein React DragEvent-Listener.
   */
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

  /**
   * Erhöht oder verringert den Wert des aktiven Inputs (Gewicht oder Wiederholungen)
   * um einen bestimmten Betrag (z. B. +1 oder -1) über die Quick-Buttons.
   * 
   * Ermittelt anhand von `activeInput`, welches Feld (Repetitions oder Weight) gerade im Fokus ist,
   * und verhindert negative Werte (< 0).
   *
   * @param {number} exerciseKey - Die ID der Übung.
   * @param {number} setIndex - Der Index des Satzes.
   * @param {number} amount - Der Betrag, um den der Wert verändert werden soll (z. B. 1 oder -1).
   */
  const handleValueChange = (
    exerciseKey: number,
    setIndex: number,
    amount: number,
  ) => {
    if (!onUpdate) return;

    // Fallback auf Wiederholungen, falls kein Input im Fokus ist
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