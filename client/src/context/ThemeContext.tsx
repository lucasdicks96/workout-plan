import { createContext, useState, ReactNode, useEffect } from "react";

/** * Definiert die verfügbaren Farbschemata (Themes) der Anwendung. 
 */
type Theme = "dark" | "light";

/**
 * Typisierung für den Theme-Context.
 * Definiert die Werte und Funktionen, die über den Custom Hook `useTheme` konsumiert werden können.
 */
export interface ThemeContextType {
  /** Das aktuell aktive Theme ("dark" oder "light") */
  theme: Theme;
  /** Funktion zum Umschalten zwischen dem Dark- und Light-Mode */
  toggleTheme: () => void;
}

/**
 * Der globale Context für das Theme-Management.
 * Initialer Wert ist null, wird aber durch den Provider überschrieben.
 */
export const ThemeContext = createContext<ThemeContextType | null>(null);

/**
 * Provider-Komponente für das Theme-System.
 * Verwaltet den aktuellen Theme-State und stellt sicher, dass das gesamte 
 * HTML-Dokument (über den Body-Tag) die passenden CSS-Klassen erhält.
 *
 * @param children - Die untergeordneten Komponenten, die Zugriff auf das Theme erhalten sollen.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  // Lokaler State für das Theme. 
  // TODO (Optional): Initialen Wert aus dem localStorage auslesen, falls User-Präferenz gespeichert wurde.
  const [theme, setTheme] = useState<Theme>("dark");

  /**
   * Wechselt den aktuellen Theme-Status.
   * Wenn "dark" aktiv ist, wird auf "light" gewechselt und umgekehrt.
   */
  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  /**
   * Synchronisiert das React-State-Theme mit dem echten HTML-DOM.
   * Setzt die aktuelle Theme-Klasse global auf das <body>-Element.
   * WICHTIG: Das ermöglicht es, dass global injizierte Komponenten (wie das Popup)
   * vollen Zugriff auf die CSS-Variablen (--c-primary, --c-bg etc.) haben.
   */
  useEffect(() => {
    // Alte Klassen entfernen, um Konflikte zu vermeiden
    document.body.classList.remove("light", "dark");
    // Neue, aktuelle Klasse setzen
    document.body.classList.add(theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}