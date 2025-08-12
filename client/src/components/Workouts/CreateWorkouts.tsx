import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { apiService } from "../../services/apiService";
import stylesLayout from "../../styles/Layout.module.css";
import { CombinedExercise } from "../../types/exercises";
import {
  WorkoutExercises as WorkoutExercisesType,
  WorkoutExerciseSets,
} from "../../types/workouts";
import ExerciseSelectionList from "../Exercises/ExerciseSelectionList";
import WorkoutExercises from "./WorkoutExercises";

export default function CreateWorkout() {
  const [allExercises, setAllExercises] = useState<CombinedExercise[]>([]);
  const [workoutList, setWorkoutList] = useState<WorkoutExercisesType[]>(() => {
    const savedList = sessionStorage.getItem("createPlan");
    return savedList ? JSON.parse(savedList) : [];
  });
  const [workoutName, setWorkoutName] = useState<string>(() => {
    const savedName = sessionStorage.getItem("planName");
    return savedName ? JSON.parse(savedName) : "";
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSelecting, setIsSelecting] = useState<boolean>(false);
  const { user } = useAuth();
  const uid = useRef(0);
  const navigate = useNavigate();

  // Speichere die workoutList bei jeder Änderung im sessionStorage
  useEffect(() => {
    sessionStorage.setItem("createPlan", JSON.stringify(workoutList));
    sessionStorage.setItem("planName", JSON.stringify(workoutName));
  }, [workoutList, workoutName]);

  // Lösche die Daten aus dem sessionStorage, wenn die Komponente verlassen wird
  useEffect(() => {
    // Diese Funktion wird ausgeführt, wenn die Komponente "unmounted" wird
    return () => {
      sessionStorage.removeItem("createPlan");
      sessionStorage.removeItem("planName");
    };
  }, []);

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

  const addExerciseToWorkout = (exercise: CombinedExercise) => {
    const newWorkoutExercise: WorkoutExercisesType = {
      ...exercise,
      // workoutId: 0,
      // userId: uid.current,
      sets: [
        {
          setNumber: 1,
          repetitions: 10,
          weight: 10,
        },
      ],
    };
    setWorkoutList((current) => [...current, newWorkoutExercise]);
    setIsSelecting(false); // Zurück zur Hauptansicht
  };

  const updateExerciseInWorkout = (
    key: string,
    field: keyof WorkoutExerciseSets,
    value: number,
    setIdx: number
  ) => {
    setWorkoutList((current) =>
      current.map((ex) =>
        ex.compositeKey === key
          ? {
              ...ex,
              sets: (ex.sets || []).map((set, idx) =>
                idx === setIdx ? { ...set, [field]: value } : set
              ),
            }
          : ex
      )
    );
  };

  const handleAddSet = (key: string) => {
    const index = workoutList.findIndex((ex) => ex.compositeKey === key);
    if (index !== -1) {
      setWorkoutList((current) =>
        current.map((ex) =>
          ex.compositeKey === key
            ? {
                ...ex,
                sets: [
                  ...ex.sets,
                  {
                    setNumber: ex.sets.length + 1,
                    repetitions: 10,
                    weight: 10,
                  },
                ],
              }
            : ex
        )
      );
    }
    // console.log(compositeKey);
  };

  const handleRemoveSet = (key: string) => {
    setWorkoutList((current) =>
      current.map((ex) => {
        if (ex.compositeKey === key && ex.sets.length > 1) {
          return {
            ...ex,
            sets: ex.sets.slice(0, -1),
          };
        }
        return ex;
      })
    );
  };

  const removeExerciseFromWorkout = (key: string) => {
    setWorkoutList((current) =>
      current.filter((ex) => ex.compositeKey !== key)
    );
  };

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
    }
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
        onUpdate={(
          key: string,
          setIndex: number,
          field: keyof WorkoutExerciseSets,
          value: string
        ) => {
          const numericValue = Number(value);
          if (!isNaN(numericValue)) {
            updateExerciseInWorkout(key, field, numericValue, setIndex);
          }
        }}
        onRemove={removeExerciseFromWorkout}
        onAddSet={handleAddSet}
        onRemoveSet={handleRemoveSet}
      />
      <div className="button-container">
        <button className="button" onClick={() => navigate("/workouts")}>
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
