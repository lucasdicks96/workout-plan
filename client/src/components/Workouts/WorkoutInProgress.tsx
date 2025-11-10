import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSetTitle } from "../../hooks/useSetTitle";
import { useWorkoutManager } from "../../hooks/useWorkoutManager";
import { apiService } from "../../services/apiService";
import stylesButton from "../../styles/Button.module.css";
import PlayPauseButton from "../Buttons/PlayPauseButton";
import ReturnButton from "../Buttons/ReturnButton";
import StopCompleteButton from "../Buttons/StopCompleteButton";
import WorkoutExercises from "./WorkoutExercises";

const WORKOUT_IN_PROGRESS_KEY = "workoutInProgressState";
export default function WorkoutInProgress() {
  const [workoutName, setWorkoutName] = useState<string>("");
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [workoutId, setWorkoutId] = useState<number | null>(null);
  // const savedWorkoutId = localStorage.getItem("startWorkoutId");
  // let workoutId: number | null = null;
  // if (savedWorkoutId) {
  //   const temp = JSON.parse(savedWorkoutId);
  //   workoutId = parseInt(temp);
  // }
  const startedWorkoutId = useRef<number | null>(null);

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

  useEffect(() => {
    const savedWorkoutId = localStorage.getItem("startWorkoutId");
    if (savedWorkoutId && startedWorkoutId.current === null) {
      // Nur setzen, wenn Ref noch leer
      try {
        const temp = JSON.parse(savedWorkoutId);
        const parsedId = typeof temp === "number" ? temp : parseInt(temp, 10);
        if (!isNaN(parsedId) && parsedId > 0) {
          startedWorkoutId.current = parsedId;
          setWorkoutId(parsedId);
          console.log(
            "Workout ID einmalig aus localStorage gesetzt:",
            parsedId
          );
        } else {
          console.error("Ungültige Workout ID aus localStorage:", temp);
        }
      } catch (error) {
        console.error("Fehler beim Parsen von startWorkoutId:", error);
      }
    } else if (!savedWorkoutId) {
      console.warn(
        "Keine startWorkoutId in localStorage gefunden – ID wird erst beim Start gesetzt"
      );
    }
  }, []);

  const loadWorkout = useCallback(async () => {
    try {
      const id = workoutId ?? startedWorkoutId.current;
      if (id === null || id === undefined) {
        return console.error("Keine Workout ID gefunden");
      }
      const response = await apiService.getWorkoutExercises(id);
      console.log(response.data);
      if (
        !response.data ||
        !response.data.workout.exercises ||
        !response.data.workout.title
      ) {
        return console.error("Keine Übungen im Trainingsplan gefunden.");
      }
      console.log("WORKOUTDATA: ", response.data);
      setWorkoutList(response.data.workout.exercises);
      setWorkoutName(response.data.workout.title);
    } catch (error) {
      setWorkoutList([]);
      console.error("Fehler beim Laden des Trainingsplans", error);
    }
  }, [setWorkoutList, workoutId]);

  // Lade Workout aus State, sonst API Call
  useEffect(() => {
    try {
      const savedStateJSON = localStorage.getItem(WORKOUT_IN_PROGRESS_KEY);
      if (savedStateJSON) {
        const savedState = JSON.parse(savedStateJSON);
        if (startedWorkoutId.current === null) {
          const savedId = savedState.startedWorkoutId;
          const parsedSavedId =
            typeof savedId === "number" && !isNaN(savedId) ? savedId : null;
          if (parsedSavedId) {
            startedWorkoutId.current = parsedSavedId;
            setWorkoutId(parsedSavedId);
            console.log(
              "Workout ID einmalig aus savedState gesetzt:",
              parsedSavedId
            );
          }
        }

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
  }, [loadWorkout, setWorkoutList, workoutId]);

  useEffect(() => {
    // Nur speichern, wenn bereits gestartet wurde
    if (startTime && startedWorkoutId.current !== null) {
      const stateToSave = {
        startedWorkoutId: startedWorkoutId.current,
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
      if (startedWorkoutId.current === null) {
        if (!workoutId) {
          console.error("Keine Workout ID zum Starten verfügbar");
          return;
        }
        startedWorkoutId.current = workoutId;
        console.log(
          "Workout ID einmalig beim ersten Start gesetzt:",
          startedWorkoutId.current
        );
      } else {
        console.log(
          "Workout ID bereits gesetzt, überspringe Setzen:",
          startedWorkoutId.current
        );
      }
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
    try {
      const endTime: number = Date.now();

      if (!startTime || startTime === null) return;
      if (!pauseTime || pauseTime === null) return;
      if (
        !startedWorkoutId.current ||
        startedWorkoutId.current === null ||
        isNaN(startedWorkoutId.current)
      ) {
        console.error(
          "Keine gültige Workout ID zum Speichern gefunden.",
          startedWorkoutId.current
        );
        return;
      }
      const response = await apiService.saveCompletedWorkout(
        startedWorkoutId.current,
        startTime,
        endTime,
        pauseTime,
        elapsedTime,
        workoutList,
        workoutName
      );
      console.log(response.data);
      localStorage.removeItem(WORKOUT_IN_PROGRESS_KEY);
      localStorage.removeItem("startWorkoutId");
      navigate("/workouts");
    } catch (error) {
      console.error("Fehler beim Speichern des Workouts: ", error);
    }
  };

  const handleCancel = () => {
    const confirm = window.confirm(
      "Möchten Sie das laufende Workout wirklich abbrechen? Alle Daten gehen verloren."
    );
    if (confirm) {
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

  useSetTitle(workoutName);

  if (!workoutName && !startTime) {
    return <div>Lade Workout...</div>;
  }

  return (
    // <div className={`${stylesLayout.content}`}>
    <>
      {/* <h2 className={stylesLayout.pageTitle}>{workoutName}</h2> */}
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
      <div className={`${stylesButton.buttonContainer}`}>
        <ReturnButton onBack={handleCancel} />
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
      {/* </div> */}
    </>
  );
}
