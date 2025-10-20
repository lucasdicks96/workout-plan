import { memo, useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSetTitle } from "../../hooks/useSetTitle";
import { apiService } from "../../services/apiService";
import styles from "../../styles/Exercises.module.css";
import stylesButton from "../../styles/Button.module.css";
import { CombinedExercise } from "../../types/exercises";
import Modal from "./Modal";
import EditButton from "../EditButton";
import AddButton from "../AddButton";

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
      <ExerciseList
        exerciseList={exerciseList}
        isLoading={isLoading}
        onUpdateSuccess={fetchAllExercises}
      />
      <div className="button-container">
        <EditButton onEdit={() => navigate("edit-exercises")} />

        <AddButton onAdd={() => navigate("create-exercises")} />
      </div>
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
      if (exercise.compositeKey.includes("user") && isEditPage) {
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
                isEditPage={isEditPage}
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
  isEditPage?: boolean;
};

const ExerciseCard = memo(
  ({ title, description, userId, onClick, isEditPage }: ExerciseCardProps) => {
    return (
      <div className={styles.card}>
        {userId && <span style={{ position: "relative" }}>Eigene Übung</span>}
        <h3>{title}</h3>
        {isEditPage && (
          <EditButton
            onEdit={onClick}
            className={`${stylesButton.buttonRounded}`}
          />
        )}

        <div className={styles.exerciseCardDescription}>{description}</div>
      </div>
    );
  }
);
