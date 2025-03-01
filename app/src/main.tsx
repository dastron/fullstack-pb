import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import ErrorPage from "./pages/app/ErrorPage.tsx";
import SpinnerPage from "./pages/app/SpinnerPage.tsx";
// load route modules
import { ProjectRoutes } from "./pages/ProjectRoutes.tsx";
import { AppRoutes } from "./pages/AppRoutes.tsx";
import { SettingsRoutes } from "./pages/SettingsRoutes.tsx";
// Consolidate router configuration
const future = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
  v7_fetcherPersist: true,
  v7_normalizeFormMethod: true,
  v7_partialHydration: true,
  v7_skipActionErrorReObservation: true,
  v7_skipActionErrorRevalidation: true,
};

// Create router with optimized configuration
const router = createBrowserRouter([
  {
    element: <App />,
    errorElement: <ErrorPage />,
    hydrateFallbackElement: <SpinnerPage />,
    children: [
      AppRoutes,
      ProjectRoutes,
      SettingsRoutes,
    ],
  },
]);

// Create root with error boundary
const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");
const root = createRoot(rootElement);

// Render app with suspense boundary for better loading experience
root.render(
  <StrictMode>
    <Suspense fallback={<SpinnerPage />}>
      <RouterProvider router={router} future={future} />
    </Suspense>
  </StrictMode>
);
