import { memo, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { apiService } from "../../services/apiService";
import styles from "../../styles/Exercises.module.css";
import stylesLayout from "../../styles/Layout.module.css";
import { CombinedExercise } from "../../types/exercises";

export default function Exercises() {
  const [exerciseList, setExerciseList] = useState<CombinedExercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const { user } = useAuth();
  const id = useRef<number>(0);

  useEffect(() => {
    async function loadAllExercises() {
      try {
        if (!user || user.id === undefined || user.id === null) {
          console.error("Benutzer ist nicht angemeldet oder hat keine ID.");
          return;
        }
        id.current = user.id;
        const response = await apiService.getAllExercises(id.current);
        // const exercises: ExercisesList[] = response.data.exercises;
        setExerciseList(response.data.exercises);
      } catch (error) {
        console.error("Fehler beim Abrufen der Übungen:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadAllExercises();
  }, [user]);

  return (
    <>
      <div className="content">
        <h2 className={stylesLayout.pageTitle}>Übungen</h2>
        <ExerciseList
          exerciseList={exerciseList}
          isLoading={isLoading}
          userId={id.current}
        />
      </div>
      <div className="button-container">
        <button className="button" onClick={() => navigate("edit-exercises")}>
          Bearbeiten
        </button>
        <button className="button" onClick={() => navigate("create-exercises")}>
          Erstellen
        </button>
      </div>
    </>
  );
}

type ExerciseProps = {
  isLoading: boolean;
  exerciseList: CombinedExercise[];
  userId: number;
};
export function ExerciseList({
  isLoading,
  exerciseList,
  userId,
}: ExerciseProps) {
  const [selectedExercise, setSelectedExercise] =
    useState<CombinedExercise | null>(null);

  const location = window.location.pathname;
  const isEditPage = location.includes("edit-exercises");

  const handleCardClick = (exercise: CombinedExercise) => {
    if (exercise.isUserCreated && isEditPage) {
      setSelectedExercise(exercise);
    }
  };

  const handleCloseModal = () => {
    setSelectedExercise(null);
  };

  if (isLoading) {
    return <p>Lade Übungen...</p>;
  }

  if (exerciseList.length === 0) {
    return <p>Keine Übungen verfügbar.</p>;
  }
  return (
    <>
      <div className={styles.exerciseList}>
        {exerciseList.map((item) => (
          <ExerciseCard
            key={item.compositeKey}
            title={item.title}
            description={item.description}
            isUserCreated={item.isUserCreated}
            compositeKey={item.compositeKey}
            originalId={item.originalId}
            onClick={() => handleCardClick(item)}
          />
        ))}
      </div>
      {selectedExercise && (
        <Modal
          isOpen={!!selectedExercise}
          onClose={handleCloseModal}
          exerciseData={selectedExercise}
          userId={userId}
        />
      )}
    </>
  );
}

import Modal from "../Modal";

type ExerciseCardProps = CombinedExercise & {
  onClick: () => void;
};

const ExerciseCard = memo(
  ({ title, description, isUserCreated, onClick }: ExerciseCardProps) => {
    return (
      <div className="card" onClick={onClick}>
        {isUserCreated && <span>(Eigene Übung)</span>}
        <h3>{title}</h3>
        <div className={styles.exerciseCardDescription}>{description}</div>
      </div>
    );
  }
);
