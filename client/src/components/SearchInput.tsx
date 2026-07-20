import styles from "../styles/Exercises.module.css"; // Pfad ggf. anpassen

/**
 * Die Eigenschaften (Props) für die SearchInput-Komponente.
 *
 * @property {string} value - Der aktuelle Suchtext (kontrollierter Zustand aus der Elternkomponente).
 * @property {(value: string) => void} onChange - Callback-Funktion, die bei jedem Tastenanschlag den aktualisierten Text nach außen reicht.
 * @property {string} [placeholder="Übung suchen..."] - Optionaler Platzhaltertext, der im leeren Zustand im Eingabefeld angezeigt wird.
 */
export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/**
 * Eine wiederverwendbare, kontrollierte Suchfeld-Komponente für Text-Filterungen.
 * 
 * Bietet durch die Integration mit CSS-Modulen ein konsistentes Styling, das vertikal und horizontal
 * nahtlos neben anderen Filter-Elementen (wie z. B. dem `CategoryDropdown`) platziert werden kann.
 * Deaktiviert bewusst die native Browser-Autovervollständigung (`autoComplete="off"`), um visuelle
 * Überlappungen mit aufklappbaren Menüs in der Benutzeroberfläche zu verhindern.
 *
 * @param {SearchInputProps} props - Die Eigenschaften der Komponente.
 * @returns {JSX.Element} Das gerenderte Suchfeld im CSS-Wrapper.
 */
export default function SearchInput({
  value,
  onChange,
  placeholder,
}: SearchInputProps) {
  return (
    <div className={styles["search-wrapper"]}>
      <input
        className={styles["search-input"]}
        type="text"
        id="searchInput"
        value={value}
        placeholder={placeholder || "Übung suchen..."}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off" // Verhindert, dass die Browser-Historie aufklappende Menüs überlagert
      />
    </div>
  );
}