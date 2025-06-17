import axios from "axios";
import { useEffect, useState } from "react";
import styles from "../Exercises/Exercises.module.css";

type ExerciseType = {
  id: number;
  title: string;
  description: string;
  img_path: string;
};
type ExerciseCardProps = ExerciseType & {
  onCardClick: (id: number) => void;
  isSelected: boolean;
};

export default function CreateWorkout() {
  const [exerciseList, setExerciseList] = useState<ExerciseType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCardClick = (id: number) => {
    setSelectedIds((prevIds) => {
      // Prüfen, ob die ID bereits im Array ist
      if (prevIds.includes(id)) {
        // Wenn ja, entferne sie (deselektieren)
        return prevIds.filter((selectedId) => selectedId !== id);
      } else {
        // Wenn nein, füge sie hinzu (selektieren)
        return [...prevIds, id];
      }
    });
  };

  const SelectExerciseButton = () => {
    return (
      <button
        className={styles.addExerciseButton}
        onClick={() => handleSelectExercise()}
      >
        <span>+</span> Select Exercise
      </button>
    );
  };

  const AddExerciseButton = () => {
    return (
      <button
        className={styles.addExerciseButton}
        onClick={() => handleAddExercise()}
      >
        <span>+</span> Add Exercise
      </button>
    );
  };

  const handleSelectExercise = () => {
    setIsModalOpen(!isModalOpen);
    console.log("Select Exercise button clicked");
  };

  const handleAddExercise = () => {
    console.log("Add Exercise button clicked");
    
  };

  async function fetchAllExercises() {
    try {
      const response = await axios.get(
        "http://localhost:5000/exercise/all-exercises",
        { withCredentials: true }
      );
      // console.log("Response data: ", response.data.exercises);
      setExerciseList(response.data.exercises);
    } catch (err) {
      console.error("Fehler beim Abrufen der Übungen:", err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchAllExercises();
  }, []);

  function ExerciseCard({
    title,
    description,
    img_path,
    id,
    onCardClick,
    isSelected,
  }: ExerciseCardProps) {
    const cardClassName = `${styles.exerciseCardContainer} ${
      isSelected ? styles.active : ""
    }`;
    return (
      <div
        className={cardClassName.trim()} // .trim() entfernt überflüssige Leerzeichen
        onClick={() => onCardClick(id)}
      >
        <div className={styles.exerciseImageContainer}>
          <a className={styles.exerciseImage}>
            <img src={img_path} alt={title} />
          </a>
        </div>
        <div className={styles.exerciseCardBody}>
          <h3>{title}</h3>
          <div className={styles.exerciseCardDescription}>{description}</div>
        </div>
      </div>
    );
  }

  function ExerciseList() {
    if (isLoading) {
      return <p>Lade Übungen...</p>; // Ladeanzeige
    }

    if (exerciseList.length === 0) {
      return <p>Keine Übungen verfügbar.</p>; // Kein Inhalt
    }
    return (
      <>
        <div className={styles.exerciseList}>
          {exerciseList.map((item) => (
            <ExerciseCard
              key={item.id}
              id={item.id}
              title={item.title}
              description={item.description}
              img_path={item.img_path}
              // Wichtige Props, die weitergegeben werden:
              onCardClick={handleCardClick}
              isSelected={selectedIds.includes(item.id)} // Prüft, ob diese Karte ausgewählt ist
            />
          ))}
        </div>
        <AddExerciseButton />
      </>
    );
  }

  return (
    <>
      <h2>Create Workout</h2>
      {isModalOpen ? <ExerciseList /> : <SelectExerciseButton />}
    </>
  );
}

const workoutList: ExerciseType[] = [];
