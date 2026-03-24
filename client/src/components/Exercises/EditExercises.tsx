import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSetTitle } from "../../hooks/useSetTitle";
import { apiService } from "../../services/apiService";
import { Exercise } from "../../types/exercises";
import { ExerciseList } from "./Exercises";
import ReturnButton from "../Buttons/ReturnButton";

export default function EditExercise() {
  const [userExercisesList, setUserExercisesList] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useSetTitle("Übung bearbeiten");

  const fetchUserExercises = useCallback(async () => {
    try {
      const response = await apiService.getUserExercises();

      if (response.status === 200) {
        setUserExercisesList(response.data.exercises);
        console.log("RESPONSE DATA EXERCISES: ", response.data.exercises);
      } else {
        setUserExercisesList([]);
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

  if (!userExercisesList || userExercisesList.length === 0) {
    return (
      <>
        <p>Keine Übungen gefunden</p>
        <div className="button-container">
          <ReturnButton onBack={() => navigate("/exercises")} />
        </div>
      </>
    );
  }

  return (
    <>
      <ExerciseList
        exerciseList={userExercisesList}
        isLoading={isLoading}
        onUpdateSuccess={fetchUserExercises}
      />
      <div className="button-container">
        <ReturnButton onBack={() => navigate("/exercises")} />
      </div>
    </>
  );
}
