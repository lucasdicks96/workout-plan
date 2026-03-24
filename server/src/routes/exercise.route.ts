import { Response, Router } from "express";
import { isAuthenticated } from "../middlewares/isAuthenticated";
import * as exerciseService from "../services/exercise.service";
import { BadRequestError } from "../types/errors.types";
import { authenticatedHandler } from "../utils/auth.utils";

const router = Router();

router.get(
  "/exercises",
  isAuthenticated,
  authenticatedHandler(async (req, res: Response) => {
    const userId = req.user.id;

    const combinedExercises = await exerciseService.getExercises(userId);

    res.status(200).json({ exercises: combinedExercises });
  }),
);

router.get(
  "/user-exercises",
  isAuthenticated,
  authenticatedHandler(async (req, res: Response) => {
    const userId = req.user.id;

    const combinedExercises = await exerciseService.getUserExercises(userId);

    res.status(200).json({ exercises: combinedExercises });
  }),
);

router.get(
  "/category-tree",
  isAuthenticated,
  authenticatedHandler(async (req, res: Response) => {
    const categories = await exerciseService.getCategoryTree();
    res.status(200).json({ categories: categories });
  }),
);

router.post(
  "/exercise",
  isAuthenticated,
  authenticatedHandler(async (req, res: Response) => {
    const { title, description, categories } = req.body;
    const userId = req.user.id;

    if (!title || typeof title !== "string" || title.trim() === "") {
      throw new BadRequestError(
        "Titel ist erforderlich und darf nicht leer sein.",
      );
    }

    const newExercise = await exerciseService.postExercise(
      title,
      description,
      userId,
      categories,
    );
    res.status(201).json(newExercise);
  }),
);

router.put(
  "/exercise",
  isAuthenticated,
  authenticatedHandler(async (req, res: Response) => {
    const { id, title, description, categories } = req.body;
    const userId = req.user.id;

    if (isNaN(id)) {
      throw new BadRequestError("Ungültige Übungs-ID.");
    }

    if (!title || typeof title !== "string" || title.trim() === "") {
      throw new BadRequestError("Titel darf nicht leer sein.");
    }

    const result = await exerciseService.putUserExercise(
      id,
      title,
      description,
      userId,
      categories,
    );
    res.status(200).json({ message: result.message });
  }),
);

router.delete(
  "/exercise/:id",
  isAuthenticated,
  authenticatedHandler(async (req, res: Response) => {
    const exerciseId = parseInt(req.params.id);
    const userId = req.user.id;

    if (isNaN(exerciseId)) {
      throw new BadRequestError("Ungültige Übungs-ID.");
    }

    const result = await exerciseService.deleteUserExercise(exerciseId, userId);
    res.status(200).json({ message: result.message });
  }),
);

export default router;
