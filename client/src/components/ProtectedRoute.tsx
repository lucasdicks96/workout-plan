import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

/**
 * Ein Routing-Guard (HOC / Wrapper-Komponente) zum Schutz authentifizierter Seitenbereiche.
 *
 * Diese Komponente wird im Router-Setup (z. B. in App.tsx) als Eltern-Layout für geschützte
 * Routen verwendet. Sie regelt den Seitenzugriff anhand von drei Lebenszyklus-Phasen:
 * 1. **Ladephase (`loading`)**: Zeigt einen zentrierten Platzhalter an, solange der Auth-Hook noch beim Backend prüft, ob eine gültige Session existiert.
 * 2. **Nicht authentifiziert (`!user`)**: Leitet den Benutzer sofort zur Login-Seite um (`/login`). Dabei wird der aktuelle URL-Pfad im `state` (`from`) zwischengespeichert, damit nach erfolgreichem Login eine automatische Rückleitung zur ursprünglich gewünschten Seite erfolgen kann.
 * 3. **Authentifiziert (`user` vorhanden)**: Rendert die jeweils angeforderte Unter-Route über die React-Router `<Outlet />`-Komponente.
 *
 * @returns {JSX.Element} Den Ladebildschirm, einen Redirect zur Login-Seite oder die geschützten Kind-Routen (`<Outlet />`).
 */
const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  
  // Nutzt React Routers eigenen Location-Hook statt des nativen window.location
  const location = useLocation();

  // Phase 1: Warte auf die Rückmeldung des Backend-Session-Checks
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <div>Lade...</div>
      </div>
    );
  }

  // Phase 2: Kein gültiger Login -> Umleitung zum Login mit Speicher der Ziel-URL
  if (!user) {
    // location.pathname + location.search speichert auch Query-Parameter wie "?tab=2"
    const currentPath = location.pathname + location.search;
    
    // replace=true verhindert, dass der Redirect die Browser-Zurück-Historie zumüllt
    return <Navigate to="/login" state={{ from: currentPath }} replace />;
  }

  // Phase 3: Zugriff gewährt -> Rendere die eigentliche Seitenkomponente
  return <Outlet />;
};

export default ProtectedRoute;