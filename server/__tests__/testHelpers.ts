// __tests__/testHelpers.ts
import bcrypt from "bcrypt";
import crypto from "crypto"; // <-- Nativ in Node.js, keine Installation nötig!
import request from "supertest";
import pool from "../src/config/db";
import app from "../src/index";

export async function createAndLoginTestUser() {
  const password = "testpassword123";
  const email = `test-${Date.now()}@example.com`;

  // Nutzt die native Node.js Funktion zur UUID Generierung
  const userId = crypto.randomUUID();

  const hashedPassword = await bcrypt.hash(password, 10);

  // 1. User direkt in die frisch geleerte Datenbank einfügen
  await pool.query(
    "INSERT INTO users (id, email, password) VALUES ($1, $2, $3)",
    [userId, email, hashedPassword],
  );

  // 2. Über die API einloggen (Passe die Route '/auth/login' an deine an)
  const loginResponse = await request(app).post("/user/login").send({
    email: email,
    password: password,
  });

  if (loginResponse.status !== 200) {
    console.log("Login Error Body:", loginResponse.body);
  }

  // 3. Den magischen Session-Cookie extrahieren
  const cookie = loginResponse.headers["set-cookie"];

  if (!cookie) {
    throw new Error("Login fehlgeschlagen: Kein Cookie vom Server erhalten.");
  }

  // Wir geben die ID (für spätere Abfragen) und den Cookie zurück
  return { userId, cookie, email, password };
}

export async function createTestWorkoutPlan({
  workoutId,
  userId,
  title,
  exerciseId,
  displayOrder,
  setNumber,
  repetitions,
  weight,
}: {
  workoutId: number;
  userId: string;
  title: string;
  exerciseId: number;
  displayOrder: number;
  setNumber: number;
  repetitions: number;
  weight: number;
}) {
  await pool.query(
    "INSERT INTO workout_plans (id, user_id, title) VALUES ($1, $2, $3)",
    [workoutId, userId, title],
  );

  const peResult = await pool.query(
    "INSERT INTO plan_exercises (workout_plan_id, exercise_id, display_order) VALUES ($1, $2, $3) RETURNING id",
    [workoutId, exerciseId, displayOrder],
  );

  await pool.query(
    "INSERT INTO plan_sets (plan_exercise_id, set_number, repetitions, weight) VALUES ($1, $2, $3, $4)",
    [peResult.rows[0].id, setNumber, repetitions, weight],
  );
}

export async function createTestCompletedWorkout({
  workoutId,
  userId,
  title,
  startTime,
  endTime,
  duration,
  pause,
  exerciseId,
  setNumber,
  repetitions,
  weight,
}: {
  workoutId: number;
  userId: string;
  title: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  pause: number;
  exerciseId: number;
  setNumber: number;
  repetitions: number;
  weight: number;
}): Promise<string> {
  const res = await pool.query(
    "INSERT INTO completed_workouts (user_id, workout_plan_id, title, start_time, end_time, duration_seconds, pause_seconds) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id",
    [userId, workoutId, title, startTime, endTime, duration, pause],
  );

  await pool.query(
    "INSERT INTO completed_sets (completed_workout_id, exercise_id, set_number, repetitions, weight) VALUES ($1, $2, $3, $4, $5)",
    [res.rows[0].id, exerciseId, setNumber, repetitions, weight],
  );

  return res.rows[0].id;
}
