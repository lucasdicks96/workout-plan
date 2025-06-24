/**
 * @interface IWorkoutPlanExercise
 * Definiert eine Übung innerhalb eines Trainingsplans mit der vorgesehenen Satzanzahl.
 */
export interface IWorkoutPlanExercise {
  exerciseId: number; // Referenz zur ID der Übung aus dem globalen Katalog
  sets: number; // Die im Plan festgelegte Anzahl der Sätze für diese Übung
}

/**
 * @interface IWorkoutPlan
 * Definiert die Struktur eines gesamten Trainingsplans.
 * Diese Pläne werden vom Benutzer erstellt und gehören ihm.
 */
export interface IWorkoutPlan {
  id: number; // Eindeutige ID des Trainingsplans (UUID vom Backend)
  userId: number; // ID des Benutzers, dem dieser Trainingsplan gehört
  name: string; // Name des Trainingsplans, z.B. "Ganzkörper Training A"
  exercises: IWorkoutPlanExercise[]; // Liste der Übungen mit ihren geplanten Sätzen
  createdAt: string; // Optional: Zeitstempel der Erstellung (ISO 8601 String vom Backend)
  updatedAt: string; // Optional: Zeitstempel der letzten Aktualisierung (ISO 8601 String)
}
