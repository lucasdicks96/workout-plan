/**
 * Repräsentiert eine Übung im System (entweder global als Systemübung oder benutzerspezifisch).
 */
export interface Exercise {
  /** Eindeutige numerische ID der Übung. */
  id: number;
  /** UUID des Benutzers oder `null`, falls es sich um eine globale Systemübung handelt. */
  userId: string | null;
  /** Titel der Übung. */
  title: string;
  /** Detaillierte Beschreibung der Ausführung. */
  description: string;
  /** Liste der der Übung zugewiesenen Kategorien. */
  category: Category[];
}

/**
 * Erweitert das Basis-`Exercise`-Interface um spezifische Leistungsdaten eines einzelnen Satzes 
 * (z. B. für Protokollierungs- oder Auswertungsansichten).
 */
export interface ExerciseSets extends Exercise {
  /** Die laufende Nummer des Satzes. */
  set: number;
  /** Anzahl der absolvierten Wiederholungen in diesem Satz. */
  repetitions: number;
  /** Das verwendete Gewicht in diesem Satz. */
  weight: number;
}

/**
 * Repräsentiert eine Übungskategorie mit Unterstützung für hierarchische Strukturen (verschachtelte Bäume).
 */
export interface Category {
  /** Eindeutige ID der Kategorie. */
  id: number;
  /** Name der Kategorie. */
  name: string;
  /** ID der übergeordneten Kategorie oder `null`, falls es sich um eine Hauptkategorie (Root) handelt. */
  parent_id: number | null;
  /** Optionale Liste von Unterkategorien zur Darstellung des Kategoriebaums. */
  children?: Category[];
}