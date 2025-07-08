/**
 * @interface IWorkoutPlanExercise
 * Definiert eine Übung innerhalb eines Trainingsplans mit der vorgesehenen Satzanzahl.
 */
export interface IWorkoutPlanExercise {
  exerciseId: number; // Referenz zur ID der Übung aus dem globalen Katalog
  sets: number; // Die im Plan festgelegte Anzahl der Sätze für diese Übung
  repetitions: number; // Die im Plan festgelegte Anzahl der Wiederholungen pro Satz
  weight: number; // Das im Plan festgelegte Gewicht für diese Übung (in kg)
}

/**
 * @interface IWorkoutPlan
 * Definiert die Struktur eines gesamten Trainingsplans.
 * Diese Pläne werden vom Benutzer erstellt und gehören ihm.
 */
export interface IWorkoutPlan {
  id: number; // Eindeutige ID des Trainingsplans (UUID vom Backend)
  uid: number; // ID des Benutzers, dem dieser Trainingsplan gehört
  title: string; // Name des Trainingsplans, z.B. "Ganzkörper Training A"
  exercises: IWorkoutPlanExercise[]; // Liste der Übungen mit ihren geplanten Sätzen
  createdAt: string; // Optional: Zeitstempel der Erstellung (ISO 8601 String vom Backend)
}
/**
 * @interface IFinishedWorkoutPlan
 * Definiert die Struktur eines abgeschlossenen Trainingsplans.
 * Diese Pläne werden vom Backend erstellt, wenn der Benutzer ein Workout abschließt.
 */
export interface IFinishedWorkoutPlan {
  id: number; // Eindeutige ID des abgeschlossenen Trainingsplans
  uid: number; // ID des Benutzers, dem dieser Trainingsplan gehört
  title: string; // Name des Trainingsplans, z.B. "Ganzkörper Training A"
  exercises: IWorkoutPlanExercise[]; // Liste der Übungen mit ihren geplanten Sätzen
  date: string; // Datum des Abschlusses (ISO 8601 String)
  duration: number; // Dauer des Workouts in Sekunden
  startTime: string; // Startzeit des Workouts (ISO 8601 String)
  endTime: string; // Endzeit des Workouts (ISO 8601 String)
}
