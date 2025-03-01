import { RouteObject } from "react-router-dom";
import SettingsPage from "./settings/SettingsPage";
import SettingsAppNav from "./settings/SettingsAppNav";
export const SettingsRoutes: RouteObject = {
  path: "/settings",
  element: <SettingsAppNav />,
  children: [
    {
      index: true,
      element: <SettingsPage />,
    },
    {
      path: "profile",
      element: <SettingsPage />,
    },
  ],
};
