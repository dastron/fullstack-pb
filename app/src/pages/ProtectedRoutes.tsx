import React from "react";

import useAuth from "../hooks/useAuth";
import UnauthorizedPage from "../pages/app/UnauthorizedPage";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredPermission }) => {
  const { isAuthenticated, hasPermission, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <UnauthorizedPage />;
  }

  // If a specific permission is required, check for it
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <UnauthorizedPage />;
  }

  // User is authenticated and has required permissions, render the children
  return <>{children}</>;
};

export default ProtectedRoute;
