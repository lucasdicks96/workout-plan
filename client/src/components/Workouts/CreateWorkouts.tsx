import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useWorkoutManager } from "../../hooks/useWorkoutManager";
import { apiService } from "../../services/apiService";
import stylesLayout from "../../styles/Layout.module.css";
import { CombinedExercise } from "../../types/exercises";
import ExerciseSelectionList from "../Exercises/ExerciseSelectionList";
import WorkoutExercises from "./WorkoutExercises";

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
  } = useWorkoutManager();

  const [allExercises, setAllExercises] = useState<CombinedExercise[]>([]);

  const [workoutName, setWorkoutName] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { user } = useAuth();
  const uid = useRef(0);
  const navigate = useNavigate();

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
      if (!user || user.id === undefined || user.id === null) {
        console.error("User is not logged in or does not have an ID.");
        return;
      }
      const response = await apiService.getAllExercises(user.id);
      uid.current = user.id;
      setAllExercises(response.data.exercises);
    } catch (error) {
      console.error("Fehler beim Abrufen der Übungen:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

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
    console.log("Plan wird erstellt:", {
      name: workoutName,
      userId: uid.current,
      exercises: workoutList,
    });

    try {
      const response = await apiService.createWorkout(
        workoutName,
        uid.current,
        workoutList
      );
      console.log(response);
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
    <div className="content">
      <h2 className={stylesLayout.pageTitle}>Trainingsplan erstellen</h2>
      <input
        className="input"
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
        onRemove={removeExerciseFromWorkout}
        onAddSet={handleAddSet}
        onRemoveSet={handleRemoveSet}
      />
      <div className="button-container">
        <button className="button" onClick={handleBack}>
          Zurück
        </button>
        <button className="button" onClick={() => setIsSelecting(true)}>
          Hinzufügen
        </button>
        <button className="button" onClick={handleCreateWorkout}>
          Erstellen
        </button>
      </div>
    </div>
  );
}
