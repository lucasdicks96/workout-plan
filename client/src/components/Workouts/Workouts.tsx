import { Outlet, useLocation, useNavigate } from "react-router-dom";
// import stylesDashboard from "../dashboard/Dashboard.module.css";
import styles from "../exercises/Exercises.module.css";

export default function Workout() {
  const navigate = useNavigate();
  const location = useLocation();

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
              onClick={() => navigate("/users/workouts/edit-workouts")}
            >
              Edit Workout
            </button>
            <button
              className={styles.button}
              onClick={() => navigate("/users/workouts/create-workouts")}
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
