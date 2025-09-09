import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { apiService } from "../../services/apiService";
import stylesDashboard from "../../styles/Dashboard.module.css";
import stylesLayout from "../../styles/Layout.module.css";
import { CombinedExercise } from "../../types/exercises";
import { ExerciseList } from "./Exercises";

export default function EditExercise() {
  const [userExercisesList, setUserExercisesList] = useState<
    CombinedExercise[]
  >([]);
  const uid = useRef<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchUserExercises = useCallback(async () => {
    try {
      if (!user || user.id === undefined || user.id === null) {
        console.error("User is not logged in or does not have an ID.");
        return;
      }
      uid.current = user.id;

      const response = await apiService.getUserExercises(user.id);

      if (response.status === 200) {
        setUserExercisesList(response.data.exercise);
      } else {
        setUserExercisesList([]);
        console.log("Else Block user exercises", setUserExercisesList([]));
      }
    } catch (error) {
      console.error("Error fetching user exercises:", error);
      setUserExercisesList([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchUserExercises();
  }, [fetchUserExercises]);

  return (
    <div className={stylesDashboard.dashboardContent}>
      <h2 className={stylesLayout.pageTitle}>Übungen bearbeiten</h2>
      <ExerciseList
        exerciseList={userExercisesList}
        isLoading={isLoading}
        userId={uid.current}
        onUpdateSuccess={fetchUserExercises}
      />
      <div className="button-container">
        <button
          className="button"
          onClick={() => navigate("/exercises")}
          type="button"
        >
          Zurück
        </button>
      </div>
    </div>
  );
}
