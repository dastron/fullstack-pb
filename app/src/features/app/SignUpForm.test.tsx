import { describe, it, expect, vi, beforeEach, afterEach, MockInstance } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import UserForm from "./SignUpForm";

// Mock the useAuth hook
const mockSignUpNewUser = vi.fn();
vi.mock("@/hooks/useAuth", () => ({
  default: () => ({
    SignUpNewUser: mockSignUpNewUser,
  }),
}));

// Mock window.location
const originalLocation = window.location;
// Mock search params
let mockRedirectValue: string | null = null;
vi.mock("react-router-dom", async () => ({
  ...(await vi.importActual("react-router-dom")),
  useSearchParams: () => [
    {
      get: (param: string) => (param === "redirect" ? mockRedirectValue : null),
    },
  ],
}));

describe("SignUpForm", () => {
  // Add this to spy on console.error
  let consoleErrorSpy: MockInstance;

  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
    mockRedirectValue = null;
    // Spy on console.error to prevent actual logging
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    // Mock window.location before each test
    Object.defineProperty(window, "location", {
      writable: true,
      value: { href: "" },
    });
  });

  afterEach(() => {
    // Restore console.error after each test
    consoleErrorSpy.mockRestore();
    // Restore original window.location
    Object.defineProperty(window, "location", {
      writable: true,
      value: originalLocation,
    });
  });

  it("fills out the form and submits successfully", async () => {
    // Mock successful signup
    mockSignUpNewUser.mockResolvedValue(true);

    render(<UserForm />);

    // Fill out the Name field
    const nameInput = screen.getByTestId("name-input");
    fireEvent.change(nameInput, { target: { value: "John Doe" } });

    // Fill out the Username field
    const usernameInput = screen.getByTestId("username-input");
    fireEvent.change(usernameInput, { target: { value: "johndoe" } });

    // Fill out the Email field
    const emailInput = screen.getByTestId("email-input");
    fireEvent.change(emailInput, { target: { value: "john@example.com" } });

    // Fill out the Password field
    const passwordInput = screen.getByTestId("password-input");
    fireEvent.change(passwordInput, { target: { value: "Password123!" } });

    // Fill out the Confirm Password field
    const confirmPasswordInput = screen.getByTestId("password-confirm-input");
    fireEvent.change(confirmPasswordInput, { target: { value: "Password123!" } });

    // Submit the form
    const submitButton = screen.getByTestId("signup-button");
    fireEvent.click(submitButton);

    // Check if SignUpNewUser was called with the correct data
    await vi.waitFor(() => {
      expect(mockSignUpNewUser).toHaveBeenCalledWith({
        name: "John Doe",
        username: "johndoe",
        email: "john@example.com",
        password: "Password123!",
        passwordConfirm: "Password123!",
      });
    });

    // Check if window.location.href was set to redirect to home
    await vi.waitFor(() => {
      expect(window.location.href).toBe("/");
    });
  });

  it("shows error message when signup fails", async () => {
    // Mock failed signup
    mockSignUpNewUser.mockResolvedValue(false);

    render(<UserForm />);

    // Fill out required fields
    fireEvent.change(screen.getByTestId("name-input"), { target: { value: "John Doe" } });
    fireEvent.change(screen.getByTestId("username-input"), { target: { value: "johndoe" } });
    fireEvent.change(screen.getByTestId("email-input"), { target: { value: "john@example.com" } });
    fireEvent.change(screen.getByTestId("password-input"), { target: { value: "Password123!" } });
    fireEvent.change(screen.getByTestId("password-confirm-input"), { target: { value: "Password123!" } });

    // Submit the form
    fireEvent.click(screen.getByTestId("signup-button"));

    // Check if error message is displayed
    await vi.waitFor(() => {
      const errorElement = screen.getByTestId("form-error");
      expect(errorElement.textContent).toBe("Sign up failed. Please try again.");
    });

    // Check that window.location.href was not changed
    expect(window.location.href).toBe("");
  });

  it("redirects to the specified URL when provided in search params", async () => {
    // Mock successful signup
    mockSignUpNewUser.mockResolvedValue(true);

    // Mock redirect parameter
    mockRedirectValue = "/dashboard";

    render(<UserForm />);

    // Fill out required fields
    fireEvent.change(screen.getByTestId("name-input"), { target: { value: "John Doe" } });
    fireEvent.change(screen.getByTestId("username-input"), { target: { value: "johndoe" } });
    fireEvent.change(screen.getByTestId("email-input"), { target: { value: "john@example.com" } });
    fireEvent.change(screen.getByTestId("password-input"), { target: { value: "Password123!" } });
    fireEvent.change(screen.getByTestId("password-confirm-input"), { target: { value: "Password123!" } });

    // Submit the form
    fireEvent.click(screen.getByTestId("signup-button"));

    // Check if window.location.href was set with the redirect URL
    await vi.waitFor(() => {
      expect(window.location.href).toBe("/dashboard");
    });
  });

  it("handles API errors during signup", async () => {
    // Mock API error
    const errorMessage = "Email already exists";
    mockSignUpNewUser.mockRejectedValue(new Error(errorMessage));

    render(<UserForm />);

    // Fill out required fields
    fireEvent.change(screen.getByTestId("name-input"), { target: { value: "John Doe" } });
    fireEvent.change(screen.getByTestId("username-input"), { target: { value: "johndoe" } });
    fireEvent.change(screen.getByTestId("email-input"), { target: { value: "john@example.com" } });
    fireEvent.change(screen.getByTestId("password-input"), { target: { value: "Password123!" } });
    fireEvent.change(screen.getByTestId("password-confirm-input"), { target: { value: "Password123!" } });

    // Submit the form
    fireEvent.click(screen.getByTestId("signup-button"));

    // Check if error message is displayed
    await vi.waitFor(() => {
      const errorElement = screen.getByTestId("form-error");
      expect(errorElement.textContent).toBe(`Error signing up. (${errorMessage})`);
    });

    // Verify that console.error was called with the expected error
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error during sign up:",
      expect.objectContaining({ message: errorMessage })
    );

    // Check that window.location.href was not changed
    expect(window.location.href).toBe("");
  });
});
