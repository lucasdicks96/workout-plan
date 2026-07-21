import { ReactNode, useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import useTheme from "../../hooks/useTheme";
import styles from "../../styles/Sidebar.module.css";

// ==========================================
// SVG Icons
// Statische SVG-Grafiken für Navigation und UI
// ==========================================

const HomeIcon: React.FC = () => (
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
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
    <polyline points="9 22 9 12 15 12 15 22"></polyline>
  </svg>
);
const DumbbellIcon: React.FC = () => (
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
    <path d="m6.5 6.5 11 11"></path>
    <path d="m2 6 4-4"></path>
    <path d="m3 10 7-7"></path>
    <path d="m14 21 7-7"></path>
    <path d="m18 22 4-4"></path>
  </svg>
);
const ActivityPulseIcon: React.FC = () => (
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
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
  </svg>
);
const ClipboardIcon: React.FC = () => (
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
    <rect width="8" height="4" x="8" y="2" rx="1" ry="1"></rect>
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
  </svg>
);
const HistoryIcon: React.FC = () => (
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
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
    <path d="M3 3v5h5"></path>
  </svg>
);
const LogoutIcon: React.FC = () => (
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
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
    <polyline points="16 17 21 12 16 7"></polyline>
    <line x1="21" x2="9" y1="12" y2="12"></line>
  </svg>
);
const SunIcon: React.FC = () => (
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
    <circle cx="12" cy="12" r="5"></circle>
    <line x1="12" y1="1" x2="12" y2="3"></line>
    <line x1="12" y1="21" x2="12" y2="23"></line>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
    <line x1="1" y1="12" x2="3" y2="12"></line>
    <line x1="21" y1="12" x2="23" y2="12"></line>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
  </svg>
);
const MoonIcon: React.FC = () => (
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
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
  </svg>
);
const ChartIcon: React.FC = () => (
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
    <line x1="18" y1="20" x2="18" y2="10"></line>
    <line x1="12" y1="20" x2="12" y2="4"></line>
    <line x1="6" y1="20" x2="6" y2="14"></line>
  </svg>
);

// ==========================================
// Komponenten
// ==========================================

/**
 * Definition der Properties für ein einzelnes Navigationselement.
 */
type NavItemProps = {
  icon: ReactNode;
  label: string;
  path: string;
  onClick?: () => void;
};

/**
 * Wrappt den React Router NavLink, steuert die Hervorhebung der aktiven Seite
 * und führt optionale Klick-Events aus.
 *
 * @param icon - Das SVG-Icon, das links neben dem Label angezeigt wird.
 * @param label - Der Text des Menüpunkts.
 * @param path - Die Ziel-URL für das Routing.
 * @param onClick - Optionaler Callback (z.B. um das Menü auf Mobile zu schließen).
 */
function NavItem({ icon, label, path, onClick }: NavItemProps) {
  return (
    <NavLink
      to={path}
      onClick={onClick}
      className={({ isActive }) =>
        `${styles["sidebar-nav-item"]} ${isActive ? styles.active : ""}`
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}

/**
 * Definition der Properties für die Sidebar-Komponente.
 */
type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

/**
 * Die Hauptnavigationsleiste der App. Sie ist responsiv aufgebaut:
 * Sticky auf dem Desktop, Off-Canvas-Menü auf Mobile.
 * Beinhaltet Logik für "Click-Outside" und "Swipe-to-Close" auf Touch-Geräten.
 *
 * @param isOpen - Gibt an, ob die Sidebar im mobilen Viewport sichtbar ist.
 * @param onClose - Funktion zum Schließen der Sidebar.
 */
function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Referenz für das DOM-Element der Sidebar (benötigt für Click-Outside Erkennung)
  const sidebarRef = useRef<HTMLElement>(null);

  // Referenzen für die Swipe-Berechnung (verhindert Re-Renders während der Wischbewegung)
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  /**
   * Click-Outside-Erkennung:
   * Schließt die Sidebar, wenn der Benutzer auf mobilen Geräten neben das Menü klickt.
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      // Prüfen, ob Sidebar offen ist UND der Klick außerhalb stattfand
      if (
        isOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      // setTimeout verhindert, dass der anfängliche Klick auf den Menü-Button
      // sofort als "Klick außerhalb" gewertet wird.
      setTimeout(() => {
        document.addEventListener("touchstart", handleClickOutside);
      }, 0);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen, onClose]);

  /**
   * Speichert die Start-Koordinate bei einer Touch-Geste.
   */
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  /**
   * Aktualisiert die End-Koordinate während der Finger-Bewegung.
   */
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  /**
   * Wertet den abgeschlossenen Swipe aus und schließt die Sidebar,
   * falls weit genug nach links gewischt wurde.
   */
  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;

    const swipeDistance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50; // Schwellenwert in Pixeln

    if (swipeDistance > minSwipeDistance) {
      onClose();
    }

    // Werte für den nächsten Swipe zurücksetzen
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  return (
    <aside
      className={`${styles.sidebar} ${isOpen ? styles.open : ""}`}
      ref={sidebarRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <header className={styles["sidebar-header"]}>
        <ActivityPulseIcon /> Fitness Tracker
      </header>

      <nav className={styles["sidebar-nav"]}>
        <NavItem
          icon={<HomeIcon />}
          label="Dashboard"
          path="/dashboard"
          onClick={onClose}
        />
        <NavItem
          icon={<DumbbellIcon />}
          label="Übungen"
          path="/exercises"
          onClick={onClose}
        />
        <NavItem
          icon={<ClipboardIcon />}
          label="Pläne"
          path="/workouts"
          onClick={onClose}
        />
        <NavItem
          icon={<HistoryIcon />}
          label="Historie"
          path="/history"
          onClick={onClose}
        />
        <NavItem
          icon={<ChartIcon />}
          label="Leistung"
          path="/analyse"
          onClick={onClose}
        />
      </nav>

      <footer className={styles["sidebar-footer"]}>
        <div className={styles["theme-toggle"]}>
          <button onClick={toggleTheme} className={styles["sidebar-nav-item"]}>
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
            <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
          </button>
          <button
            onClick={() => {
              logout();
              onClose();
            }}
            className={styles["sidebar-nav-item"]}
          >
            <LogoutIcon />
            <span>Logout</span>
          </button>
        </div>
      </footer>
    </aside>
  );
}

export default Sidebar;
