import { memo, useCallback, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useExercises } from "../../hooks/useExercises";
import { useSetTitle } from "../../hooks/useSetTitle";
import { Exercise } from "../../schemas/exercise.schema";
import stylesButton from "../../styles/Button.module.css";
import styles from "../../styles/Exercises.module.css";
import AddButton from "../Buttons/AddButton";
import EditButton from "../Buttons/EditButton";
import CategoryDropdown from "../CategoryDropDown";
import SearchInput from "../SearchInput";
import Modal from "./Modal";

// ==========================================
// Hauptkomponente: Exercises
// ==========================================

/**
 * Exercises
 * 
 * Die Hauptansicht für das Durchsuchen, Filtern und Verwalten von Trainingsübungen.
 * 
 * Steuert den globalen Datenfluss:
 * - Setzt den Seitentitel im Header auf "Übungen".
 * - Bündelt die Filter- und Suchlogik über den `useExercises`-Hook.
 * - Stellt globale Aktions-Buttons am unteren Bildschirmrand bereit (Wechsel zur Bearbeitungs- oder Erstellungsansicht).
 *
 * @returns {JSX.Element} Die gerenderte Übungs-Übersichtsseite.
 */
export default function Exercises() {
  const navigate = useNavigate();

  // Setzt den globalen Seitentitel im Header (via TitleContext)
  useSetTitle("Übungen");

  // Custom Hook abstrahiert die gesamte Logik für das Laden, Caching und Filtern der Übungsdaten
  const {
    isLoading,
    fetchAllExercises,
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    filteredExercises,
  } = useExercises();

  return (
    <div className={styles["page-wrapper"]}>
      {/* Filter-Bereich: Dropdown für Kategorie-Hierarchien und Live-Suche nach Begriffen */}
      <div className={styles["filter-container"]}>
        <CategoryDropdown
          selectedCategory={selectedCategory}
          onCategoryChange={(value) =>
            setSelectedCategory(value as number | "Alle")
          }
        />
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Übung suchen..."
        />
      </div>

      {/* Darstellung der gefilterten Übungsliste oder des Lade-Status */}
      <ExerciseList
        isLoading={isLoading}
        exerciseList={filteredExercises}
        onUpdateSuccess={fetchAllExercises} // Löst einen Refetch aus, sobald eine Übung im Modal verändert oder gelöscht wurde
      />

      {/* Globale Aktions-Buttons am unteren Ende der Ansicht */}
      <div className={styles["button-container"]}>
        <EditButton onEdit={() => navigate("edit-exercises")} />
        <AddButton onAdd={() => navigate("create-exercises")} />
      </div>
    </div>
  );
}

// ==========================================
// Komponente: ExerciseList
// ==========================================

/**
 * Die Eigenschaften (Props) für die ExerciseList-Komponente.
 */
type ExerciseProps = {
  /** Gibt an, ob die Daten noch vom Server geladen werden. */
  isLoading: boolean;
  /** Das Array der aktuell gefilterten Übungen, die gerendert werden sollen. */
  exerciseList: Exercise[];
  /** Callback-Funktion zum Neuladen der Übungsliste nach erfolgreichen Mutationen. */
  onUpdateSuccess: () => void;
};

/**
 * ExerciseList
 *
 * Verantwortlich für das Rendern des Übungs-Grids sowie die Modal-Steuerung.
 * 
 * Erkennt über den URL-Pfad (`isEditPage`), ob wir uns im Bearbeitungsmodus befinden,
 * und öffnet beim Klick auf eine editierbare (eigene) Übung das entsprechende Bearbeitungs-Modal.
 *
 * @param {ExerciseProps} props - Die Eigenschaften der Komponente.
 * @returns {JSX.Element} Entweder das Bearbeitungs-Modal oder das gefilterte Übungs-Grid.
 */
export function ExerciseList({
  isLoading,
  exerciseList = [],
  onUpdateSuccess,
}: ExerciseProps) {
  // --- State-Management für das Bearbeitungs-Modal ---
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(
    null,
  );
  const [isOpen, setIsOpen] = useState(false);

  // Prüft anhand der aktuellen URL, ob wir uns im Bearbeitungsmodus befinden
  const location = useLocation();
  const isEditPage = location.pathname.includes("edit-exercises");

  /**
   * Wird aufgerufen, wenn auf eine Übungskarte geklickt wird.
   * Das Modal wird **nur** geöffnet, wenn wir uns im Edit-Modus befinden 
   * **und** es sich um eine vom Benutzer selbst erstellte Übung handelt (`userId !== null`).
   *
   * @param {Exercise} exercise - Das angeklickte Übungsobjekt.
   */
  const handleCardClick = useCallback(
    (exercise: Exercise) => {
      if (exercise.userId !== null && isEditPage) {
        setSelectedExercise(exercise);
        setIsOpen(true);
      }
    },
    [isEditPage],
  );

  /**
   * Schließt das Bearbeitungs-Modal und bereinigt den ausgewählten Übungs-State.
   */
  const handleCloseModal = () => {
    setSelectedExercise(null);
    setIsOpen(false);
  };

  // Frühzeitiger Return mit Ladehinweis während des Datenabrufs
  if (isLoading) {
    return <p className={styles.loading}>Lade Übungen...</p>;
  }

  return (
    <>
      {/* Bedingtes Rendern: Entweder wird das Modal oder die Übungs-Grid-Liste angezeigt */}
      {isOpen ? (
        <div className={styles["modal-container"]}>
          {selectedExercise && (
            <Modal
              isOpen={isOpen}
              onClose={handleCloseModal}
              exerciseData={selectedExercise}
              onUpdateSuccess={onUpdateSuccess}
            />
          )}
        </div>
      ) : (
        <>
          <div className={styles["exercise-list"]}>
            {exerciseList.map((item) => (
              <ExerciseCard
                key={item.id}
                title={item.title}
                userId={item.userId}
                description={item.description}
                id={item.id}
                onClick={() => handleCardClick(item)}
                isEditPage={isEditPage}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
}

// ==========================================
// Komponente: ExerciseCard
// ==========================================

/**
 * Die Eigenschaften für die ExerciseCard-Komponente.
 * Erweitert das Basis-`Exercise`-Schema um spezifische UI-Handler und Modus-Flags.
 */
type ExerciseCardProps = Exercise & {
  /** Callback-Funktion, die beim Klick auf die Karte (bzw. den Edit-Button) ausgelöst wird. */
  onClick: () => void;
  /** Gibt an, ob der Editier-Modus aktiv ist (`true` blendet den Edit-Button ein). */
  isEditPage?: boolean;
};

/**
 * ExerciseCard
 *
 * Eine rein visuelle Präsentationskomponente für eine einzelne Übung im Grid.
 * 
 * Optimierungen:
 * - Mit `React.memo` gewrappt, damit die Karte nur dann neu gerendert wird, 
 *   wenn sich ihre spezifischen Props (z. B. Titel oder Beschreibungsänderungen) verändern.
 * - Blendet automatisch ein Badge ("Eigene Übung") ein, wenn die Übung dem Nutzer gehört.
 *
 * @param {ExerciseCardProps} props - Die Eigenschaften der Übungskarte.
 * @returns {JSX.Element} Die gerenderte Übungskarte.
 */
const ExerciseCard = memo(
  ({ title, description, userId, onClick, isEditPage }: ExerciseCardProps) => {
    return (
      <div className={styles.card}>
        {/* Visueller Indikator (Badge) für vom Benutzer selbst erstellte Übungen */}
        {typeof userId === "string" && (
          <span className={styles["own-exercise-badge"]}>Eigene Übung</span>
        )}

        <h3>{title}</h3>

        {/* Editier-Button wird ausschließlich im aktiven Edit-Modus eingeblendet */}
        {isEditPage && (
          <EditButton
            onEdit={onClick}
            className={`${stylesButton["button-rounded"]}`}
          />
        )}

        <div className={styles["exercise-card-description"]}>{description}</div>
      </div>
    );
  },
);