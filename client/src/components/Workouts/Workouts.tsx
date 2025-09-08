import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { apiService } from "../../services/apiService";
import styles from "../../styles/Exercises.module.css";
import stylesLayout from "../../styles/Layout.module.css";
import stylesModal from "../../styles/Modal.module.css";
import { Workout as IWorkout } from "../../types/workouts";
import PlayPauseButton from "../PlayPauseButton";

export default function Workout() {
  const [workoutList, setWorkoutList] = useState<IWorkout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const loadAllWorkouts = useCallback(async () => {
    try {
      const response = await apiService.getAllWorkouts();
      setWorkoutList(response.data.workouts);
    } catch (error) {
      console.error("Fehler beim Abrufen der Workouts:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);
  useEffect(() => {
    loadAllWorkouts();
  }, [loadAllWorkouts]);

  const handleDelete = async (userId: number, workoutId: number) => {
    try {
      const response = await apiService.deleteWorkout(userId, workoutId);
      loadAllWorkouts();
      console.log(response.data);
    } catch (error) {
      console.error("Fehler beim Löschen des Plans", error);
    }
  };

  return (
    <>
      <div className="content">
        <h2 className={stylesLayout.pageTitle}>Workouts</h2>
        <WorkoutList
          isLoading={isLoading}
          workoutList={workoutList}
          onDelete={handleDelete}
        />
        <div className="button-container">
          <button className="button" onClick={() => navigate("edit-workouts")}>
            Bearbeiten
          </button>
          <button
            className="button"
            onClick={() => navigate("create-workouts")}
          >
            Erstellen
          </button>
        </div>
      </div>
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
  onDelete?: (workoutId: number, userId: number) => void;
}) {
  if (isLoading) {
    return <p>Lade Übungen...</p>;
  }

  if (workoutList.length === 0) {
    return <p>Keine Übungen verfügbar.</p>;
  }
  return (
    <div className={styles.exerciseList}>
      {workoutList.map((workout) => (
        <WorkoutCard
          key={workout.id}
          workoutId={workout.id}
          title={workout.title}
          onClick={onClick}
          onDelete={onDelete}
        />
      ))}
    </div>
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
  onDelete?: (workoutId: number, userId: number) => void;
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const location = window.location.pathname;
  const isEditPage: boolean = location.includes("edit-workouts");
  let userId: number;
  if (user) {
    userId = user.id;
  }
  const onStart = () => {
    localStorage.setItem("startWorkoutId", JSON.stringify(workoutId));
    navigate("start-workouts");
  };

  return (
    <div className="card" onClick={() => onClick?.(workoutId)}>
      {isEditPage && (
        <button
          className={stylesModal.closeButton}
          onClick={() => onDelete?.(userId, workoutId)}
        >
          &times;
        </button>
      )}
      <h3>{title}</h3>
      {!isEditPage && <PlayPauseButton onStart={onStart} />}
    </div>
  );
}
