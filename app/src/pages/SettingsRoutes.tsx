import { RouteObject } from "react-router-dom";

import SettingsAppNav from "./settings/SettingsAppNav";
import SettingsPage from "./settings/SettingsPage";

export const SettingsRoutes: RouteObject = {
  path: "/settings",
  element: <SettingsAppNav />,
  children: [
    {
      index: true,
      element: <SettingsPage />,
    },
  ],
};
