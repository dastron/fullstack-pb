import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, MockInstance, vi } from "vitest";

import UserForm from "./LoginForm";

// Mock the useAuth hook
const mockLogin = vi.fn();
vi.mock("@/hooks/useAuth", () => ({
  default: () => ({
    Login: mockLogin,
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

describe("LoginForm", () => {
  // Add this before each test to spy on console.error
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
    // Mock successful login
    mockLogin.mockResolvedValue(true);

    render(<UserForm />);

    // Fill out the Email field
    const emailInput = screen.getByTestId("email-input");
    fireEvent.change(emailInput, { target: { value: "user@example.com" } });

    // Fill out the Password field
    const passwordInput = screen.getByTestId("password-input");
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    // Submit the form
    const submitButton = screen.getByTestId("login-button");
    fireEvent.click(submitButton);

    // Check if Login was called with the correct data
    await vi.waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("user@example.com", "password123");
    });

    // Check if window.location.href was set to redirect to home
    await vi.waitFor(() => {
      expect(window.location.href).toBe("/");
    });
  });

  it("shows error message when login fails", async () => {
    // Mock failed login
    mockLogin.mockResolvedValue(false);

    render(<UserForm />);

    // Fill out required fields
    fireEvent.change(screen.getByTestId("email-input"), { target: { value: "user@example.com" } });
    fireEvent.change(screen.getByTestId("password-input"), { target: { value: "password123" } });

    // Submit the form
    fireEvent.click(screen.getByTestId("login-button"));

    // Check if error message is displayed
    await vi.waitFor(() => {
      const errorElement = screen.getByTestId("form-error");
      expect(errorElement.textContent).toBe("Login failed. Please try again.");
    });

    // Check that window.location.href was not changed
    expect(window.location.href).toBe("");
  });

  it("redirects to the specified URL when provided in search params", async () => {
    // Mock successful login
    mockLogin.mockResolvedValue(true);

    // Mock redirect parameter
    mockRedirectValue = "/dashboard";

    render(<UserForm />);

    // Fill out required fields
    fireEvent.change(screen.getByTestId("email-input"), { target: { value: "user@example.com" } });
    fireEvent.change(screen.getByTestId("password-input"), { target: { value: "password123" } });

    // Submit the form
    fireEvent.click(screen.getByTestId("login-button"));

    // Check if window.location.href was set with the redirect URL
    await vi.waitFor(() => {
      expect(window.location.href).toBe("/dashboard");
    });
  });

  it("handles API errors during login", async () => {
    // Mock API error
    mockLogin.mockRejectedValue(new Error("Invalid credentials"));

    render(<UserForm />);

    // Fill out required fields
    fireEvent.change(screen.getByTestId("email-input"), { target: { value: "user@example.com" } });
    fireEvent.change(screen.getByTestId("password-input"), { target: { value: "password123" } });

    // Submit the form
    fireEvent.click(screen.getByTestId("login-button"));

    // Check if error message is displayed
    await vi.waitFor(() => {
      const errorElement = screen.getByTestId("form-error");
      expect(errorElement.textContent).toBe("Invalid Login");
    });

    // Verify that console.error was called with the expected error
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error during login:",
      expect.objectContaining({ message: "Invalid credentials" })
    );

    // Check that window.location.href was not changed
    expect(window.location.href).toBe("");
  });

  it("validates email format", async () => {
    render(<UserForm />);

    // Fill out with invalid email
    fireEvent.change(screen.getByTestId("email-input"), { target: { value: "invalid-email" } });
    fireEvent.change(screen.getByTestId("password-input"), { target: { value: "password123" } });

    // Submit the form
    fireEvent.click(screen.getByTestId("login-button"));

    // Login should not be called with invalid data
    expect(mockLogin).not.toHaveBeenCalled();

    // Check that window.location.href was not changed
    expect(window.location.href).toBe("");
  });

  it("validates password length", async () => {
    render(<UserForm />);

    // Fill out with short password
    fireEvent.change(screen.getByTestId("email-input"), { target: { value: "user@example.com" } });
    fireEvent.change(screen.getByTestId("password-input"), { target: { value: "12345" } });

    // Submit the form
    fireEvent.click(screen.getByTestId("login-button"));

    // Login should not be called with invalid data
    expect(mockLogin).not.toHaveBeenCalled();

    // Check that window.location.href was not changed
    expect(window.location.href).toBe("");
  });
});
