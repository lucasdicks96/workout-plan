import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import styles from "../../styles/Layout.module.css";
import { useState } from "react";
import { TitleContext } from "../../context/TitleContext";

// ==========================================
// Icons
// ==========================================

/**
 * MenuIcon
 * 
 * Ein klassisches Hamburger-Menü-Icon im skalierbaren SVG-Format.
 * Wird primär auf mobilen Endgeräten angezeigt, um die Off-Canvas-Sidebar zu öffnen oder zu schließen.
 *
 * @returns {JSX.Element} Das gerenderte SVG-Icon.
 */
const MenuIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="3" y1="12" x2="21" y2="12"></line>
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <line x1="3" y1="18" x2="21" y2="18"></line>
  </svg>
);

// ==========================================
// Layout Komponente
// ==========================================

/**
 * Layout
 * 
 * Die Haupt-Rahmenkomponente (App Shell) der gesamten Anwendung.
 * Sie umschließt alle Unterseiten und koordiniert das zentrale Layout-Zusammenspiel:
 * - Stellt den `TitleContext.Provider` zur Verfügung, über den Unterseiten dynamisch den Header-Titel verändern können.
 * - Steuert den Öffnungszustand und das responsive Verhalten der Navigation (`Sidebar`).
 * - Rendert den Hauptinhalt über die React-Router `<Outlet />`-Komponente.
 *
 * @returns {JSX.Element} Das gerenderte Anwendungs-Layout inklusive Header, Sidebar und Content-Bereich.
 */
function Layout() {
  // --- State-Management ---

  /** Speichert den dynamischen Titel der aktuell aufgerufenen Seite (wird von Unterseiten via Context aktualisiert). */
  const [title, setTitle] = useState<string>("");

  /** Steuert die Sichtbarkeit und das Einblenden der Sidebar auf mobilen Endgeräten. */
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  /** Schaltet den Öffnungszustand der Sidebar um (Toggle). */
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  
  /** Schließt die Sidebar explizit (z. B. nach Klick auf einen Menüpunkt). */
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    /* 
      TitleContext.Provider stellt die setTitle-Funktion für alle tiefer 
      liegenden Komponenten (wie z. B. die Übungs- oder Workout-Seiten) zur Verfügung. 
    */
    <TitleContext.Provider value={setTitle}>
      <div className={styles.layout}>
        {/* Die Seitenleiste erhält den Öffnungszustand und die Funktion zum Schließen */}
        <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

        {/* Hauptbereich, der sich rechts neben der Sidebar befindet (auf Desktop-Ansichten) */}
        <div className={styles.wrapper}>
          {/* 
            Header-Bereich 
            - Auf Desktop: Zeigt primär den dynamischen Seitentitel.
            - Auf Mobile: Zeigt zusätzlich den Hamburger-Menü-Button zum Öffnen der Sidebar.
          */}
          <header className={styles.header}>
            <button className={styles["menu-button"]} onClick={toggleSidebar}>
              <MenuIcon />
            </button>
            <h1 className={styles.title}>{title}</h1>
          </header>

          {/* 
            Content-Bereich
            Das <Outlet /> von react-router-dom fungiert als dynamischer Platzhalter. 
            Hier werden die jeweiligen Unterseiten (z. B. Dashboard, Übungen, Verlauf) 
            hineingerendert, je nachdem, auf welcher Route sich der User befindet.
          */}
          <main className={styles.content}>
            <Outlet />
          </main>
        </div>
      </div>
    </TitleContext.Provider>
  );
}

export default Layout;