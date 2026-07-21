import { ApiResponse } from "@workout/shared";
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

/**
 * GET /workouts
 *
 * Ruft alle aktiven Trainingspläne inklusive der dazugehörigen Übungen und Sätze
 * für den aktuell authentifizierten Benutzer ab.
 *
 * @route GET /workouts
 * @security Authentifiziert via Session (`isAuthenticated`).
 * @returns {ApiResponse<Workout[]>} 200 - Liste aller aktiven Trainingspläne des Benutzers.
 */
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

/**
 * GET /workout/:workoutId
 *
 * Ruft die detaillierten Informationen eines spezifischen Trainingsplans
 * anhand seiner numerischen ID ab.
 *
 * @route GET /workout/:workoutId
 * @param {string} req.params.workoutId - Die eindeutige numerische ID des Trainingsplans.
 * @security Authentifiziert via Session (`isAuthenticated`).
 * @returns {ApiResponse<Workout>} 200 - Das angeforderte Workout-Plan-Objekt.
 */
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

/**
 * GET /last-workout/:workoutId
 *
 * Ruft die Daten des chronologisch letzten absolvierten Trainings zu einem bestimmten
 * Workout-Plan ab (dient zur Anzeige der vorherigen Gewichte/Wiederholungen als Referenz).
 *
 * @route GET /last-workout/:workoutId
 * @param {string} req.params.workoutId - Die eindeutige ID des Trainingsplans.
 * @security Authentifiziert via Session (`isAuthenticated`).
 * @returns {ApiResponse<Workout>} 200 - Das letzte absolvierte Workout mitsamt Sätzen/Gewichten.
 */
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

/**
 * POST /workout
 *
 * Validiert die Formulardaten über Zod und erstellt einen neuen Trainingsplan
 * mitsamt Übungen und Sätzen für den Benutzer.
 *
 * @route POST /workout
 * @security Authentifiziert via Session (`isAuthenticated`).
 * @returns {ApiResponse<number>} 200 - Die generierte ID des erstellten Trainingsplans.
 */
router.post(
  "/workout",
  isAuthenticated,
  authenticatedHandler(
    async (
      req: AuthenticatedRequest<any, any, CreateWorkoutBody>,
      res: Response<ApiResponse<{ id: number }>>,
    ) => {
      const { title, exercises } = createWorkoutBodySchema.parse(req.body);
      const { id } = await workoutService.createWorkoutPlan(
        title,
        req.user.id,
        exercises,
      );

      res.status(200).json({
        status: "success",
        message: "Workout erfolgreich gespeichert",
        data: { id: id },
      });
    },
  ),
);

/**
 * DELETE /workout/:workoutId
 *
 * Führt einen Soft Delete für einen bestimmten Trainingsplan anhand der ID in der URL aus.
 *
 * @route DELETE /workout/:workoutId
 * @param {string} req.params.workoutId - Die ID des zu löschenden Trainingsplans.
 * @security Authentifiziert via Session (`isAuthenticated`).
 * @returns {ApiResponse} 200 - Erfolgsmeldung der Löschung.
 */
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

/**
 * POST /completed-workout
 *
 * Speichert ein erfolgreich absolviertes Training (inklusive Start-/Endzeit, Dauer,
 * Pausenzeiten und absolvierter Sätze) in der Datenbank ab.
 *
 * @route POST /completed-workout
 * @security Authentifiziert via Session (`isAuthenticated`).
 * @returns {ApiResponse<string>} 200 - Die eindeutige UUID des gespeicherten absolvierten Workouts.
 */
router.post(
  "/completed-workout",
  isAuthenticated,
  authenticatedHandler(
    async (
      req: AuthenticatedRequest<any, any, PostCompletedWorkoutBody>,
      res: Response<ApiResponse<{ id: string }>>,
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

      const { id } = await workoutService.postCompletedWorkout(
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
        data: { id: id },
      });
    },
  ),
);

/**
 * GET /completed-workouts
 *
 * Ruft eine Historie aller vom Benutzer absolvierten Workouts ab.
 *
 * @route GET /completed-workouts
 * @security Authentifiziert via Session (`isAuthenticated`).
 * @returns {ApiResponse<CompletedWorkout[]>} 200 - Historie aller absolvierten Workouts.
 */
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

/**
 * GET /completed-workout/:workoutId
 *
 * Ruft die Details eines spezifischen absolvierten Workouts anhand seiner UUID ab.
 *
 * @route GET /completed-workout/:workoutId
 * @param {string} req.params.workoutId - Die eindeutige UUID des absolvierten Workouts.
 * @security Authentifiziert via Session (`isAuthenticated`).
 * @returns {ApiResponse<CompletedWorkout>} 200 - Die Detaildaten des absolvierten Workouts.
 */
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

/**
 * PUT /workout/:workoutId
 *
 * Aktualisiert einen bestehenden Trainingsplan (Titel sowie verknüpfte Übungen und Sätze)
 * basierend auf der ID in der URL.
 *
 * @route PUT /workout/:workoutId
 * @param {string} req.params.workoutId - Die ID des zu aktualisierenden Trainingsplans.
 * @security Authentifiziert via Session (`isAuthenticated`).
 * @returns {ApiResponse} 200 - Erfolgsmeldung der Aktualisierung.
 */
router.put(
  "/workout/:workoutId",
  isAuthenticated,
  authenticatedHandler(
    async (
      req: AuthenticatedRequest<any, any, CreateWorkoutBody>,
      res: Response<ApiResponse>,
    ) => {
      const { workoutId } = workoutIdParamSchema.parse(req.params);
      const { title, exercises } = createWorkoutBodySchema.parse(req.body);

      await workoutService.putWorkout(workoutId, req.user.id, title, exercises);

      res.status(200).json({
        status: "success",
        message: "Workoutplan erfolgreich aktualisiert",
      });
    },
  ),
);

/**
 * PUT /completed-workout
 *
 * Aktualisiert die Daten und Sätze eines bereits absolvierten Workouts.
 *
 * @route PUT /completed-workout
 * @security Authentifiziert via Session (`isAuthenticated`).
 * @returns {ApiResponse} 200 - Erfolgsmeldung der Aktualisierung.
 */
router.put(
  "/completed-workout",
  isAuthenticated,
  authenticatedHandler(
    async (
      req: AuthenticatedRequest<any, any, PutCompletedWorkoutBody>,
      res: Response<ApiResponse>,
    ) => {
      const workout = completedWorkoutSchema.parse(req.body);

      await workoutService.putCompletedWorkout(workout);

      res.status(200).json({
        status: "success",
        message: "Abgeschlossenes Workout erfolgreich aktualisiert",
      });
    },
  ),
);

export default router;
