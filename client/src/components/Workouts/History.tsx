import { isAxiosError } from "axios";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useSetTitle } from "../../hooks/useSetTitle";
import { apiService } from "../../services/apiService";
import styles from "../../styles/Exercises.module.css";
import stylesButton from "../../styles/Button.module.css";
import { CompletedWorkout } from "../../types/workouts";
import EditButton from "../Buttons/EditButton";
import type { CompletedWorkout } from "../../types/workouts";

export default function History() {
  const [workouts, setWorkouts] = useState<CompletedWorkout[] | null>([]);
  const { user } = useAuth();

  useSetTitle("Verlauf");

  const loadWorkout = useCallback(async () => {
    try {
      if (!user) return;
      const response = await apiService.getCompletedWorkouts();
      console.log("Response Data History ", response.data);
      setWorkouts(response.data.workouts);
    } catch (error) {
      if (isAxiosError(error)) {
        if (
          error.response &&
          error.response.data &&
          error.response.data.message
        ) {
          console.error(error.response.data.message);
        } else {
          console.error("Fehler beim Laden der Workouts");
        }
      } else {
        console.error("Interner Serverfehler");
      }
    }
  }, [user]);
  useEffect(() => {
    loadWorkout();
  }, [loadWorkout]);

  return (
    // <div className="content">
    <>
      {!workouts || workouts.length === 0 ? (
        <div>Bisher wurden keine Workouts absolviert</div>
      ) : (
        <div className={styles.exerciseList}>
          {workouts.map((workout) => (
            <HistoryItem key={workout.id} workout={workout} />
          ))}
        </div>
      )}
    </>
    // </div>
  );
}

const HistoryItem = ({ workout }: { workout: CompletedWorkout }) => {
  const navigate = useNavigate();
  const date = new Date(workout.startTime);

  return (
    <div className={styles.card}>
      <h3 className={styles.workoutCardTitle}>{workout.title}</h3>
      {date.toLocaleDateString()} - {date.toLocaleTimeString()}
      <EditButton
        // Change the route to pass the specific completed workout ID
        onEdit={() => navigate(`/history/edit/${workout.id}`)}
        className={`${stylesButton.right} ${stylesButton.buttonRounded}`}
      />
    </div>
  );
};
