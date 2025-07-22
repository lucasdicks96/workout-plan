import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { apiService } from "../../services/apiService";
import stylesDashboard from "../../styles/Dashboard.module.css"; // Import dashboard styles
import "../../styles/global.css"; // Import global styles
import stylesLayout from "../../styles/Layout.module.css";
import { CombinedExercise } from "../../types/exercises";
import { ExerciseList } from "./ExercisesList";

export default function EditExercise() {
  const [userExercisesList, setUserExercisesList] = useState<
    CombinedExercise[]
  >([]);
  const uid = useRef<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchUserExercises() {
      try {
        if (!user || user.id === undefined || user.id === null) {
          console.error("User is not logged in or does not have an ID.");
          return;
        }
        uid.current = user.id;

        const exerciseList = await apiService.getUserExercises(user.id);
        if (exerciseList.status === 200) {
          setUserExercisesList(exerciseList.data.exercise);
          // console.log(
          //   "User exercises fetched successfully:",
          //   exerciseList.data.exercise
          // );
        } else {
          console.error("Failed to fetch user exercises");
        }
      } catch (error) {
        console.error("Error fetching user exercises:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchUserExercises();
  }, [user]);

  return (
    <div className={stylesDashboard.content}>
      <h2 className={stylesLayout.pageTitle}>Übungen bearbeiten</h2>
      <ExerciseList
        exerciseList={userExercisesList}
        isLoading={isLoading}
        userId={uid.current}
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
