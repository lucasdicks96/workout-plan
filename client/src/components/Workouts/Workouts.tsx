import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
// import stylesDashboard from "../dashboard/Dashboard.module.css";
import { apiService } from "../../services/apiService";
import styles from "../../styles/Exercises.module.css";
import stylesLayout from "../../styles/Layout.module.css";
import stylesModal from "../../styles/Modal.module.css";
import { Workout as IWorkout } from "../../types/workouts";
import { useAuth } from "../../context/AuthContext";
import PlayPauseButton from "../PlayPauseButton";

export default function Workout() {
  const [workoutList, setWorkoutList] = useState<IWorkout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  // const workouts: Workout[] = [];

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

  const onDelete = async (userId: number, workoutId: number) => {
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
          onDelete={onDelete}
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
    return <p>Lade Übungen...</p>; // Ladeanzeige
  }

  if (workoutList.length === 0) {
    return <p>Keine Übungen verfügbar.</p>; // Kein Inhalt
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
  let userId: number;
  if (user) {
    userId = user.id;
  }
  const onStart = () => {
    sessionStorage.setItem("startWorkoutId", JSON.stringify(workoutId));
    navigate("start-workouts");
  };

  return (
    <div className="card" onClick={() => onClick?.(workoutId)}>
      <button
        className={stylesModal.closeButton}
        onClick={() => onDelete?.(userId, workoutId)}
      >
        &times;
      </button>
      <h3>{title}</h3>
      <PlayPauseButton onStart={onStart} />
    </div>
  );
}

// const PlayIcon: React.FC = () => {
//   return (
//     <svg
//       xmlns="http://www.w3.org/2000/svg"
//       width="1.5rem"
//       height="1.5rem"
//       viewBox="0 0 24 24"
//       fill="var(--c-bg)"
//     >
//       <path d="M7.22,21.64C6.33,22.2,5,21.5,5,20.47V3.53c0-1.03,1.33-1.73,2.22-1.17l13.43,8.47c0.83,0.53,0.83,1.8,0,2.33L7.22,21.64z" />
//     </svg>
//   );
// };
