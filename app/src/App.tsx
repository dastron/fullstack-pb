import { Container } from "@chakra-ui/react";
import "./App.css";
import { Suspense } from "react";
import { Outlet } from "react-router-dom";

import NavMenu, { NAV_HEIGHT } from "./components/nav/AppMenu";
import SpinnerPage from "./pages/app/SpinnerPage";
import { Provider } from "./theme/provider";

function App() {
  return (
    <Provider>
      <NavMenu />
      <Container maxW="container.lg" pt={NAV_HEIGHT}>
        <Suspense fallback={<SpinnerPage />}>
          <Outlet />
        </Suspense>
      </Container>
    </Provider>
  );
}

export default App;
