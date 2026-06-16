import { ApiResponse } from "@workout/shared"; // Geändert zu ApiResponse
import { Response, Router } from "express";
import { isAuthenticated } from "../middlewares/isAuthenticated";
import * as workoutService from "../services/workout.service";
import { CompletedWorkout, Workout } from "../types/workout.types";
import {
  authenticatedHandler,
  AuthenticatedRequest,
} from "../utils/auth.utils";

// Zod Schemas importieren
import {
  CreateWorkoutBody,
  createWorkoutBodySchema,
  PostCompletedWorkoutBody,
  postCompletedWorkoutBodySchema,
  PutCompletedWorkoutBody,
  completedWorkoutSchema,
  stringIdParamSchema,
  workoutIdParamSchema,
} from "../schemas/workout.schema";

const router = Router();

router.get(
  "/workouts",
  isAuthenticated,
  authenticatedHandler(
    async (
      req: AuthenticatedRequest<any, any, never>,
      res: Response<ApiResponse<Workout[]>>,
    ) => {
      const workouts = await workoutService.getAllWorkouts(req.user.id);
      res.status(200).json({
        status: "success",
        message: "Workout erfolgreich übermittelt",
        data: workouts,
      });
    },
  ),
);

router.get(
  "/workout/:workoutId",
  isAuthenticated,
  authenticatedHandler(
    async (
      req: AuthenticatedRequest<any, any, never>,
      res: Response<ApiResponse<Workout>>,
    ) => {
      const { workoutId } = workoutIdParamSchema.parse(req.params);
      const workoutData = await workoutService.getWorkoutById(
        workoutId,
        req.user.id,
      );

      res.status(200).json({
        status: "success",
        data: workoutData,
        message: "Workout Übungen erfolgreich übermittelt",
      });
    },
  ),
);

router.get(
  "/last-workout/:workoutId",
  isAuthenticated,
  authenticatedHandler(
    async (
      req: AuthenticatedRequest<any, any, never>,
      res: Response<ApiResponse<Workout>>,
    ) => {
      const { workoutId } = workoutIdParamSchema.parse(req.params);
      const workoutData = await workoutService.getLastWorkout(
        workoutId,
        req.user.id,
      );

      res.status(200).json({
        status: "success",
        data: workoutData,
        message: "Workout erfolgreich übermittelt",
      });
    },
  ),
);

router.post(
  "/workout",
  isAuthenticated,
  authenticatedHandler(
    async (
      req: AuthenticatedRequest<any, any, CreateWorkoutBody>,
      res: Response<ApiResponse<Workout>>, // Void, also kein data-Feld erwartet
    ) => {
      const { title, exercises } = createWorkoutBodySchema.parse(req.body);
      const workout = await workoutService.createWorkoutPlan(
        title,
        req.user.id,
        exercises,
      );

      res.status(200).json({
        status: "success",
        message: "Workout erfolgreich gespeichert",
        data: workout,
      });
    },
  ),
);

router.delete(
  "/workout/:workoutId",
  isAuthenticated,
  authenticatedHandler(
    async (
      req: AuthenticatedRequest<any, any, never>,
      res: Response<ApiResponse>,
    ) => {
      const { workoutId } = workoutIdParamSchema.parse(req.params);
      const result = await workoutService.deleteWorkout(workoutId, req.user.id);

      res.status(200).json({ status: "success", message: result.message });
    },
  ),
);

router.post(
  "/completed-workout",
  isAuthenticated,
  authenticatedHandler(
    async (
      req: AuthenticatedRequest<any, any, PostCompletedWorkoutBody>,
      res: Response<ApiResponse<CompletedWorkout>>,
    ) => {
      const {
        workoutId,
        startTime,
        endTime,
        pauseTime,
        duration,
        exercises,
        title,
      } = postCompletedWorkoutBodySchema.parse(req.body);

      const completedWorkout = await workoutService.postCompletedWorkout(
        workoutId,
        req.user.id,
        startTime,
        endTime,
        pauseTime,
        duration,
        exercises,
        title,
      );

      res.status(200).json({
        status: "success",
        message: "Abgeschlossenes Workout erfolreich gespeichert",
        data: completedWorkout,
      });
    },
  ),
);

router.get(
  "/completed-workouts",
  isAuthenticated,
  authenticatedHandler(
    async (
      req: AuthenticatedRequest<any, any, never>,
      res: Response<ApiResponse<CompletedWorkout[]>>,
    ) => {
      const completedWorkouts = await workoutService.getCompletedWorkouts(
        req.user.id,
      );

      res.status(200).json({
        status: "success",
        data: completedWorkouts,
        message: "Abgeschlossene Workouts erfolgreich abgefragt.",
      });
    },
  ),
);

router.get(
  "/completed-workout/:workoutId",
  isAuthenticated,
  authenticatedHandler(
    async (
      req: AuthenticatedRequest<any, any, never>,
      res: Response<ApiResponse<CompletedWorkout>>,
    ) => {
      const { workoutId } = stringIdParamSchema.parse(req.params);
      const workoutData = await workoutService.getCompletedWorkout(
        req.user.id,
        workoutId,
      );

      res.status(200).json({
        status: "success",
        data: workoutData,
        message: "Abgeschlossenes Workout erfolgreich abgefragt.",
      });
    },
  ),
);

router.put(
  "/workout/:workoutId",
  isAuthenticated,
  authenticatedHandler(
    async (
      req: AuthenticatedRequest<any, any, CreateWorkoutBody>,
      res: Response<ApiResponse<Workout>>,
    ) => {
      const { workoutId } = workoutIdParamSchema.parse(req.params);
      const { title, exercises } = createWorkoutBodySchema.parse(req.body);

      const workout = await workoutService.putWorkout(
        workoutId,
        req.user.id,
        title,
        exercises,
      );

      res.status(200).json({
        status: "success",
        message: "Workoutplan erfolgreich aktualisiert",
        data: workout,
      });
    },
  ),
);

router.put(
  "/completed-workout",
  isAuthenticated,
  authenticatedHandler(
    async (
      req: AuthenticatedRequest<any, any, PutCompletedWorkoutBody>,
      res: Response<ApiResponse<CompletedWorkout>>,
    ) => {
      const workout = completedWorkoutSchema.parse(req.body);
      const completedWorkout =
        await workoutService.putCompletedWorkout(workout);

      res.status(200).json({
        status: "success",
        message: "Abgeschlossenes Workout erfolgreich aktualisiert",
        data: completedWorkout,
      });
    },
  ),
);

export default router;
