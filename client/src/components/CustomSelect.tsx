import { useState, useRef, useEffect } from "react";
import styles from "../styles/AnalyseWorkouts.module.css";

/**
 * Repräsentiert eine einzelne Auswahloption im CustomSelect-Dropdown.
 *
 * @template T - Der Datentyp des Optionswertes (z. B. string oder number).
 * @property {string} label - Der für den Nutzer sichtbare Text im Dropdown-Menü.
 * @property {T} value - Der tatsächliche, zugrundeliegende Wert der Option.
 */
export interface SelectOption<T> {
  label: string;
  value: T;
}

/**
 * Die Eigenschaften (Props) für die CustomSelect-Komponente.
 *
 * @template T - Der Datentyp des ausgewählten Wertes.
 * @property {T} value - Der aktuell ausgewählte Wert (kontrollierter Zustand).
 * @property {(value: T) => void} onChange - Callback-Funktion, die beim Auswählen einer neuen Option aufgerufen wird.
 * @property {SelectOption<T>[]} options - Array aller verfügbaren Optionen im Dropdown.
 * @property {string} [placeholder="Bitte wählen..."] - Optionaler Platzhaltertext, der angezeigt wird, falls kein passender Label für den aktuellen Wert gefunden wird.
 */
interface CustomSelectProps<T> {
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  placeholder?: string;
}

/**
 * Eine generische, benutzerdefinierte Dropdown-Komponente als Alternative zum nativen `<select>`-Element.
 * Bietet vollständige CSS-Kontrolle über Styling, Öffnungsrichtung und Scroll-Verhalten.
 * Schließt sich automatisch, sobald ein Klick außerhalb des Komponenten-Wrappers registriert wird.
 *
 * @template T - Der Datentyp des Auswahlwertes. Muss ein string oder number sein.
 * @param {CustomSelectProps<T>} props - Die Eigenschaften (Props) der Komponente.
 * @returns {JSX.Element} Das gerenderte Custom-Dropdown-Element.
 */
export default function CustomSelect<T extends string | number>({
  value,
  onChange,
  options,
  placeholder = "Bitte wählen...",
}: CustomSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  /**
   * Effect-Hook für den Klick-Outside-Listener:
   * Schließt das Dropdown-Menü automatisch bei einem Mausklick außerhalb des `dropdownRef`-Wrappers.
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

  // Finde das passende Label zur aktuellen Auswahl für die Anzeige im Button
  const selectedOption = options.find((opt) => opt.value === value);
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  /**
   * Verarbeitet die Auswahl einer Option durch den Nutzer:
   * Reicht den neuen Wert an die Elternkomponente weiter und schließt das Dropdown.
   *
   * @param {T} val - Der neu ausgewählte Wert.
   */
  const handleSelect = (val: T) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div className={styles["custom-select-wrapper"]} ref={dropdownRef}>
      <div
        className={styles["custom-select-trigger"]}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={styles["trigger-text"]}>{displayLabel}</span>
        <span className={`${styles.arrow} ${isOpen ? styles.open : ""}`}>
          ▼
        </span>
      </div>

      {isOpen && (
        <ul className={styles["custom-select-menu"]}>
          {options.map((opt) => (
            <li
              key={String(opt.value)}
              className={`${styles["custom-select-item"]} ${opt.value === value ? styles.active : ""}`}
              onClick={() => handleSelect(opt.value)}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}