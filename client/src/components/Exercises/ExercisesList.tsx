import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { fetchAllExercises } from "../../api/fetchExercise";
import { IExercisesList } from "../../types/exercises";
import stylesDashboard from "../dashboard/Dashboard.module.css";
import styles from "./ExercisesList.module.css";
// import image from "../../assets/BackgroundImage.png";
// const img: string = image;

export default function Exercise() {
  const [exerciseList, setExerciseList] = useState<IExercisesList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const isSubRoute =
    location.pathname.includes("edit-exercises") ||
    location.pathname.includes("create-exercises");

  useEffect(() => {
    const loadAllExercises = async () => {
      try {
        const exercises = await fetchAllExercises();
        setExerciseList(exercises);
      } catch (error) {
        console.error("Fehler beim Abrufen der Übungen:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadAllExercises();
  }, [location]);

  function ExerciseList() {
    if (isLoading) {
      return <p>Lade Übungen...</p>;
    }

    if (exerciseList.length === 0) {
      return <p>Keine Übungen verfügbar.</p>;
    }
    return (
      <div className={styles.exerciseList}>
        {exerciseList.map((item) => (
          <ExerciseCard
            key={item.id}
            id={item.id}
            title={item.title}
            description={item.description}
            img_path={item.img_path}
          />
        ))}
      </div>
    );
  }
  function ExerciseCard({ title, description, img_path }: IExercisesList) {
    return (
      <div className={styles.exerciseCardContainer}>
        <div className={styles.exerciseImageContainer}>
          <a className={styles.exerciseImage}>
            <img src={img_path} />
          </a>
        </div>
        <div className={styles.exerciseCardBody}>
          <h3>{title}</h3>
          <div className={styles.exerciseCardDescription}>{description}</div>
        </div>
      </div>
    );
  }

  return (
    <>
      {!isSubRoute && (
        <>
          <h2>Exercises</h2>
          <div className={stylesDashboard.content}>
            <ExerciseList />
          </div>
          <div>
            <button
              className={styles.button}
              onClick={() => navigate("edit-exercises")}
            >
              Edit Exercise
            </button>
            <button
              className={styles.button}
              onClick={() => navigate("create-exercises")}
            >
              Create Exercise
            </button>
          </div>
        </>
      )}

      <Outlet />
    </>
  );
}
