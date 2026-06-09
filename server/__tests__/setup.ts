import { afterAll, beforeEach } from "@jest/globals";
import pool from "../src/config/db";

beforeEach(async () => {
  // Wir nutzen DELETE statt TRUNCATE.
  // Tabellen, die hier nicht stehen (wie 'exercises'), bleiben zu 100 % unangetastet!
  // WICHTIG: Die Reihenfolge ist von unten (Kinder) nach oben (Eltern) aufgebaut.
  await pool.query(`
    DELETE FROM plan_sets;
    DELETE FROM plan_exercises;
    DELETE FROM completed_sets;
    DELETE FROM completed_workouts;
    DELETE FROM workout_plans;
    DELETE FROM sessions;
    DELETE FROM users;
  `);
});

afterAll(async () => {
  // Verbindung sauber kappen
  await pool.end();
});
