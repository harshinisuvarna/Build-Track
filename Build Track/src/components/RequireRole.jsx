import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function RequireRole({ permission, route, children }) {
  const { user, loading, isAuthenticated, can } = useAuth();

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "#888" }}>
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (permission && !can(permission)) {
    return <Navigate to="/" replace />;
  }

  // If a route check is needed (e.g. /admin or /audit-logs only for admin/supervisor)
  if (route) {
    const r = user?.role?.toLowerCase();
    const isAdminOrSupervisor = r === "admin" || r === "supervisor";
    if (!isAdminOrSupervisor) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
}
