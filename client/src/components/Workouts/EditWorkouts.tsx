import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useWorkoutManager } from "../../hooks/useWorkoutManager";
import { apiService } from "../../services/apiService";
import stylesLayout from "../../styles/Layout.module.css";
import { CombinedExercise } from "../../types/exercises";
import { Workout } from "../../types/workouts";
import ExerciseSelectionList from "../Exercises/ExerciseSelectionList";
import WorkoutExercises from "./WorkoutExercises";
import { WorkoutList as WorkoutPlans } from "./Workouts";

export default function EditWorkouts() {
  const [workoutPlans, setWorkoutPlans] = useState<Workout[]>([]);
  const [allExercises, setAllExercises] = useState<CombinedExercise[]>([]);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<number | null>(
    null
  );
  const [workoutName, setWorkoutName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // const [open, setOpen] = useState<boolean>(false);
  // const workoutId = useRef(selectedWorkoutId);
  const { user } = useAuth();

  const {
    workoutList,
    setWorkoutList,
    isSelecting,
    setIsSelecting,
    updateExerciseInWorkout,
    handleAddSet,
    handleRemoveSet,
    removeExerciseFromWorkout,
    addExerciseToWorkout,
  } = useWorkoutManager();

  const navigate = useNavigate();

  useEffect(() => {
    const fetchAllExercises = async () => {
      try {
        if (!user || user.id === undefined || user.id === null) return;
        const response = await apiService.getAllExercises(user.id);
        setAllExercises(response.data.exercises);
      } catch (error) {
        console.error("Fehler beim Abrufen aller Übungen:", error);
      }
    };
    fetchAllExercises();
  }, [user]);

  const loadAllWorkouts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiService.getAllWorkouts();
      setWorkoutPlans(response.data.workouts);
    } catch (error) {
      console.error("Fehler beim Abrufen der Workouts:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllWorkouts();
  }, [loadAllWorkouts]);

  const loadExercises = useCallback(async () => {
    if (!user || selectedWorkoutId === null) return;
    setIsLoading(true);
    try {
      const response = await apiService.getWorkoutExercises(
        selectedWorkoutId,
        user.id
      );
      setWorkoutList(response.data.exercises);
      setWorkoutName(response.data.title);
    } catch (error) {
      console.error("Fehler beim Laden der Workout-Übungen:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedWorkoutId, user, setWorkoutList]);

  useEffect(() => {
    if (selectedWorkoutId !== null) {
      loadExercises();
    } else {
      setWorkoutList([]);
      setWorkoutName("");
    }
  }, [selectedWorkoutId, loadExercises, setWorkoutList]);

  const handleSaveWorkout = async () => {
    try {
      if (!user || selectedWorkoutId === null) {
        setError("Benutzer ID oder Trainingsplan-ID fehlt.");
        throw new Error();
      }

      if (workoutName.trim().length === 0) {
        setError("Trainingsname darf nicht leer sein.");
        throw new Error("Trainingsname darf nicht leer sein.");
      }

      if (workoutList.length === 0) {
        setError("Trainingsplan muss mindestens eine Übung enthalten.");
        throw new Error("Trainingsplan muss mindestens eine Übung enthalten.");
      }

      if (workoutList.filter((ex) => ex.sets.length === 0).length > 0) {
        setError("Jede Übung muss mindestens einen Satz enthalten.");
        throw new Error("Jede Übung muss mindestens einen Satz enthalten.");
      }
      const response = await apiService.updateWorkout(
        workoutName,
        user.id,
        selectedWorkoutId!,
        workoutList
      );
      if (response.status === 200) navigate("/workouts");
    } catch (error) {
      console.error("Fehler beim Speichern des Trainingsplans:", error);
    }
  };

  const handlePlanSelect = (workoutId: number) => {
    setSelectedWorkoutId(workoutId);
  };

  const handleBackToList = () => {
    setSelectedWorkoutId(null);
  };

  if (isSelecting) {
    return (
      <ExerciseSelectionList
        allExercises={allExercises}
        onBack={() => setIsSelecting(false)}
        workoutList={workoutList}
        onSelectExercise={addExerciseToWorkout}
      />
    );
  }

  return (
    <div className="content">
      <h2 className={stylesLayout.pageTitle}>Edit Workout</h2>
      {selectedWorkoutId !== null ? (
        <>
          {error && <p style={{ color: "var(--c-danger)" }}>{error}</p>}
          <input
            className="input"
            style={{ maxWidth: "20rem" }}
            type="text"
            placeholder="Name des Trainingsplans"
            value={workoutName}
            onChange={(e) => setWorkoutName(e.target.value)}
          />
          <WorkoutExercises
            onBack={handleBackToList}
            onRemove={removeExerciseFromWorkout}
            onUpdate={(key, setIndex, field, value) => {
              const numericValue = Number(value);
              if (!isNaN(numericValue)) {
                updateExerciseInWorkout(key, setIndex, field, numericValue);
              }
            }}
            workoutList={workoutList}
            onAddSet={handleAddSet}
            onRemoveSet={handleRemoveSet}
          />
          <div className="button-container">
            <button
              className="button"
              onClick={() => setSelectedWorkoutId(null)}
            >
              Zurück
            </button>
            <button className="button" onClick={() => setIsSelecting(true)}>
              Hinzufügen
            </button>
            <button className="button" onClick={handleSaveWorkout}>
              Bestätigen
            </button>
          </div>
        </>
      ) : (
        <>
          <WorkoutPlans
            isLoading={isLoading}
            workoutList={workoutPlans}
            onClick={handlePlanSelect}
          />
          <button className="button" onClick={() => navigate("/workouts")}>
            Zurück
          </button>
        </>
      )}
    </div>
  );
}
