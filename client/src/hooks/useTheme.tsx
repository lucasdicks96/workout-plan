import { useContext } from "react";
import { ThemeContext, ThemeContextType } from "../context/ThemeContext.tsx";

/**
 * Custom Hook für den direkten Zugriff auf den globalen Theme-Status.
 * Erlaubt das Auslesen des aktuellen Themes sowie den Wechsel zwischen Dark- und Light-Mode.
 *
 * @throws {Error} Löst einen Fehler aus, wenn der Hook in einer Komponente 
 * verwendet wird, die nicht vom `ThemeProvider` umschlossen ist.
 * @returns {ThemeContextType} Ein Objekt mit dem aktuellen `theme` und der `toggleTheme`-Funktion.
 */
const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  
  // Sicherheitscheck: Stellt sicher, dass der Hook nicht ins Leere greift
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  
  return context;
};

export default useTheme;