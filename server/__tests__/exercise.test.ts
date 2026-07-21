import { beforeAll, describe, expect, it } from "@jest/globals";
import request from "supertest";
import pool from "../src/config/db";
import app from "../src/index";
import {
  createAndLoginTestUser,
  createTestCompletedWorkout,
  createTestWorkoutPlan,
} from "./testHelpers";
import crypto from "crypto";

describe("Exercise API Integration Tests (Seeded DB)", () => {
  let validCategoryId: number;

  beforeAll(async () => {
    // 1. Wir fragen die DB nach der erstbesten Kategorie-ID aus deinem Seed
    const res = await pool.query("SELECT id FROM categories LIMIT 1;");

    if (res.rows.length === 0) {
      throw new Error(
        "FAIL: Die Test-DB enthält keine Kategorien. Bitte Seed ausführen!",
      );
    }

    validCategoryId = res.rows[0].id;
  });

  // =================================================================
  // GET /exercises
  // =================================================================
  describe("GET /exercises", () => {
    it("sollte 200 OK und die vorbefüllten Übungen zurückgeben", async () => {
      const { cookie } = await createAndLoginTestUser();

      const response = await request(app)
        .get("/exercise/exercises")
        .set("Cookie", cookie);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
      expect(Array.isArray(response.body.data)).toBe(true);
      // Da deine DB befüllt ist, muss hier zwingend etwas zurückkommen:
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  // =================================================================
  // GET /user-exercises
  // =================================================================
  describe("GET /user-exercises", () => {
    it("sollte für einen frisch erstellten User ein leeres Array zurückgeben", async () => {
      const { cookie } = await createAndLoginTestUser();

      const response = await request(app)
        .get("/exercise/user-exercises")
        .set("Cookie", cookie);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
      // Der Test-User besitzt noch keine eigenen Übungen:
      expect(response.body.data).toEqual([]);
    });
  });

  describe("GET /exercise/:exerciseId/last-performance", () => {
    it("sollte die korrekten letzten Sätze einer absolvierten Übung für den angemeldeten User zurückgeben", async () => {
      const userA = await createAndLoginTestUser();
      const workoutPlanId = crypto.randomInt(1, 10000);
      const exerciseId = 1;

      // User A absolviert ein Training mit bestimmten Werten
      await createTestWorkoutPlan({
        workoutId: workoutPlanId,
        userId: userA.userId,
        title: "Chest Day",
        exerciseId: exerciseId,
        displayOrder: 1,
        setNumber: 1,
        repetitions: 10,
        weight: 20,
      });

      await createTestCompletedWorkout({
        workoutId: workoutPlanId,
        userId: userA.userId,
        title: "Brust Tag",
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600),
        duration: 3600,
        pause: 100,
        exerciseId: exerciseId,
        setNumber: 1,
        repetitions: 12,
        weight: 50,
      });

      // User A ruft die letzte Performance für diese Übung ab
      const response = await request(app)
        .get(`/exercise/${exerciseId}/last-performance`)
        .set("Cookie", userA.cookie);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
      expect(response.body.data).toEqual([
        {
          setNumber: 1,
          weight: 50,
          repetitions: 12,
        },
      ]);
    });

    it("sollte keine Historie eines fremden Users zurückgeben (Datenschutz/Isolation)", async () => {
      const userA = await createAndLoginTestUser();
      const userB = await createAndLoginTestUser();
      const workoutPlanId = crypto.randomInt(1, 10000);
      const exerciseId = 1;

      // User A hat die Übung absolviert (schwere Gewichte)
      await createTestWorkoutPlan({
        workoutId: workoutPlanId,
        userId: userA.userId,
        title: "Chest Day",
        exerciseId: exerciseId,
        displayOrder: 1,
        setNumber: 1,
        repetitions: 10,
        weight: 20,
      });

      await createTestCompletedWorkout({
        workoutId: workoutPlanId,
        userId: userA.userId,
        title: "Geheimes Training von A",
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600),
        duration: 3600,
        pause: 100,
        exerciseId: exerciseId,
        setNumber: 1,
        repetitions: 8,
        weight: 100,
      });

      // User B versucht, die Historie genau dieser Übung abzurufen (hat sie selbst aber nie gemacht)
      const responseB = await request(app)
        .get(`/exercise/${exerciseId}/last-performance`)
        .set("Cookie", userB.cookie);

      expect(responseB.status).toBe(200);
      expect(responseB.body.status).toBe("success");
      // Da User B keine eigene Historie für diese Übung hat, muss ein leeres Array zurückkommen
      expect(responseB.body.data).toEqual([]);
    });
  });

  // =================================================================
  // GET /category-tree
  // =================================================================
  describe("GET /category-tree", () => {
    it("sollte 200 OK und den vorbefüllten Kategorie-Baum zurückgeben", async () => {
      const { cookie } = await createAndLoginTestUser();

      const response = await request(app)
        .get("/exercise/category-tree")
        .set("Cookie", cookie);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  // =================================================================
  // POST /exercise
  // =================================================================
  describe("POST /exercise", () => {
    it("sollte 201 Created zurückgeben und die neue Übung anlegen", async () => {
      const { cookie } = await createAndLoginTestUser();
      const payload = {
        title: "Integration Test Squat",
        description: "Wird nach dem Test in der DB verbleiben",
        categories: [validCategoryId], // Nutzt die dynamische ID aus dem Seed
      };

      const response = await request(app)
        .post("/exercise/exercise")
        .set("Cookie", cookie)
        .send(payload);

      expect(response.status).toBe(201);
      expect(response.body.status).toBe("success");
      expect(response.body.message).toBe("Übung erfolgreich erstellt.");
    });

    it("sollte mit 400 scheitern, wenn Zod die Daten ablehnt (leerer Titel)", async () => {
      const { cookie } = await createAndLoginTestUser();

      const response = await request(app)
        .post("/exercise/exercise")
        .set("Cookie", cookie)
        .send({ title: "", categories: [validCategoryId] });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  // =================================================================
  // PUT Operations (Body ID & Param ID)
  // =================================================================
  describe("PUT Operations", () => {
    it("sollte eine eigene Übung via Body-ID erfolgreich updaten", async () => {
      const { cookie } = await createAndLoginTestUser();

      // Setup: Eigene Übung erzeugen
      const createRes = await request(app)
        .post("/exercise/exercise")
        .set("Cookie", cookie)
        .send({ title: "Pre-Update Body", categories: [validCategoryId] });

      const myExerciseId = createRes.body.data.id;

      const response = await request(app)
        .put("/exercise/exercise")
        .set("Cookie", cookie)
        .send({
          id: myExerciseId,
          title: "Post-Update Body",
          description: "Aktualisiert",
          categories: [validCategoryId],
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Übung erfolgreich aktualisiert");
    });

    it("sollte eine eigene Übung via URL-Parameter (:id) updaten", async () => {
      const { cookie } = await createAndLoginTestUser();

      // 2. Act: POST-Request mit Payload und Cookie absenden
      const createRes = await request(app)
        .post("/exercise/exercise")
        .set("Cookie", cookie)
        .send({
          title: "Test-Übung",
          description: "Testbeschreibung",
          categories: [validCategoryId],
        });

      const myExerciseId = createRes.body.data.id;

      const response = await request(app)
        .put(`/exercise/exercise/${myExerciseId}`)
        .set("Cookie", cookie)
        .send({
          id: myExerciseId,
          title: "Post-Update Param",
          description: "Aktualisiert via Param",
          categories: [validCategoryId],
        });

      if (response.status !== 200) {
        console.log("Put Operations create exercise res ", createRes.body);
        console.log("Put Operations put response: ", response.body);
      }

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
    });
  });

  // =================================================================
  // DELETE /exercise/:id
  // =================================================================
  describe("DELETE /exercise/:id", () => {
    it("sollte eine eigene Übung soft-deleten", async () => {
      const { cookie } = await createAndLoginTestUser();

      const createRes = await request(app)
        .post("/exercise/exercise")
        .set("Cookie", cookie)
        .send({
          title: "Test-Übung",
          description: "Testbeschreibung",
          categories: [validCategoryId],
        });

      const myExerciseId = createRes.body.data.id;

      const deleteRes = await request(app)
        .delete(`/exercise/exercise/${myExerciseId}`)
        .set("Cookie", cookie);

      if (deleteRes.status !== 200) {
        console.log("Delete /exercise/:id data: ", createRes.body.data);
        console.log("Delete /exercise/:id delete response: ", deleteRes.body);
      }

      expect(deleteRes.status).toBe(200);

      // Gegenprüfung: Darf beim User nicht mehr gelistet werden
      const listRes = await request(app)
        .get("/exercise/user-exercises")
        .set("Cookie", cookie);

      const stillExists = listRes.body.data.length === 0 ? false : true;

      expect(stillExists).toBe(false);
    });

    it("sollte 404 werfen, wenn man versucht, die Seed-Übung eines fremden Users zu löschen", async () => {
      const attacker = await createAndLoginTestUser();

      // Wir holen uns die ID irgendeiner Übung, die der Attacker NICHT erstellt hat
      const allExercisesRes = await pool.query(
        "SELECT id FROM exercises LIMIT 1;",
      );
      const foreignExerciseId = allExercisesRes.rows[0].id;

      const deleteRes = await request(app)
        .delete(`/exercise/exercise/${foreignExerciseId}`)
        .set("Cookie", attacker.cookie);

      // Dein Service wirft hier NotFoundError -> Controller macht daraus 404
      expect(deleteRes.status).toBe(404);
    });
  });
});
