import { describe, it, expect } from "@jest/globals";
import request from "supertest";
import app from "../src/index";
import { createAndLoginTestUser } from "./testHelpers";
import pool from "../src/config/db";
import crypto from "crypto"; // Für die Generierung von Test-IDs

// 1. Die Beschreibung des Tests (optional, aber für die Übersicht wichtig)
describe("GET /workout/completed-workouts", () => {
  it("sollte 200 OK und eine Liste von Workouts zurückgeben, wenn der User eingeloggt ist", async () => {
    const { cookie } = await createAndLoginTestUser();

    // 2. HIER den Pfad anpassen!
    const response = await request(app)
      .get("/workout/completed-workouts")
      .set("Cookie", cookie);

    // Wieder unser Debug-Trick, falls es nicht klappt:
    if (response.status !== 200) {
      console.log("Workout Error Body:", response.body);
    }

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("success");
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBe(0);
  });

  it("sollte 401 Unauthorized zurückgeben, wenn kein gültiger Cookie gesendet wird", async () => {
    const response = await request(app).get("/workout/completed-workouts");

    expect(response.status).toBe(401);
    expect(response.body.status).toBe("fail");
    expect(response.body.message).toBe("Nicht authentifiziert");
  });
});

describe("POST /workout/workout", () => {
  it("sollte 200 OK zurückgeben und ein Workout erfolgreich in der Datenbank anlegen", async () => {
    // 1. Arrange: User erstellen und einloggen
    const { cookie } = await createAndLoginTestUser();

    // Bereite die Testdaten vor, die genau deinem createWorkoutBodySchema entsprechen
    const newWorkoutPayload = {
      title: "Push Day (Test)",
      exercises: [
        {
          // Nutze hier Test-Daten, die deine Zod-Validierung für Übungen erwartet
          id: 1,
          title: "Bankdrücken",
          displayOrder: 1,
          sets: [{ setNumber: 1, weight: 60, repetitions: 10 }],
        },
      ],
    };

    // 2. Act: POST-Request mit Payload und Cookie absenden
    const response = await request(app)
      .post("/workout/workout")
      .set("Cookie", cookie)
      .send(newWorkoutPayload);

    // Hilfreiches Debugging, falls das Zod-Schema oder der Service fehlschlägt
    if (response.status !== 200) {
      console.log("POST Error Body:", response.body);
    }

    // 3. Assert: Antwort des Servers prüfen
    expect(response.status).toBe(200);
    expect(response.body.status).toBe("success");
    expect(response.body.message).toBeDefined(); // Prüft, ob eine Erfolgsmeldung existiert

    // 4. Der "Enterprise"-Zusatz-Check: Wir prüfen, ob die Daten JETZT wirklich in der DB existieren!
    const checkResponse = await request(app)
      .get("/workout/workouts") // Nutzt deine Route für alle Workout-Pläne
      .set("Cookie", cookie);

    expect(checkResponse.status).toBe(200);
    expect(checkResponse.body.data.length).toBe(1);
    expect(checkResponse.body.data[0].title).toBe("Push Day (Test)");
  });

  it("sollte 400 Bad Request zurückgeben, wenn die Payload ungültig ist (Zod-Test)", async () => {
    const { cookie } = await createAndLoginTestUser();

    // Eine komplett unvollständige Payload senden (z.B. fehlender Titel)
    const invalidPayload = {
      exercises: [],
    };

    const response = await request(app)
      .post("/workout/workout")
      .set("Cookie", cookie)
      .send(invalidPayload);

    // Hier sollte dein Zod-Error-Handler oder globaler Error-Handler greifen
    expect(response.status).toBe(400);
    expect(response.body.status).toBe("fail"); // Zod-Fehler sollten als "fail" markiert sein
    expect(response.body.message).toBe(
      "Validierungsfehler bei den gesendeten Daten.",
    );
    expect(response.body.data).toBeDefined(); // Zod-Fehlerdetails sollten im data-Feld sein
  });
});

describe("DELETE /workout/workout/:workoutId", () => {
  it("sollte 200 OK zurückgeben und den Workout-Plan erfolgreich löschen", async () => {
    // 1. Arrange: User einloggen und ID holen
    const { userId, cookie } = await createAndLoginTestUser();
    const workoutPlanId = crypto.randomInt(1, 10000);

    // Workout-Plan direkt in die DB einfügen, der diesem User gehört
    await pool.query(
      "INSERT INTO workout_plans (id, user_id, title) VALUES ($1, $2, $3) RETURNING *",
      [workoutPlanId, userId, "Lösch-Mich-Training"],
    );

    // 2. Act: DELETE-Request absenden
    const response = await request(app)
      .delete(`/workout/workout/${workoutPlanId}`)
      .set("Cookie", cookie);

    if (response.status !== 200) {
      console.log("DELETE Error Body:", response.body);
    }

    // 3. Assert: API-Antwort prüfen
    expect(response.status).toBe(200);
    expect(response.body.status).toBe("success");
    expect(response.body.message).toBeDefined();

    // Gegenprüfung in der DB: Existiert der Eintrag wirklich nicht mehr?
    const dbCheck = await pool.query(
      "SELECT * FROM workout_plans WHERE id = $1 AND deleted_at IS NULL",
      [workoutPlanId],
    );

    expect(dbCheck.rows.length).toBe(0);
  });

  it("sollte verhindern, dass ein User das Workout eines anderen Users löscht", async () => {
    // Arrange: Zwei verschiedene User erstellen
    const userA = await createAndLoginTestUser(); // User A ist eingeloggt

    // Für User B erstellen wir nur die Daten in der DB (ohne Login)
    const userBId = crypto.randomUUID();
    await pool.query(
      "INSERT INTO users (id, email, password) VALUES ($1, $2, $3)",
      [userBId, `userb-${Date.now()}@test.com`, "password"],
    );

    const workoutPlanId = crypto.randomInt(1, 10000);
    // Das Workout gehört USER B!
    await pool.query(
      "INSERT INTO workout_plans (id, user_id, title) VALUES ($1, $2, $3)",
      [workoutPlanId, userBId, "User Bs privates Workout"],
    );

    // Act: USER A versucht das Workout von USER B zu löschen
    const response = await request(app)
      .delete(`/workout/workout/${workoutPlanId}`)
      .set("Cookie", userA.cookie); // Cookie von User A!

    // Assert: Je nachdem wie deine Logik im Service gebaut ist,
    // sollte hier entweder ein 403/404 Fehler kommen oder das Löschen fehlschlagen.
    expect(response.status).toBe(401);
    expect(response.body.status).toBe("fail");
    expect(response.body.message).toBe(
      "Benutzer hat nicht die Rechte, dieses Workout zu bearbeiten.",
    );
  });
});

describe("PUT /workout/workout/:workoutId", () => {
  it("sollte 200 OK zurückgeben und den Titel sowie Übungen aktualisieren", async () => {
    // 1. Arrange: User einloggen und bestehendes Workout anlegen
    const { userId, cookie } = await createAndLoginTestUser();
    const workoutPlanId = crypto.randomInt(1, 10000);

    await pool.query(
      "INSERT INTO workout_plans (id, user_id, title) VALUES ($1, $2, $3)",
      [workoutPlanId, userId, "Alter Name"],
    );

    // Die neuen Daten, die exakt deinem createWorkoutBodySchema entsprechen
    const updatedPayload = {
      title: "Neuer aktualisierter Name",
      exercises: [
        {
          id: 1,
          title: "Bankdrücken",
          displayOrder: 1,
          sets: [{ setNumber: 1, weight: 65, repetitions: 12 }], // Erhöhtes Gewicht/Reps
        },
      ],
    };

    // 2. Act: PUT-Request absenden
    const response = await request(app)
      .put(`/workout/workout/${workoutPlanId}`)
      .set("Cookie", cookie)
      .send(updatedPayload);

    if (response.status !== 200) {
      console.log("PUT Error Body:", response.body);
    }

    // 3. Assert: API-Antwort prüfen
    expect(response.status).toBe(200);
    expect(response.body.status).toBe("success");

    // Gegenprüfung in der DB: Wurde der Name im Tabelleneintrag geändert?
    const dbCheck = await pool.query(
      "SELECT title FROM workout_plans WHERE id = $1",
      [workoutPlanId],
    );
    expect(dbCheck.rows[0].title).toBe("Neuer aktualisierter Name");
  });

  it("sollte 400 Bad Request zurückgeben, wenn die Update-Payload ungültig ist", async () => {
    const { cookie } = await createAndLoginTestUser();
    const workoutPlanId = crypto.randomInt(1, 10000); // Fiktive ID reicht hier

    const invalidPayload = { exercises: [] }; // Titel fehlt

    const response = await request(app)
      .put(`/workout/workout/${workoutPlanId}`)
      .set("Cookie", cookie)
      .send(invalidPayload);

    expect(response.status).toBe(400);
    expect(response.body.status).toBe("fail"); // Oder "error", je nach deiner Logik
  });

  it("sollte verhindern, dass ein User das Workout eines anderen Users aktualisiert", async () => {
    const userA = await createAndLoginTestUser();
    const userBId = crypto.randomUUID();

    await pool.query(
      "INSERT INTO users (id, email, password) VALUES ($1, $2, $3)",
      [userBId, `userb-${Date.now()}@test.com`, "password"],
    );

    // Die neuen Daten, die exakt deinem createWorkoutBodySchema entsprechen
    const updatedPayload = {
      title: "Neuer aktualisierter Name",
      exercises: [
        {
          id: 1,
          title: "Bankdrücken",
          displayOrder: 1,
          sets: [{ setNumber: 1, weight: 65, repetitions: 12 }], // Erhöhtes Gewicht/Reps
        },
      ],
    };

    const workoutPlanId = crypto.randomInt(1, 10000);
    await pool.query(
      "INSERT INTO workout_plans (id, user_id, title) VALUES ($1, $2, $3)",
      [workoutPlanId, userBId, "User Bs privates Workout"],
    );

    // User A feuert PUT auf User Bs ID
    const response = await request(app)
      .put(`/workout/workout/${workoutPlanId}`)
      .set("Cookie", userA.cookie)
      .send(updatedPayload);

    expect(response.status).toBe(401); // Oder 403 / 404
  });

  describe("GET /workout/workouts", () => {
    it("sollte alle Workout-Pläne des eingeloggten Users zurückgeben", async () => {
      const { userId, cookie } = await createAndLoginTestUser();

      // Arrange: 2 Workout-Pläne für diesen User in die DB schreiben
      await pool.query(
        "INSERT INTO workout_plans (id, user_id, title) VALUES ($1, $2, $3), ($4, $5, $6)",
        [
          crypto.randomInt(1, 10000),
          userId,
          "Plan A",
          crypto.randomInt(10001, 20000),
          userId,
          "Plan B",
        ],
      );

      // Act: Alle Pläne abfragen
      const response = await request(app)
        .get("/workout/workouts")
        .set("Cookie", cookie);

      // Assert: Wir erwarten genau die 2 angelegten Pläne
      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
      expect(response.body.data.length).toBe(2);
    });
  });

  describe("GET /workout/workout/:workoutId", () => {
    it("sollte einen spezifischen Workout-Plan anhand der ID zurückgeben", async () => {
      const { userId, cookie } = await createAndLoginTestUser();
      const workoutPlanId = crypto.randomInt(1, 10000);

      await pool.query(
        "INSERT INTO workout_plans (id, user_id, title) VALUES ($1, $2, $3)",
        [workoutPlanId, userId, "Spezifischer Plan"],
      );

      const response = await request(app)
        .get(`/workout/workout/${workoutPlanId}`)
        .set("Cookie", cookie);

      if (response.status !== 200) {
        console.log("GET /workout/:workoutId ERROR: ", response.body);
      }

      expect(response.status).toBe(200);
      expect(response.body.data.title).toBe("Spezifischer Plan"); // Nimmt an, dass dein Service den Plan direkt zurückgibt
    });
  });

  describe("POST /workout/completed-workout", () => {
    it("sollte ein durchgeführtes Workout erfolgreich speichern", async () => {
      const { userId, cookie } = await createAndLoginTestUser();
      const workoutPlanId = crypto.randomInt(1, 10000);

      // Ein Plan muss existieren, auf den sich das Training bezieht
      await pool.query(
        "INSERT INTO workout_plans (id, user_id, title) VALUES ($1, $2, $3)",
        [workoutPlanId, userId, "Bein Tag"],
      );

      const completedPayload = {
        workoutId: workoutPlanId,
        title: "Bein Tag (Durchgeführt)",
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 3600000).toISOString(), // 1 Stunde später
        pauseTime: 300,
        duration: 3300,
        exercises: [
          {
            id: 1,
            title: "Kniebeugen",
            displayOrder: 1,
            sets: [{ setNumber: 1, weight: 100, repetitions: 8 }], // Eventuell hast du hier noch ein 'completed: true' in deinem Schema
          },
        ],
      };

      const response = await request(app)
        .post("/workout/completed-workout")
        .set("Cookie", cookie)
        .send(completedPayload);

      if (response.status !== 200)
        console.log("POST Completed Error:", response.body);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
    });
  });

  describe("GET /workout/completed-workout/:workoutId", () => {
    it("sollte ein einzelnes durchgeführtes Workout anhand der UUID abrufen", async () => {
      const { userId, cookie } = await createAndLoginTestUser();
      const completedWorkoutId = crypto.randomUUID();
      const workoutPlanId = crypto.randomInt(1, 10000);

      // Ein Plan muss existieren, auf den sich das Training bezieht
      await pool.query(
        "INSERT INTO workout_plans (id, user_id, title) VALUES ($1, $2, $3)",
        [workoutPlanId, userId, "Bein Tag"],
      );

      // Wir fügen ein simuliertes durchgeführtes Workout in die DB ein
      await pool.query(
        "INSERT INTO completed_workouts (id, user_id, workout_plan_id,title, start_time, end_time, duration_seconds, pause_seconds) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
        [
          crypto.randomUUID(),
          userId,
          workoutPlanId,
          "Gestern trainiert",
          new Date(),
          new Date(),
          3600,
          0,
        ],
      );

      const response = await request(app)
        .get(`/workout/completed-workout/${completedWorkoutId}`)
        .set("Cookie", cookie);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
      // Prüft, ob die UUID korrekt verarbeitet wurde
      expect(response.body.data.id).toBe(completedWorkoutId);
    });
  });

  describe("PUT /workout/completed-workout", () => {
    it("sollte ein durchgeführtes Workout im Nachhinein aktualisieren können", async () => {
      const { userId, cookie } = await createAndLoginTestUser();
      const completedWorkoutId = crypto.randomUUID();
      const workoutPlanId = crypto.randomInt(1, 10000);

      // Ein Plan muss existieren, auf den sich das Training bezieht
      await pool.query(
        "INSERT INTO workout_plans (id, user_id, title) VALUES ($1, $2, $3)",
        [workoutPlanId, userId, "Bein Tag"],
      );

      await pool.query(
        "INSERT INTO completed_workouts (id, user_id, workout_plan_id, title, start_time, end_time, duration_seconds, pause_seconds) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
        [
          crypto.randomUUID(),
          userId,
          workoutPlanId,
          "Falscher Name",
          new Date(),
          new Date(),
          3600,
          0,
        ],
      );

      // Da deine Route die ID nicht in der URL (/workout/:id) erwartet,
      // muss die UUID zwingend im Body mitgeschickt werden!
      const updatePayload = {
        id: completedWorkoutId,
        title: "Korrigierter Name",
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        pauseTime: 0,
        duration: 4000,
        exercises: [],
      };

      const response = await request(app)
        .put("/workout/completed-workout")
        .set("Cookie", cookie)
        .send(updatePayload);

      if (response.status !== 200)
        console.log("PUT Completed Error:", response.body);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
    });
  });

  describe("GET /workout/last-workout/:workoutId", () => {
    it("sollte das zuletzt durchgeführte Training für einen bestimmten Plan zurückgeben", async () => {
      const { userId, cookie } = await createAndLoginTestUser();
      const workoutPlanId = crypto.randomInt(1, 10000);

      // 1. Plan erstellen
      await pool.query(
        "INSERT INTO workout_plans (id, user_id, title) VALUES ($1, $2, $3)",
        [workoutPlanId, userId, "Mein Stamm-Plan"],
      );

      // 2. Ein durchgeführtes Workout verknüpfen (Beachte: Die Spalte 'workout_id' oder 'plan_id' muss existieren)
      await pool.query(
        "INSERT INTO completed_workouts (id, user_id, workout_plan_id, title, start_time, end_time, duration_seconds, pause_seconds) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
        [
          crypto.randomUUID(),
          userId,
          workoutPlanId,
          "Letztes Mal",
          new Date(),
          new Date(),
          3600,
          0,
        ],
      );

      const response = await request(app)
        .get(`/workout/last-workout/${workoutPlanId}`)
        .set("Cookie", cookie);

      if (response.status !== 200)
        console.log("GET Last Workout Error:", response.body);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("success");
      console.log("GET LAST WORKOUT BODY ", response.body);
    });
  });
});
