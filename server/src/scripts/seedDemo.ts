import * as userService from "../services/user.service";
import * as exerciseService from "../services/exercise.service";
import * as workoutService from "../services/workout.service";

import { seedDemoUser } from "./seedDemoUser";

async function run() {
  // E-Mail und Passwort aus den CLI-Argumenten lesen
  const email = process.argv[2];
  const password = process.argv[3] || "Demo1234!";

  if (!email) {
    console.error("❌ Bitte gib eine E-Mail-Adresse an!");
    console.log("Usage: npx tsx scripts/seedDemo.ts <email> [password]");
    process.exit(1);
  }

  // Variable außerhalb des try-Blocks deklarieren, damit sie im catch verfügbar ist
  let createdUserId: string | null = null;

  try {
    console.log(`1. Erstelle User ${email}...`);
    // Erstellt den User in der DB
    const user = await userService.createUser(email, password);
    createdUserId = user.id; // ID merken

    console.log(
      `2. Befülle Datenbank mit Testdaten für User-ID: ${user.id}...`,
    );

    await seedDemoUser(user.id, {
      // Service 1: exerciseService.postExercise(title, description, userId, categories)
      createExercise: async (uId, body) => {
        const result = await exerciseService.postExercise(
          body.title,
          body.description,
          uId,
          body.categories,
        );
        return { id: result.id };
      },

      // Service 2: workoutService.createWorkoutPlan(title, userId, exercises)
      createWorkoutPlan: async (uId, body) => {
        const result = await workoutService.createWorkoutPlan(
          body.title,
          uId,
          body.exercises,
        );
        return { id: result.id };
      },

      // Service 3: workoutService.postCompletedWorkout(workoutId, userId, startTime, endTime, pauseTime, duration, exercises, title)
      saveCompletedWorkout: async (uId, body) => {
        await workoutService.postCompletedWorkout(
          body.workoutId,
          uId,
          body.startTime,
          body.endTime,
          body.pauseTime,
          body.duration,
          body.exercises,
          body.title,
        );
      },
    });

    console.log(`\n🎉 Fertig! Login-Daten für Bewerbung:`);
    console.log(`E-Mail:   ${email}`);
    console.log(`Passwort: ${password}\n`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Fehler beim Seeden:", error);
    // AUTOMATISCHES CLEANUP: Falls der User schon angelegt wurde, löschen wir ihn wieder
    if (createdUserId) {
      console.log(
        `🧹 Lösche unvollständig angelegten User (${createdUserId})...`,
      );
      try {
        await userService.deleteUser(createdUserId); // Oder dein entsprechender Delete-Service/Query
        console.log("✅ Cleanup erfolgreich.");
      } catch (cleanupError) {
        console.error("⚠️ Fehler beim Cleanup des Users:", cleanupError);
      }
    }

    process.exit(1);
  }
}

run();
