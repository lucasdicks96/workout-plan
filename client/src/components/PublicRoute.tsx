// PublicRoute.tsx (ähnlich wie ProtectedRoute)
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const PublicRoute = () => {
  const { user } = useAuth();
  //   if (loading || user) return <div>Lade...</div>;
  return !user ? <Outlet /> : <Navigate to="/dashboard" replace />;
};

export default PublicRoute;
