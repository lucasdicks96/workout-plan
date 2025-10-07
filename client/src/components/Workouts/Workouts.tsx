import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSetTitle } from "../../hooks/useSetTitle";
import { apiService } from "../../services/apiService";
import styles from "../../styles/Exercises.module.css";
import stylesModal from "../../styles/Modal.module.css";
import { Workout as IWorkout } from "../../types/workouts";
import PlayPauseButton from "../PlayPauseButton";

export default function Workout() {
  const [workoutList, setWorkoutList] = useState<IWorkout[] | []>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useSetTitle("Trainingspläne");

  const loadAllWorkouts = useCallback(async () => {
    try {
      const response = await apiService.getAllWorkouts();
      setWorkoutList(response.data.workouts);
    } catch (error) {
      setWorkoutList([]);
      console.error("Fehler beim Abrufen der Workouts:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);
  useEffect(() => {
    loadAllWorkouts();
  }, [loadAllWorkouts]);

  const handleDelete = async (workoutId: number) => {
    try {
      const response = await apiService.deleteWorkout(workoutId);
      loadAllWorkouts();
      console.log(response.data);
    } catch (error) {
      console.error("Fehler beim Löschen des Plans", error);
    }
  };

  return (
    <>
      {/* <div className="content"> */}
      <WorkoutList
        isLoading={isLoading}
        workoutList={workoutList}
        onDelete={handleDelete}
      />
      <div className="button-container">
        <button className="button" onClick={() => navigate("edit-workouts")}>
          Bearbeiten
        </button>
        <button className="button" onClick={() => navigate("create-workouts")}>
          Erstellen
        </button>
      </div>
      {/* </div> */}
    </>
  );
}

export function WorkoutList({
  isLoading,
  workoutList,
  onClick,
  onDelete,
}: {
  isLoading: boolean;
  workoutList: IWorkout[];
  onClick?: (workoutId: number) => void;
  onDelete?: (workoutId: number) => void;
}) {
  if (isLoading) {
    return <p>Lade Workouts...</p>;
  }

  if (workoutList.length === 0) {
    return <p>Keine Workouts verfügbar.</p>;
  }
  return (
    <>
      {workoutList.map((workout) => (
        <WorkoutCard
          key={workout.id}
          workoutId={workout.id}
          title={workout.title}
          onClick={onClick}
          onDelete={onDelete}
        />
      ))}
    </>
  );
}
function WorkoutCard({
  title,
  workoutId,
  onClick,
  onDelete,
}: {
  title: string;
  workoutId: number;
  onClick?: (workoudId: number) => void;
  onDelete?: (workoutId: number) => void;
}) {
  const navigate = useNavigate();
  const location = window.location.pathname;
  const isEditPage: boolean = location.includes("edit-workouts");

  const onStart = () => {
    localStorage.setItem("startWorkoutId", JSON.stringify(workoutId));
    navigate("start-workouts");
  };

  return (
    <div className={styles.card} onClick={() => onClick?.(workoutId)}>
      {isEditPage && (
        <button
          className={stylesModal.closeButton}
          onClick={() => onDelete?.(workoutId)}
        >
          &times;
        </button>
      )}
      <h3>{title}</h3>
      {!isEditPage && <PlayPauseButton onStart={onStart} />}
    </div>
  );
}
