import { Request, Response, Router } from "express";
import { isAuthenticated } from "../middlewares/isAuthenticated";
import * as exerciseService from "../services/exercise.service";

const router = Router();

router.get(
  "/all-exercises",
  isAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId || userId === undefined) {
        return res.status(404).json({ message: "Benutzer ID fehlt." });
      }

      const combinedExercises =
        await exerciseService.getCombinedExercisesForUser(userId);
      res.status(200).json(combinedExercises);
    } catch (error) {
      console.error("Error fetching combined exercises:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

router.post(
  "/create-exercise",
  isAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const { title, description } = req.body;
      const userId = req.user?.id;

      if (!title || typeof title !== "string" || title.trim() === "") {
        return res.status(400).json({
          message: "Titel ist erforderlich und darf nicht leer sein.",
        });
      }
      if (!userId) {
        return res.status(400).json({ message: "Benutzer ID fehlt." });
      }

      const newExercise = await exerciseService.createNewExercise(
        title,
        description,
        userId
      );
      res.status(201).json(newExercise);
    } catch (error) {
      console.error("Error creating exercise:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

router.put(
  "/edit-exercise/:id",
  isAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const exerciseId = parseInt(req.params.id);
      const { title, description } = req.body;
      const userId = req.user?.id;

      if (isNaN(exerciseId)) {
        return res.status(400).json({ message: "Ungültige Übungs-ID." });
      }

      if (!title || typeof title !== "string" || title.trim() === "") {
        return res.status(400).json({ message: "Titel darf nicht leer sein." });
      }
      if (!userId) {
        return res.status(400).json({ message: "Benutzer ID fehlt." });
      }

      const updatedExercise = await exerciseService.updateUserExercise(
        exerciseId,
        title,
        description,
        userId
      );
      res.status(200).json(updatedExercise);
    } catch (error) {
      if (error instanceof Error)
        if (
          error.message.includes("not found") ||
          error.message.includes("not authorized")
        ) {
          return res
            .status(404)
            .json({ message: "Übung nicht gefunden oder keine Berechtigung." });
        }
      console.error("Error updating exercise:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

router.delete(
  "/delete-exercise/:id",
  isAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const exerciseId = parseInt(req.params.id);
      const userId = req.user?.id;

      if (isNaN(exerciseId)) {
        return res.status(400).json({ message: "Ungültige Übungs-ID." });
      }
      if (!userId) {
        return res.status(400).json({ message: "Benutzer ID fehlt." });
      }

      await exerciseService.deleteUserExercise(exerciseId, userId);
      res.status(204).send();
    } catch (error) {
      if (error instanceof Error)
        if (
          error.message.includes("not found") ||
          error.message.includes("not authorized")
        ) {
          return res
            .status(404)
            .json({ message: "Übung nicht gefunden oder keine Berechtigung." });
        }
      console.error("Error deleting exercise:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default router;
