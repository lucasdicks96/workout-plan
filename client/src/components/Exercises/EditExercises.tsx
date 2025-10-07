import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSetTitle } from "../../hooks/useSetTitle";
import { apiService } from "../../services/apiService";
import { CombinedExercise } from "../../types/exercises";
import { ExerciseList } from "./Exercises";

export default function EditExercise() {
  const [userExercisesList, setUserExercisesList] = useState<
    CombinedExercise[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useSetTitle("Übung bearbeiten");

  const fetchUserExercises = useCallback(async () => {
    try {
      const response = await apiService.getUserExercises();
      console.log(response.data.exercises);

      if (response.status === 200) {
        setUserExercisesList(response.data.exercises);
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
  }, []);

  useEffect(() => {
    fetchUserExercises();
  }, [fetchUserExercises]);

  return (
    // <div className={stylesDashboard.dashboardContent}>
    <>
      <ExerciseList
        exerciseList={userExercisesList}
        isLoading={isLoading}
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
    </>
    // </div>
  );
}
