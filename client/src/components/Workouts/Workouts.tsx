import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
// import stylesDashboard from "../dashboard/Dashboard.module.css";
import { fetchAllWorkouts } from "../../api/fetchWorkout";
import { IWorkout } from "../../types/workouts";
import styles from "../exercises/ExercisesList.module.css";

export default function Workout() {
  const [workoutList, setWorkoutList] = useState<IWorkout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  // const workouts: Workout[] = [];

  function WorkoutList() {
    if (isLoading) {
      return <p>Lade Übungen...</p>; // Ladeanzeige
    }

    if (workoutList.length === 0) {
      return <p>Keine Übungen verfügbar.</p>; // Kein Inhalt
    }
    return (
      <div className={styles.exerciseList}>
        {workoutList.map((item) => (
          <WorkoutCard
            key={item.id}
            id={item.id}
            title={item.title}
            description={item.description}
          />
        ))}
      </div>
    );
  }
  function WorkoutCard({ title, description }: IWorkout) {
    return (
      <div className={styles.exerciseCardContainer}>
        <div className={styles.exerciseCardBody}>
          <h3>{title}</h3>
          <div className={styles.exerciseCardDescription}>{description}</div>
        </div>
      </div>
    );
  }

  useEffect(() => {
    const loadAllWorkouts = async () => {
      try {
        const workouts = await fetchAllWorkouts();
        setWorkoutList(workouts);
      } catch (error) {
        console.error("Fehler beim Abrufen der Workouts:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadAllWorkouts();
  }, []);

  const isSubRoute =
    location.pathname.includes("edit-workout") ||
    location.pathname.includes("create-workout");

  return (
    <>
      {!isSubRoute && (
        <>
          <h2>Workouts</h2>
          <WorkoutList />
          <div>
            <button
              className={styles.button}
              onClick={() => navigate("edit-workouts")}
            >
              Edit Workout
            </button>
            <button
              className={styles.button}
              onClick={() => navigate("create-workouts")}
            >
              Create Workout
            </button>
          </div>
        </>
      )}
      <Outlet />
    </>
  );
}
