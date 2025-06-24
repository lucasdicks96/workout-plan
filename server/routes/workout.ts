import { Request, Response, Router } from "express";

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
    title: req.body.title,
    description: req.body.description,
  });
  res.status(201).json({
    message: "Workout created successfully",
    workout: req.body,
  });
});

export default router;

const workouts = [
  {
    id: 1,
    title: "Full Body Workout",
    description: "A complete workout for all muscle groups.",
  },
  {
    id: 2,
    title: "Cardio Blast",
    description: "High-intensity cardio workout.",
  },
  {
    id: 3,
    title: "Strength Training",
    description: "Focus on building muscle strength.",
  },
];
