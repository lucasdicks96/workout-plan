import { FormEvent, useEffect, useState, useMemo } from "react";
import { useExercises } from "../../hooks/useExercises";
import { useNotification } from "../../hooks/useNotification";
import { apiService } from "../../services/apiService";
import stylesExercises from "../../styles/Exercises.module.css";
import styles from "../../styles/Modal.module.css";
import { Category, Exercise } from "../../schemas/exercise.schema";
import { getApiErrorMessage } from "../../util/errorHelper";
import ConfirmButton from "../Buttons/ConfirmButton";
import DeleteButton from "../Buttons/DeleteButton";
import ReturnButton from "../Buttons/ReturnButton";

/**
 * Die Eigenschaften (Props) für die Modal-Komponente.
 */
export type ModalProps = {
  /** Steuert die Sichtbarkeit des Modals (`true` = offen, `false` = geschlossen). */
  isOpen: boolean;
  /** Callback-Funktion, die beim Schließen des Modals ausgeführt wird. */
  onClose: () => void;
  /** Das zu bearbeitende Übungs-Objekt (beinhaltet Name, Beschreibung und zugeordnete Kategorien). */
  exerciseData: Exercise;
  /** Callback-Funktion, die nach einer erfolgreichen Aktualisierung oder Löschung ausgelöst wird, um Daten neu zu laden. */
  onUpdateSuccess: () => void;
};

/**
 * Repräsentiert den lokalen Formularzustand im Modal.
 */
type FormState = {
  /** Der Name der Übung. */
  title: string;
  /** Die eindeutige Datenbank-ID der Übung. */
  id: number;
  /** Die detaillierte Beschreibung der Übung. */
  description: string;
};

/**
 * Modal-Komponente zur Bearbeitung und zum Löschen einer bestehenden Übung.
 * 
 * Bietet folgende Kernfunktionen:
 * - Formular-State für Titel und Beschreibung mit Vorbefüllung aus `exerciseData`.
 * - Interaktive Auswahl von hierarchischen Kategorien über den `useExercises`-Hook.
 * - API-Anbindung für das Speichern von Änderungen (`putExercise`) sowie das Löschen der Übung (`deleteExercise`).
 * - Integrierte Sicherheitsabfrage über den `DeleteButton` vor dem endgültigen Löschvorgang.
 *
 * @param {ModalProps} props - Die Eigenschaften der Komponente.
 * @returns {JSX.Element | null} Das gerenderte Overlay-Modal oder `null`, wenn es geschlossen ist.
 */
export default function Modal({
  isOpen,
  exerciseData,
  onClose,
  onUpdateSuccess,
}: ModalProps) {
  /** Lokaler Formular-State für Übungstitel, ID und Beschreibung. */
  const [formState, setFormState] = useState<FormState>({
    title: "",
    description: "",
    id: 0,
  });

  const { showNotification } = useNotification();
  /** Steuert, ob der erweiterte Löschbestätigungs-Modus aktiv ist. */
  const [deleteIsOpen, setDeleteIsOpen] = useState(false);

  // Custom Hook zur Verwaltung des hierarchischen Kategoriebaums und der Checkbox-Auswahl
  const {
    categoryTree,
    selectedCategories,
    setSelectedCategories,
    handleCategorySelect,
    flattenCategoryTree,
    isCategoryLoading,
  } = useExercises();

  /** 
   * Glättet den Kategoriebaum performant mittels Pre-Order DFS 
   * und memoisierte das Ergebnis zur Vermeidung unnötiger Neuberechnungen.
   */
  const flatCategories = useMemo(
    () => flattenCategoryTree(categoryTree || []),
    [categoryTree, flattenCategoryTree],
  );

  /**
   * Initialisierungs-Effect: Befüllt den Formular-State und die selektierten Kategorien 
   * automatisch mit den Daten der zu bearbeitenden Übung, sobald das Modal geöffnet wird.
   */
  useEffect(() => {
    if (isOpen && exerciseData) {
      setFormState({
        title: exerciseData.title || "",
        id: Number(exerciseData.id) || 0,
        description: exerciseData.description || "",
      });

      // Zod/TypeScript-Schutz: Garantiert, dass nur valide Zahlen-IDs im State landen
      const catIds =
        exerciseData.category
          ?.map((c: Category) => Number(c.id))
          .filter(Number.isFinite) ?? [];
      setSelectedCategories(catIds);
    }
  }, [isOpen, exerciseData, setSelectedCategories]);

  // Wenn das Modal nicht geöffnet ist, wird nichts im DOM gerendert
  if (!isOpen) {
    return null;
  }

  /**
   * Löscht die aktuelle Übung unwiderruflich aus der Datenbank.
   * Zeigt bei Erfolg eine Benachrichtigung an und triggert den Erfolg-Callback.
   *
   * @async
   * @param {number} id - Die ID der zu löschenden Übung.
   * @returns {Promise<void>}
   */
  const onDelete = async (id: number) => {
    const deleteId = id ?? formState.id;
    console.log(`Deleting exercise: ${deleteId}`);
    try {
      await apiService.deleteExercise(deleteId);

      showNotification("Übung erfolgreich gelöscht", "success");
      onUpdateSuccess();
      onClose();
    } catch (error: unknown) {
      showNotification(
        getApiErrorMessage(error, "Die Übung konnte nicht gelöscht werden."),
        "error",
        3000,
      );
    }
  };

  /**
   * Generischer Change-Handler für die Text-Input-Felder (Titel und Beschreibung).
   * 
   * @param {React.ChangeEvent<HTMLInputElement>} e - Das Änderungsevent des Inputs.
   */
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  /**
   * Verarbeitet das Abspeichern der Änderungen:
   * Sendet die aktualisierten Daten (Titel, Beschreibung und gewählte Kategorien) an das Backend.
   *
   * @async
   * @param {FormEvent<HTMLFormElement>} e - Das Formular-Submit-Event.
   * @returns {Promise<void>}
   */
  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await apiService.putExercise({
        id: formState.id,
        title: formState.title,
        description: formState.description,
        categories: selectedCategories,
      });

      showNotification("Übung erfolgreich aktualisiert", "success");
      onUpdateSuccess();
      onClose();
    } catch (error: unknown) {
      showNotification(
        getApiErrorMessage(error, "Die Übung konnte nicht gespeichert werden"),
        "error",
        3000,
      );
    }
  };

  return (
    <div
      className={stylesExercises["exercise-list"]}
      style={{ position: "relative" }}
    >
      {/* Abgedunkelter Hintergrund (Backdrop) - Klick darauf schließt das Modal */}
      <div className={styles.backdrop} onClick={onClose} />

      <form className="form" onSubmit={onSubmit}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div>
            {/* Eingabefeld für den Übungsnamen */}
            <input
              value={formState.title}
              className={stylesExercises["search-input"]}
              type="text"
              name="title"
              onChange={onChange}
              placeholder="Übungsname..."
              required
            />
            <div style={{ marginTop: "0.5rem" }}>
              {/* Eingabefeld für die Übungsbeschreibung */}
              <input
                value={formState.description}
                className={stylesExercises["search-input"]}
                type="text"
                name="description"
                onChange={onChange}
                placeholder="Übungsbeschreibung..."
                required
              />
            </div>
          </div>

          {/* Hierarchischer Checkbox-Bereich zur Auswahl und Bearbeitung der Kategorien */}
          <fieldset
            style={{
              display: "block",
              maxHeight: "200px",
              overflowY: "auto",
              border: "1px solid var(--c-border, #ccc)",
              borderRadius: "5px",
              padding: "0.75rem",
              marginTop: "1rem",
            }}
            className="input"
          >
            <legend style={{ padding: "0 5px", fontWeight: 600 }}>
              Kategorien bearbeiten:
            </legend>

            {isCategoryLoading ? (
              <p
                style={{
                  padding: "0.5rem 0",
                  color: "var(--c-text-secondary)",
                }}
              >
                Kategorien werden geladen...
              </p>
            ) : flatCategories.length > 0 ? (
              flatCategories.map((cat) => {
                const isChecked = selectedCategories.includes(cat.id);
                return (
                  <label
                    key={cat.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      paddingTop: "0.25rem",
                      paddingBottom: "0.25rem",
                      paddingLeft: `${cat.depth * 1.2}rem`, // Visuelle Einrückung nach Baumtiefe
                      cursor: "pointer",
                      userSelect: "none",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleCategorySelect(cat.id)}
                      style={{ cursor: "pointer", margin: 0 }}
                    />
                    <span>{cat.name}</span>
                  </label>
                );
              })
            ) : (
              <p
                style={{
                  padding: "0.5rem 0",
                  color: "var(--c-text-secondary)",
                }}
              >
                Keine Kategorien verfügbar.
              </p>
            )}
          </fieldset>

          {/* Aktionsleiste am unteren Modal-Rand (Zurück, Löschen, Speichern) */}
          <div className="button-container" style={{ marginTop: "1rem" }}>
            {deleteIsOpen && (
              <DeleteButton
                isOpen={deleteIsOpen}
                onDelete={() => {
                  onDelete(formState.id);
                  setDeleteIsOpen(false);
                }}
                onToggleVisibility={setDeleteIsOpen}
              />
            )}
            {!deleteIsOpen && (
              <>
                <ReturnButton onBack={onClose} />
                <DeleteButton
                  isOpen={deleteIsOpen}
                  onDelete={() => {
                    onDelete(formState.id);
                    setDeleteIsOpen(false);
                  }}
                  onToggleVisibility={setDeleteIsOpen}
                />
                <ConfirmButton btnType="submit" />
              </>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}