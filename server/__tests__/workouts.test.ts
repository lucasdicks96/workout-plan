import { describe, expect, it } from "@jest/globals";
import crypto from "crypto"; // Für die Generierung von Test-IDs
import request from "supertest";
import pool from "../src/config/db";
import app from "../src/index";
import { createAndLoginTestUser } from "./testHelpers";

describe("GET /workout/completed-workouts", () => {
  it("sollte 200 OK und eine Liste von Workouts zurückgeben, wenn der User eingeloggt ist", async () => {
    const { cookie } = await createAndLoginTestUser();

    const response = await request(app)
      .get("/workout/completed-workouts")
      .set("Cookie", cookie);

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
      console.log("PUT Error Message:", response.body.message);
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
      "INSERT INTO workout_plans (id, user_id, title) VALUES ($1, $2, $3) RETURNING *",
      [workoutPlanId, userId, "Spezifischer Plan"],
    );

    const planExRes = await pool.query(
      "INSERT INTO plan_exercises (workout_plan_id, exercise_id, display_order) VALUES ($1, $2, $3) RETURNING *",
      [workoutPlanId, 1, 1],
    );

    await pool.query(
      "INSERT INTO plan_sets (plan_exercise_id, set_number, repetitions, weight) VALUES ($1, $2, $3, $4) RETURNING *",
      [planExRes.rows[0].id, 1, 10, 10],
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

  it("sollte 400 Zod Validierungsfehler zurueck geben", async () => {
    const { userId, cookie } = await createAndLoginTestUser();
    const workoutPlanId = crypto.randomInt(1, 10000);

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
      duration: "",
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

    if (response.status !== 400)
      console.log("POST Completed Error:", response.body);

    expect(response.status).toBe(400);
    expect(response.body.status).toBe("fail");
  });

  it("sollte 401 zurückgeben, wenn der Benutzer nicht authentifiziert ist", async () => {
    // Gültige Payload
    const completedPayload = {
      workoutId: 1,
      title: "Unauthentifiziertes Training",
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      pauseTime: 0,
      duration: 3600,
      exercises: [
        {
          id: 1,
          title: "Bankdrücken",
          displayOrder: 1,
          sets: [{ setNumber: 1, weight: 80, repetitions: 10 }],
        },
      ],
    };

    const response = await request(app)
      .post("/workout/completed-workout")
      // WICHTIG: Absichtlich kein .set("Cookie", ...) aufgerufen
      .send(completedPayload);

    expect(response.status).toBe(401);
    expect(response.body.status).toBe("fail");
  });

  it("sollte 401 zurückgeben, wenn der verknüpfte Trainingsplan gar nicht existiert => ownerCheck mismatch", async () => {
    const { cookie } = await createAndLoginTestUser();
    const nonExistentPlanId = 9999999; // Eine ID, die sicher nicht in der DB existiert

    const payload = {
      workoutId: nonExistentPlanId,
      title: "Geister-Training",
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      pauseTime: 0,
      duration: 3600,
      exercises: [
        {
          id: 1,
          title: "Klimmzüge",
          displayOrder: 1,
          sets: [{ setNumber: 1, weight: 0, repetitions: 10 }],
        },
      ],
    };

    const response = await request(app)
      .post("/workout/completed-workout")
      .set("Cookie", cookie)
      .send(payload);

    if (response.body.status !== "error") {
      console.log(
        "Post completed workout Error: ",
        response.body,
        response.status,
      );
    }

    // Da der Plan (workoutId) nicht existiert, sollte der Datenbank-Check fehlschlagen
    expect(response.status).toBe(401);
    expect(response.body.status).toBe("fail");
  });

  it("sollte 403 (oder 401/404) zurückgeben, wenn der angegebene Plan einem anderen Benutzer gehört", async () => {
    // 1. User A (Besitzer) erstellt einen Plan
    const userA = await createAndLoginTestUser();
    const workoutPlanId = crypto.randomInt(1, 10000);

    await pool.query(
      "INSERT INTO workout_plans (id, user_id, title) VALUES ($1, $2, $3)",
      [workoutPlanId, userA.userId, "Plan von User A"],
    );

    // 2. User B (Angreifer) wird erstellt und eingeloggt
    const userB = await createAndLoginTestUser();

    // 3. User B versucht, ein Workout für den Plan von User A zu speichern
    const maliciousPayload = {
      workoutId: workoutPlanId, // Hier wird die ID von User A eingeschleust!
      title: "Gehacktes Training",
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      pauseTime: 0,
      duration: 3600,
      exercises: [
        {
          id: 1,
          title: "Kreuzheben",
          displayOrder: 1,
          sets: [{ setNumber: 1, weight: 100, repetitions: 5 }],
        },
      ],
    };

    const response = await request(app)
      .post("/workout/completed-workout")
      .set("Cookie", userB.cookie) // WICHTIG: Der Request wird als User B gesendet!
      .send(maliciousPayload);

    // Der ownerCheck in deinem Service sollte hier anschlagen und den Request blockieren
    expect(response.status).toBe(401);
    expect(response.body.status).toBe("fail");
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
    const icp = await pool.query(
      "INSERT INTO completed_workouts (user_id, workout_plan_id ,title, start_time, end_time, duration_seconds, pause_seconds) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id",
      [
        userId,
        workoutPlanId,
        "Gestern trainiert",
        new Date(),
        new Date(),
        3600,
        0,
      ],
    );

    await pool.query(
      `INSERT INTO plan_exercises (workout_plan_id, exercise_id, display_order) VALUES ($1, $2, $3)`,
      [workoutPlanId, 1, 1],
    );

    const workoutId = icp.rows[0].id;

    await pool.query(
      `INSERT INTO completed_sets 
          (completed_workout_id, exercise_id, set_number, repetitions, weight) VALUES ($1, $2, $3, $4, $5)`,
      [workoutId, 1, 1, 10, 10],
    );

    const response = await request(app)
      .get(`/workout/completed-workout/${workoutId}`)
      .set("Cookie", cookie);

    if (response.status !== 200) {
      console.log(
        "GET /workout/completed-workout/:workoutId ERROR: ",
        response.body,
      );
    }

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("success");
    // Prüft, ob die UUID korrekt verarbeitet wurde
    expect(response.body.data.id).toBe(workoutId);
  });

  it("sollte 401 zurückgeben, wenn der Benutzer nicht authentifiziert ist", async () => {
    const fakeId = crypto.randomUUID();

    const response = await request(app).get(
      `/workout/completed-workout/${fakeId}`,
    );
    // WICHTIG: Hier wird bewusst kein .set("Cookie", ...) gesendet

    expect(response.status).toBe(401);
    expect(response.body.status).toBe("fail"); // Ggf. anpassen, falls dein Error-Handler "error" nutzt
  });

  it("sollte 400 zurückgeben, wenn die übergebene ID keine gültige UUID ist", async () => {
    const { cookie } = await createAndLoginTestUser();
    const invalidId = "12345-keine-echte-uuid";

    const response = await request(app)
      .get(`/workout/completed-workout/${invalidId}`)
      .set("Cookie", cookie);

    expect(response.status).toBe(400);
    expect(response.body.status).toBe("fail");
  });

  it("sollte 401 zurückgeben, wenn das Workout nicht existiert => mismatch im ownerCheck", async () => {
    const { cookie } = await createAndLoginTestUser();
    const nonExistentId = crypto.randomUUID(); // Gültiges Format, aber nicht in der DB

    const response = await request(app)
      .get(`/workout/completed-workout/${nonExistentId}`)
      .set("Cookie", cookie);

    expect(response.status).toBe(401);
    expect(response.body.status).toBe("fail");
  });

  it("sollte 403 (oder 401/404) zurückgeben, wenn das Workout einem anderen User gehört", async () => {
    // 1. User A (Besitzer) erstellen und ein Workout für ihn anlegen
    const userA = await createAndLoginTestUser();
    const workoutPlanId = crypto.randomInt(1, 10000);

    await pool.query(
      "INSERT INTO workout_plans (id, user_id, title) VALUES ($1, $2, $3)",
      [workoutPlanId, userA.userId, "Geheimer Plan"],
    );

    const icp = await pool.query(
      "INSERT INTO completed_workouts (user_id, workout_plan_id, title, start_time, end_time, duration_seconds, pause_seconds) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id",
      [
        userA.userId,
        workoutPlanId,
        "User A Training",
        new Date(),
        new Date(),
        3600,
        0,
      ],
    );
    const workoutId = icp.rows[0].id;

    // 2. User B (Angreifer) erstellen
    const userB = await createAndLoginTestUser();

    // 3. User B versucht, das Workout von User A abzurufen
    const response = await request(app)
      .get(`/workout/completed-workout/${workoutId}`)
      .set("Cookie", userB.cookie); // WICHTIG: Cookie von User B!

    expect(response.status).toBe(401);
    expect(response.body.status).toBe("fail");
  });
});

describe("PUT /workout/completed-workout", () => {
  it("sollte ein durchgeführtes Workout im Nachhinein aktualisieren können", async () => {
    const { userId, cookie } = await createAndLoginTestUser();
    const completedWorkoutId = crypto.randomUUID();
    const workoutId = crypto.randomInt(1, 10000);

    // Ein Plan muss existieren, auf den sich das Training bezieht
    await pool.query(
      "INSERT INTO workout_plans (id, user_id, title) VALUES ($1, $2, $3)",
      [workoutId, userId, "Bein Tag"],
    );

    const icw = await pool.query(
      "INSERT INTO completed_workouts (id, user_id, workout_plan_id, title, start_time, end_time, duration_seconds, pause_seconds) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id",
      [
        completedWorkoutId,
        userId,
        workoutId,
        "Falscher Name",
        new Date(),
        new Date(),
        3600,
        0,
      ],
    );

    await pool.query(
      `INSERT INTO completed_sets (completed_workout_id, exercise_id, set_number, repetitions, weight) VALUES ($1, $2, $3, $4, $5)`,
      [completedWorkoutId, 1, 1, 10, 10],
    );

    // Da deine Route die ID nicht in der URL (/workout/:id) erwartet,
    // muss die UUID zwingend im Body mitgeschickt werden!
    const updatePayload = {
      id: completedWorkoutId,
      userId,
      workoutId,
      title: "Korrigierter Name",
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      pauseTime: 0,
      duration: 4000,
      exercises: [
        {
          id: 1,
          title: "Kniebeugen",
          displayOrder: 1,
          sets: [{ setNumber: 1, weight: 100, repetitions: 8 }],
        },
      ],
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

  it("sollte 401 zurückgeben, wenn der Benutzer nicht authentifiziert ist", async () => {
    // Gültige Payload, aber kein Login
    const updatePayload = {
      id: crypto.randomUUID(),
      userId: crypto.randomUUID(),
      workoutId: 1,
      title: "Geheimes Workout",
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      pauseTime: 0,
      duration: 3600,
      exercises: [
        {
          id: 1,
          title: "Kniebeugen",
          displayOrder: 1,
          sets: [{ setNumber: 1, weight: 100, repetitions: 8 }],
        },
      ],
    };

    const response = await request(app)
      .put("/workout/completed-workout")
      .send(updatePayload);
    // WICHTIG: Kein .set("Cookie", cookie)

    expect(response.status).toBe(401);
    expect(response.body.status).toBe("fail");
  });

  it("sollte 400 zurückgeben, wenn die Validierung fehlschlägt (z.B. fehlende Pflichtfelder)", async () => {
    const { cookie } = await createAndLoginTestUser();

    // Fehlerhafte Payload: Es fehlen 'duration' und 'exercises'
    const invalidPayload = {
      id: crypto.randomUUID(),
      userId: crypto.randomUUID(),
      workoutId: 1,
      title: "Unvollständiges Workout",
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      pauseTime: 0,
      // duration und exercises fehlen absichtlich
    };

    const response = await request(app)
      .put("/workout/completed-workout")
      .set("Cookie", cookie)
      .send(invalidPayload);

    expect(response.status).toBe(400);
    expect(response.body.status).toBe("fail");
  });

  it("sollte 400 zurückgeben, wenn die gesendete Workout-ID keine gültige UUID ist", async () => {
    const { userId, cookie } = await createAndLoginTestUser();

    const invalidIdPayload = {
      id: "das-ist-keine-uuid-123", // Absichtlich falsch
      userId,
      workoutId: 1,
      title: "Workout mit falscher ID",
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      pauseTime: 0,
      duration: 3600,
      exercises: [
        {
          id: 1,
          title: "Kniebeugen",
          displayOrder: 1,
          sets: [{ setNumber: 1, weight: 100, repetitions: 8 }],
        },
      ],
    };

    const response = await request(app)
      .put("/workout/completed-workout")
      .set("Cookie", cookie)
      .send(invalidIdPayload);

    expect(response.status).toBe(400);
    expect(response.body.status).toBe("fail");
  });

  it("sollte 403 (oder 401/404) zurückgeben, wenn der Benutzer versucht, das Workout eines anderen zu ändern", async () => {
    // 1. User A (Besitzer) erstellen und ein Workout anlegen
    const userA = await createAndLoginTestUser();
    const completedWorkoutId = crypto.randomUUID();
    const workoutPlanId = crypto.randomInt(1, 10000);

    await pool.query(
      "INSERT INTO workout_plans (id, user_id, title) VALUES ($1, $2, $3)",
      [workoutPlanId, userA.userId, "User A Plan"],
    );

    await pool.query(
      "INSERT INTO completed_workouts (id, user_id, workout_plan_id, title, start_time, end_time, duration_seconds, pause_seconds) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
      [
        completedWorkoutId,
        userA.userId,
        workoutPlanId,
        "User A Training",
        new Date(),
        new Date(),
        3600,
        0,
      ],
    );

    // 2. User B (Angreifer) erstellen
    const userB = await createAndLoginTestUser();

    // 3. User B versucht, das Workout von User A zu überschreiben
    const maliciousPayload = {
      id: completedWorkoutId, // Die ID von User A's Workout
      userId: userB.userId, // User B schickt seine eigene User ID
      workoutId: workoutPlanId,
      title: "Gehacktes Workout!",
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      pauseTime: 0,
      duration: 9999,
      exercises: [
        {
          id: 1,
          title: "Bizeps Curls",
          displayOrder: 1,
          sets: [{ setNumber: 1, weight: 50, repetitions: 10 }],
        },
      ],
    };

    const response = await request(app)
      .put("/workout/completed-workout")
      .set("Cookie", userB.cookie) // WICHTIG: Cookie von User B!
      .send(maliciousPayload);

    // Hier schlägt dein 'ownerCheck' aus dem Service an!
    expect(response.status).not.toBe(200);
    expect(response.body.status).toBe("fail");
    expect(response.status).toBe(401);
  });
});

describe("GET /workout/last-workout/:workoutId", () => {
  it("sollte das zuletzt durchgeführte Training für einen bestimmten Plan zurückgeben", async () => {
    const { userId, cookie } = await createAndLoginTestUser();
    const workoutId = crypto.randomInt(1, 10000);

    // 1. Plan erstellen
    await pool.query(
      "INSERT INTO workout_plans (id, user_id, title) VALUES ($1, $2, $3)",
      [workoutId, userId, "Mein Stamm-Plan"],
    );

    await pool.query(
      `INSERT INTO plan_exercises (workout_plan_id, exercise_id, display_order) VALUES ($1, $2, $3)`,
      [workoutId, 1, 1],
    );

    const icw = await pool.query(
      "INSERT INTO completed_workouts (id, user_id, workout_plan_id, title, start_time, end_time, duration_seconds, pause_seconds) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id",
      [
        crypto.randomUUID(),
        userId,
        workoutId,
        "Letztes Mal",
        new Date(),
        new Date(),
        3600,
        0,
      ],
    );

    await pool.query(
      `INSERT INTO completed_sets (completed_workout_id, exercise_id, set_number, repetitions, weight) VALUES ($1, $2, $3, $4, $5)`,
      [icw.rows[0].id, 1, 1, 10, 10],
    );

    const response = await request(app)
      .get(`/workout/last-workout/${workoutId}`)
      .set("Cookie", cookie);

    if (response.status !== 200)
      console.log("GET Last Workout Error:", response.body);

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("success");
  });

  it("sollte 401 zurückgeben, wenn der Benutzer nicht authentifiziert ist", async () => {
    const workoutId = 1; // Irgendeine ID

    const response = await request(app).get(
      `/workout/last-workout/${workoutId}`,
    );
    // WICHTIG: Wieder absichtlich kein Cookie!

    expect(response.status).toBe(401);
    expect(response.body.status).toBe("fail");
  });

  it("sollte 400 zurückgeben, wenn die workoutId im URL-Parameter keine gültige Zahl ist", async () => {
    const { cookie } = await createAndLoginTestUser();
    const invalidId = "keine-zahl"; // Zod wird das mit dem workoutIdParamSchema blockieren

    const response = await request(app)
      .get(`/workout/last-workout/${invalidId}`)
      .set("Cookie", cookie);

    expect(response.status).toBe(400);
    expect(response.body.status).toBe("fail");
  });

  it("sollte 200 zurücktgeben, da fallback auf workoutplan(id) wenn kein workout abgeschlossen", async () => {
    const { userId, cookie } = await createAndLoginTestUser();
    const workoutId = crypto.randomInt(1, 10000);

    // 1. Wir erstellen NUR den Plan
    await pool.query(
      "INSERT INTO workout_plans (id, user_id, title) VALUES ($1, $2, $3)",
      [workoutId, userId, "Plan ohne Training"],
    );

    const res = await pool.query(
      `INSERT INTO plan_exercises (workout_plan_id, exercise_id, display_order) VALUES ($1, $2, $3) RETURNING id`,
      [workoutId, 1, 1],
    );

    await pool.query(
      `INSERT INTO plan_sets (plan_exercise_id, set_number, repetitions, weight) VALUES ($1, $2, $3, $4)`,
      [res.rows[0].id, 1, 10, 10],
    );

    // 2. Wir erstellen KEIN completed_workout für diesen Plan.

    // 3. Versuch, das letzte Workout abzurufen
    const response = await request(app)
      .get(`/workout/last-workout/${workoutId}`)
      .set("Cookie", cookie);

    // Hier greift dein 'BadRequestError: Keine Workout-Daten gefunden.' aus dem Service!
    // Falls du den Statuscode im Error-Handler auf 404 geändert hast, passe dies an.
    expect(response.status).toBe(200);
    expect(response.body.status).toBe("success");
  });

  it("sollte 403 (oder 401/404) zurückgeben, wenn der Plan einem anderen Benutzer gehört", async () => {
    // 1. User A (Besitzer) erstellen und Plan anlegen
    const userA = await createAndLoginTestUser();
    const workoutId = crypto.randomInt(1, 10000);

    await pool.query(
      "INSERT INTO workout_plans (id, user_id, title) VALUES ($1, $2, $3)",
      [workoutId, userA.userId, "Mein streng geheimer Plan"],
    );

    // (Optional: Auch ein durchgeführtes Training für User A anlegen,
    // um sicherzugehen, dass es wirklich am Owner-Check scheitert)
    const icw = await pool.query(
      "INSERT INTO completed_workouts (id, user_id, workout_plan_id, title, start_time, end_time, duration_seconds, pause_seconds) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id",
      [
        crypto.randomUUID(),
        userA.userId,
        workoutId,
        "Geheimes Training",
        new Date(),
        new Date(),
        3600,
        0,
      ],
    );

    // 2. User B (Angreifer) erstellen
    const userB = await createAndLoginTestUser();

    // 3. User B versucht, das letzte Training von User A's Plan abzurufen
    const response = await request(app)
      .get(`/workout/last-workout/${workoutId}`)
      .set("Cookie", userB.cookie); // WICHTIG: Cookie von User B!

    // Hier schlägt dein `ownerCheck` aus der getLastWorkout-Service-Funktion an!
    expect(response.status).not.toBe(200);
    expect(response.body.status).toBe("fail");
  });
});
