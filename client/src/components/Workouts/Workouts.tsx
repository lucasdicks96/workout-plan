import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSetTitle } from "../../hooks/useSetTitle";
import { apiService } from "../../services/apiService";
import styles from "../../styles/Exercises.module.css";
import stylesButton from "../../styles/Button.module.css";
import { Workout as IWorkout } from "../../types/workouts";
import AddButton from "../Buttons/AddButton";
import DeleteButton from "../Buttons/DeleteButton";
import EditButton from "../Buttons/EditButton";
import PlayPauseButton from "../Buttons/PlayPauseButton";

export default function Workout() {
  const [workoutList, setWorkoutList] = useState<IWorkout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useSetTitle("Trainingspläne");

  const loadAllWorkouts = useCallback(async () => {
    try {
      const response = await apiService.getWorkouts();
      setWorkoutList(response.data.workouts);
    } catch (error) {
      setWorkoutList([]);
      console.error("Fehler beim Abrufen der Workouts:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);
  useEffect(() => {
    loadAllWorkouts();
  }, [loadAllWorkouts]);

  return (
    <>
      <div className={styles.exerciseList}>
        <WorkoutList isLoading={isLoading} workoutList={workoutList} />
      </div>
      <div className={stylesButton.buttonContainer}>
        <EditButton
          onEdit={() => navigate("edit-workouts")}
          className={`${stylesButton.left}, ${stylesButton.button}`}
        />
        <AddButton onAdd={() => navigate("create-workouts")} />
      </div>
    </>
  );
}

export function WorkoutList({
  isLoading,
  workoutList,
  onClick,
  onDelete,
}: {
  isLoading: boolean;
  workoutList: IWorkout[];
  onClick?: (workoutId: number) => void;
  onDelete?: (workoutId: number) => void;
}) {
  if (isLoading) {
    return <p>Lade Workouts...</p>;
  }

  if (workoutList.length === 0) {
    return <p>Keine Workouts verfügbar.</p>;
  }
  return (
    <>
      {workoutList.map((workout) => (
        <WorkoutCard
          key={workout.id}
          workoutId={workout.id}
          title={workout.title}
          onClick={onClick}
          onDelete={onDelete}
        />
      ))}
    </>
  );
}
function WorkoutCard({
  title,
  workoutId,
  onClick,
  onDelete,
}: {
  title: string;
  workoutId: number;
  onClick?: (workoutId: number) => void;
  onDelete?: (workoutId: number) => void;
}) {
  const navigate = useNavigate();
  const location = window.location.pathname;
  const isEditPage: boolean = location.includes("edit-workouts");
  const isInProgress = localStorage.getItem("workoutInProgressState");
  const startedWorkoutId = localStorage.getItem("startWorkoutId");
  const startedId = parseInt(JSON.parse(startedWorkoutId || "null"));

  const [deleteIsOpen, setDeleteIsOpen] = useState(false);

  const onStart = () => {
    if (!startedWorkoutId) {
      localStorage.setItem("startWorkoutId", JSON.stringify(workoutId));
      navigate("start-workouts");
    } else if (startedWorkoutId && !isInProgress) {
      localStorage.setItem("startWorkoutId", JSON.stringify(workoutId));
      navigate("start-workouts");
    }

    if (isInProgress) {
      const progressState = JSON.parse(isInProgress);
      const progressId = parseInt(progressState.startedWorkoutId);

      if (progressId != workoutId) {
        const confirmNew = window.confirm(
          "Es ist bereits ein Workout im Gange. Wenn du ein neues startest, gehen die Daten des aktuellen Workouts verloren. Möchtest du wirklich ein neues Workout starten?",
        );
        if (!confirmNew) {
          return;
        } else {
          localStorage.removeItem("workoutInProgressState");
          localStorage.setItem("startWorkoutId", JSON.stringify(workoutId));
          navigate("start-workouts");
        }
      }

      if (progressId === startedId) {
        navigate("start-workouts");
        return;
      }
    }
  };

  return (
    <div
      className={styles.card}
    >
      <h3 className={styles.workoutCardTitle}>{title}</h3>
      {isEditPage && (
        <div className={stylesButton.buttonContainerNonRelative}>
          <DeleteButton
            isOpen={deleteIsOpen}
            onDelete={() => {
              onDelete?.(workoutId);
              setDeleteIsOpen(false);
            }}
            onToggleVisibility={setDeleteIsOpen}
            className={`${stylesButton.buttonRounded}`}
          />

          {!deleteIsOpen && (
            <>
              <EditButton
                onEdit={() => onClick?.(workoutId)}
                className={`${stylesButton.buttonRounded}, ${stylesButton.left}`}
              />
            </>
          )}
        </div>
      )}

      {!isEditPage && isInProgress && workoutId == startedId && (
        <span>In Arbeit</span>
      )}
      {!isEditPage && (
        <PlayPauseButton
          onStart={onStart}
          className={`${stylesButton.buttonRounded}`}
        />
      )}
    </div>
  );
}
