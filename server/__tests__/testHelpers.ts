// __tests__/testHelpers.ts
import request from "supertest";
import app from "../src/index";
import pool from "../src/config/db";
import bcrypt from "bcrypt";
import crypto from "crypto"; // <-- Nativ in Node.js, keine Installation nötig!

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
  return { userId, cookie };
}
