import { ApiResponse } from "@workout/shared";
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

/**
 * GET /exercises
 *
 * Ruft alle für den authentifizierten Benutzer verfügbaren Übungen ab
 * (globale Systemübungen sowie eigene benutzerdefinierte Übungen).
 *
 * @security Authentifiziert via Session (`isAuthenticated`).
 * @returns {ApiResponse<Exercise[]>} 200 - Array aller verfügbaren Übungen.
 */
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

/**
 * GET /user-exercises
 *
 * Ruft exklusiv die vom authentifizierten Benutzer selbst erstellten Übungen ab.
 *
 * @security Authentifiziert via Session (`isAuthenticated`).
 * @returns {ApiResponse<Exercise[]>} 200 - Array der eigenen benutzerdefinierten Übungen.
 */
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

/**
 * GET /:exerciseId/last-performance
 *
 * Ruft die absolvierten Leistungssätze (Gewicht & Wiederholungen) des allerletzten Trainings
 * für eine spezifische Übung des angemeldeten Benutzers ab.
 *
 * @param {string} req.params.exerciseId - Die eindeutige ID der abzufragenden Übung.
 * @security Authentifiziert via Session (`isAuthenticated`).
 * @returns {ApiResponse<{ setNumber: number; weight: number; repetitions: number }[]>}
 *          200 - Array der Sätze aus dem letzten Durchlauf dieser Übung.
 */
router.get(
  "/:exerciseId/last-performance",
  isAuthenticated,
  authenticatedHandler(
    async (
      req: AuthenticatedRequest<any, any, never>,
      res: Response<
        ApiResponse<
          {
            setNumber: number;
            weight: number;
            repetitions: number;
          }[]
        >
      >,
    ) => {
      const exerciseId = Number(req.params.exerciseId);
      const performance = await exerciseService.getLastExercisePerformance(
        req.user.id,
        exerciseId,
      );

      res.status(200).json({
        status: "success",
        data: performance,
        message: "Historie der Übung erfolgreich geladen.",
      });
    },
  ),
);

/**
 * GET /category-tree
 *
 * Ruft den vollständigen, hierarchischen Kategoriebaum für Übungen ab.
 *
 * @security Authentifiziert via Session (`isAuthenticated`).
 * @returns {ApiResponse<Category[]>} 200 - Der hierarchische Kategoriebaum.
 */
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

/**
 * POST /exercise
 *
 * Validiert den Request-Body über das `createExerciseBodySchema` und erstellt
 * eine neue, benutzerspezifische Übung mitsamt Kategorie-Zuordnungen.
 *
 * @security Authentifiziert via Session (`isAuthenticated`).
 * @returns {ApiResponse<number>} 201 - Die ID der neu erstellten Übung.
 */
router.post(
  "/exercise",
  isAuthenticated,
  authenticatedHandler(
    async (
      req: AuthenticatedRequest<any, any, CreateExerciseBody>,
      res: Response<ApiResponse<{ id: number }>>,
    ) => {
      // Validierung über Zod: Löst bei ungültigen Eingaben automatisch einen Validierungsfehler aus
      const { title, description, categories } = createExerciseBodySchema.parse(
        req.body,
      );

      const result = await exerciseService.postExercise(
        title,
        description,
        req.user.id,
        categories,
      );

      res
        .status(201)
        .json({
          status: "success",
          message: result.message,
          data: { id: result.id },
        });
    },
  ),
);

/**
 * PUT /exercise
 *
 * Aktualisiert eine bestehende Übung über die im Request-Body übergebene ID
 * und validiert die Daten mit dem `updateExerciseBodySchema`.
 *
 * @security Authentifiziert via Session (`isAuthenticated`).
 * @returns {ApiResponse} 200 - Erfolgsmeldung der Aktualisierung.
 */
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

/**
 * PUT /exercise/:id
 *
 * Aktualisiert eine bestehende Übung, wobei die ID als URL-Parameter übergeben
 * und validiert wird, während Titel, Beschreibung und Kategorien im Body stehen.
 *
 * @param {string} req.params.id - Die eindeutige ID der zu aktualisierenden Übung.
 * @security Authentifiziert via Session (`isAuthenticated`).
 * @returns {ApiResponse} 200 - Erfolgsmeldung der Aktualisierung.
 */
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

/**
 * DELETE /exercise/:id
 *
 * Führt einen Soft Delete für eine benutzerdefinierte Übung anhand der ID in der URL aus.
 *
 * @param {string} req.params.id - Die eindeutige ID der zu löschenden Übung.
 * @security Authentifiziert via Session (`isAuthenticated`).
 * @returns {ApiResponse} 200 - Erfolgsmeldung der Löschung.
 */
router.delete(
  "/exercise/:id",
  isAuthenticated,
  authenticatedHandler(
    async (
      req: AuthenticatedRequest<any, any, never>,
      res: Response<ApiResponse>,
    ) => {
      // Validiert den URL-Parameter und konvertiert ihn in eine Nummer
      const { id } = exerciseIdParamSchema.parse(req.params);

      const result = await exerciseService.deleteUserExercise(id, req.user.id);

      res.status(200).json({ status: "success", message: result.message });
    },
  ),
);

export default router;
