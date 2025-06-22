import exp from "constants";
import { Router, Request, Response } from "express";

const router = Router();

router.get("/all-workouts", (req: Request, res: Response) => {
  const workouts = [
    {
      id: 1,
      name: "Full Body Workout",
      description: "A complete workout for all muscle groups.",
    },
    {
      id: 2,
      name: "Cardio Blast",
      description: "High-intensity cardio workout.",
    },
    {
      id: 3,
      name: "Strength Training",
      description: "Focus on building muscle strength.",
    },
  ];

  res.json({ workouts }).status(200);
});

router.get("/workout/:id", (req: Request, res: Response) => {});

router.post("/create-workout", async (req: Request, res: Response) => {
  console.log(req.body);
  // Here you would typically save the workout to a database
  res.status(201).json({
    message: "Workout created successfully",
    workout: req.body,
  });
});

export default router;
