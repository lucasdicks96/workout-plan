import {
  CompletedWorkout,
  FlatCompletedWorkoutRow,
  FlatWorkoutRow,
  Workout,
  WorkoutExercise,
} from "../types/workout.types";

/**
 * Transformiert flache SQL-Abfrageergebnisse eines einzelnen Trainingsplans in ein strukturiertes,
 * hierarchisches `Workout`-Domain-Objekt.
 *
 * @remarks
 * **Performance:** Nutzt eine `Map` für das Gruppieren von Übungen nach ihrer ID.
 * Dies garantiert eine lineare Zeitkomplexität von O(N) relativ zur Anzahl der Datenbankzeilen
 * und vermeidet performancelastige `Array.find()`-Aufrufe.
 *
 * @param workoutId - Die eindeutige ID des zu generierenden Workouts.
 * @param rows - Array von flachen Zeilen aus der Datenbank (typischerweise Ergebnis eines SQL-JOINs aus Plan, Übungen und Sätzen).
 * @returns Das fertig aggregierte und sortierte `Workout`-Objekt.
 */
export function buildWorkout(
  workoutId: number,
  rows: FlatWorkoutRow[],
): Workout {
  const { plan_title, plan_user_id } = rows[0];

  const workout: Workout = {
    id: workoutId,
    title: plan_title,
    userId: plan_user_id,
    exercises: [],
  };

  const exerciseMap = new Map<number, WorkoutExercise>();

  rows.forEach((row) => {
    let exercise = exerciseMap.get(row.exercise_id);

    if (!exercise) {
      exercise = {
        id: row.exercise_id,
        title: row.title,
        displayOrder: row.display_order,
        sets: [],
      };
      exerciseMap.set(row.exercise_id, exercise);
    }

    // Null-Check (`!= null` prüft auf null UND undefined):
    // Essentiell für Übungen ohne definierte Sätze (z. B. durch SQL LEFT JOINs).
    if (row.set_number != null) {
      exercise.sets.push({
        setNumber: row.set_number,
        repetitions: row.repetitions,
        weight: row.weight,
      });
    }
  });

  // Übungen in ein Array konvertieren und nach der gewünschten Anzeigereihenfolge sortieren
  workout.exercises = Array.from(exerciseMap.values()).sort(
    (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
  );

  return workout;
}

/**
 * Gruppiert und transformiert eine flache Liste von Trainingshistorien-Zeilen in ein Array von
 * absolvierten Workouts (`CompletedWorkout[]`).
 *
 * @remarks
 * **Sortierung:** Das resultierende Array wird automatisch chronologisch **absteigend** sortiert
 * (neueste Workouts zuerst).
 * **Zweistufiges Mapping:** Nutzt eine verschachtelte Map-Struktur (Workout -> Exercise -> Sets),
 * um die Datenstruktur mit O(N) Laufzeit aufzubauen.
 *
 * @param rows - Flache Zeilen aus der Datenbank-Historientabelle (inkl. Zeitstempel, Pausen und Dauer).
 * @returns Ein absteigend nach Startzeitpunkt sortiertes Array von absolvierten Workouts.
 */
export function buildCompletedWorkouts(
  rows: FlatCompletedWorkoutRow[],
): CompletedWorkout[] {
  const workoutGroupMap = new Map<
    string,
    {
      workout: CompletedWorkout;
      exerciseMap: Map<number, WorkoutExercise>;
    }
  >();

  rows.forEach((row) => {
    const completedWorkoutId = row.workout_id;

    let workoutEntry = workoutGroupMap.get(completedWorkoutId);

    if (!workoutEntry) {
      workoutEntry = {
        workout: {
          id: completedWorkoutId,
          userId: row.plan_user_id,
          workoutId: row.plan_id,
          title: row.workout_title,
          planTitle: row.plan_title,
          duration: row.duration_seconds,
          startTime: row.start_time,
          endTime: row.end_time,
          pauseTime: row.pause_seconds,
          exercises: [],
        },
        exerciseMap: new Map<number, WorkoutExercise>(),
      };
      workoutGroupMap.set(completedWorkoutId, workoutEntry);
    }

    const exerciseId = row.exercise_id;
    let exercise = workoutEntry.exerciseMap.get(exerciseId);

    if (!exercise) {
      exercise = {
        id: exerciseId,
        title: row.title,
        displayOrder: row.display_order,
        sets: [],
      };
      workoutEntry.exerciseMap.set(exerciseId, exercise);
    }

    if (row.set_number != null) {
      exercise.sets.push({
        setNumber: row.set_number,
        // Explizites Type Casting für numerische Datenbank-Rückgabewerte
        weight: row.weight as number,
        repetitions: row.repetitions as number,
      });
    }
  });

  const completedWorkouts: CompletedWorkout[] = [];

  for (const { workout, exerciseMap } of workoutGroupMap.values()) {
    workout.exercises = Array.from(exerciseMap.values()).sort(
      (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
    );
    completedWorkouts.push(workout);
  }

  // Absteigende chronologische Sortierung (neueste zuerst)
  return completedWorkouts.sort(
    (a, b) => b.startTime.getTime() - a.startTime.getTime(),
  );
}

/**
 * Aggregiert das flache Ergebnis einer Datenbankabfrage über alle verfügbaren Trainingspläne
 * eines Nutzers in eine strukturierte Liste von `Workout`-Objekten.
 *
 * @remarks
 * **Sortierung:** Im Gegensatz zur Historie werden die Pläne hier **alphabetisch** aufsteigend
 * nach dem Plan-Titel sortiert.
 *
 * @param rows - Flache Join-Zeilen aller Trainingspläne eines Nutzers.
 * @returns Eine alphabetisch sortierte Liste von vollständigen `Workout`-Objekten.
 */
export function buildWorkoutPlansList(rows: FlatWorkoutRow[]): Workout[] {
  const plansMap = new Map<
    number,
    { workout: Workout; exerciseMap: Map<number, WorkoutExercise> }
  >();

  rows.forEach((row) => {
    let planEntry = plansMap.get(row.plan_id);

    if (!planEntry) {
      planEntry = {
        workout: {
          id: row.plan_id,
          title: row.plan_title,
          userId: row.plan_user_id,
          exercises: [],
        },
        exerciseMap: new Map<number, WorkoutExercise>(),
      };
      plansMap.set(row.plan_id, planEntry);
    }

    let exercise = planEntry.exerciseMap.get(row.exercise_id);

    if (!exercise) {
      exercise = {
        id: row.exercise_id,
        title: row.title,
        displayOrder: row.display_order,
        sets: [],
      };
      planEntry.exerciseMap.set(row.exercise_id, exercise);
    }

    exercise.sets.push({
      setNumber: row.set_number,
      weight: row.weight,
      repetitions: row.repetitions,
    });
  });

  const workouts: Workout[] = [];

  for (const { workout, exerciseMap } of plansMap.values()) {
    workout.exercises = Array.from(exerciseMap.values()).sort(
      (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
    );
    workouts.push(workout);
  }

  // Alphabetische Sortierung nach dem Titel des Plans
  return workouts.sort((a, b) => a.title.localeCompare(b.title));
}

/**
 * Erzeugt ein "intelligentes" Workout-Objekt für das nächste anstehende Training (Pre-Filling),
 * indem die Zielstruktur des Trainingsplans mit den realen Leistungsdaten der Historie verschmolzen wird.
 *
 * @remarks
 * **Algorithmus (2 Phasen):**
 * 1. **Historien-Lookup:** Erstellt eine schnell durchsuchbare Map (`O(1)`) aus den absolvierten Sätzen
 *    unter Verwendung eines Composite Keys (`"exerciseId-setNumber"`).
 * 2. **Plan-Konstruktion:** Baut das Workout **strikt** nach der aktuellen Plan-Vorlage auf.
 *    - Falls historische Daten zu einem Satz existieren, werden Gewicht und Wiederholungen als Vorbelegung übernommen.
 *    - Falls keine Historie existiert (z. B. bei neu im Plan hinzugefügten Übungen), werden die Zielwerte aus dem Plan (oder 0) gesetzt.
 *
 * @param workoutId - Die ID für das neu zu erstellende/anstehende Workout.
 * @param planRows - Flache Zeilen der aktuellen Trainingsplan-Vorlage.
 * @param completedRows - Flache Zeilen aus der Trainingshistorie (idealerweise nur vom zuletzt absolvierten Training dieses Plans).
 * @returns Ein fertig mit historischen Daten vorbefülltes `Workout`-Objekt für die UI.
 */
export function buildMergedWorkout(
  workoutId: number,
  planRows: FlatWorkoutRow[],
  completedRows: FlatCompletedWorkoutRow[],
): Workout {
  const { plan_title, plan_user_id } = planRows[0];

  const workout: Workout = {
    id: workoutId,
    title: plan_title,
    userId: plan_user_id,
    exercises: [],
  };

  // SCHRITT 1: Historie in eine schnelle Lookup-Map verwandeln
  // Schlüssel-Format: "exerciseId-setNumber" -> Wert: { weight, repetitions }
  const historyLookup = new Map<
    string,
    { weight: number; repetitions: number }
  >();

  completedRows.forEach((row) => {
    if (row.set_number != null) {
      historyLookup.set(`${row.exercise_id}-${row.set_number}`, {
        weight: Number(row.weight),
        repetitions: Number(row.repetitions),
      });
    }
  });

  // SCHRITT 2: Workout strikt auf Basis der Plan-Vorlage aufbauen
  const exerciseMap = new Map<number, WorkoutExercise>();

  planRows.forEach((row) => {
    let exercise = exerciseMap.get(row.exercise_id);

    if (!exercise) {
      exercise = {
        id: row.exercise_id,
        title: row.title,
        displayOrder: row.display_order,
        sets: [],
      };
      exerciseMap.set(row.exercise_id, exercise);
    }

    if (row.set_number != null) {
      // Prüfen: Gibt es für diese Übung und diesen Satz einen historischen Wert?
      const historyKey = `${row.exercise_id}-${row.set_number}`;
      const historicalData = historyLookup.get(historyKey);

      exercise.sets.push({
        setNumber: row.set_number,
        // Wenn Historie da ist: Nimm historisches Gewicht/Reps.
        // Wenn NEUE ÜBUNG: Nimm die Vorgabe aus dem Plan (oder Fallback 0)!
        weight: historicalData
          ? historicalData.weight
          : Number(row.weight || 0),
        repetitions: historicalData
          ? historicalData.repetitions
          : Number(row.repetitions || 0),
      });
    }
  });

  workout.exercises = Array.from(exerciseMap.values()).sort(
    (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
  );

  return workout;
}