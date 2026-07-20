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

/** 
 * Schlüssel für den LocalStorage, unter dem der Live-Zustand des aktuell laufenden Workouts
 * (Timer, Sätze, Pausenzeiten) zwischengespeichert wird, um Seiten-Reloads zu überstehen.
 */
const WORKOUT_IN_PROGRESS_KEY = "workoutInProgressState";

/**
 * Hauptkomponente für die aktive Trainingssession ("Workout in Progress").
 * 
 * Versteuert den gesamten Lebenszyklus eines Trainings:
 * - Stoppuhr mit Millisekunden-Präzision (Start, Pause, Resume, Stop)
 * - Automatische Wiederherstellung bei Browser-Absturz oder Page-Reload über LocalStorage
 * - Live-Aktualisierung von Übungssätzen, Gewichten und Wiederholungen via `useWorkoutManager`
 * - Übermittlung des abgeschlossenen Trainings an das Backend
 * 
 * @returns {JSX.Element} Die gerenderte Ansicht des aktiven Trainings inklusive Timer und Steuerung.
 */
export default function WorkoutInProgress() {
  const [workoutName, setWorkoutName] = useState<string>("");
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [workoutId, setWorkoutId] = useState<number | null>(null);
  
  /**
   * Ref auf die ID des aktiven Trainings.
   * Wird als Ref statt als State gespeichert, um endlose Re-Render-Schleifen im Timer
   * und in den LocalStorage-Effekten zu verhindern.
   */
  const startedWorkoutId = useRef<number | null>(null);

  const navigate = useNavigate();

  const {
    updateExerciseInWorkout,
    handleAddSet,
    handleRemoveSet,
    workoutList,
    setWorkoutList,
  } = useWorkoutManager();

  // --- Timer & Zeit-State ---
  const [startTime, setStartTime] = useState<number | null>(null);
  const [pauseTime, setPauseTime] = useState<number | null>(null);
  const [totalPausedDuration, setTotalPausedDuration] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  
  /** Ref für den laufenden `setInterval`-Timer (100ms-Takt) zur sauberen Bereinigung beim Unmount. */
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Initialer Effect: Liest beim Mounten der Komponente eine neu gestartete Workout-ID
   * aus dem LocalStorage ("startWorkoutId") aus und validiert diese als Zahl.
   */
  useEffect(() => {
    const savedWorkoutId = localStorage.getItem("startWorkoutId");
    if (savedWorkoutId && startedWorkoutId.current === null) {
      try {
        const temp = JSON.parse(savedWorkoutId);
        const parsedId = typeof temp === "number" ? temp : parseInt(temp, 10);
        if (!isNaN(parsedId) && parsedId > 0) {
          startedWorkoutId.current = parsedId;
          setWorkoutId(parsedId);
        } else {
          console.error("Ungültige Workout ID aus localStorage:", temp);
        }
      } catch (error) {
        console.error("Fehler beim Parsen von startWorkoutId:", error);
      }
    }
  }, []);

  /**
   * Lädt die Daten des letzten absolvierten Trainings dieses Plans aus dem Backend,
   * um die Sätze, Gewichte und Wiederholungen für die neue Session vorzubefüllen.
   * 
   * @async
   * @returns {Promise<void>}
   */
  const loadWorkout = useCallback(async () => {
    try {
      const id = workoutId ?? startedWorkoutId.current;
      if (id === null || id === undefined) {
        return console.error("Keine Workout ID gefunden");
      }
      const response = await apiService.getLastWorkout(id);

      if (!response.data || !response.data.exercises || !response.data.title) {
        return console.error("Keine Übungen im Trainingsplan gefunden.");
      }

      setWorkoutList(response.data.exercises);
      setWorkoutName(response.data.title);
    } catch (error) {
      setWorkoutList([]);
      console.error("Fehler beim Laden des Trainingsplans", error);
    }
  }, [setWorkoutList, workoutId]);

  /**
   * Hydrations-Effect: Prüft, ob ein unterbrochenes Training im LocalStorage liegt (`WORKOUT_IN_PROGRESS_KEY`).
   * Falls ja, wird der genaue Timer- und Übungszustand wiederhergestellt.
   * Falls nein, wird das Training neu über `loadWorkout()` initialisiert.
   */
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

  /**
   * Auto-Save-Effect: Speichert den aktuellen Fortschritt bei jedem Render-Zyklus synchron
   * im LocalStorage ab, sobald das Training gestartet wurde (`startTime` existiert).
   * 
   * Hinweis: Absichtlich ohne Dependency-Array, damit jede Set- oder Gewichtsänderung direkt greift.
   */
  useEffect(() => {
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
        JSON.stringify(stateToSave),
      );
    }
  });

  /**
   * Timer-Engine Effect: Startet oder stoppt den 100ms-Intervallgeber basierend auf `isRunning`.
   * Berechnet die exakte `elapsedTime` aus der Differenz zwischen Jetzt-Zeit, Start-Zeit und Pausenzeit,
   * um Drift-Effekte bei Browser-Tab-Wechseln zu verhindern.
   */
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
    
    // Sofortige Einmal-Berechnung beim Statuswechsel
    if (startTime) {
      if (pauseTime) {
        setElapsedTime(pauseTime - startTime - totalPausedDuration);
      } else {
        setElapsedTime(Date.now() - startTime - totalPausedDuration);
      }
    }
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, startTime, pauseTime, totalPausedDuration]);

  /**
   * Steuert die Play/Pause-Logik der Stoppuhr:
   * - Beim ersten Start: Initialisiert `startTime` und aktiviert den Timer.
   * - Bei Pause: Speichert den aktuellen Zeitstempel in `pauseTime`.
   * - Bei Resume: Berechnet die abgelaufene Pausendauer und addiert sie zu `totalPausedDuration`.
   */
  const handleTogglePlayPause = () => {
    const now = Date.now();
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
    if (!startTime) {
      if (startedWorkoutId.current === null) {
        if (!workoutId) {
          console.error("Keine Workout ID zum Starten verfügbar");
          return;
        }
        startedWorkoutId.current = workoutId;
      }
      setStartTime(now);
      setIsRunning(true);
      setIsFinished(false);
      return;
    }
    if (isRunning) {
      setPauseTime(now);
      setIsRunning(false);
    } else if (pauseTime) {
      const pauseDuration = now - pauseTime;
      setTotalPausedDuration((prev) => prev + pauseDuration);
      setIsRunning(true);
      setPauseTime(null);
    }
  };

  /**
   * Stoppt das laufende Training, hält die Stoppuhr an und versetzt die Ansicht
   * in den Finish-Modus (bereit zum Abspeichern).
   */
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

  /**
   * Schließt das Training erfolgreich ab:
   * Übermittelt die Zeiten und den finalen Übungsplan an die API, bereinigt den LocalStorage
   * und navigiert zurück zur Workout-Übersicht.
   * 
   * @async
   * @returns {Promise<void>}
   */
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
        console.error("Keine gültige Workout ID zum Speichern gefunden.");
        return;
      }
      await apiService.postCompletedWorkout({
        workoutId: startedWorkoutId.current,
        startTime,
        endTime,
        pauseTime: totalPausedDuration,
        duration: elapsedTime,
        exercises: workoutList,
        title: workoutName,
      });

      localStorage.removeItem(WORKOUT_IN_PROGRESS_KEY);
      localStorage.removeItem("startWorkoutId");
      navigate("/workouts");
    } catch (error) {
      console.error("Fehler beim Speichern des Workouts: ", error);
    }
  };

  /**
   * Bricht das aktuelle Training nach einer Bestätigungsabfrage ab.
   * Löscht den Zwischenspeicher aus dem LocalStorage und kehrt zur Übersicht zurück.
   */
  const handleCancel = () => {
    const confirm = window.confirm(
      "Möchten Sie das laufende Workout wirklich abbrechen? Alle Daten gehen verloren.",
    );
    if (confirm) {
      localStorage.removeItem(WORKOUT_IN_PROGRESS_KEY);
      localStorage.removeItem("startWorkoutId");
      navigate("/workouts");
    }
  };

  /**
   * Formatiert eine Zeitangabe in Millisekunden in ein lesbares Stunden/Minuten/Sekunden-Format.
   * 
   * @param {number} ms - Die verstrichene Zeit in Millisekunden.
   * @returns {string} Die formatierte Zeichenkette im Format "HH:MM:SS" (z. B. "01:15:30").
   */
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0",
    )}:${String(seconds).padStart(2, "0")}`;
  };

  useSetTitle("Workout starten");

  if (!workoutName && !startTime) {
    return <div>Lade Workout...</div>;
  }

  return (
    <>
      {" "}
      <input
        className="input"
        name="name"
        style={{ maxWidth: "20rem" }}
        type="text"
        placeholder="Name des Trainingsplans"
        value={workoutName}
        onChange={(e) => setWorkoutName(e.target.value)}
      />
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
      <div className={`${stylesButton["button-container"]}`}>
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
    </>
  );
}