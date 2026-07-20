import { useState, useRef, useEffect, useMemo } from "react";
import { useExercises } from "../hooks/useExercises";
import styles from "../styles/Exercises.module.css";

/**
 * Die Eigenschaften (Props) für die CategoryDropdown-Komponente.
 *
 * @property {number | "Alle"} selectedCategory - Die aktuell ausgewählte Kategorie-ID oder "Alle" für keine Filterung.
 * @property {(value: number | "Alle") => void} onCategoryChange - Callback-Funktion, die bei der Auswahl einer neuen Kategorie aufgerufen wird.
 */
export interface CategoryDropdownProps {
  selectedCategory: number | "Alle";
  onCategoryChange: (value: number | "Alle") => void;
}

/**
 * Eine benutzerdefinierte Dropdown-Komponente zur Auswahl von Übungskategorien.
 * Rendert den Kategoriebaum als hierarchische, geglättete Liste mit optischer Einrückung je nach Baumtiefe (`depth`).
 * Ersetzt natives HTML-`<select>`, um eine konsistente Styling-Kontrolle und ein garantiertes Öffnen nach unten zu ermöglichen.
 *
 * @param {CategoryDropdownProps} props - Die Eigenschaften (Props) der Komponente.
 * @returns {JSX.Element} Das gerenderte Dropdown-Menü oder ein Ladehinweis.
 */
export default function CategoryDropdown({
  selectedCategory,
  onCategoryChange,
}: CategoryDropdownProps) {
  const { categoryTree, flattenCategoryTree, isCategoryLoading } =
    useExercises();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  /**
   * Memoisiert die geglättete Pre-Order-Kategorieliste, damit der hierarchische Baum
   * nicht bei jedem Render-Zyklus (z. B. durch Elternkomponenten) neu berechnet werden muss.
   */
  const flatCategories = useMemo(
    () => flattenCategoryTree(categoryTree || []),
    [categoryTree, flattenCategoryTree],
  );

  /**
   * Effect-Hook für den Klick-Outside-Listener:
   * Schließt das aufklappbare Menü automatisch, wenn ein Mausklick außerhalb des `dropdownRef`-Wrappers registriert wird.
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (isCategoryLoading) {
    return <p>Kategorien werden geladen...</p>;
  }

  // Finde das passende Label für den geschlossen angezeigten Trigger-Button
  const selectedLabel =
    selectedCategory === "Alle"
      ? "Alle Kategorien"
      : flatCategories.find((c) => c.id === selectedCategory)?.name ||
        "Kategorie wählen...";

  /**
   * Verarbeitet die Auswahl einer Kategorie durch den Nutzer:
   * Reicht den Wert an die Elternkomponente weiter und schließt das Dropdown-Menü.
   *
   * @param {number | "Alle"} value - Die ID der ausgewählten Kategorie oder der String "Alle".
   */
  const handleSelect = (value: number | "Alle") => {
    onCategoryChange(value);
    setIsOpen(false);
  };

  return (
    <div className={styles["dropdown-wrapper"]} ref={dropdownRef}>
      {/* Der sichtbare Trigger-Button */}
      <div
        className={styles["dropdown-trigger"]}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{selectedLabel}</span>
        <span className={`${styles.arrow} ${isOpen ? styles.open : ""}`}>
          ▼
        </span>
      </div>

      {/* Das nach unten erzwungene, scrollbare Menü */}
      {isOpen && (
        <ul className={styles["dropdown-menu"]}>
          {/* Option für "Alle" */}
          <li
            className={`${styles["dropdown-item"]} ${selectedCategory === "Alle" ? styles.active : ""}`}
            onClick={() => handleSelect("Alle")}
          >
            Alle Kategorien
          </li>

          {/* Iteriert über die flache Baum-Liste mit dynamischer CSS-Einrückung */}
          {flatCategories.map((cat) => (
            <li
              key={cat.id}
              className={`${styles["dropdown-item"]} ${selectedCategory === cat.id ? styles.active : ""}`}
              style={{ paddingLeft: `${1.5 + cat.depth * 1.2}rem` }}
              onClick={() => handleSelect(cat.id)}
            >
              {cat.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}