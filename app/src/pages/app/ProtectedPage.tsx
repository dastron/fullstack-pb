import React from "react";
import UnauthorizedPage from "./UnauthorizedPage";

interface ProtectedPageProps {
  children: React.ReactNode;
  hasPermission: boolean;
}

/**
 * A wrapper component that conditionally renders its children or an unauthorized page
 * based on whether the user has the required permissions.
 *
 * @param children - The content to render if the user has permission
 * @param hasPermission - Boolean indicating if the user has permission to view the content
 */
const ProtectedPage: React.FC<ProtectedPageProps> = ({ children, hasPermission }) => {
  if (!hasPermission) {
    return <UnauthorizedPage />;
  }

  return <>{children}</>;
};

export default ProtectedPage;
