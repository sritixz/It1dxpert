// ProtectedRoute — client-side equivalent of the backend's
// authenticate + authorize middleware chain: confirms a user is logged
// in, and (optionally) that their role is allowed, before rendering
// whatever it wraps.
//
// Note: this is a client-side check, not a security boundary — the real
// enforcement is the backend's RBAC chain (authenticate/authorize/
// scopeToHospital). This just prevents a logged-in PATIENT from ever
// seeing the doctor UI shell flash on screen; it does not, by itself,
// protect any data.

import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { HOME_PATH_BY_ROLE } from "../config/navConfig.js";

export function ProtectedRoute({ allowedRoles, children }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Logged in, but wrong role for this route — send them to their own
    // home instead of a dead end.
    return <Navigate to={HOME_PATH_BY_ROLE[user.role] || "/login"} replace />;
  }

  return children;
}
