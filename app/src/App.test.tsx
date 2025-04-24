import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect } from "vitest";

import App from "./App";

const future = { v7_startTransition: false, v7_relativeSplatPath: false };

// Helper function to render App with required providers
const renderApp = () => {
  return render(
    <MemoryRouter future={future}>
      <App />
    </MemoryRouter>
  );
};

describe("App", () => {
  it("renders without crashing", () => {
    const { container } = renderApp();
    expect(container).toBeDefined();
  });

  it("renders with a container", () => {
    const { container } = renderApp();
    expect(container.querySelector(".chakra-container")).toBeDefined();
  });

  it("displays welcome text", async () => {
    const { getAllByText } = renderApp();

    await expect(getAllByText(/Projects/i).length).toBeGreaterThan(0);
  });
});
