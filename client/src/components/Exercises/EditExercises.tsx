import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSetTitle } from "../../hooks/useSetTitle";
import { apiService } from "../../services/apiService";
import { CombinedExercise } from "../../types/exercises";
import { ExerciseList } from "./Exercises";
import ReturnButton from "../ReturnButton";

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

      if (response.status === 200) {
        setUserExercisesList(response.data.exercises);
        console.log(response.data.exercises);
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
