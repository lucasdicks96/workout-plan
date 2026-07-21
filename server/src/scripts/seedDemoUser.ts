import { CreateExerciseBody } from "../schemas/exercise.schema";
import {
  CreateWorkoutBody,
  PostCompletedWorkoutBody,
} from "../schemas/workout.schema";

// ==========================================
// TYPES & DEPENDENCIES
// ==========================================

// Anpassen an deine tatsächlichen Service-Imports:
interface SeedServices {
  // Backend liefert z. B. { status: "success", message: "...", data: { id: 42 } }
  createExercise: (
    userId: string,
    body: CreateExerciseBody,
  ) => Promise<{ id: number }>;
  createWorkoutPlan: (
    userId: string,
    body: CreateWorkoutBody,
  ) => Promise<{ id: number }>;
  saveCompletedWorkout: (
    userId: string,
    body: PostCompletedWorkoutBody,
  ) => Promise<void>;
}

// ==========================================
// MAIN SEED FUNCTION
// ==========================================

/**
 * Befüllt einen spezifischen Demo-Benutzer mit Testdaten (Übungen, Pläne & Absolvierte Workouts).
 *
 * @param userId - Die UUID des Ziel-Users.
 * @param services - Ein Objekt mit deinen Service-Funktionen zum Speichern der Daten.
 */
export async function seedDemoUser(
  userId: string,
  services: SeedServices,
): Promise<void> {
  console.log(`🚀 Starte Seeding für Demo-User: ${userId}...`);

  // ---------------------------------------------------------
  // 1. EIGENE ÜBUNGEN ERSTELLEN
  // ---------------------------------------------------------
  console.log("📦 Erstelle eigene Übungen...");

  const customExercisePayloads: CreateExerciseBody[] = [
    {
      title: "Schrägbankdrücken (Kurzhantel)",
      description:
        "Bank auf ca. 30 Grad einstellen. Ellenbogen leicht nach innen führen.",
      categories: [3, 19], // Beispiel-Kategorie ID (Brust)
    },
    {
      title: "Kabelzug-Seitheben",
      description: "Kabel hinter dem Körper führen für gleichmäßige Spannung.",
      categories: [2, 15], // Beispiel-Kategorie ID (Schultern)
    },
    {
      title: "Kreuzheben",
      description: "Grundübung für die Beine",
      categories: [1, 5, 10, 26, 27], // Beispiel-Kategorie ID (Beine)
    },
  ];

  const createdExercises: Array<{ id: number; title: string }> = [];

  for (const payload of customExercisePayloads) {
    // 1. Backend aufrufen und frische ID erhalten
    const response = await services.createExercise(userId, payload);

    // 2. ID mit dem gesendeten Titel verknüpfen
    createdExercises.push({
      id: response.id, // e.g. 104 (vom Auto-Increment der DB)
      title: payload.title,
    });
  }

  // ---------------------------------------------------------
  // 2. TRAININGSPLÄNE ERSTELLEN
  // ---------------------------------------------------------
  console.log("📋 Erstelle Trainingspläne...");

  // Kombinieren aus Standard-Übungs-IDs (z.B. 1, 2) und frisch erstellten Custom-Übungen
  const pushPlanPayload: CreateWorkoutBody = {
    title: "Push A (Brust / Schulter / Trizeps)",
    exercises: [
      {
        id: createdExercises[0].id, // Schrägbank KH
        title: createdExercises[0].title,
        displayOrder: 0,
        sets: [
          { setNumber: 1, weight: 24, repetitions: 10 },
          { setNumber: 2, weight: 26, repetitions: 8 },
          { setNumber: 3, weight: 26, repetitions: 8 },
        ],
      },
      {
        id: createdExercises[1].id,
        title: createdExercises[1].title,
        displayOrder: 1,
        sets: [
          { setNumber: 1, weight: 8, repetitions: 15 },
          { setNumber: 2, weight: 10, repetitions: 12 },
          { setNumber: 3, weight: 10, repetitions: 10 },
        ],
      },
    ],
  };

  const pullPlanPayload: CreateWorkoutBody = {
    title: "Pull A (Rücken / Bizeps)",
    exercises: [
      {
        id: createdExercises[2].id,
        title: createdExercises[2].title,
        displayOrder: 0,
        sets: [
          { setNumber: 1, weight: 70, repetitions: 10 },
          { setNumber: 2, weight: 80, repetitions: 8 },
          { setNumber: 3, weight: 80, repetitions: 8 },
        ],
      },
    ],
  };

  const pushPlanResponse = await services.createWorkoutPlan(
    userId,
    pushPlanPayload,
  );
  const pushPlan = { id: pushPlanResponse.id, title: pushPlanPayload.title };
  const pullPlanResponse = await services.createWorkoutPlan(
    userId,
    pullPlanPayload,
  );
  const pullPlan = { id: pullPlanResponse.id, title: pullPlanPayload.title };

  // ---------------------------------------------------------
  // 3. HISTORIE: ABSOLVIERTE WORKOUTS GENERIEREN
  // ---------------------------------------------------------
  console.log("🏋️ Generiere vergangene Workouts (letzte 3 Wochen)...");

  const completedWorkouts = generateWorkoutHistory(
    pushPlan,
    pullPlan,
    createdExercises,
  );

  for (const completedPayload of completedWorkouts) {
    await services.saveCompletedWorkout(userId, completedPayload);
  }

  console.log("✅ Seeding erfolgreich abgeschlossen!");
}

// ==========================================
// HELPER: HISTORIE GENERIEREN
// ==========================================

/**
 * Generiert vergangene Workout-Sessions mit realistischen Zeitstempeln und Steigerungen.
 */
function generateWorkoutHistory(
  pushPlan: { id: number; title: string },
  pullPlan: { id: number; title: string },
  exercises: Array<{ id: number; title: string }>,
): PostCompletedWorkoutBody[] {
  const now = new Date();

  // Hilfsfunktion für Vergangenheitsdaten
  const daysAgo = (days: number, hour: number = 18): Date => {
    const d = new Date(now);
    d.setDate(d.getDate() - days);
    d.setHours(hour, 0, 0, 0);
    return d;
  };

  const exSchraegbank = exercises[0];
  const exSeitheben = exercises[1];
  const exRdl = exercises[2];

  return [
    // --- Woche 1: Vor 18 Tagen (Push) ---
    createCompletedWorkoutPayload({
      workoutId: pushPlan.id,
      title: pushPlan.title,
      start: daysAgo(18, 17),
      durationMinutes: 52,
      pauseSeconds: 300,
      exercises: [
        {
          id: exSchraegbank.id,
          title: exSchraegbank.title,
          displayOrder: 0,
          sets: [
            { setNumber: 1, weight: 22, repetitions: 10 },
            { setNumber: 2, weight: 24, repetitions: 8 },
            { setNumber: 3, weight: 24, repetitions: 7 },
          ],
        },
        {
          id: exSeitheben.id,
          title: exSeitheben.title,
          displayOrder: 1,
          sets: [
            { setNumber: 1, weight: 7, repetitions: 12 },
            { setNumber: 2, weight: 7, repetitions: 12 },
            { setNumber: 3, weight: 8, repetitions: 10 },
          ],
        },
      ],
    }),

    // --- Woche 1: Vor 16 Tagen (Pull) ---
    createCompletedWorkoutPayload({
      workoutId: pullPlan.id,
      title: pullPlan.title,
      start: daysAgo(16, 18),
      durationMinutes: 45,
      pauseSeconds: 240,
      exercises: [
        {
          id: exRdl.id,
          title: exRdl.title,
          displayOrder: 0,
          sets: [
            { setNumber: 1, weight: 60, repetitions: 10 },
            { setNumber: 2, weight: 70, repetitions: 8 },
            { setNumber: 3, weight: 70, repetitions: 8 },
          ],
        },
      ],
    }),

    // --- Woche 2: Vor 11 Tagen (Push - Steigerung) ---
    createCompletedWorkoutPayload({
      workoutId: pushPlan.id,
      title: pushPlan.title,
      start: daysAgo(11, 17),
      durationMinutes: 58,
      pauseSeconds: 360,
      exercises: [
        {
          id: exSchraegbank.id,
          title: exSchraegbank.title,
          displayOrder: 0,
          sets: [
            { setNumber: 1, weight: 24, repetitions: 10 },
            { setNumber: 2, weight: 24, repetitions: 9 },
            { setNumber: 3, weight: 26, repetitions: 6 },
          ],
        },
        {
          id: exSeitheben.id,
          title: exSeitheben.title,
          displayOrder: 1,
          sets: [
            { setNumber: 1, weight: 8, repetitions: 12 },
            { setNumber: 2, weight: 8, repetitions: 12 },
            { setNumber: 3, weight: 10, repetitions: 8 },
          ],
        },
      ],
    }),

    // --- Woche 3: Vor 4 Tagen (Push - Noch bessere Performance) ---
    createCompletedWorkoutPayload({
      workoutId: pushPlan.id,
      title: pushPlan.title,
      start: daysAgo(4, 18),
      durationMinutes: 50,
      pauseSeconds: 300,
      exercises: [
        {
          id: exSchraegbank.id,
          title: exSchraegbank.title,
          displayOrder: 0,
          sets: [
            { setNumber: 1, weight: 24, repetitions: 10 },
            { setNumber: 2, weight: 26, repetitions: 8 },
            { setNumber: 3, weight: 26, repetitions: 8 },
          ],
        },
        {
          id: exSeitheben.id,
          title: exSeitheben.title,
          displayOrder: 1,
          sets: [
            { setNumber: 1, weight: 8, repetitions: 15 },
            { setNumber: 2, weight: 10, repetitions: 10 },
            { setNumber: 3, weight: 10, repetitions: 10 },
          ],
        },
      ],
    }),
  ];
}

/**
 * Erzeugt das exakte `PostCompletedWorkoutBody`-Format inklusive berechneter Endzeit & Dauer in Sekunden.
 */
/**
 * Erzeugt das exakte `PostCompletedWorkoutBody`-Format mit Zeitangaben in Millisekunden.
 */
function createCompletedWorkoutPayload(params: {
  workoutId: number;
  title: string;
  start: Date;
  durationMinutes: number;
  pauseSeconds: number;
  exercises: PostCompletedWorkoutBody["exercises"];
}): PostCompletedWorkoutBody {
  // Umrechnung in Millisekunden für das Backend
  const durationMs = params.durationMinutes * 60 * 1000;
  const pauseMs = params.pauseSeconds * 1000;

  // Endzeit berechnen (Startzeit + Dauer in ms)
  const endTime = new Date(params.start.getTime() + durationMs);

  return {
    workoutId: params.workoutId,
    title: params.title,
    startTime: params.start,
    endTime: endTime,
    duration: durationMs, // In Millisekunden
    pauseTime: pauseMs, // In Millisekunden
    exercises: params.exercises,
  };
}
