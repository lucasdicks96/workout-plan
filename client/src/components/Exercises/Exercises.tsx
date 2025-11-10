import { memo, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useExercises } from "../../hooks/useExercises";
import { useSetTitle } from "../../hooks/useSetTitle";
import stylesButton from "../../styles/Button.module.css";
import styles from "../../styles/Exercises.module.css";
import { CombinedExercise } from "../../types/exercises";
import AddButton from "../Buttons/AddButton";
import EditButton from "../Buttons/EditButton";
import CategoryDropdown from "../CategoryDropDown";
import SearchInput from "../SearchInput";
import Modal from "./Modal";

export default function Exercises() {
  // const [exerciseList, setExerciseList] = useState<CombinedExercise[]>([]);
  // const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  useSetTitle("Übungen");

  const {
    isLoading,
    fetchAllExercises,
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    filteredExercises,
  } = useExercises();

  return (
    <>
      <div>
        <CategoryDropdown
          selectedCategory={selectedCategory}
          onCategoryChange={(value) =>
            setSelectedCategory(value as number | "Alle")
          }
        />
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Übung suchen..."
        />
      </div>
      <ExerciseList
        isLoading={isLoading}
        exerciseList={filteredExercises}
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
