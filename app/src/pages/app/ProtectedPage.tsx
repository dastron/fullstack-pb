import React from "react";

import UnauthorizedPage from "./UnauthorizedPage";

interface ProtectedPageProps {
  children: React.ReactNode;
  hasPermission: boolean;
}

const ProtectedPage: React.FC<ProtectedPageProps> = ({ children, hasPermission }) => {
  if (!hasPermission) {
    return <UnauthorizedPage />;
  }

  return <>{children}</>;
};

export default ProtectedPage;
