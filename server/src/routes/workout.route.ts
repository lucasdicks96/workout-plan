import { Request, Response, Router } from "express";
import { isAuthenticated } from "../middlewares/isAuthenticated";
import * as workoutService from "../services/workout.service";
import { Workout, WorkoutExercises } from "../types/workout.types";

const router = Router();

router.get(
  "/all-workouts",
  isAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(400).json({ message: "Benutzer ID fehlt." });
      }
      const workouts = workoutService.getAllWorkouts(userId);
      res.status(201).json({ workouts: workouts });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Fehler beim Abrufen der Workouts" });
    }
  }
);

router.get(
  "/workout-exercises/:workoutId/:userId",
  isAuthenticated,
  async (req: Request, res: Response) => {
    console.log(req.params);
    const workoutId = parseInt(req.params.id);
    const userId = req.user?.id;
    if (!workoutId || !userId || isNaN(workoutId)) {
      return res.status(400).json({ message: "Falsche WorkoutId oder UserId" });
    }
    try {
      const workoutData = await workoutService.getWorkoutById(
        workoutId,
        userId
      );
      res.status(200).json({
        message: "Workout Übungen erfolgreich übermittelt",
        workout: workoutData,
      });
    } catch (error) {
      console.error("Fehler beim Abrufen des Workouts", error);
      res.status(404).json({ message: "Fehler beim Abrufen des Workouts." });
    }
  }
);

router.get(
  "/workout/:workoutId/:userId",
  isAuthenticated,
  async (req: Request, res: Response) => {
    console.log(req.params);
    const workoutId = parseInt(req.params.workoutId);
    const userId = req.user?.id;
    // if (isNaN(workoutId) || isNaN(userId)) {
    //   return res.status(400).json({ message: "Falsche WorkoutId oder UserId" });
    // }
    try {
    } catch (error) {}
  }
);

router.post(
  "/create-workout",
  isAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const { title, exercises } = req.body;
      const userId = req.user?.id;
      if (!title || !userId || !exercises) {
        return res.status(400).json({ message: "Fehlerhafte Daten gesendet." });
      }
      const result = await workoutService.createWorkoutPlan(
        title,
        userId,
        exercises
      );
      res.status(200).json({ message: result.message });
    } catch (error) {
      console.error("Fehler beim Erstellen des Workouts:", error);
      res.status(404).json({ message: "Fehler beim Erstellen des Workouts." });
    }
  }
);

router.delete(
  "/delete-workout/:userId/:workoutId",
  isAuthenticated,
  async (req: Request, res: Response) => {
    console.log(req.params);
    try {
      const userId = req.user?.id;
      const workoutId = parseInt(req.params.workoutId);
      if (!userId || !workoutId) {
        return res
          .status(400)
          .json({ message: "Benutzer ID oder Workout ID sind falsch." });
      }
      const result = await workoutService.deleteWorkout(workoutId, userId);
      res.status(200).json({ message: result.message });
    } catch (error) {
      console.error("Fehler beim Löschen des Workouts", error);
      res.status(404).json({ message: "Fehler biem Löschen des Workouts" });
    }
  }
);

router.post(
  "/save-completed-workout",
  isAuthenticated,
  async (req: Request, res: Response) => {
    console.log(req.body);
    try {
      const userId = req.user?.id;
      const { workoutId, startTime, pauseTime, duration, exercises, title } =
        req.body;
      if (!userId) throw new Error("Benutzer ID fehlt");
      if (!workoutId) throw new Error("Workout ID fehlt");
      if (!title) throw new Error("Workout Titel fehlt");
      if (!exercises || exercises.length === 0)
        throw new Error("Übungen fehlen");
      if (!duration) throw new Error("Dauer des Workouts fehlt");
      if (!startTime) throw new Error("Startzeit des Workouts fehlt");

      if (pauseTime === undefined || pauseTime === null)
        throw new Error("Pausenzeit des Workouts fehlt");

      const result = await workoutService.saveCompletedWorkout(
        workoutId,
        userId,
        startTime,
        pauseTime,
        duration,
        exercises,
        title
      );
      res.status(200).json({ message: result.message });
    } catch (error) {
      console.error(
        "Fehler beim Speichern des Abgeschlossenen Workouts",
        error
      );
      res
        .status(500)
        .json("Fehler beim Speichern des Abgeschlossenen Workouts");
    }
  }
);

router.get(
  "/completed-workouts/:userId",
  isAuthenticated,
  async (req: Request, res: Response) => {
    console.log(req.params);
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(404).json({ message: "Benutzer ID fehlt." });
      }
      const completedWorkouts = await workoutService.getCompletedWorkouts(
        userId
      );
      res.status(200).json({
        message: "Abgeschlossene Workouts erfolgreich abgefragt.",
        workouts: completedWorkouts,
      });
    } catch (error) {
      res
        .status(404)
        .json({ message: "Fehler beim Abrufen der Abgeschlossenen Workouts" });
    }
  }
);

router.put(
  "/update-workout",
  isAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const workoutId = parseInt(req.body.workoutId);
      const userId = req.user?.id;
      const title: string = req.body.title;
      const exercises: WorkoutExercises[] = req.body.exercises;
      if (!userId || !workoutId || isNaN(workoutId)) {
        return res
          .status(404)
          .json({ message: "Benutzer ID oder Workout ID fehlerhaft." });
      }
      if (!title || !exercises) {
        return res.status(404).json({
          message:
            "Es müssen der Title und mindestens eine Übung vorhanden sein.",
        });
      }

      const result = await workoutService.updateWorkout(
        workoutId,
        userId,
        title,
        exercises
      );
      res.status(200).json({ message: result.message });
    } catch (error) {
      console.error("Fehler beim Aktualisieren des Workouts", error);
      res
        .status(404)
        .json({ message: "Fehler beim Aktualisieren des Workouts" });
    }
  }
);

export default router;
