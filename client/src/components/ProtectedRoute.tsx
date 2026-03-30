import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const ProtectedRoute = () => {
  const { user, loading } = useAuth();

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

  if (!user) {
    // Redirect to login, but preserve current path
    const currentPath = window.location.pathname;
    return <Navigate to="/login" state={{ from: currentPath }} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
