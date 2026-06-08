import { ApiResponse } from "@workout/shared"; // Geändert zu ApiResponse
import { Response, Router } from "express";
import { isAuthenticated } from "../middlewares/isAuthenticated";
import * as exerciseService from "../services/exercise.service";
import {
  authenticatedHandler,
  AuthenticatedRequest,
} from "../utils/auth.utils";
import { Category, Exercise } from "../types/exercise.types";

import {
  createExerciseBodySchema,
  CreateExerciseBody,
  updateExerciseBodySchema,
  UpdateExerciseBody,
  exerciseIdParamSchema,
} from "../schemas/exercise.schema";

const router = Router();

router.get(
  "/exercises",
  isAuthenticated,
  authenticatedHandler(
    async (
      req: AuthenticatedRequest<any, any, never>,
      res: Response<ApiResponse<Exercise[]>>,
    ) => {
      const combinedExercises = await exerciseService.getExercises(req.user.id);
      res.status(200).json({ status: "success", data: combinedExercises });
    },
  ),
);

router.get(
  "/user-exercises",
  isAuthenticated,
  authenticatedHandler(
    async (
      req: AuthenticatedRequest<any, any, never>,
      res: Response<ApiResponse<Exercise[]>>,
    ) => {
      const combinedExercises = await exerciseService.getUserExercises(
        req.user.id,
      );
      res.status(200).json({ status: "success", data: combinedExercises });
    },
  ),
);

router.get(
  "/category-tree",
  isAuthenticated,
  authenticatedHandler(
    async (
      req: AuthenticatedRequest<any, any, never>,
      res: Response<ApiResponse<Category[]>>,
    ) => {
      const categories = await exerciseService.getCategoryTree();
      res.status(200).json({ status: "success", data: categories });
    },
  ),
);

router.post(
  "/exercise",
  isAuthenticated,
  authenticatedHandler(
    async (
      req: AuthenticatedRequest<any, any, CreateExerciseBody>,
      res: Response<ApiResponse<Exercise>>,
    ) => {
      // Wenn etwas fehlt oder falsch ist, wirft Zod hier automatisch einen Fehler!
      const { title, description, categories } = createExerciseBodySchema.parse(
        req.body,
      );

      const newExercise = await exerciseService.postExercise(
        title,
        description,
        req.user.id,
        categories,
      );

      res.status(201).json({ status: "success", data: newExercise });
    },
  ),
);

router.put(
  "/exercise",
  isAuthenticated,
  authenticatedHandler(
    async (
      req: AuthenticatedRequest<any, any, UpdateExerciseBody>,
      res: Response<ApiResponse>, // Void erwartet kein data-Feld
    ) => {
      const { id, title, description, categories } =
        updateExerciseBodySchema.parse(req.body);

      const result = await exerciseService.putUserExercise(
        id,
        title,
        description,
        req.user.id,
        categories,
      );

      res.status(200).json({ status: "success", message: result.message });
    },
  ),
);

router.put(
  "/exercise/:id",
  isAuthenticated,
  authenticatedHandler(
    async (
      req: AuthenticatedRequest<any, any, CreateExerciseBody>,
      res: Response<ApiResponse>,
    ) => {
      const { id } = exerciseIdParamSchema.parse(req.params);
      const { title, description, categories } = createExerciseBodySchema.parse(
        req.body,
      );

      const result = await exerciseService.putUserExercise(
        id,
        title,
        description,
        req.user.id,
        categories,
      );

      res.status(200).json({ status: "success", message: result.message });
    },
  ),
);

router.delete(
  "/exercise/:id",
  isAuthenticated,
  authenticatedHandler(
    async (
      req: AuthenticatedRequest<any, any, never>,
      res: Response<ApiResponse>,
    ) => {
      // String aus URL sicher validieren und in Number konvertieren
      const { id } = exerciseIdParamSchema.parse(req.params);

      const result = await exerciseService.deleteUserExercise(id, req.user.id);

      res.status(200).json({ status: "success", message: result.message });
    },
  ),
);

export default router;
