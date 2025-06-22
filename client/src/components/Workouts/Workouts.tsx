import { Outlet, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { useEffect, useState } from "react";
// import stylesDashboard from "../dashboard/Dashboard.module.css";
import styles from "../exercises/Exercises.module.css";

export default function Workout() {
  const [workoutList, setWorkoutList] = useState<Workout[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  // const workouts: Workout[] = [];

  async function fetchWorkouts() {
    try {
      const response = await axios.get(
        "http://localhost:5000/workout/all-workouts",
        {
          withCredentials: true,
        }
      );
      setWorkoutList(response.data.workouts);
      console.log("Fetched workouts:", response.data);
    } catch (error) {
      console.error("Error fetching workouts:", error);
      // Optionally, you can handle the error here, e.g., show a notification
    }
  }

  useEffect(() => {
    fetchWorkouts();
  }, []);

  const isSubRoute =
    location.pathname.includes("edit-workout") ||
    location.pathname.includes("create-workout");

  return (
    <>
      {!isSubRoute && (
        <>
          <h2>Workouts</h2>
          {/* <div className={stylesDashboard.content}></div> */}
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

interface Workout {
  id: number;
  name: string;
  description: string;
}
