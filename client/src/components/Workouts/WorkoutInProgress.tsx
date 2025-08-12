import { useCallback, useEffect, useState, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { apiService } from "../../services/apiService";
import stylesLayout from "../../styles/Layout.module.css";
import { ExerciseForWorkout } from "../../types/exercises";
import PlayPauseButton from "../PlayPauseButton";
import WorkoutExercises from "./WorkoutExercises";

export default function WorkoutInProgress() {
  const [workoutList, setWorkoutList] = useState<ExerciseForWorkout[]>();
  const [workoutName, setWorkoutName] = useState<string>("");
  const [inProgress, setInProgress] = useState<boolean>(false);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const { user } = useAuth();
  let startTime = useRef<Date>(new Date());
  const loadWorkout = useCallback(async () => {
    try {
      if (!user) {
        console.error("User is not logged in or does not have an ID.");
        return;
      }
      let savedId = sessionStorage.getItem("startWorkoutId");
      let workoutId: number = 0;
      if (savedId && savedId !== null) {
        savedId = JSON.parse(savedId);
        workoutId = parseInt(savedId as string);
      } else return;
      const response = await apiService.getWorkoutExercises(workoutId, user.id);
      console.log(response.data);
      if (!response.data || !response.data.exercises || !response.data.title) {
        return console.error("Keine Übungen im Trainingsplan gefunden.");
      }
      setWorkoutList(response.data.exercises);
      setWorkoutName(response.data.title);
    } catch (error) {
      console.error("Fehler beim Laden des Trainingsplans", error);
    }
  }, [user]);
  useEffect(() => {
    loadWorkout();
  }, [loadWorkout]);

  const onStart = () => {
    const time = new Date();
    // console.log("Training gestartet um: ", new Date().toLocaleTimeString());
    console.log(time);
    setInProgress(!inProgress);
  };

  return (
    <div className="content">
      <h2 className={stylesLayout.pageTitle}>{workoutName}</h2>
      <WorkoutExercises workoutList={workoutList || []} />
      <div className="button-container">
        <PlayPauseButton
          className="button"
          isPlaying={inProgress}
          onStart={onStart}
        />
      </div>
    </div>
  );
}
