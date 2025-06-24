import { useState } from "react";
import { IExercise, IExerciseForWorkout } from "../../types/exercises";
import styles from "./Exercise.module.css";

type ExerciseProps = {
  exercise: IExercise & {
    repetitions?: number;
    sets?: number;
    weight?: number;
  };
  onSave: (exerciseData: IExerciseForWorkout) => void;
  onClose: () => void;
};

export default function Exercise({ exercise, onSave, onClose }: ExerciseProps) {
  const [sets, setSets] = useState<number>(exercise.sets || 1);
  const [repetitions, setRepetitions] = useState<number>(
    exercise.repetitions || 0
  );
  const [weight, setWeight] = useState<number>(exercise.weight || 0);

  const [error, setError] = useState<string>("");

  // Eine generische Funktion, um Werte zu ändern. Verhindert negative Zahlen.
  const handleValueChange = (
    setter: React.Dispatch<React.SetStateAction<number>>,
    amount: number
  ) => {
    setter((currentValue) => Math.max(0, currentValue + amount));
  };

  const handleSave = () => {
    if (sets <= 0) {
      setError("Die Anzahl an Sets muss mindestens 1 sein.");
      return;
    }
    setError(""); // Fehler zurücksetzen, wenn alles in Ordnung ist

    const exerciseData: IExerciseForWorkout = {
      id: exercise.id,
      title: exercise.title,
      sets,
      repetitions,
      weight,
    };
    onSave(exerciseData);
    onClose();
  };

  return (
    <>
      <h2>{exercise.title}</h2>

      <div className={styles.container}>
        <div className={styles.inputGroup}>
          <label htmlFor="sets">Sets</label>
          <div className={styles.controls}>
            <button
              className={styles.controlButton}
              onClick={() => handleValueChange(setSets, -1)}
              aria-label="Sets verringern"
            >
              -
            </button>
            <input
              id="sets"
              type="number"
              className={styles.numberInput}
              value={sets}
              onChange={(e) => setSets(Math.max(0, Number(e.target.value)))}
            />
            <button
              className={styles.controlButton}
              onClick={() => handleValueChange(setSets, 1)}
              aria-label="Sets erhöhen"
            >
              +
            </button>
          </div>
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="repetitions">Repetitions</label>
          <div className={styles.controls}>
            <button
              className={styles.controlButton}
              onClick={() => handleValueChange(setRepetitions, -1)}
              aria-label="Wiederholungen verringern"
            >
              -
            </button>
            <input
              id="repetitions"
              type="number"
              className={styles.numberInput}
              value={repetitions}
              onChange={(e) =>
                setRepetitions(Math.max(0, Number(e.target.value)))
              }
            />
            <button
              className={styles.controlButton}
              onClick={() => handleValueChange(setRepetitions, 1)}
              aria-label="Wiederholungen erhöhen"
            >
              +
            </button>
          </div>
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="weight">Weight (kg)</label>
          <div className={styles.controls}>
            <button
              className={styles.controlButton}
              onClick={() => handleValueChange(setWeight, -1)}
              aria-label="Gewicht verringern"
            >
              -
            </button>
            <input
              id="weight"
              type="number"
              className={styles.numberInput}
              value={weight}
              onChange={(e) => setWeight(Math.max(0, Number(e.target.value)))}
            />
            <button
              className={styles.controlButton}
              onClick={() => handleValueChange(setWeight, 1)}
              aria-label="Gewicht erhöhen"
            >
              +
            </button>
          </div>
        </div>
      </div>
      {error && <p className={styles.error}>{error}</p>}
      <div className={styles.buttonContainer}>
        <button onClick={handleSave}>Speichern</button>
        <button onClick={onClose} style={{ marginLeft: "10px" }}>
          Abbrechen
        </button>
      </div>
    </>
  );
}
