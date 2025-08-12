import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { apiService } from "../../services/apiService";
import stylesLayout from "../../styles/Layout.module.css";
import {
  Workout,
  WorkoutExercises as WorkoutExercisesType,
} from "../../types/workouts";
import { WorkoutList as WorkoutPlans } from "./Workouts";
import WorkoutExercises from "./WorkoutExercises";
export default function EditWorkouts() {
  const [workoutPlans, setWorkoutPlans] = useState<Workout[]>([]);
  const [workoutExercises, setWorkoutExercises] = useState<
    WorkoutExercisesType[]
  >([]);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<number | null>(
    null
  );
  const [workoutName, setWorkoutName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  // const [open, setOpen] = useState<boolean>(false);
  // const uid = useRef(0);
  const { user } = useAuth();

  const navigate = useNavigate();

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
    setIsLoading(true);
    try {
      if (!user || user.id === undefined || user.id === null) {
        console.error("User is not logged in or does not have an ID.");
        return;
      }
      if (selectedWorkoutId === null) {
        return;
      }
      const response = await apiService.getWorkoutExercises(
        selectedWorkoutId,
        user.id
      );
      console.log(response.data);
      setWorkoutExercises(response.data.exercises);
      setWorkoutName(response.data.title);
    } catch (error) {
      console.error("Fehler beim Laden der Workout-Übungen:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedWorkoutId, user]);

  useEffect(() => {
    loadExercises();
  }, [loadExercises]);

  const updateExerciseInWorkout = (
    key: string,
    field: keyof WorkoutExercisesType,
    value: string
  ) => {
    setWorkoutExercises((current) =>
      current.map((ex) =>
        ex.compositeKey === key ? { ...ex, [field]: value } : ex
      )
    );
  };

  const removeExerciseFromWorkout = (key: string) => {
    setWorkoutExercises((current) =>
      current.filter((ex) => ex.compositeKey !== key)
    );
  };

  const handlePlanSelect = (workoutId: number) => {
    setSelectedWorkoutId(workoutId);
  };

  const handleBackToList = () => {
    setSelectedWorkoutId(null);
  };
  const handleAddSet = ({ compositeKey }: { compositeKey: string }) => {
    const index = workoutExercises.findIndex(
      (ex) => ex.compositeKey === compositeKey
    );
    if (index !== -1) {
      workoutExercises[index].sets.push({
        setNumber: 0,
        repetitions: 0,
        weight: 0,
      });
    }
    console.log(compositeKey);
  };

  const handleRemoveSet = () => {};

  // const confirmModifiedExercises = (workoutId: number, userId: number) => {
  //   try {
  //   } catch (error) {}
  // };

  return (
    <div className="content">
      <h2 className={stylesLayout.pageTitle}>Edit Workout</h2>
      {selectedWorkoutId !== null ? (
        <>
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
            onUpdate={updateExerciseInWorkout}
            workoutList={workoutExercises}
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
            <button className="button">Bestätigen</button>
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
