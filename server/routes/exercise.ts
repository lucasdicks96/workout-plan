import { Request, Response, Router } from "express";
import {
  IExerciseForWorkout,
  IExercisesList,
  IFinishedExercise,
} from "../types/exercises";

const router = Router();

router.get("/all-exercises", (req: Request, res: Response) => {
  res.json({ exercises: exerciseList }).status(200);
});

router.get("/exercise/:id", (req: Request, res: Response) => {
  const exerciseId = parseInt(req.params.id);
  const exercise = exerciseList.find((ex) => ex.id === exerciseId);
  res.json({ exercise }).status(200);
});

router.post("/create-exercise", async (req: Request, res: Response) => {
  console.log(req.body);
  let newExercise = {
    id: exerciseList.length + 1,
    title: req.body.title,
    description: req.body.description,
    img_path: "/BackgroundImage.png",
    user_id: req.body.user_id,
  };
  exerciseList.push(newExercise);
  res.status(201).json({
    exercise: { title: req.body.title, description: req.body.description },
  });
});

router.get("/edit", (req: Request, res: Response) => {});

export default router;

const exerciseList: IExercisesList[] = [
  {
    id: 1,
    title: "Pushup",
    description:
      "A basic upper body exercise focusing on the chest, shoulders, and triceps.",
    img_path: "/BackgroundImage.png",
  },
  {
    id: 2,
    title: "Squat",
    description:
      "A fundamental exercise targeting the lower body, including quads and glutes.",
    img_path: "/BackgroundImage.png",
  },
  {
    id: 3,
    title: "Plank",
    description:
      "A core exercise that builds strength and stability in the abdomen and back.",
    img_path: "/BackgroundImage.png",
  },
  {
    id: 4,
    title: "Lunge",
    description: "An exercise to strengthen the legs and improve balance.",
    img_path: "/BackgroundImage.png",
  },
  {
    id: 5,
    title: "Burpee",
    description:
      "A full-body exercise that combines a squat, pushup, and jump.",
    img_path: "/BackgroundImage.png",
  },
  {
    id: 6,
    title: "Deadlift",
    description:
      "A weightlifting exercise that targets the lower back, glutes, and hamstrings.",
    img_path: "/BackgroundImage.png",
  },
  {
    id: 7,
    title: "Bicep Curl",
    description: "An upper body exercise to target the biceps.",
    img_path: "/BackgroundImage.png",
  },
  {
    id: 8,
    title: "Tricep Dip",
    description: "An exercise to build strength in the triceps and shoulders.",
    img_path: "/BackgroundImage.png",
  },
  {
    id: 9,
    title: "Mountain Climber",
    description: "A cardiovascular exercise that strengthens the core.",
    img_path: "/BackgroundImage.png",
  },
  {
    id: 10,
    title: "Situp",
    description: "A basic core exercise focusing on the abdominals.",
    img_path: "/BackgroundImage.png",
  },
  {
    id: 11,
    title: "Russian Twist",
    description: "A core exercise to improve oblique strength.",
    img_path: "/BackgroundImage.png",
  },
  {
    id: 12,
    title: "Pullup",
    description: "An upper body exercise targeting the back and biceps.",
    img_path: "/BackgroundImage.png",
  },
  {
    id: 13,
    title: "Leg Raise",
    description: "A core exercise that targets the lower abdominals.",
    img_path: "/BackgroundImage.png",
  },
  {
    id: 14,
    title: "Bench Press",
    description: "A weightlifting exercise to build chest strength.",
    img_path: "/BackgroundImage.png",
  },
  {
    id: 15,
    title: "Overhead Press",
    description: "An upper body exercise focusing on the shoulders.",
    img_path: "/BackgroundImage.png",
  },
  {
    id: 16,
    title: "Chest Fly",
    description: "An exercise to target the chest muscles.",
    img_path: "/BackgroundImage.png",
  },
  {
    id: 17,
    title: "Leg Press",
    description: "A machine-based exercise for the lower body.",
    img_path: "/BackgroundImage.png",
  },
  {
    id: 18,
    title: "Calf Raise",
    description: "An exercise to strengthen the calves.",
    img_path: "/BackgroundImage.png",
  },
  {
    id: 19,
    title: "Shoulder Shrug",
    description: "An exercise focusing on the trapezius muscles.",
    img_path: "/BackgroundImage.png",
  },
  {
    id: 20,
    title: "Bent-over Row",
    description: "A back exercise that targets the lats and rhomboids.",
    img_path: "/BackgroundImage.png",
  },
  {
    id: 21,
    title: "Crunch",
    description: "A core exercise focusing on the upper abdominals.",
    img_path: "/BackgroundImage.png",
  },
  {
    id: 22,
    title: "Hamstring Curl",
    description: "A lower body exercise targeting the hamstrings.",
    img_path: "/BackgroundImage.png",
  },
  {
    id: 23,
    title: "Lat Pulldown",
    description: "A machine exercise targeting the back and biceps.",
    img_path: "/BackgroundImage.png",
  },
  {
    id: 24,
    title: "Seated Row",
    description: "A back exercise to build strength in the middle back.",
    img_path: "/BackgroundImage.png",
  },
  {
    id: 25,
    title: "Dumbbell Fly",
    description: "An exercise for the chest performed with dumbbells.",
    img_path: "/BackgroundImage.png",
  },
  {
    id: 26,
    title: "Chest Press",
    description: "A machine exercise to strengthen the chest.",
    img_path: "/BackgroundImage.png",
  },
  {
    id: 27,
    title: "Skullcrusher",
    description: "An exercise focusing on tricep development.",
    img_path: "/BackgroundImage.png",
  },
  {
    id: 28,
    title: "Cable Crossover",
    description: "A cable machine exercise to work the chest.",
    img_path: "/BackgroundImage.png",
  },
  {
    id: 29,
    title: "Pec Deck",
    description: "A machine exercise targeting the chest muscles.",
    img_path: "/BackgroundImage.png",
  },
  {
    id: 30,
    title: "Good Morning",
    description:
      "A lower back exercise that also targets the glutes and hamstrings.",
    img_path: "/BackgroundImage.png",
  },
  {
    id: 31,
    title: "Ab Rollout",
    description: "A core exercise to build abdominal strength and stability.",
    img_path: "/BackgroundImage.png",
  },
  {
    id: 32,
    title: "Hyperextension",
    description: "An exercise focusing on the lower back.",
    img_path: "/BackgroundImage.png",
  },
  {
    id: 33,
    title: "Hanging Leg Raise",
    description: "A core exercise performed hanging to target the abs.",
    img_path: "/BackgroundImage.png",
  },
  {
    id: 34,
    title: "Reverse Crunch",
    description: "A core exercise targeting the lower abdominals.",
    img_path: "/BackgroundImage.png",
  },
  {
    id: 35,
    title: "Side Plank",
    description:
      "A core exercise to improve oblique and overall core strength.",
    img_path: "/BackgroundImage.png",
  },
  {
    id: 36,
    title: "Kettlebell Swing",
    description: "A dynamic exercise focusing on the core and lower body.",
    img_path: "/BackgroundImage.png",
  },
  {
    id: 37,
    title: "Farmer's Walk",
    description: "A functional exercise to build grip strength and endurance.",
    img_path: "/BackgroundImage.png",
  },
  {
    id: 38,
    title: "Step-Up",
    description: "A lower body exercise focusing on quads and glutes.",
    img_path: "/BackgroundImage.png",
  },
  {
    id: 39,
    title: "Box Jump",
    description: "A plyometric exercise to build explosive leg power.",
    img_path: "/BackgroundImage.png",
  },
  {
    id: 40,
    title: "Wall Sit",
    description: "A lower body endurance exercise targeting the quads.",
    img_path: "/BackgroundImage.png",
  },
  {
    id: 41,
    title: "Tuck Jump",
    description:
      "A plyometric exercise to improve agility and explosive power.",
    img_path: "/BackgroundImage.png",
  },
  {
    id: 42,
    title: "Bridge",
    description: "A core and lower body exercise focusing on the glutes.",
    img_path: "/BackgroundImage.png",
  },
  {
    id: 43,
    title: "Windmill",
    description: "A core exercise to enhance flexibility and oblique strength.",
    img_path: "/BackgroundImage.png",
  },
  {
    id: 44,
    title: "Side Lunge",
    description: "A lower body exercise focusing on adductors and quads.",
    img_path: "/BackgroundImage.png",
  },
  {
    id: 45,
    title: "High Knees",
    description: "A cardiovascular exercise to improve speed and endurance.",
    img_path: "/BackgroundImage.png",
  },
  {
    id: 46,
    title: "Jumping Jack",
    description: "A full-body exercise to increase cardiovascular fitness.",
    img_path: "/BackgroundImage.png",
  },
  {
    id: 47,
    title: "Flutter Kick",
    description: "A core exercise targeting the lower abdominals.",
    img_path: "/BackgroundImage.png",
  },
  {
    id: 48,
    title: "Bear Crawl",
    description: "A full-body exercise to improve strength and coordination.",
    img_path: "/BackgroundImage.png",
  },
  {
    id: 49,
    title: "Inchworm",
    description: "A dynamic stretch and warm-up exercise.",
    img_path: "/BackgroundImage.png",
  },
  {
    id: 50,
    title: "Donkey Kick",
    description: "A lower body exercise targeting the glutes.",
    img_path: "/BackgroundImage.png",
  },
];

const exerciseForWorkout: IExerciseForWorkout[] = exerciseList.map(
  (exercise) => ({
    id: exercise.id,
    title: exercise.title,
    decription: exercise.description,
    repetitions: Math.floor(Math.random() * 15) + 5, // Random repetitions between 5 and 20
    sets: Math.floor(Math.random() * 3) + 1, // Random sets between 1 and 3
    weight: 0, // Default weight, can be adjusted later
  })
);

// const finishedExercises: IFinishedExercise[] = exerciseForWorkout.map();

export { exerciseForWorkout };
