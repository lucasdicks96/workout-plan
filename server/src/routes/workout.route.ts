import { Response, Router } from "express";
import { isAuthenticated } from "../middlewares/isAuthenticated";
import * as workoutService from "../services/workout.service";
import { BadRequestError } from "../types/errors.types";
import { WorkoutExercises } from "../types/workout.types";
import { authenticatedHandler } from "../utils/auth.utils";

const router = Router();

router.get(
  "/all-workouts",
  isAuthenticated,
  authenticatedHandler(async (req, res: Response) => {
    const workouts = await workoutService.getAllWorkouts(req.user.id);
    res.status(200).json({ workouts: workouts });
  })
);

router.get(
  "/workout-exercises/:workoutId",
  isAuthenticated,
  authenticatedHandler(async (req, res: Response) => {
    const workoutId = parseInt(req.params.workoutId);
    const userId = req.user.id;
    if (!workoutId || isNaN(workoutId)) {
      throw new BadRequestError("Falsche Workout ID");
    }

    const workoutData = await workoutService.getWorkoutById(workoutId, userId);
    res.status(200).json({
      message: "Workout Übungen erfolgreich übermittelt",
      workout: workoutData,
    });
  })
);

router.get(
  "/last-workout/:workoutId",
  isAuthenticated,
  authenticatedHandler(async (req, res: Response) => {
    const workoutId = parseInt(req.params.workoutId);
    const userId = req.user.id;
    if (!workoutId || isNaN(workoutId)) {
      throw new BadRequestError("Falsche Workout ID");
    }
    const workoutData = await workoutService.getLastWorkout(workoutId, userId);
    res.status(200).json({
      message: "Workout erfolgreich übermittelt",
      workout: workoutData,
    });
  })
);

router.post(
  "/create-workout",
  isAuthenticated,
  authenticatedHandler(async (req, res: Response) => {
    const { title, exercises } = req.body;
    if (!title || !exercises) {
      throw new BadRequestError("Fehlerhafte Daten gesendet.");
    }
    const userId = req.user.id;

    const result = await workoutService.createWorkoutPlan(
      title,
      userId,
      exercises
    );
    res.status(200).json({ message: result.message });
  })
);

router.delete(
  "/delete-workout/:workoutId",
  isAuthenticated,
  authenticatedHandler(async (req, res: Response) => {
    const workoutId = parseInt(req.params.workoutId);
    if (!workoutId || isNaN(workoutId)) {
      throw new BadRequestError("Workout ID stimmt nicht überein.");
    }
    const result = await workoutService.deleteWorkout(workoutId, req.user.id);
    res.status(200).json({ message: result.message });
  })
);

router.post(
  "/save-completed-workout",
  isAuthenticated,
  authenticatedHandler(async (req, res: Response) => {
    const {
      workoutId,
      startTime,
      endTime,
      pauseTime,
      duration,
      exercises,
      title,
    } = req.body;
    if (!workoutId || isNaN(workoutId))
      throw new BadRequestError("Workout ID fehlt");
    if (!title) throw new BadRequestError("Workout Titel fehlt");
    if (!exercises || exercises.length === 0)
      throw new BadRequestError("Übungen fehlen");
    if (!duration) throw new BadRequestError("Dauer des Workouts fehlt");
    if (!startTime) throw new BadRequestError("Startzeit des Workouts fehlt");

    if (pauseTime === undefined || pauseTime === null)
      throw new BadRequestError("Pausenzeit des Workouts fehlt");

    if (!endTime) throw new BadRequestError("Endzeit des Workouts fehlt");

    const result = await workoutService.saveCompletedWorkout(
      workoutId,
      req.user.id,
      startTime,
      endTime,
      pauseTime,
      duration,
      exercises,
      title
    );
    res.status(200).json({ message: result.message });
  })
);

router.get(
  "/completed-workouts",
  isAuthenticated,
  authenticatedHandler(async (req, res: Response) => {
    const completedWorkouts = await workoutService.getCompletedWorkouts(
      req.user.id
    );
    res.status(200).json({
      message: "Abgeschlossene Workouts erfolgreich abgefragt.",
      workouts: completedWorkouts,
    });
  })
);

router.put(
  "/update-workout",
  isAuthenticated,
  authenticatedHandler(async (req, res: Response) => {
    const workoutId = parseInt(req.body.workoutId);
    const title: string = req.body.title;
    const exercises: WorkoutExercises[] = req.body.exercises;
    if (!workoutId || isNaN(workoutId)) {
      throw new BadRequestError("Workout ID fehlerhaft.");
    }
    if (!title || !exercises || exercises.length === 0) {
      throw new BadRequestError(
        "Es müssen der Title und mindestens eine Übung vorhanden sein."
      );
    }

    const result = await workoutService.updateWorkout(
      workoutId,
      req.user.id,
      title,
      exercises
    );
    res.status(200).json({ message: result.message });
  })
);

export default router;
