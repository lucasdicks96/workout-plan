import axios from "axios";
import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import stylesDashboard from "../dashboard/Dashboard.module.css";
import styles from "./Exercises.module.css";
// import image from "../../assets/BackgroundImage.png";
// const img: string = image;

export default function Exercise() {
  const [exerciseList, setExerciseList] = useState<ExerciseType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const isSubRoute =
    location.pathname.includes("edit-exercises") ||
    location.pathname.includes("create-exercises");

  async function fetchAllExercises() {
    try {
      const response = await axios.get(
        "http://localhost:5000/exercise/all-exercises",
        { withCredentials: true }
      );
      // console.log("Response data: ", response.data.exercises);
      setExerciseList(response.data.exercises);
    } catch (err) {
      console.error("Fehler beim Abrufen der Übungen:", err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchAllExercises();
  }, [location]);

  function ExerciseList() {
    if (isLoading) {
      return <p>Lade Übungen...</p>; // Ladeanzeige
    }

    if (exerciseList.length === 0) {
      return <p>Keine Übungen verfügbar.</p>; // Kein Inhalt
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
  function ExerciseCard({ title, description, img_path }: ExerciseType) {
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

type ExerciseType = {
  id: number;
  title: string;
  description: string;
  img_path: string;
};

// const exerciseListTest: ExerciseType[] = [
//   {
//     id: 1,
//     title: "Pushup",
//     description:
//       "A basic upper body exercise focusing on the chest, shoulders, and triceps.",
//     img_path: "/BackgroundImage.png",
//   },
//   {
//     id: 2,
//     title: "Squat",
//     description:
//       "A fundamental exercise targeting the lower body, including quads and glutes.",
//     img_path: "/BackgroundImage.png",
//   },
//   {
//     id: 3,
//     title: "Plank",
//     description:
//       "A core exercise that builds strength and stability in the abdomen and back.",
//     img_path: "/BackgroundImage.png",
//   },
//   {
//     id: 4,
//     title: "Lunge",
//     description: "An exercise to strengthen the legs and improve balance.",
//     img_path: "/BackgroundImage.png",
//   },
//   {
//     id: 5,
//     title: "Burpee",
//     description:
//       "A full-body exercise that combines a squat, pushup, and jump.",
//     img_path: "/BackgroundImage.png",
//   },
//   {
//     id: 6,
//     title: "Deadlift",
//     description:
//       "A weightlifting exercise that targets the lower back, glutes, and hamstrings.",
//     img_path: "/BackgroundImage.png",
//   },
//   {
//     id: 7,
//     title: "Bicep Curl",
//     description: "An upper body exercise to target the biceps.",
//     img_path: "/BackgroundImage.png",
//   },
//   {
//     id: 8,
//     title: "Tricep Dip",
//     description: "An exercise to build strength in the triceps and shoulders.",
//     img_path: "/BackgroundImage.png",
//   },
//   {
//     id: 9,
//     title: "Mountain Climber",
//     description: "A cardiovascular exercise that strengthens the core.",
//     img_path: "/BackgroundImage.png",
//   },
//   {
//     id: 10,
//     title: "Situp",
//     description: "A basic core exercise focusing on the abdominals.",
//     img_path: "/BackgroundImage.png",
//   },
//   {
//     id: 11,
//     title: "Russian Twist",
//     description: "A core exercise to improve oblique strength.",
//     img_path: "/BackgroundImage.png",
//   },
//   {
//     id: 12,
//     title: "Pullup",
//     description: "An upper body exercise targeting the back and biceps.",
//     img_path: "/BackgroundImage.png",
//   },
//   {
//     id: 13,
//     title: "Leg Raise",
//     description: "A core exercise that targets the lower abdominals.",
//     img_path: "/BackgroundImage.png",
//   },
//   {
//     id: 14,
//     title: "Bench Press",
//     description: "A weightlifting exercise to build chest strength.",
//     img_path: "/BackgroundImage.png",
//   },
//   {
//     id: 15,
//     title: "Overhead Press",
//     description: "An upper body exercise focusing on the shoulders.",
//     img_path: "/BackgroundImage.png",
//   },
//   {
//     id: 16,
//     title: "Chest Fly",
//     description: "An exercise to target the chest muscles.",
//     img_path: "/BackgroundImage.png",
//   },
//   {
//     id: 17,
//     title: "Leg Press",
//     description: "A machine-based exercise for the lower body.",
//     img_path: "/BackgroundImage.png",
//   },
//   {
//     id: 18,
//     title: "Calf Raise",
//     description: "An exercise to strengthen the calves.",
//     img_path: "/BackgroundImage.png",
//   },
//   {
//     id: 19,
//     title: "Shoulder Shrug",
//     description: "An exercise focusing on the trapezius muscles.",
//     img_path: "/BackgroundImage.png",
//   },
//   {
//     id: 20,
//     title: "Bent-over Row",
//     description: "A back exercise that targets the lats and rhomboids.",
//     img_path: "/BackgroundImage.png",
//   },
//   {
//     id: 21,
//     title: "Crunch",
//     description: "A core exercise focusing on the upper abdominals.",
//     img_path: "/BackgroundImage.png",
//   },
//   {
//     id: 22,
//     title: "Hamstring Curl",
//     description: "A lower body exercise targeting the hamstrings.",
//     img_path: "/BackgroundImage.png",
//   },
//   {
//     id: 23,
//     title: "Lat Pulldown",
//     description: "A machine exercise targeting the back and biceps.",
//     img_path: "/BackgroundImage.png",
//   },
//   {
//     id: 24,
//     title: "Seated Row",
//     description: "A back exercise to build strength in the middle back.",
//     img_path: "/BackgroundImage.png",
//   },
//   {
//     id: 25,
//     title: "Dumbbell Fly",
//     description: "An exercise for the chest performed with dumbbells.",
//     img_path: "/BackgroundImage.png",
//   },
//   {
//     id: 26,
//     title: "Chest Press",
//     description: "A machine exercise to strengthen the chest.",
//     img_path: "/BackgroundImage.png",
//   },
//   {
//     id: 27,
//     title: "Skullcrusher",
//     description: "An exercise focusing on tricep development.",
//     img_path: "/BackgroundImage.png",
//   },
//   {
//     id: 28,
//     title: "Cable Crossover",
//     description: "A cable machine exercise to work the chest.",
//     img_path: "/BackgroundImage.png",
//   },
//   {
//     id: 29,
//     title: "Pec Deck",
//     description: "A machine exercise targeting the chest muscles.",
//     img_path: "/BackgroundImage.png",
//   },
//   {
//     id: 30,
//     title: "Good Morning",
//     description:
//       "A lower back exercise that also targets the glutes and hamstrings.",
//     img_path: "/BackgroundImage.png",
//   },
//   {
//     id: 31,
//     title: "Ab Rollout",
//     description: "A core exercise to build abdominal strength and stability.",
//     img_path: "/BackgroundImage.png",
//   },
//   {
//     id: 32,
//     title: "Hyperextension",
//     description: "An exercise focusing on the lower back.",
//     img_path: "/BackgroundImage.png",
//   },
//   {
//     id: 33,
//     title: "Hanging Leg Raise",
//     description: "A core exercise performed hanging to target the abs.",
//     img_path: "/BackgroundImage.png",
//   },
//   {
//     id: 34,
//     title: "Reverse Crunch",
//     description: "A core exercise targeting the lower abdominals.",
//     img_path: "/BackgroundImage.png",
//   },
//   {
//     id: 35,
//     title: "Side Plank",
//     description:
//       "A core exercise to improve oblique and overall core strength.",
//     img_path: "/BackgroundImage.png",
//   },
//   {
//     id: 36,
//     title: "Kettlebell Swing",
//     description: "A dynamic exercise focusing on the core and lower body.",
//     img_path: "/BackgroundImage.png",
//   },
//   {
//     id: 37,
//     title: "Farmer's Walk",
//     description: "A functional exercise to build grip strength and endurance.",
//     img_path: "/BackgroundImage.png",
//   },
//   {
//     id: 38,
//     title: "Step-Up",
//     description: "A lower body exercise focusing on quads and glutes.",
//     img_path: "/BackgroundImage.png",
//   },
//   {
//     id: 39,
//     title: "Box Jump",
//     description: "A plyometric exercise to build explosive leg power.",
//     img_path: "/BackgroundImage.png",
//   },
//   {
//     id: 40,
//     title: "Wall Sit",
//     description: "A lower body endurance exercise targeting the quads.",
//     img_path: "/BackgroundImage.png",
//   },
//   {
//     id: 41,
//     title: "Tuck Jump",
//     description:
//       "A plyometric exercise to improve agility and explosive power.",
//     img_path: "/BackgroundImage.png",
//   },
//   {
//     id: 42,
//     title: "Bridge",
//     description: "A core and lower body exercise focusing on the glutes.",
//     img_path: "/BackgroundImage.png",
//   },
//   {
//     id: 43,
//     title: "Windmill",
//     description: "A core exercise to enhance flexibility and oblique strength.",
//     img_path: "/BackgroundImage.png",
//   },
//   {
//     id: 44,
//     title: "Side Lunge",
//     description: "A lower body exercise focusing on adductors and quads.",
//     img_path: "/BackgroundImage.png",
//   },
//   {
//     id: 45,
//     title: "High Knees",
//     description: "A cardiovascular exercise to improve speed and endurance.",
//     img_path: "/BackgroundImage.png",
//   },
//   {
//     id: 46,
//     title: "Jumping Jack",
//     description: "A full-body exercise to increase cardiovascular fitness.",
//     img_path: "/BackgroundImage.png",
//   },
//   {
//     id: 47,
//     title: "Flutter Kick",
//     description: "A core exercise targeting the lower abdominals.",
//     img_path: "/BackgroundImage.png",
//   },
//   {
//     id: 48,
//     title: "Bear Crawl",
//     description: "A full-body exercise to improve strength and coordination.",
//     img_path: "/BackgroundImage.png",
//   },
//   {
//     id: 49,
//     title: "Inchworm",
//     description: "A dynamic stretch and warm-up exercise.",
//     img_path: "/BackgroundImage.png",
//   },
//   {
//     id: 50,
//     title: "Donkey Kick",
//     description: "A lower body exercise targeting the glutes.",
//     img_path: "/BackgroundImage.png",
//   },
// ];
