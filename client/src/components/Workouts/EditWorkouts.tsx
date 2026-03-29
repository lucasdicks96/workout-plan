import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSetTitle } from "../../hooks/useSetTitle";
import { apiService } from "../../services/apiService";
import stylesButton from "../../styles/Button.module.css";
import styles from "../../styles/Exercises.module.css";
import { Exercise } from "../../types/exercises";
import {
  Workout,
  WorkoutExercises as WorkoutExercisesType,
} from "../../types/workouts";
import ReturnButton from "../Buttons/ReturnButton";
import Popup, { PopupRef } from "../Popup";
import SharedWorkoutEditor from "./SharedWorkoutEditor";
import { WorkoutList as WorkoutPlans } from "./Workouts";

export default function EditWorkouts() {
  const [workoutPlans, setWorkoutPlans] = useState<Workout[]>([]);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<number | null>(
    null,
  );

  const [workoutExercises, setWorkoutExercises] = useState<
    WorkoutExercisesType[]
  >([]);
  const [workoutName, setWorkoutName] = useState("");

  const [isLoading, setIsLoading] = useState(true);

  const popupRef = useRef<PopupRef>(null);

  useSetTitle("Trainingspläne bearbeiten");

  const navigate = useNavigate();

  useEffect(() => {
    const fetchAllExercises = async () => {
      try {
        const response = await apiService.getExercises();
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
      const response = await apiService.getWorkouts();
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
    if (selectedWorkoutId === null) return;
    setIsLoading(true);
    try {
      const response = await apiService.getWorkout(selectedWorkoutId);
      setWorkoutExercises(response.data.workout.exercises);
      setWorkoutName(response.data.workout.title);
    } catch (error) {
      console.error("Fehler beim Laden der Workout-Übungen:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedWorkoutId]);

  useEffect(() => {
    if (selectedWorkoutId !== null) {
      loadExercises();
    } else {
      setWorkoutName("");
    }
  }, [selectedWorkoutId, loadExercises]);

  const handleSaveWorkout = async (
    title: string,
    exercises: WorkoutExercisesType[],
  ) => {
    try {
      if (selectedWorkoutId === null) throw new Error();
      const response = await apiService.putWorkout(
        title,
        selectedWorkoutId,
        exercises,
      );
      if (response.status === 200) {
        popupRef.current?.show("Trainingsplan erfolgreich gespeichert!", 200);
      }
    } catch (error) {
      popupRef.current?.show("Fehler beim Speichern des Trainingsplans", 500);
    }
  };

  const handlePlanSelect = (workoutId: number) => {
    setSelectedWorkoutId(workoutId);
  };

  const handleBackToList = () => {
    setSelectedWorkoutId(null);
  };

  const handleClosePopup = () => {
    loadAllWorkouts();
    handleBackToList();
  };

  const handleDelete = async (workoutId: number) => {
    try {
      await apiService.deleteWorkout(workoutId);
      popupRef.current?.show("Trainingsplan erfolgreich gelöscht!", 200);
      setSelectedWorkoutId(null);
    } catch (error) {
      popupRef.current?.show("Fehler beim Löschen des Plans", 500);
      console.error("Fehler beim Löschen des Plans", error);
    }
  };

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
      }}
    >
      <Popup
        ref={popupRef}
        duration={1500}
        onClose={handleClosePopup}
        showBackdrop={true}
      />

      {selectedWorkoutId ? (
        !isLoading && (
          <SharedWorkoutEditor
            initialTitle={workoutName}
            initialExercises={workoutExercises}
            allExercises={allExercises}
            onSave={handleSaveWorkout}
            onCancel={handleBackToList}
          />
        )
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
          <div className={stylesButton.buttonContainerNonRelative}>
            <ReturnButton
              onBack={() => navigate("/workouts")}
              className={`${stylesButton.button}`}
            />
          </div>
        </>
      )}
    </div>
  );
}
