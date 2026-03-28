// PublicRoute.tsx (ähnlich wie ProtectedRoute)
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const PublicRoute = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <div>Lade...</div>
      </div>
    );
  }
  
  if (user) {
    // Redirect to dashboard, but preserve current path
    const currentPath = window.location.pathname;
    return <Navigate to="/dashboard" state={{ from: currentPath }} replace />;
  }
  
  return <Outlet />;
};

export default PublicRoute;
