import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth";
import { apiService } from "../../services/apiService";
import { FinishedWorkout } from "../../types/workouts";
import stylesLayout from "../../styles/Layout.module.css";
import { isAxiosError } from "axios";

export default function History() {
  const [workouts, setWorkouts] = useState<FinishedWorkout[] | null>([]);
  const { user } = useAuth();

  const loadWorkout = useCallback(async () => {
    try {
      if (!user) return;
      const response = await apiService.getCompletedWorkouts(user.id);
      console.log("Response Data History ", response.data);
      setWorkouts(response.data.exercises);
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
    <div className="content">
      <h2 className={stylesLayout.pageTitle}>History</h2>
      {!workouts || workouts.length === 0 ? (
        <div>Bisher wurden keine Workouts absolviert</div>
      ) : (
        <>
          {workouts.map((workout) => (
            <HistoryItem key={workout.workoutId} workout={workout} />
          ))}
        </>
      )}
    </div>
  );
}

const HistoryItem = ({ workout }: { workout: FinishedWorkout }) => {
  return (
    <div>
      {workout.title}
      {workout.date}
    </div>
  );
};
