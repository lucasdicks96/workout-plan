import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSetTitle } from "../../hooks/useSetTitle";
import { useWorkoutManager } from "../../hooks/useWorkoutManager";
import { apiService } from "../../services/apiService";
import { CombinedExercise } from "../../types/exercises";
import ExerciseSelectionList from "../Exercises/ExerciseSelectionList";
import WorkoutExercises from "./WorkoutExercises";
import ReturnButton from "../ReturnButton";
import AddButton from "../AddButton";
import ConfirmButton from "../ConfirmButton";
import stylesButton from "../../styles/Button.module.css";

export default function CreateWorkout() {
  const {
    updateExerciseInWorkout,
    handleAddSet,
    handleRemoveSet,
    removeExerciseFromWorkout,
    workoutList,
    setWorkoutList,
    isSelecting,
    setIsSelecting,
    addExerciseToWorkout,
    reorderWorkoutList,
  } = useWorkoutManager();

  const [allExercises, setAllExercises] = useState<CombinedExercise[]>([]);

  const [workoutName, setWorkoutName] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useSetTitle("Plan erstellen");

  const isInitialMount = useRef(true);

  useEffect(() => {
    const savedList = localStorage.getItem("createPlan");
    const savedName = localStorage.getItem("planName");

    if (savedList) setWorkoutList(JSON.parse(savedList));
    if (savedName) setWorkoutName(JSON.parse(savedName));
  }, [setWorkoutList]);

  // Wenn erster Mount, dann initialMount = false und return
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    // Wird nach dem 2. rendern ausgeführt
    localStorage.setItem("createPlan", JSON.stringify(workoutList));
    localStorage.setItem("planName", JSON.stringify(workoutName));
  }, [workoutList, workoutName]);

  const loadAllExercises = useCallback(async () => {
    try {
      const response = await apiService.getAllExercises();
      setAllExercises(response.data.exercises);
    } catch (error) {
      console.error("Fehler beim Abrufen der Übungen:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllExercises();
  }, [loadAllExercises]);

  const handleCreateWorkout = async () => {
    if (!workoutName.trim()) {
      alert("Bitte gib dem Trainingsplan einen Namen.");
      return;
    }
    if (workoutList.length === 0) {
      alert("Füge mindestens eine Übung zum Plan hinzu.");
      return;
    }

    try {
      await apiService.createWorkout(workoutName, workoutList);
      navigate("/workouts");
    } catch (error) {
      console.error("Fehler beim Erstellen des Plans", error);
    } finally {
      localStorage.removeItem("createPlan");
      localStorage.removeItem("planName");
    }
  };

  const handleBack = () => {
    navigate("/workouts");
    localStorage.removeItem("createPlan");
    localStorage.removeItem("planName");
  };

  if (isLoading) {
    return <p>Lade Daten...</p>;
  }

  if (isSelecting) {
    return (
      <ExerciseSelectionList
        allExercises={allExercises}
        workoutList={workoutList}
        onSelectExercise={addExerciseToWorkout}
        onBack={() => setIsSelecting(false)}
      />
    );
  }
  return (
    <>
      <input
        className="input"
        name="title"
        style={{ maxWidth: "20rem" }}
        type="text"
        placeholder="Name des Trainingsplans"
        value={workoutName}
        onChange={(e) => setWorkoutName(e.target.value)}
      />
      <WorkoutExercises
        workoutList={workoutList}
        onUpdate={(key, setIndex, field, value) => {
          const numericValue = Number(value);
          if (!isNaN(numericValue)) {
            updateExerciseInWorkout(key, setIndex, field, numericValue);
          }
        }}
        onReorderWorkoutList={reorderWorkoutList}
        onRemove={removeExerciseFromWorkout}
        onAddSet={handleAddSet}
        onRemoveSet={handleRemoveSet}
      />
      <div className={stylesButton.buttonContainer}>
        <ReturnButton
          onBack={handleBack}
          className={`${stylesButton.button}, ${stylesButton.left}`}
        />
        <AddButton onAdd={() => setIsSelecting(true)} />
        <ConfirmButton
          onConfirm={handleCreateWorkout}
          className={`${stylesButton.button}, ${stylesButton.right}`}
        />
      </div>
    </>
  );
}
