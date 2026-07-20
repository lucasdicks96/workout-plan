// PublicRoute.tsx (ähnlich wie ProtectedRoute)
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

/**
 * Ein Routing-Guard (HOC / Wrapper-Komponente) für öffentliche Routen (wie Login oder Registrierung).
 *
 * Diese Komponente wird im Router-Setup für Routen verwendet, die nur für **nicht** 
 * authentifizierte Benutzer zugänglich sein sollen. Sie steuert das Verhalten in drei Phasen:
 * 1. **Ladephase (`loading`)**: Zeigt einen zentrierten Platzhalter an, während der Auth-Hook den Session-Status beim Backend prüft.
 * 2. **Bereits eingeloggt (`user` vorhanden)**: Leitet den Benutzer automatisch vom Login/Register weg (z. B. zum Dashboard), da ein erneuter Login keinen Sinn ergibt. Dabei wird die aktuelle URL-Position im `state` mitgesendet.
 * 3. **Nicht eingeloggt (`!user`)**: Erlaubt den Zugriff und rendert die öffentliche Seite (z. B. das Anmeldeformular) über die React-Router `<Outlet />`-Komponente.
 *
 * @returns {JSX.Element} Den Ladebildschirm, einen Redirect zum Dashboard oder die öffentliche Kind-Route (`<Outlet />`).
 */
const PublicRoute = () => {
  const { user, loading } = useAuth();
  
  // Nutzt React Routers Location-Hook für sauberes Routing inklusive Query-Parametern
  const location = useLocation();
  
  // Phase 1: Warte auf die Verifizierung der Session durch das Backend
  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <div>Lade...</div>
      </div>
    );
  }
  
  // Phase 2: Benutzer ist bereits eingeloggt -> Umleitung weg von Login/Register
  if (user) {
    // location.pathname + location.search sichert den kompletten Ursprungspfad ab
    const currentPath = location.pathname + location.search;
    
    // replace=true verhindert, dass die Login-Seite in der Browser-Historie blockiert
    return <Navigate to="/dashboard" state={{ from: currentPath }} replace />;
  }
  
  // Phase 3: Kein Login vorhanden -> Zeige das öffentliche Formular an
  return <Outlet />;
};

export default PublicRoute;