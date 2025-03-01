import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import ProjectForm from "./ProjectCreationForm";

// Mock the useAuth hook
vi.mock("@/hooks/useAuth", () => ({
  default: () => ({
    user: { id: "123", name: "Test User", roles: ["worker"] },
    isAuthenticated: true,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

vi.mock("@/utils/moderation", () => ({
  moderateObject: vi.fn(() => Promise.resolve({ flagged: false })),
}));

// Mock the navigation
const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => ({
  ...(await vi.importActual("react-router-dom")),
  useNavigate: () => mockNavigate,
  useParams: () => ({ requestId: "test-request-id" }),
}));

describe("ProjectForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  it("fills out the form and submits successfully", async () => {
    render(<ProjectForm />);

    // Fill out the Title field
    const nameInput = screen.getByTestId("project-title-input");
    fireEvent.change(nameInput, { target: { value: "New Project" } });

    // Fill out the Project Description field
    const descriptionInput = screen.getByTestId("project-description-input");
    fireEvent.change(descriptionInput, {
      target: { value: "Test project description" },
    });

    // Submit the form
    const submitButton = screen.getByTestId("submit-project-button");
    fireEvent.click(submitButton);

    // Check if navigation was called with the new project ID
    await vi.waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/project/new-id");
    });
  });
});
