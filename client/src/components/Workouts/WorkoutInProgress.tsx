import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useWorkoutManager } from "../../hooks/useWorkoutManager";
import { apiService } from "../../services/apiService";
import stylesLayout from "../../styles/Layout.module.css";
import PlayPauseButton from "../PlayPauseButton";
import StopCompleteButton from "../StopCompleteButton";
import WorkoutExercises from "./WorkoutExercises";
import { useNavigate } from "react-router-dom";

const WORKOUT_IN_PROGRESS_KEY = "workoutInProgressState";
export default function WorkoutInProgress() {
  const [workoutName, setWorkoutName] = useState<string>("");
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const savedWorkoutId = localStorage.getItem("startWorkoutId");
  let workoutId: number | null = null;
  if (savedWorkoutId) {
    const temp = JSON.parse(savedWorkoutId);
    workoutId = parseInt(temp);
  }
  const { user } = useAuth();

  const navigate = useNavigate();

  const {
    updateExerciseInWorkout,
    handleAddSet,
    handleRemoveSet,
    workoutList,
    setWorkoutList,
  } = useWorkoutManager();

  const [startTime, setStartTime] = useState<number | null>(null);
  const [pauseTime, setPauseTime] = useState<number | null>(null);
  const [totalPausedDuration, setTotalPausedDuration] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Lade Workout aus State, sonst API Call
  useEffect(() => {
    try {
      const savedStateJSON = localStorage.getItem(WORKOUT_IN_PROGRESS_KEY);
      if (savedStateJSON) {
        const savedState = JSON.parse(savedStateJSON);
        setWorkoutList(savedState.workoutList || []);
        setWorkoutName(savedState.workoutName || "");
        setStartTime(savedState.startTime || null);
        setPauseTime(savedState.pauseTime || null);
        setTotalPausedDuration(savedState.totalPausedDuration || 0);
        setIsRunning(savedState.isRunning || false);
        setIsFinished(savedState.isFinished || false);
      } else {
        loadWorkout();
      }
    } catch (error) {
      console.error("Fehler beim Laden des Zustands aus localStorage:", error);
      loadWorkout();
    }
  }, []);

  useEffect(() => {
    // Nur speichern, wenn bereits gestartet wurde
    if (startTime) {
      const stateToSave = {
        workoutList,
        workoutName,
        startTime,
        pauseTime,
        totalPausedDuration,
        isRunning,
        isFinished,
      };
      localStorage.setItem(
        WORKOUT_IN_PROGRESS_KEY,
        JSON.stringify(stateToSave)
      );
    }
  });

  // Timeraktualisierung
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        if (startTime) {
          const now = Date.now();
          setElapsedTime(now - startTime - totalPausedDuration);
        }
      }, 100);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    // Aktualisiere Zeit nach Pause oder Stopp
    {
      if (startTime) {
        if (pauseTime) {
          setElapsedTime(pauseTime - startTime - totalPausedDuration);
        } else {
          setElapsedTime(Date.now() - startTime - totalPausedDuration);
        }
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, startTime, pauseTime, totalPausedDuration]);

  const loadWorkout = useCallback(async () => {
    try {
      if (!user) {
        console.error("Benutzer ist nicht eingeloggt oder hat keine ID.");
        return;
      }
      if (!workoutId || workoutId === null) {
        console.error("Keine Workout ID gefunden");
        return;
      }
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
  }, [user, setWorkoutList, workoutId]);

  const handleTogglePlayPause = () => {
    const now = Date.now();
    // Workout wurde gestoppt, soll aber fortgesetzt werden
    if (isFinished) {
      setIsFinished(false);
      if (pauseTime) {
        const pauseDuration = now - pauseTime;
        setTotalPausedDuration((prev) => prev + pauseDuration);
        setIsRunning(true);
        setPauseTime(null);
      }
      return;
    }
    // Workout wird zum ersten Mal gestartet
    if (!startTime) {
      setStartTime(now);
      setIsRunning(true);
      setIsFinished(false);
      return;
    }
    // Timer läuft und wird pausiert
    if (isRunning) {
      setPauseTime(now);
      setIsRunning(false);
    }
    // Timer ist pausiert und wird fortgesetzt
    else if (pauseTime) {
      const pauseDuration = now - pauseTime;
      setTotalPausedDuration((prev) => prev + pauseDuration);
      setIsRunning(true);
      setPauseTime(null);
    }
  };

  const handleStop = () => {
    setIsFinished(true);
    setIsRunning(false);
    if (isRunning) {
      setPauseTime(Date.now());
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const handleComplete = async () => {
    // console.log("Workout-Daten zum Abschicken:", workoutList);
    // console.log("Abgelaufene Zeit: " + formatTime(elapsedTime));
    try {
      const endTime: number = Date.now();
      if (!user) {
        console.error("Benutzer ist nicht eingeloggt oder hat keine ID.");
        return;
      }
      if (!workoutId || workoutId === null) {
        console.error("Keine Workout ID gefunden");
        return;
      }
      if (!startTime || startTime === null) return;
      if (!pauseTime || pauseTime === null) return;
      const response = await apiService.finishWorkout(
        user.id,
        workoutId,
        startTime,
        endTime,
        totalPausedDuration,
        elapsedTime,
        workoutList
      );
      console.log(response.data);
    } catch (error) {
      console.error("Fehler beim Speichern des Workouts: ", error);
    } finally {
      localStorage.removeItem(WORKOUT_IN_PROGRESS_KEY);
      localStorage.removeItem("startWorkoutId");
      navigate("/workouts");
    }
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(seconds).padStart(2, "0")}`;
  };

  if (!workoutName && !startTime) {
    return <div>Lade Workout...</div>;
  }

  return (
    <div className="content">
      <h2 className={stylesLayout.pageTitle}>{workoutName}</h2>
      <WorkoutExercises
        workoutList={workoutList || []}
        onUpdate={(key, setIndex, field, value) => {
          const numericValue = Number(value);
          if (!isNaN(numericValue)) {
            updateExerciseInWorkout(key, setIndex, field, numericValue);
          }
        }}
        onAddSet={handleAddSet}
        onRemoveSet={handleRemoveSet}
      />
      <div
        className="timerDisplay"
        style={{ fontSize: "2rem", margin: "20px 0", textAlign: "center" }}
      >
        <span>{formatTime(elapsedTime)}</span>
      </div>
      <div className="button-container">
        <PlayPauseButton
          isPlaying={isRunning}
          onStart={handleTogglePlayPause}
        />
        <StopCompleteButton
          onStop={handleStop}
          onComplete={handleComplete}
          isComplete={isFinished}
        />
      </div>
    </div>
  );
}
