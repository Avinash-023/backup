import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { Loader2 } from "lucide-react";

export const ProtectedRoute = ({ 
  children,
  allowedRoles
}: { 
  children: React.ReactNode;
  allowedRoles?: ('admin' | 'faculty')[];
}) => {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    // Redirect them to the login page, but save the current location they were
    // trying to go to when they were redirected. This allows us to send them
    // along to that page after they login, which is a nicer user experience
    // than dropping them off on the home page.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (localStorage.getItem("requiresPasswordReset") === "true") {
    if (location.pathname !== "/reset-password") {
      return <Navigate to="/reset-password" replace />;
    }
  } else {
    // If they don't need a reset but tried accessing /reset-password directly, send them to /admin
    if (location.pathname === "/reset-password") {
      return <Navigate to="/admin" replace />;
    }
  }

  // Role-based route protection
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    // For faculty trying to access admin pages, bounce them to the admin dashboard
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
};
