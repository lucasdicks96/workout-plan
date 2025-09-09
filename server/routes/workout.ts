import { Request, Response, Router } from "express";
import { FinishedWorkout, Workout, WorkoutExercises } from "../types/workouts";
import { ExerciseForWorkout } from "../types/exercises";
import { getTransformedCombinedExercise } from "./exercise";
import { isAuthenticated } from "../middlewares/auth.middleware";

const router = Router();

router.get(
  "/all-workouts",
  isAuthenticated,
  async (req: Request, res: Response) => {
    res.json({ workouts: workouts }).status(200);
  }
);

router.get(
  "/workout-exercises/:workoutId/:userId",
  isAuthenticated,
  async (req: Request, res: Response) => {
    console.log(req.params);
    const workoutId = parseInt(req.params.workoutId);
    const userId = parseInt(req.params.userId);
    if (isNaN(workoutId) || isNaN(userId)) {
      return res.status(400).json({ message: "Falsche WorkoutId oder UserId" });
    }
    try {
      const workoutData: Workout[] = await getWorkoutExercises(
        workoutId,
        userId
      );
      const exercises = workoutData[0].exercises;
      const title: string = workoutData[0].title;
      res
        .status(200)
        .json({ message: "Success", exercises: exercises, title: title });
    } catch (error) {
      console.error("Error fetching Workout exercises", error);
    }

    console.log("clicked");
  }
);

router.get(
  "/workout/:workoutId/:userId",
  isAuthenticated,
  async (req: Request, res: Response) => {
    console.log(req.params);
    const workoutId = parseInt(req.params.workoutId);
    const userId = parseInt(req.params.userId);
    if (isNaN(workoutId) || isNaN(userId)) {
      return res.status(400).json({ message: "Falsche WorkoutId oder UserId" });
    }
    try {
    } catch (error) {}
  }
);

router.post(
  "/create-workout",
  isAuthenticated,
  async (req: Request, res: Response) => {
    workouts.push({
      workoutId: workouts.length + 1,
      userId: parseInt(req.body.userId),
      title: req.body.title,
      exercises: req.body.exercises.map((exercise: Workout) => ({
        ...exercise,
      })),
    });
    res.status(201).json({
      message: "Workout created successfully",
      workout: workouts[workouts.length - 1],
    });
  }
);

router.delete(
  "/delete-workout/:userId/:workoutId",
  isAuthenticated,
  async (req: Request, res: Response) => {
    console.log(req.params);
    const userId = parseInt(req.params.userId);
    const workoutId = parseInt(req.params.workoutId);
    const index = workouts.findIndex(
      (workout) => workout.workoutId === workoutId && workout.userId === userId
    );
    if (index !== -1) {
      workouts.splice(index, 1);
      res.status(200).json({ message: "Löschen des Plan war erfolgreich" });
    } else {
      return res.status(404).json({ message: "Löschen nicht erfolgreich" });
    }
  }
);

router.post(
  "/finish-workout",
  isAuthenticated,
  async (req: Request, res: Response) => {
    console.log(req.body);
    // const duration: number =
    // parseInt(req.body.endTime) - parseInt(req.body.startTime);
    const finishedWorkout: FinishedWorkout = {
      ...req.body,
      date: req.body.date,
      duration: req.body.elapsedTime,
      startTime: req.body.startTime,
      endTime: req.body.endTime,
      exercises: req.body.exercises,
      tite: req.body.title,
    };
    finishedWorkouts.push(finishedWorkout);
    res.status(201).json({
      message: "Workout finished successfully",
      workout: finishedWorkout,
    });
  }
);

router.get(
  "/completed-workouts/:userId",
  isAuthenticated,
  async (req: Request, res: Response) => {
    console.log(req.params);
    const userId = parseInt(req.params.userId);
    const filteredWorkouts = finishedWorkouts.filter(
      (workout) => workout.userId === userId
    );
    console.log("Finished Workouts ", finishedWorkouts);
    console.log("Filtered Workouts ", filteredWorkouts);
    if (filteredWorkouts.length > 0) {
      return res
        .status(200)
        .json({ message: "Erfolgreich geladen", exercises: filteredWorkouts });
    } else {
      return res
        .status(404)
        .json({ message: "Keine Workouts vorhanden", exercises: null });
    }
  }
);

router.put(
  "/update-workout",
  isAuthenticated,
  async (req: Request, res: Response) => {
    const workoutId = parseInt(req.body.workoutId);
    const userId = parseInt(req.body.userId);
    if (isNaN(workoutId) || isNaN(userId)) {
      return res.status(400).json({ message: "Falsche WorkoutId oder UserId" });
    }
    const exercises = req.body.exercises;
    try {
      const index = workouts.findIndex(
        (workout) => workout.workoutId === workoutId
      );
      if (index !== -1) {
        const existingWorkout = workouts[index];
        workouts[index] = {
          ...existingWorkout,
          title: req.body.title || existingWorkout.title,
          exercises: exercises || existingWorkout.exercises,
        };
        res
          .status(200)
          .json({ message: "Update erfolgreich", workout: workouts[index] });
      } else {
        res.status(404).json({ message: "Workout nicht gefunden" });
      }
    } catch (error) {
      console.error("Fehler beim Aktualisieren des Workouts", error);
    }
  }
);

export default router;

async function getWorkoutExercises(
  workoutId: number,
  userId: number
): Promise<Workout[]> {
  try {
    // const workout: number = workoutId;
    if (isNaN(workoutId) || isNaN(userId)) {
      console.error("workoutId | userId isNaN or is missing");
      throw new Error("Invalid workoutId or userId");
    }
    const workout: Workout | undefined = workouts.find(
      (workout) => workout.workoutId === workoutId && workout.userId === userId
    );

    if (!workout) {
      throw new Error("Workout not found");
    }

    return [workout];
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error fetching Workout exercises", error);
    }
    throw error;
  }
}

const workouts: Workout[] = [];

const finishedWorkouts: FinishedWorkout[] = [
  {
    userId: 8,
    workoutId: 1,
    title: "Chest Workout",
    startTime: 1757355686359,
    endTime: 1757355688727,
    pauseTime: 0,
    duration: 1902,
    exercises: [
      {
        compositeKey: "exercise-16",
        title: "Chest Press",
        description: "An exercise to target the chest muscles.",
        isUserCreated: false,
        originalId: 16,
        sets: [
          {
            repetitions: 10,
            setNumber: 1,
            weight: 10,
          },
        ],
      },
    ],
    date: "2024-01-08",
  },
];
