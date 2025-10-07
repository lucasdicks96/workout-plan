import { isAxiosError } from "axios";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useSetTitle } from "../../hooks/useSetTitle";
import { apiService } from "../../services/apiService";
import { FinishedWorkout } from "../../types/workouts";

export default function History() {
  const [workouts, setWorkouts] = useState<FinishedWorkout[] | null>([]);
  const { user } = useAuth();

  useSetTitle("Verlauf");

  const loadWorkout = useCallback(async () => {
    try {
      if (!user) return;
      const response = await apiService.getCompletedWorkouts();
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
    // <div className="content">
    <>
      {!workouts || workouts.length === 0 ? (
        <div>Bisher wurden keine Workouts absolviert</div>
      ) : (
        <>
          {workouts.map((workout) => (
            <HistoryItem key={workout.id} workout={workout} />
          ))}
        </>
      )}
    </>
    // </div>
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
