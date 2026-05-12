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
 * Ein klassisches Hamburger-Menü-Icon im SVG-Format.
 * Wird auf mobilen Geräten angezeigt, um die Off-Canvas-Sidebar zu öffnen.
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
 * Die Haupt-Rahmenkomponente (Shell) der gesamten Anwendung.
 * Sie umschließt alle Unterseiten und koordiniert das Zusammenspiel zwischen
 * der Navigation (Sidebar), dem globalen Seitentitel und dem eigentlichen Inhalt.
 */
function Layout() {
  // --- State-Management ---

  // Speichert den dynamischen Titel der aktuell aufgerufenen Seite.
  // Wird über den TitleContext von den jeweiligen Unterseiten aktualisiert.
  const [title, setTitle] = useState<string>("");

  // Steuert die Sichtbarkeit der Sidebar auf mobilen Endgeräten.
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  // Hilfsfunktionen zum Umschalten und expliziten Schließen der Sidebar
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    /* 
      TitleContext.Provider stellt die setTitle-Funktion für alle tiefer 
      liegenden Komponenten (wie z.B. die Exercises-Seite) zur Verfügung. 
      Dadurch können Unterseiten den Titel im Header verändern.
    */
    <TitleContext.Provider value={setTitle}>
      <div className={styles.layout}>
        
        {/* Die Seitenleiste erhält den Öffnungszustand und die Funktion zum Schließen */}
        <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
        
        {/* Hauptbereich, der sich rechts neben der Sidebar befindet (auf Desktop) */}
        <div className={styles.wrapper}>
          
          {/* 
            Header-Bereich 
            Auf Desktop: Zeigt nur den Seitentitel.
            Auf Mobile: Zeigt zusätzlich den Hamburger-Button zum Öffnen der Sidebar.
          */}
          <header className={styles.header}>
            <button className={styles["menu-button"]} onClick={toggleSidebar}>
              <MenuIcon />
            </button>
            <h1 className={styles.title}>{title}</h1>
          </header>

          {/* 
            Content-Bereich
            Das <Outlet /> von react-router-dom fungiert als Platzhalter. 
            Hier werden die jeweiligen Unterseiten (z.B. Dashboard, Übungen) 
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