/**
 * Repräsentiert einen strukturierten Trainingsplan inklusive der zugehörigen Übungen und Sätze.
 */
export interface Workout {
  /** Eindeutige ID des Workout-Plans. */
  id: number;
  /** UUID des Benutzers, dem der Plan gehört. */
  userId: string;
  /** Titel des Trainingsplans. */
  title: string;
  /** Liste der im Plan enthaltenen Übungen. */
  exercises: WorkoutExercise[];
}

/**
 * Repräsentiert eine Übung innerhalb eines Trainingsplans 
 * inklusive ihrer Anzeigereihenfolge und der zugehörigen Sätze.
 */
export interface WorkoutExercise {
  /** Eindeutige ID der Übung. */
  id: number;
  /** Titel der Übung. */
  title: string;
  /** Die Reihenfolge, in der die Übung innerhalb des Plans angezeigt werden soll. */
  displayOrder: number;
  /** Liste der geplanten oder absolvierten Sätze für diese Übung. */
  sets: WorkoutExerciseSets[];
}

/**
 * Repräsentiert einen einzelnen Satz (Set) innerhalb einer Übung.
 */
export interface WorkoutExerciseSets {
  /** Die laufende Nummer des Satzes. */
  setNumber: number;
  /** Das verwendete Gewicht in kg. */
  weight: number;
  /** Die Anzahl der absolvierten Wiederholungen. */
  repetitions: number;
}

/**
 * Repräsentiert ein erfolgreich absolviertes und gespeichertes Workout 
 * inklusive aller zeitlichen Metadaten, Pausen und ausgeführten Sätze.
 */
export interface CompletedWorkout {
  /** Eindeutige UUID des absolvierten Workouts. */
  id: string;
  /** UUID des Benutzers, der das Training absolviert hat. */
  userId: string;
  /** ID des zugrundeliegenden Plans (oder 0, falls freies Training). */
  workoutId: number;
  /** Titel des absolvierten Workouts. */
  title: string;
  /** Titel des ursprünglichen Plans (falls abgeleitet). */
  planTitle: string;
  /** Gesamtdauer des Trainings in Sekunden. */
  duration: number;
  /** Zeitpunkt des Trainingsbeginns. */
  startTime: Date;
  /** Zeitpunkt des Trainingsendes. */
  endTime: Date;
  /** Gesamte Pausenzeit in Sekunden. */
  pauseTime: number;
  /** Die während des Trainings absolvierten Übungen und Sätze. */
  exercises: WorkoutExercise[];
}

/**
 * Repräsentiert eine einzelne flache Zeile aus der Datenbankabfrage für ein absolviertes Workout 
 * (Resultat von SQL-Joins zwischen Workouts, Sets und Übungen).
 */
export type FlatCompletedWorkoutRow = {
  workout_id: string;
  plan_id: number;
  plan_user_id: string;
  plan_title: string;
  workout_title: string;
  duration_seconds: number;
  start_time: Date;
  end_time: Date;
  pause_seconds: number;
  exercise_id: number;
  title: string;
  display_order: number;
  set_number: number;
  weight: number;
  repetitions: number;
};

/**
 * Repräsentiert eine einzelne flache Zeile aus der Datenbankabfrage für einen aktiven Trainingsplan.
 */
export type FlatWorkoutRow = {
  plan_title: string;
  plan_user_id: string;
  plan_id: number;
  title: string;
  exercise_id: number;
  display_order: number;
  set_number: number;
  repetitions: number;
  weight: number;
};

/**
 * Repräsentiert eine einzelne flache Zeile beim Abrufen aller Workout-Pläne eines Benutzers.
 */
export type FlatAllWorkoutsRow = {
  plan_id: number;
  plan_title: string;
  plan_user_id: string;
  exercise_id: number;
  title: string;
  display_order: number;
  set_number: number;
  repetitions: number;
  weight: number;
};