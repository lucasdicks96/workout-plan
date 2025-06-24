/**
 * @interface IWorkoutSet
 * Definiert einen einzelnen Satz innerhalb einer Trainingseinheit.
 * Hier werden die tatsächlich durchgeführten Wiederholungen erfasst.
 */
export interface IWorkoutSet {
  setNumber: number; // Die fortlaufende Nummer des Satzes (z.B. 1, 2, 3)
  repetitions: number | null; // Die Anzahl der Wiederholungen, oder null, wenn noch nicht eingegeben
  weight?: number; // Optional: Das Gewicht für diesen Satz
  notes?: string; // Optional: Anmerkungen zum Satz
}

/**
 * @interface IWorkoutSessionExercise
 * Definiert eine Übung, wie sie in einer konkreten Trainingseinheit durchgeführt wird.
 * Enthält die Liste der tatsächlich durchgeführten Sätze.
 */
export interface IWorkoutSessionExercise {
  // Hier könnte eine Referenz zur Exercise vorhanden sein, oder die Übungsdetails direkt für einen Schnappschuss.
  // Für Einfachheit nehmen wir an, dass wir die Übungs-ID referenzieren und die Details separat holen können.
  exerciseId: number; // Referenz zur ID der Übung aus dem Katalog
  sets: IWorkoutSet[]; // Die Liste der tatsächlich ausgeführten Sätze mit Wiederholungen
}

/**
 * @interface IWorkoutSession
 * Definiert eine abgeschlossene oder gerade laufende Trainingseinheit.
 * Eine Instanz dieser Struktur wird erstellt, wenn ein Benutzer ein Training beginnt.
 */
export interface IWorkoutSession {
  id: number; // Eindeutige ID der Trainingseinheit (UUID vom Backend)
  workoutPlanId: number; // Referenz zum Trainingsplan, auf dem die Sitzung basiert
  userId: number; // ID des Benutzers, der das Training durchgeführt hat
  startTime: string; // Startzeitpunkt des Trainings (ISO 8601 String)
  endTime: string | null; // Endzeitpunkt des Trainings, null wenn noch nicht beendet (ISO 8601 String)
  status: "started" | "completed" | "cancelled"; // Aktueller Status der Trainingseinheit
  exercises: IWorkoutSessionExercise[]; // Liste der Übungen mit den erfassten Sätzen
  createdAt: string; // Optional: Zeitstempel der Erstellung
  updatedAt: string; // Optional: Zeitstempel der letzten Aktualisierung
}
