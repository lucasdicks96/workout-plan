import { memo, useCallback, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useExercises } from "../../hooks/useExercises";
import { useSetTitle } from "../../hooks/useSetTitle";
import stylesButton from "../../styles/Button.module.css";
import styles from "../../styles/Exercises.module.css";
import { Exercise } from "../../schemas/exercise.schema";
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
 * Die Hauptansicht für das Durchsuchen und Verwalten von Trainingsübungen.
 * Sie vereint die Such- und Filterfunktionen mit der Darstellung der Übungsliste
 * und den globalen Aktionen (Übung hinzufügen/bearbeiten).
 */
export default function Exercises() {
  const navigate = useNavigate();

  // Setzt den globalen Seitentitel im Header (via TitleContext)
  useSetTitle("Übungen");

  // Custom Hook abstrahiert die gesamte Logik für das Laden und Filtern der Daten
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
      {/* Filter-Bereich: Dropdown für Kategorien und Texteingabe für die Suche */}
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

      {/* Darstellung der gefilterten Liste oder Lade-Status */}
      <ExerciseList
        isLoading={isLoading}
        exerciseList={filteredExercises}
        onUpdateSuccess={fetchAllExercises} // Löst einen Refetch aus, wenn eine Übung im Modal geändert wurde
      />

      {/* Globale Aktions-Buttons am unteren Ende */}
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

type ExerciseProps = {
  isLoading: boolean;
  exerciseList: Exercise[];
  onUpdateSuccess: () => void;
};

/**
 * ExerciseList
 * Verantwortlich für das Rendern des Übungs-Grids.
 * Beinhaltet zudem die Logik, um beim Klick auf eine editierbare Übung
 * das entsprechende Bearbeitungs-Modal zu öffnen.
 */
export function ExerciseList({
  isLoading,
  exerciseList = [],
  onUpdateSuccess,
}: ExerciseProps) {
  // --- State-Management für das Modal ---
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(
    null,
  );
  const [isOpen, setIsOpen] = useState(false);

  // Prüft anhand der aktuellen URL, ob wir uns im Bearbeitungsmodus befinden
  const location = useLocation();
  const isEditPage = location.pathname.includes("edit-exercises");

  /**
   * handleCardClick
   * Wird aufgerufen, wenn auf eine Übungskarte geklickt wird.
   * Das Modal wird NUR geöffnet, wenn wir auf der Editier-Seite sind
   * UND die Übung vom Nutzer selbst erstellt wurde (userId !== null).
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

  const handleCloseModal = () => {
    setSelectedExercise(null);
    setIsOpen(false);
  };

  // Frühzeitiger Return während die Daten im Hintergrund geladen werden
  if (isLoading) {
    return <p className={styles.loading}>Lade Übungen...</p>;
  }

  return (
    <>
      {/* Bedingtes Rendern: Entweder zeigen wir das Modal ODER die Liste */}
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

type ExerciseCardProps = Exercise & {
  onClick: () => void;
  isEditPage?: boolean;
};

/**
 * ExerciseCard
 * Eine rein visuelle (Präsentations-) Komponente für eine einzelne Übung.
 * Mit `React.memo` optimiert, sodass sie nur neu gerendert wird,
 * wenn sich ihre expliziten Props ändern.
 */
const ExerciseCard = memo(
  ({ title, description, userId, onClick, isEditPage }: ExerciseCardProps) => {
    return (
      <div className={styles.card}>
        {/* Visueller Indikator (Badge) für selbst erstellte Übungen */}
        {typeof userId === "string" && (
          <span className={styles["own-exercise-badge"]}>Eigene Übung</span>
        )}

        <h3>{title}</h3>

        {/* Editier-Button wird nur eingeblendet, wenn wir uns im Edit-Modus befinden */}
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
