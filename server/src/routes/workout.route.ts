import { Response, Router } from "express";
import { isAuthenticated } from "../middlewares/isAuthenticated";
import * as workoutService from "../services/workout.service";
import { CompletedWorkout, Workout } from "../types/workout.types";
import {
  authenticatedHandler,
  AuthenticatedRequest,
} from "../utils/auth.utils";
import { ApiSuccessResponse } from "@workout/shared";

import {
  workoutIdParamSchema,
  stringIdParamSchema,
  createWorkoutBodySchema,
  CreateWorkoutBody,
  postCompletedWorkoutBodySchema,
  PostCompletedWorkoutBody,
  putCompletedWorkoutBodySchema,
  PutCompletedWorkoutBody,
} from "../schemas/workout.schema";

const router = Router();

router.get(
  "/workouts",
  isAuthenticated,
  authenticatedHandler(
    async (
      req: AuthenticatedRequest<any, any, never>,
      res: Response<ApiSuccessResponse<Workout[]>>,
    ) => {
      const workouts = await workoutService.getAllWorkouts(req.user.id);
      res.status(200).json({ status: "success", data: workouts });
    },
  ),
);

router.get(
  "/workout/:workoutId",
  isAuthenticated,
  authenticatedHandler(
    async (
      req: AuthenticatedRequest<{ workoutId: string }, any, never>,
      res: Response<ApiSuccessResponse<Workout>>,
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
      req: AuthenticatedRequest<{ workoutId: string }, any, never>,
      res: Response<ApiSuccessResponse<Workout>>,
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
      res: Response<ApiSuccessResponse>,
    ) => {
      const { title, exercises } = createWorkoutBodySchema.parse(req.body);

      const result = await workoutService.createWorkoutPlan(
        title,
        req.user.id,
        exercises,
      );

      res.status(200).json({ status: "success", message: result.message });
    },
  ),
);

router.delete(
  "/workout/:workoutId",
  isAuthenticated,
  authenticatedHandler(
    async (
      req: AuthenticatedRequest<{ workoutId: string }, any, never>,
      res: Response<ApiSuccessResponse>,
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
      res: Response<ApiSuccessResponse>,
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

      const result = await workoutService.postCompletedWorkout(
        workoutId,
        req.user.id,
        startTime,
        endTime,
        pauseTime,
        duration,
        exercises,
        title,
      );

      res.status(200).json({ status: "success", message: result.message });
    },
  ),
);

router.get(
  "/completed-workouts",
  isAuthenticated,
  authenticatedHandler(
    async (
      req: AuthenticatedRequest<any, any, never>,
      res: Response<ApiSuccessResponse<CompletedWorkout[]>>,
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
      req: AuthenticatedRequest<{ workoutId: string }, any, never>,
      res: Response<ApiSuccessResponse<CompletedWorkout>>,
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
      req: AuthenticatedRequest<{ workoutId: string }, any, CreateWorkoutBody>,
      res: Response<ApiSuccessResponse>,
    ) => {
      // Parameter parsen UND Body parsen
      const { workoutId } = workoutIdParamSchema.parse(req.params);
      const { title, exercises } = createWorkoutBodySchema.parse(req.body);

      const result = await workoutService.putWorkout(
        workoutId,
        req.user.id,
        title,
        exercises,
      );

      res.status(200).json({ status: "success", message: result.message });
    },
  ),
);

router.put(
  "/completed-workout",
  isAuthenticated,
  authenticatedHandler(
    async (
      req: AuthenticatedRequest<any, any, PutCompletedWorkoutBody>,
      res: Response<ApiSuccessResponse>,
    ) => {
      const { workout } = putCompletedWorkoutBodySchema.parse(req.body);

      const result = await workoutService.putCompletedWorkout(workout);
      res.status(200).json({ status: "success", message: result.message });
    },
  ),
);

export default router;
