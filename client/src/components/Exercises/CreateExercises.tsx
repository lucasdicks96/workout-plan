import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useExercises } from "../../hooks/useExercises";
import { useNotification } from "../../hooks/useNotification";
import { useSetTitle } from "../../hooks/useSetTitle";
import { apiService } from "../../services/apiService";
import "../../styles/global.css";
import stylesExercises from "../../styles/Exercises.module.css";
import ConfirmButton from "../Buttons/ConfirmButton";
import ReturnButton from "../Buttons/ReturnButton";
import { getApiErrorMessage } from "../../util/errorHelper";

/**
 * Repräsentiert den lokalen Formularzustand für die Erstellung einer neuen Übung.
 */
type FormState = {
  /** Der Name der neu zu erstellenden Übung. */
  title: string;
  /** Die Beschreibung der Übung. */
  description: string;
};

/**
 * CreateExercise
 *
 * Eine Formular-Komponente zum Erstellen einer neuen, benutzerdefinierten Trainingsübung.
 * 
 * Bietet folgende Kernfunktionen:
 * - Eingabefelder für Titel und Beschreibung (mit Längenbegrenzung auf 50 Zeichen).
 * - Interaktive Auswahl von hierarchischen Kategorien über den `useExercises`-Hook.
 * - Performantes Glätten des Kategoriebaums für eine eingerückte Checkbox-Ansicht.
 * - API-Anbindung zum Abspeichern der Übung (`postExercise`) inklusive Fehler- und Benachrichtigungs-Handling.
 * - Setzt den Seitentitel im Header automatisch auf "Übung erstellen".
 *
 * @returns {JSX.Element} Das gerenderte Formular zur Übungserstellung.
 */
export default function CreateExercise() {
  const navigate = useNavigate();
  
  // Custom Hook zur Verwaltung des Kategoriebaums und der Kategorie-Auswahl
  const {
    categoryTree,
    selectedCategories,
    handleCategorySelect,
    flattenCategoryTree,
    isCategoryLoading,
  } = useExercises();

  const { showNotification } = useNotification();

  /** Lokaler Formular-State für Übungstitel und Beschreibung. */
  const [formState, setFormState] = useState<FormState>({
    title: "",
    description: "",
  });

  // Setzt den globalen Seitentitel im Header (via TitleContext)
  useSetTitle("Übung erstellen");

  /**
   * Glättet den hierarchischen Kategoriebaum performant mittels Pre-Order DFS
   * und memoisierte das Ergebnis zur Vermeidung unnötiger Neuberechnungen.
   */
  const flatCategories = useMemo(
    () => flattenCategoryTree(categoryTree || []),
    [categoryTree, flattenCategoryTree],
  );

  /**
   * Verarbeitet das Absenden des Formulars:
   * Sendet die Formulardaten (Titel, Beschreibung und ausgewählte Kategorien) an das Backend.
   * Leitet bei Erfolg direkt zur Übungsübersicht (`/exercises`) weiter.
   *
   * @async
   * @param {React.FormEvent<HTMLFormElement>} e - Das Formular-Submit-Event.
   * @returns {Promise<void>}
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await apiService.postExercise({
        title: formState.title,
        description: formState.description,
        categories: selectedCategories,
      });
      navigate("/exercises", { replace: true });
    } catch (error) {
      console.error("Error creating exercise:", error);
      showNotification(
        getApiErrorMessage(error, "Fehler beim Erstellen der Übung"),
        "error",
        3000,
      );
    }
  };

  return (
    <div className="content">
      <form onSubmit={handleSubmit} method="POST" className="form">
        <div>
          {/* Eingabefeld für den Übungsnamen */}
          <input
            className={stylesExercises["search-input"]}
            type="text"
            name="title"
            value={formState.title}
            onChange={(e) =>
              setFormState({ ...formState, title: e.target.value })
            }
            placeholder="Übungsname"
            maxLength={50}
            required
          />
        </div>
        <div>
          {/* Eingabefeld für die Übungsbeschreibung */}
          <input
            className={stylesExercises["search-input"]}
            type="text"
            name="description"
            value={formState.description}
            onChange={(e) =>
              setFormState({ ...formState, description: e.target.value })
            }
            placeholder="Übungsbeschreibung"
            maxLength={50}
            required
          />
        </div>

        {/* Hierarchische Checkbox-Liste zur Zuordnung von Kategorien */}
        <fieldset
          style={{
            display: "block",
            maxHeight: "250px",
            overflowY: "auto",
            borderRadius: "5px",
            padding: "10px",
          }}
          className="input"
        >
          <legend style={{ padding: "0 5px", fontWeight: 600 }}>
            Kategorien wählen:
          </legend>

          {isCategoryLoading ? (
            <p
              style={{ padding: "0.5rem 0", color: "var(--c-text-secondary)" }}
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
                    // Echte CSS-Einrückung pro Hierarchie-Ebene entsprechend der Baumtiefe
                    paddingLeft: `${cat.depth * 1.2}rem`,
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
              style={{ padding: "0.5rem 0", color: "var(--c-text-secondary)" }}
            >
              Keine Kategorien verfügbar.
            </p>
          )}
        </fieldset>

        {/* Aktionsleiste am unteren Formular-Rand */}
        <div className="button-container">
          <ReturnButton onBack={() => navigate("/exercises")} />
          <ConfirmButton btnType="submit" />
        </div>
      </form>
    </div>
  );
}