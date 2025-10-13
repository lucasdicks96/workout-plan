import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSetTitle } from "../../hooks/useSetTitle";
import { useWorkoutManager } from "../../hooks/useWorkoutManager";
import { apiService } from "../../services/apiService";
import { CombinedExercise } from "../../types/exercises";
import { Workout } from "../../types/workouts";
import ExerciseSelectionList from "../Exercises/ExerciseSelectionList";
import WorkoutExercises from "./WorkoutExercises";
import { WorkoutList as WorkoutPlans } from "./Workouts";
import ReturnButton from "../ReturnButton";
import ConfirmButton from "../ConfirmButton";
import AddButton from "../AddButton";
import styles from "../../styles/Exercises.module.css";

export default function EditWorkouts() {
  const [workoutPlans, setWorkoutPlans] = useState<Workout[]>([]);
  const [allExercises, setAllExercises] = useState<CombinedExercise[]>([]);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<number | null>(
    null
  );
  const [workoutName, setWorkoutName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useSetTitle("Trainingspläne bearbeiten");

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
    reorderWorkoutList,
  } = useWorkoutManager();

  const navigate = useNavigate();

  useEffect(() => {
    const fetchAllExercises = async () => {
      try {
        const response = await apiService.getAllExercises();
        setAllExercises(response.data.exercises);
      } catch (error) {
        console.error("Fehler beim Abrufen aller Übungen:", error);
      }
    };
    fetchAllExercises();
  }, []);

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
    if (selectedWorkoutId === null) return console.error("Workout-ID NULL");
    setIsLoading(true);
    try {
      const response = await apiService.getWorkoutExercises(selectedWorkoutId);
      setWorkoutList(response.data.workout.exercises);
      setWorkoutName(response.data.workout.title);
    } catch (error) {
      console.error("Fehler beim Laden der Workout-Übungen:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedWorkoutId, setWorkoutList]);

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
      if (selectedWorkoutId === null) {
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
        selectedWorkoutId,
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
  const handleDelete = async (workoutId: number) => {
    try {
      await apiService.deleteWorkout(workoutId);
      setSelectedWorkoutId(null);
      loadAllWorkouts();
    } catch (error) {
      console.error("Fehler beim Löschen des Plans", error);
    }
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
    <>
      {selectedWorkoutId ? (
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
            onReorderWorkoutList={reorderWorkoutList}
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
            <ReturnButton onBack={() => setSelectedWorkoutId(null)} />
            <AddButton onAdd={() => setIsSelecting(true)} />
            <ConfirmButton onConfirm={handleSaveWorkout} />
          </div>
        </>
      ) : (
        <>
          <div className={styles.exerciseList}>
            <WorkoutPlans
              isLoading={isLoading}
              workoutList={workoutPlans}
              onClick={handlePlanSelect}
              onDelete={handleDelete}
            />
          </div>
          <ReturnButton onBack={() => navigate("/workouts")} />
        </>
      )}
    </>
  );
}
