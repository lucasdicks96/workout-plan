import { describe, expect, it } from "@jest/globals";
import crypto from "crypto"; // Für die Generierung von Test-IDs
import request from "supertest";
import pool from "../src/config/db";
import app from "../src/index";
import {
  createAndLoginTestUser,
  createTestCompletedWorkout,
  createTestWorkoutPlan,
} from "./testHelpers";

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

  it("sollte nur die Pläne des jeweiligen Benutzer zurückgeben", async () => {
    const userA = await createAndLoginTestUser();
    const userB = await createAndLoginTestUser();
    const workoutPlanId = crypto.randomInt(1, 10000);

    await createTestWorkoutPlan({
      workoutId: workoutPlanId,
      userId: userA.userId,
      title: "Geheimer Plan",
      exerciseId: 1,
      displayOrder: 1,
      setNumber: 1,
      repetitions: 10,
      weight: 10,
    });

    await createTestCompletedWorkout({
      workoutId: workoutPlanId,
      userId: userA.userId,
      title: "Test",
      startTime: new Date(Date.now()),
      endTime: new Date(Date.now() + 3600),
      duration: 3600,
      pause: 100,
      exerciseId: 1,
      setNumber: 1,
      repetitions: 10,
      weight: 10,
    });

    const responseB = await request(app)
      .get("/workout/completed-workouts")
      .set("Cookie", userB.cookie);

    expect(responseB.status).toBe(200);
    expect(responseB.body.status).toBe("success");
    expect(Array.isArray(responseB.body.data)).toBe(true);
    expect(responseB.body.data.length).toBe(0);

    const responseA = await request(app)
      .get("/workout/completed-workouts")
      .set("Cookie", userA.cookie);

    expect(responseA.status).toBe(200);
    expect(responseA.body.status).toBe("success");
    expect(Array.isArray(responseA.body.data)).toBe(true);
    expect(responseA.body.data.length).toBe(1);
    expect(responseA.body.data[0].title).toBe("Test");
  });

  it("sollte URL-Query-Parameter ignorieren und NICHT die Workouts eines fremden Users zurückgeben (Parameter Injection)", async () => {
    const userA = await createAndLoginTestUser();
    const userB = await createAndLoginTestUser();
    const workoutPlanId = crypto.randomInt(1, 10000);

    await createTestWorkoutPlan({
      workoutId: workoutPlanId,
      userId: userA.userId,
      title: "Geheimer Plan",
      exerciseId: 1,
      displayOrder: 1,
      setNumber: 1,
      repetitions: 10,
      weight: 10,
    });

    // User A hat ein Workout
    await createTestCompletedWorkout({
      workoutId: workoutPlanId,
      userId: userA.userId,
      title: "User A Geheimnis",
      startTime: new Date(),
      endTime: new Date(Date.now() + 3600),
      duration: 3600,
      pause: 100,
      exerciseId: 1,
      setNumber: 1,
      repetitions: 10,
      weight: 10,
    });

    // User B versucht, durch Anhängen von ?userId= oder ?user_id= an die Daten von User A zu kommen
    const responseB = await request(app)
      .get(
        `/workout/completed-workouts?userId=${userA.userId}&user_id=${userA.userId}`,
      )
      .set("Cookie", userB.cookie);

    expect(responseB.status).toBe(200);
    expect(responseB.body.status).toBe("success");
    // Darf trotzdem nur ein leeres Array (die Workouts von B) zurückgeben!
    expect(responseB.body.data.length).toBe(0);
  });

  it("sollte strikt trennen, wenn beide User abgeschlossene Workouts besitzen", async () => {
    const userA = await createAndLoginTestUser();
    const userB = await createAndLoginTestUser();
    const userAworkoutId = crypto.randomInt(1, 10000);
    const userBworkoutId = crypto.randomInt(1, 10000);

    // Workout für User A
    await createTestWorkoutPlan({
      workoutId: userAworkoutId,
      userId: userA.userId,
      title: "Geheimer Plan A",
      exerciseId: 1,
      displayOrder: 1,
      setNumber: 1,
      repetitions: 10,
      weight: 10,
    });

    await createTestCompletedWorkout({
      workoutId: userAworkoutId,
      userId: userA.userId,
      title: "Workout von A",
      startTime: new Date(),
      endTime: new Date(),
      duration: 1000,
      pause: 0,
      exerciseId: 1,
      setNumber: 1,
      repetitions: 10,
      weight: 10,
    });

    // Workout für User B
    await createTestWorkoutPlan({
      workoutId: userBworkoutId,
      userId: userB.userId,
      title: "Geheimer Plan B",
      exerciseId: 1,
      displayOrder: 1,
      setNumber: 1,
      repetitions: 10,
      weight: 10,
    });

    await createTestCompletedWorkout({
      workoutId: userBworkoutId,
      userId: userB.userId,
      title: "Workout von B",
      startTime: new Date(),
      endTime: new Date(),
      duration: 2000,
      pause: 0,
      exerciseId: 1,
      setNumber: 1,
      repetitions: 10,
      weight: 10,
    });

    const responseB = await request(app)
      .get("/workout/completed-workouts")
      .set("Cookie", userB.cookie);

    expect(responseB.status).toBe(200);
    expect(responseB.body.data.length).toBe(1);
    // Explizit prüfen, dass auch wirklich das EIGENE Workout geladen wurde und nicht das von A
    expect(responseB.body.data[0].title).toBe("Workout von B");
  });

  it("sollte 404 Not Found werfen, wenn User B versucht, ein spezifisches Workout von User A direkt über die ID abzurufen", async () => {
    const userA = await createAndLoginTestUser();
    const userB = await createAndLoginTestUser();
    const targetWorkoutId = crypto.randomInt(1, 10000);

    // Workout gehört User A
    await createTestWorkoutPlan({
      workoutId: targetWorkoutId,
      userId: userA.userId,
      title: "Geheimer Plan A",
      exerciseId: 1,
      displayOrder: 1,
      setNumber: 1,
      repetitions: 10,
      weight: 10,
    });

    const cwId = await createTestCompletedWorkout({
      workoutId: targetWorkoutId,
      userId: userA.userId,
      title: "Privates Detail-Workout",
      startTime: new Date(),
      endTime: new Date(),
      duration: 3600,
      pause: 0,
      exerciseId: 1,
      setNumber: 1,
      repetitions: 10,
      weight: 10,
    });

    // User B greift direkt auf die Ressource zu
    const responseB = await request(app)
      .get(`/workout/completed-workout/${cwId}`)
      .set("Cookie", userB.cookie);
    if (responseB.status !== 404) {
      console.log("TEST responseB data: ", responseB.body.data);
    }
    // Best Practice: 404 Not Found zurückgeben (damit Angreifer nicht scannen können, ob die ID existiert)
    // expect(responseB.status).();
    expect(responseB.body.status).toBe("fail");
    expect(responseB.status).toBe(404);
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
    expect(response.body.data).toBeDefined(); // Zod-Fehlerdetails sollten im data-Feld sein
  });
});

describe("DELETE /workout/workout/:workoutId", () => {
  it("sollte 200 OK zurückgeben und den Workout-Plan erfolgreich löschen", async () => {
    // 1. Arrange: User einloggen und ID holen
    const { userId, cookie } = await createAndLoginTestUser();
    const workoutPlanId = crypto.randomInt(1, 10000);

    // Workout-Plan direkt in die DB einfügen, der diesem User gehört
    await createTestWorkoutPlan({
      workoutId: workoutPlanId,
      userId: userId,
      title: "Lösch mich Training",
      exerciseId: 1,
      displayOrder: 1,
      setNumber: 1,
      repetitions: 10,
      weight: 25,
    });

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
    await createTestWorkoutPlan({
      workoutId: workoutPlanId,
      userId: userBId,
      title: "User B",
      exerciseId: 1,
      displayOrder: 1,
      setNumber: 1,
      repetitions: 10,
      weight: 25,
    });

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

    await createTestWorkoutPlan({
      workoutId: workoutPlanId,
      userId: userId,
      title: "Alter Name",
      exerciseId: 1,
      displayOrder: 1,
      setNumber: 1,
      repetitions: 10,
      weight: 25,
    });

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

  it("sollte mit 404 verhindern, dass ein User das Workout eines anderen Users aktualisiert", async () => {
    const userA = await createAndLoginTestUser();
    const userB = await createAndLoginTestUser();

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

    await createTestWorkoutPlan({
      workoutId: workoutPlanId,
      userId: userB.userId,
      title: "User B Workout",
      exerciseId: 1,
      displayOrder: 1,
      setNumber: 1,
      repetitions: 10,
      weight: 25,
    });

    // User A feuert PUT auf User Bs ID
    const response = await request(app)
      .put(`/workout/workout/${workoutPlanId}`)
      .set("Cookie", userA.cookie)
      .send(updatedPayload);

    expect(response.status).toBe(404); // Oder 403 / 404
  });
});

describe("GET /workout/workouts", () => {
  it("sollte alle Workout-Pläne des eingeloggten Users zurückgeben", async () => {
    const { userId, cookie } = await createAndLoginTestUser();
    const planIdA = crypto.randomInt(1, 10000);
    const planIdB = crypto.randomInt(10001, 20000);

    // Arrange: 2 Workout-Pläne für diesen User in die DB schreiben

    await createTestWorkoutPlan({
      workoutId: planIdA,
      userId: userId,
      title: "Plan A",
      exerciseId: 1,
      displayOrder: 1,
      setNumber: 1,
      repetitions: 10,
      weight: 25,
    });

    await createTestWorkoutPlan({
      workoutId: planIdB,
      userId: userId,
      title: "Plan B",
      exerciseId: 1,
      displayOrder: 1,
      setNumber: 1,
      repetitions: 10,
      weight: 25,
    });

    // Act: Alle Pläne abfragen
    const response = await request(app)
      .get("/workout/workouts")
      .set("Cookie", cookie);
    if (response.status !== 200) {
      console.log("GET /workout/workouts ERROR: ", response.body.data);
    }

    // Assert: Wir erwarten genau die 2 angelegten Pläne
    expect(response.status).toBe(200);
    expect(response.body.status).toBe("success");
    expect(response.body.data.length).toBe(2);
  });

  it("sollte 401 zurückgeben, wenn der Request nicht authentifiziert ist", async () => {
    // Act: Wir senden absichtlich keinen Cookie mit
    const response = await request(app).get("/workout/workouts");

    // Assert: Die Auth-Middleware muss blockieren
    expect(response.status).toBe(401);
    expect(response.body.status).toBe("fail"); // Ggf. "error", falls dein Handler das so nennt
  });

  it("sollte ein leeres Array (200 OK) zurückgeben, wenn der User noch keine Pläne hat", async () => {
    // Arrange: Ein komplett neuer User wird erstellt (ohne Pläne in der DB)
    const { cookie } = await createAndLoginTestUser();

    // Act
    const response = await request(app)
      .get("/workout/workouts")
      .set("Cookie", cookie);

    // Assert: Kein Fehler! Sondern ein leeres Array.
    expect(response.status).toBe(200);
    expect(response.body.status).toBe("success");
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBe(0);
  });

  it("sollte strikt nur die Pläne des eigenen Users zurückgeben (Daten-Isolation)", async () => {
    // Arrange: User A erstellt einen Plan
    const userA = await createAndLoginTestUser();
    await createTestWorkoutPlan({
      workoutId: crypto.randomInt(1, 10000),
      userId: userA.userId,
      title: "Top Secret Plan User A",
      exerciseId: 1,
      displayOrder: 1,
      setNumber: 1,
      repetitions: 10,
      weight: 50,
    });

    // User B wird erstellt (hat selbst noch keine Pläne)
    const userB = await createAndLoginTestUser();

    // Act: User B fragt SEINE Workouts ab
    const response = await request(app)
      .get("/workout/workouts")
      .set("Cookie", userB.cookie); // WICHTIG: Request läuft über den Cookie von User B!

    // Assert: User B darf den Plan von User A unter keinen Umständen sehen
    expect(response.status).toBe(200);
    expect(response.body.status).toBe("success");
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBe(0); // Die Liste MUSS für User B leer sein
  });
});

describe("GET /workout/workout/:workoutId", () => {
  it("sollte einen spezifischen Workout-Plan anhand der ID zurückgeben", async () => {
    const { userId, cookie } = await createAndLoginTestUser();
    const workoutPlanId = crypto.randomInt(1, 10000);

    await createTestWorkoutPlan({
      workoutId: workoutPlanId,
      userId: userId,
      title: "Spezifischer Plan",
      exerciseId: 1,
      displayOrder: 1,
      setNumber: 1,
      repetitions: 10,
      weight: 25,
    });

    const response = await request(app)
      .get(`/workout/workout/${workoutPlanId}`)
      .set("Cookie", cookie);

    if (response.status !== 200) {
      console.log("GET /workout/:workoutId ERROR: ", response.body);
    }

    expect(response.status).toBe(200);
    expect(response.body.data.title).toBe("Spezifischer Plan"); // Nimmt an, dass dein Service den Plan direkt zurückgibt
  });

  it("sollte 401 zurückgeben, wenn der Benutzer nicht authentifiziert ist", async () => {
    const workoutPlanId = 1234;

    const response = await request(app).get(
      `/workout/workout/${workoutPlanId}`,
    );
    // WICHTIG: Kein .set("Cookie", ...) aufgerufen

    expect(response.status).toBe(401);
    expect(response.body.status).toBe("fail");
  });

  it("sollte 400 zurückgeben, wenn die workoutId keine gültige Zahl ist", async () => {
    const { cookie } = await createAndLoginTestUser();
    const invalidId = "keine-zahl-sondern-text";

    const response = await request(app)
      .get(`/workout/workout/${invalidId}`)
      .set("Cookie", cookie);

    // Hier sollte dein Zod-Schema (workoutIdParamSchema) den Request blockieren
    expect(response.status).toBe(400);
    expect(response.body.status).toBe("fail");
  });

  it("sollte 404 zurückgeben, wenn der angefragte Trainingsplan nicht existiert => ownerCheck mismatch. Kein Eintrag unter userId & workoutId in db", async () => {
    const { cookie } = await createAndLoginTestUser();
    const nonExistentId = 9999999; // Eine ID, die nicht in der Datenbank existiert

    const response = await request(app)
      .get(`/workout/workout/${nonExistentId}`)
      .set("Cookie", cookie);

    // Dein Service sollte hier merken, dass die Query leer zurückkommt, und einen Fehler werfen
    expect(response.status).toBe(404); // Je nach Error-Handler anpassen (könnte auch 400 sein)
    expect(response.body.status).toBe("fail");
  });

  it("sollte 404 zurückgeben, wenn der Plan einem anderen Benutzer gehört", async () => {
    // 1. User A (Besitzer) erstellen und Plan anlegen
    const userA = await createAndLoginTestUser();
    const workoutPlanId = crypto.randomInt(1, 10000);

    await createTestWorkoutPlan({
      workoutId: workoutPlanId,
      userId: userA.userId,
      title: "Top Secret Trainingsplan",
      exerciseId: 1,
      displayOrder: 1,
      setNumber: 1,
      repetitions: 10,
      weight: 25,
    });

    // 2. User B (Angreifer) erstellen
    const userB = await createAndLoginTestUser();

    // 3. User B versucht, den Plan von User A abzurufen
    const response = await request(app)
      .get(`/workout/workout/${workoutPlanId}`)
      .set("Cookie", userB.cookie); // WICHTIG: Request läuft über User B!

    // Dein ownerCheck im Service muss diesen Zugriff blockieren
    expect(response.status).toBe(404);
    expect(response.body.status).toBe("fail");
  });
});

describe("POST /workout/completed-workout", () => {
  it("sollte ein durchgeführtes Workout erfolgreich speichern", async () => {
    const { cookie } = await createAndLoginTestUser();

    // Ein Plan muss existieren, auf den sich das Training bezieht
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

    const res = await request(app)
      .post("/workout/workout")
      .set("Cookie", cookie)
      .send(newWorkoutPayload);

    const completedPayload = {
      workoutId: res.body.data,
      title: "Bein Tag (Durchgeführt)",
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 3600000).toISOString(), // 1 Stunde später
      pauseTime: 300,
      duration: 3300,
      exercises: [
        {
          id: 1,
          title: "Bankdrücken",
          displayOrder: 1,
          sets: [{ setNumber: 1, weight: 100, repetitions: 8 }],
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

    await createTestWorkoutPlan({
      workoutId: workoutPlanId,
      userId: userId,
      title: "Bein Tag",
      exerciseId: 1,
      displayOrder: 1,
      setNumber: 1,
      repetitions: 10,
      weight: 25,
    });

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
          sets: [{ setNumber: 1, weight: 100, repetitions: 8 }],
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

  it("sollte 404 zurückgeben, wenn der verknüpfte Trainingsplan gar nicht existiert", async () => {
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

    if (response.body.status !== "fail") {
      console.log(
        "Post completed workout Error: ",
        response.body,
        response.status,
      );
    }

    // Da der Plan (workoutId) nicht existiert, sollte der Datenbank-Check fehlschlagen
    expect(response.status).toBe(404);
    expect(response.body.status).toBe("fail");
  });

  it("sollte 404 zurückgeben, wenn der angegebene Plan einem anderen Benutzer gehört", async () => {
    // 1. User A (Besitzer) erstellt einen Plan
    const userA = await createAndLoginTestUser();
    const workoutPlanId = crypto.randomInt(1, 10000);

    await createTestWorkoutPlan({
      workoutId: workoutPlanId,
      userId: userA.userId,
      title: "User A Plan",
      exerciseId: 1,
      displayOrder: 1,
      setNumber: 1,
      repetitions: 10,
      weight: 25,
    });

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
    expect(response.status).toBe(404);
    expect(response.body.status).toBe("fail");
  });
});

describe("GET /workout/completed-workout/:workoutId", () => {
  it("sollte ein einzelnes durchgeführtes Workout anhand der UUID abrufen", async () => {
    const { userId, cookie } = await createAndLoginTestUser();
    // const completedWorkoutId = crypto.randomUUID();
    const workoutPlanId = crypto.randomInt(1, 10000);

    await createTestWorkoutPlan({
      workoutId: workoutPlanId,
      userId: userId,
      title: "Bein Tag",
      exerciseId: 1,
      displayOrder: 1,
      setNumber: 1,
      repetitions: 10,
      weight: 10,
    });

    const cwId = await createTestCompletedWorkout({
      workoutId: workoutPlanId,
      userId: userId,
      title: "Gestern Trainiert",
      startTime: new Date(),
      endTime: new Date(),
      duration: 1,
      pause: 0,
      exerciseId: 1,
      setNumber: 1,
      repetitions: 100,
      weight: 30,
    });

    const response = await request(app)
      .get(`/workout/completed-workout/${cwId}`)
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
    expect(response.body.data.id).toBe(cwId);
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

  it("sollte 404 zurückgeben, wenn das Workout nicht existiert", async () => {
    const { cookie } = await createAndLoginTestUser();
    const nonExistentId = crypto.randomUUID(); // Gültiges Format, aber nicht in der DB

    const response = await request(app)
      .get(`/workout/completed-workout/${nonExistentId}`)
      .set("Cookie", cookie);

    expect(response.status).toBe(404);
    expect(response.body.status).toBe("fail");
  });

  it("sollte 404 zurückgeben, wenn das Workout einem anderen User gehört", async () => {
    // 1. User A (Besitzer) erstellen und ein Workout für ihn anlegen
    const userA = await createAndLoginTestUser();
    const workoutPlanId = crypto.randomInt(1, 10000);

    // await pool.query(
    //   "INSERT INTO workout_plans (id, user_id, title) VALUES ($1, $2, $3)",
    //   [workoutPlanId, userA.userId, "Geheimer Plan"],
    // );

    await createTestWorkoutPlan({
      workoutId: workoutPlanId,
      userId: userA.userId,
      title: "Geheimer Plan",
      exerciseId: 1,
      displayOrder: 1,
      setNumber: 1,
      repetitions: 10,
      weight: 10,
    });

    const cwId = await createTestCompletedWorkout({
      workoutId: workoutPlanId,
      userId: userA.userId,
      title: "User A Training",
      startTime: new Date(),
      endTime: new Date(),
      duration: 3600,
      pause: 1000,
      exerciseId: 1,
      setNumber: 1,
      repetitions: 10,
      weight: 100,
    });

    // 2. User B (Angreifer) erstellen
    const userB = await createAndLoginTestUser();

    // 3. User B versucht, das Workout von User A abzurufen
    const response = await request(app)
      .get(`/workout/completed-workout/${cwId}`)
      .set("Cookie", userB.cookie); // WICHTIG: Cookie von User B!

    expect(response.status).toBe(404);
    expect(response.body.status).toBe("fail");
  });
});

describe("PUT /workout/completed-workout", () => {
  it("sollte ein durchgeführtes Workout im Nachhinein aktualisieren können", async () => {
    const { userId, cookie } = await createAndLoginTestUser();

    const newWorkoutPayload = {
      title: "Push Day (Test)",
      exercises: [
        {
          id: 1,
          title: "Bankdrücken",
          displayOrder: 1,
          sets: [{ setNumber: 1, weight: 60, repetitions: 10 }],
        },
      ],
    };

    const res = await request(app)
      .post("/workout/workout")
      .set("Cookie", cookie)
      .send(newWorkoutPayload);

    const cwPayload = {
      workoutId: res.body.data,
      startTime: new Date(),
      endTime: new Date(),
      pauseTime: 200,
      duration: 3600,
      exercises: [
        {
          id: 1,
          title: "Bankdrücken",
          displayOrder: 1,
          sets: [{ setNumber: 1, weight: 60, repetitions: 12 }],
        },
      ],
      title: "Push Day Test",
    };

    const cwResult = await request(app)
      .post("/workout/completed-workout")
      .set("Cookie", cookie)
      .send(cwPayload);

    // Da deine Route die ID nicht in der URL (/workout/:id) erwartet,
    // muss die UUID zwingend im Body mitgeschickt werden!
    const cwId = cwResult.body.data;
    const updatePayload = {
      id: cwId,
      userId: userId,
      workoutId: res.body.data,
      title: "Korrigierter Name",
      planTitle: "Push Day (Test)",
      startTime: new Date(),
      endTime: new Date(),
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
      console.log("PUT Completed Error:", response.body.data);
    console.log("PUT Completed  cwResult Error:", cwId);

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

  it("sollte 404 zurückgeben, wenn der Benutzer versucht, das Workout eines anderen zu ändern", async () => {
    // 1. User A (Besitzer) erstellen und ein Workout anlegen
    const userA = await createAndLoginTestUser();
    const completedWorkoutId = crypto.randomUUID();
    const workoutId = crypto.randomInt(1, 10000);

    await createTestWorkoutPlan({
      workoutId: workoutId,
      userId: userA.userId,
      title: "User A Plan",
      exerciseId: 1,
      displayOrder: 1,
      setNumber: 1,
      repetitions: 10,
      weight: 25,
    });

    await createTestCompletedWorkout({
      workoutId: workoutId,
      userId: userA.userId,
      title: "User A Training",
      startTime: new Date(),
      endTime: new Date(),
      duration: 3600,
      pause: 100,
      exerciseId: 1,
      setNumber: 1,
      repetitions: 10,
      weight: 100,
    });

    // 2. User B (Angreifer) erstellen
    const userB = await createAndLoginTestUser();

    // 3. User B versucht, das Workout von User A zu überschreiben
    const maliciousPayload = {
      id: completedWorkoutId, // Die ID von User A's Workout
      userId: userB.userId, // User B schickt seine eigene User ID
      workoutId: workoutId,
      title: "Gehacktes Workout!",
      planTitle: "User A Plan",
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
    if (response.status !== 404) {
      console.log("PUT COMPLETED WORKOUT RESPONSE: ", response.body);
    }
    // Hier schlägt dein 'ownerCheck' aus dem Service an!
    expect(response.status).not.toBe(200);
    expect(response.body.status).toBe("fail");
    expect(response.status).toBe(404);
  });
});

describe("GET /workout/last-workout/:workoutId", () => {
  it("sollte das zuletzt durchgeführte Training für einen bestimmten Plan zurückgeben", async () => {
    const { userId, cookie } = await createAndLoginTestUser();
    const workoutId = crypto.randomInt(1, 10000);

    await createTestWorkoutPlan({
      workoutId: workoutId,
      userId: userId,
      title: "Mein Stamm-Plan",
      exerciseId: 1,
      displayOrder: 1,
      setNumber: 1,
      repetitions: 10,
      weight: 25,
    });

    await createTestCompletedWorkout({
      workoutId: workoutId,
      userId: userId,
      title: "Letztes Mal",
      startTime: new Date(),
      endTime: new Date(),
      duration: 3600,
      pause: 100,
      exerciseId: 1,
      setNumber: 1,
      repetitions: 10,
      weight: 100,
    });

    const response = await request(app)
      .get(`/workout/last-workout/${workoutId}`)
      .set("Cookie", cookie);

    if (response.status !== 200)
      console.log("GET Last Workout Error:", response.body.data);

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

    await createTestWorkoutPlan({
      workoutId: workoutId,
      userId: userId,
      title: "Plan ohne Training",
      exerciseId: 1,
      displayOrder: 1,
      setNumber: 1,
      repetitions: 10,
      weight: 25,
    });

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

  it("sollte 404 zurückgeben, wenn der Plan einem anderen Benutzer gehört", async () => {
    // 1. User A (Besitzer) erstellen und Plan anlegen
    const userA = await createAndLoginTestUser();
    const workoutId = crypto.randomInt(1, 10000);

    await createTestWorkoutPlan({
      workoutId: workoutId,
      userId: userA.userId,
      title: "Mein streng geheimer Plan",
      exerciseId: 1,
      displayOrder: 1,
      setNumber: 1,
      repetitions: 10,
      weight: 25,
    });

    await createTestCompletedWorkout({
      workoutId: workoutId,
      userId: userA.userId,
      title: "Geheimes Training",
      startTime: new Date(),
      endTime: new Date(),
      duration: 3600,
      pause: 100,
      exerciseId: 1,
      setNumber: 1,
      repetitions: 10,
      weight: 100,
    });

    // 2. User B (Angreifer) erstellen
    const userB = await createAndLoginTestUser();

    // 3. User B versucht, das letzte Training von User A's Plan abzurufen
    const response = await request(app)
      .get(`/workout/last-workout/${workoutId}`)
      .set("Cookie", userB.cookie); // WICHTIG: Cookie von User B!

    // Hier schlägt dein `ownerCheck` aus der getLastWorkout-Service-Funktion an!
    expect(response.status).toBe(404);
    expect(response.body.status).toBe("fail");
  });
});
