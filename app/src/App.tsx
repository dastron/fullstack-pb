import { Container } from "@chakra-ui/react";
import "./App.css";
import NavMenu, { NAV_HEIGHT } from "./components/nav/AppMenu";
import { Outlet } from "react-router-dom";
import { Suspense } from "react";
import SpinnerPage from "./pages/app/SpinnerPage";
import { Provider } from "./utils/provider";

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
