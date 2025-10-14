import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      // Redirect to login if not authenticated
      return;
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access
  if (allowedRoles && !allowedRoles.includes(user.role || "")) {
    // If user role is not allowed, redirect to appropriate dashboard
    if (user.role === "staff") {
      return <Navigate to="/dashboard/staff" replace />;
    } else if (user.role === "admin") {
      return <Navigate to="/dashboard/admin" replace />;
    } else {
      // Customer or other roles
      return <Navigate to="/customer" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
