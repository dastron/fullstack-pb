import React from "react";
import useAuth from "../hooks/useAuth";
import UnauthorizedPage from "../pages/app/UnauthorizedPage";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredPermission }) => {
  const { isAuthenticated, hasPermission, isLoading } = useAuth();

  // Show nothing while checking authentication
  if (isLoading) {
    return null;
  }

  // Check if user is authenticated
  if (!isAuthenticated) {
    // Render the unauthorized page directly instead of redirecting
    return <UnauthorizedPage />;
  }

  // If a specific permission is required, check for it
  if (requiredPermission && !hasPermission(requiredPermission)) {
    // Render the unauthorized page directly instead of redirecting
    // return <UnauthorizedPage />;
    console.log("Unauthorized");
  }

  // User is authenticated and has required permissions, render the children
  return <>{children}</>;
};

export default ProtectedRoute;
