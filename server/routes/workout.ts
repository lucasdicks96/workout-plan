import { Request, Response, Router } from "express";
import { IWorkout, IFinishedWorkout } from "../types/workouts";
import { exerciseForWorkout } from "./exercise";

const router = Router();

router.get("/all-workouts", (req: Request, res: Response) => {
  res.json({ workouts }).status(200);
});

router.get("/workout/:id", (req: Request, res: Response) => {});

router.post("/create-workout", async (req: Request, res: Response) => {
  console.log(req.body);
  // Here you would typically save the workout to a database
  workouts.push({
    id: workouts.length + 1,
    uid: req.body.uid, // Assuming uid is passed in the request body
    title: req.body.title,
    description: req.body.description,
    exercises: req.body.exercises.map((exercise: IWorkout) => ({
      ...exercise,
    })),
  });
  res.status(201).json({
    message: "Workout created successfully",
    workout: req.body,
  });
});
router.post("/finish-workout", async (req: Request, res: Response) => {
  console.log(req.body);
  // Here you would typically save the finished workout to a database
  const duration: number =
    parseInt(req.body.endTime) - parseInt(req.body.startTime); // Calculate duration in milliseconds
  const finishedWorkout: IFinishedWorkout = {
    ...req.body,
    date: req.body.date,
    duration: duration, // Assuming duration is passed in the request body
    startTime: req.body.startTime, // Assuming startTime is passed in the request body
    endTime: req.body.endTime, // Assuming endTime is passed in the request body
  };
  finishedWorkouts.push(finishedWorkout);
  res.status(201).json({
    message: "Workout finished successfully",
    workout: finishedWorkout,
  });
});

export default router;

const workouts: IWorkout[] = [
  {
    id: 1,
    uid: 1,
    title: "Full Body Workout",
    description: "A complete workout for all muscle groups.",
    exercises: [
      exerciseForWorkout[0], // Pushup
      exerciseForWorkout[1], // Squat
      exerciseForWorkout[2], // Plank
      exerciseForWorkout[3], // Lunge
    ],
  },
  {
    id: 2,
    uid: 2,
    title: "Cardio Blast",
    description: "High-intensity cardio workout.",
    exercises: [
      exerciseForWorkout[4], // Running
      exerciseForWorkout[5], // Cycling
      exerciseForWorkout[6], // Jump Rope
    ],
  },
  {
    id: 3,
    uid: 1,
    title: "Strength Training",
    description: "Focus on building muscle strength.",
    exercises: [
      exerciseForWorkout[7], // Deadlift
      exerciseForWorkout[8], // Bench Press
      exerciseForWorkout[9], // Pull-up
    ],
  },
];

const finishedWorkouts: IFinishedWorkout[] = [];
