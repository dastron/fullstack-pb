import { RouteObject } from "react-router-dom";
import HomePage from "./app/HomePage";
import LoginPage from "./app/LoginPage";
import SignUpFormPage from "./app/SignUpPage";
import UnauthorizedPage from "./app/UnauthorizedPage";

export const AppRoutes: RouteObject = {
  path: "/",
  children: [
    {
      index: true,
      element: <HomePage />,
    },
    {
      path: "/signup",
      element: <SignUpFormPage />,
    },
    {
      path: "/login",
      element: <LoginPage />,
    },
    {
      path: "unauthorized",
      element: <UnauthorizedPage />,
    },
  ],
};
