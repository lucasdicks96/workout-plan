import { memo, useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSetTitle } from "../../hooks/useSetTitle";
import { apiService } from "../../services/apiService";
import styles from "../../styles/Exercises.module.css";
import { CombinedExercise } from "../../types/exercises";
import Modal from "./Modal";

export default function Exercises() {
  const [exerciseList, setExerciseList] = useState<CombinedExercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  useSetTitle("Übungen");

  const fetchAllExercises = useCallback(async () => {
    try {
      const response = await apiService.getAllExercises();
      setExerciseList(response.data.exercises);
    } catch (error) {
      setExerciseList([]);
      console.error("Fehler beim Abrufen der Übungen:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllExercises();
  }, [fetchAllExercises]);

  return (
    <>
      {/* <div className=""> */}
      <ExerciseList
        exerciseList={exerciseList}
        isLoading={isLoading}
        onUpdateSuccess={fetchAllExercises}
      />
      <div className="button-container">
        <button className="button" onClick={() => navigate("edit-exercises")}>
          Bearbeiten
        </button>
        <button className="button" onClick={() => navigate("create-exercises")}>
          Erstellen
        </button>
      </div>
      {/* </div> */}
    </>
  );
}

type ExerciseProps = {
  isLoading: boolean;
  exerciseList: CombinedExercise[];
  onUpdateSuccess: () => void;
};
export function ExerciseList({
  isLoading,
  exerciseList = [],
  onUpdateSuccess,
}: ExerciseProps) {
  const [selectedExercise, setSelectedExercise] =
    useState<CombinedExercise | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const location = window.location.pathname;
  const isEditPage = location.includes("edit-exercises");

  const handleCardClick = useCallback(
    (exercise: CombinedExercise) => {
      if (exercise.userId && isEditPage) {
        console.log(exercise);
        setSelectedExercise(exercise);
        setIsOpen(true);
      }
    },
    [isEditPage]
  );

  const handleCloseModal = () => {
    setSelectedExercise(null);
    setIsOpen(false);
  };

  if (isLoading) {
    return <p>Lade Übungen...</p>;
  }

  if (!exerciseList || exerciseList.length === 0) {
    return <p>Keine Übungen verfügbar.</p>;
  }
  return (
    <>
      {isOpen ? (
        <div className={styles.exerciseList}>
          {selectedExercise && (
            <Modal
              isOpen={isOpen}
              onClose={handleCloseModal}
              exerciseData={selectedExercise}
              onUpdateSuccess={onUpdateSuccess}
            />
          )}
        </div>
      ) : (
        <>
          <div className={styles.exerciseList}>
            {exerciseList.map((item) => (
              <ExerciseCard
                key={item.compositeKey}
                title={item.title}
                userId={item.userId}
                description={item.description}
                compositeKey={item.compositeKey}
                id={item.id}
                onClick={() => handleCardClick(item)}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
}

type ExerciseCardProps = CombinedExercise & {
  onClick: () => void;
};

const ExerciseCard = memo(
  ({ title, description, userId, onClick }: ExerciseCardProps) => {
    return (
      <div className={styles.card} onClick={onClick}>
        {userId && <span style={{ position: "relative" }}>Eigene Übung</span>}
        <h3>{title}</h3>
        <div className={styles.exerciseCardDescription}>{description}</div>
      </div>
    );
  }
);
