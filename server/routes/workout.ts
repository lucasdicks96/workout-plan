import { Request, Response, Router } from "express";
import { FinishedWorkout, Workout } from "../types/workouts";
import { ExerciseForWorkout } from "../types/exercises";
import { getTransformedCombinedExercise } from "./exercise";

const router = Router();

router.get("/all-workouts", async (req: Request, res: Response) => {
  res.json({ workouts: workouts }).status(200);
});

router.get(
  "/workout-exercises/:workoutId/:userId",
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
      const exercises: ExerciseForWorkout[] = workoutData[0].exercises;
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

router.post("/create-workout", async (req: Request, res: Response) => {
  workouts.push({
    id: workouts.length + 1,
    uid: parseInt(req.body.userId), // Assuming uid is passed in the request body
    title: req.body.title,
    exercises: req.body.exercises.map((exercise: Workout) => ({
      ...exercise,
    })),
  });
  res.status(201).json({
    message: "Workout created successfully",
    workout: workouts[workouts.length - 1],
  });
});

router.delete(
  "/delete-workout/:userId/:workoutId",
  async (req: Request, res: Response) => {
    console.log(req.params);
    const userId = parseInt(req.params.userId);
    const workoutId = parseInt(req.params.workoutId);
    const index = workouts.findIndex(
      (workout) => workout.id === workoutId && workout.uid === userId
    );
    if (index !== -1) {
      workouts.splice(index, 1);
      res.status(200).json({ message: "Löschen des Plan war erfolgreich" });
    } else {
      return res.status(404).json({ message: "Löschen nicht erfolgreich" });
    }
  }
);

router.post("/finish-workout", async (req: Request, res: Response) => {
  console.log(req.body);
  // Here you would typically save the finished workout to a database
  const duration: number =
    parseInt(req.body.endTime) - parseInt(req.body.startTime); // Calculate duration in milliseconds
  const finishedWorkout: FinishedWorkout = {
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

router.put("/update-workout", async (req: Request, res: Response) => {
  const workoutId = parseInt(req.body.workoutId);
  const userId = parseInt(req.body.userId);
  if (isNaN(workoutId) || isNaN(userId)) {
    return res.status(400).json({ message: "Falsche WorkoutId oder UserId" });
  }
  const exercises = req.body.exercises;
  try {
    const index = workouts.findIndex((workout) => workout.id === workoutId);
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
});

export default router;

// export const workouts: Workout[] = [
//   {
//     id: 1,
//     uid: 1,
//     title: "Full Body Workout",
//     exercises: [
//       exerciseForWorkout[0], // Pushup
//       exerciseForWorkout[1], // Squat
//       exerciseForWorkout[2], // Plank
//       exerciseForWorkout[3], // Lunge
//     ],
//   },
//   {
//     id: 2,
//     uid: 2,
//     title: "Cardio Blast",
//     exercises: [
//       exerciseForWorkout[4], // Running
//       exerciseForWorkout[5], // Cycling
//       exerciseForWorkout[6], // Jump Rope
//     ],
//   },
//   {
//     id: 3,
//     uid: 1,
//     title: "Strength Training",
//     exercises: [
//       exerciseForWorkout[7], // Deadlift
//       exerciseForWorkout[8], // Bench Press
//       exerciseForWorkout[9], // Pull-up
//     ],
//   },
// ];

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
      (workout) => workout.id === workoutId && workout.uid === userId
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

const finishedWorkouts: FinishedWorkout[] = [];
