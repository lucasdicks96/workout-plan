import { useNavigate } from "react-router-dom";
import styles from "../exercises/Exercises.module.css";
import stylesDashboard from "../dashboard/Dashboard.module.css";

export default function Workout() {
  const navigate = useNavigate();
  return (
    <>
      <h2>Workouts</h2>
      <div className={stylesDashboard.content}></div>
      <div>
        <button
          className={styles.button}
          onClick={() => navigate("/users/edit-workouts")}
        >
          Edit Workout
        </button>
        <button
          className={styles.button}
          onClick={() => navigate("/users/create-workouts")}
        >
          Create Workout
        </button>
      </div>
    </>
  );
}
