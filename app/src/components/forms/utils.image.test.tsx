import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

export const imageUpload = {
  /**
   * Simulates uploading one or more image files.
   * It triggers a click on the select button, then fires a change event on the hidden input.
   *
   * @param files - Array of File objects to upload.
   */
  uploadFiles: async (files: File[]) => {
    // Click the "Select Image" button
    const selectButton = screen.getByTestId("image-upload-button");
    fireEvent.click(selectButton);

    // Get the hidden file input element
    const fileInput = screen.getByTestId("image-upload-input");
    if (!fileInput) {
      throw new Error("File input not found");
    }

    // Create a DataTransfer object to simulate the file selection
    const dataTransfer = new DataTransfer();
    files.forEach((file) => dataTransfer.items.add(file));

    // Fire the change event on the file input with the list of files
    fireEvent.change(fileInput, { target: { files: dataTransfer.files } });

    // Wait for the component to render at least one preview image
    await vi.waitFor(() => {
      expect(screen.getByTestId("image-preview-0")).toBeTruthy();
    });
  },

  /**
   * Simulates deleting an uploaded image by clicking the remove icon button.
   *
   * @param index - The index of the image to delete.
   */
  deleteImageByIndex: (index: number) => {
    const deleteButton = screen.getByTestId(`image-delete-button-${index}`);
    fireEvent.click(deleteButton);
  },
};

describe("Image Upload Utils", () => {
  it("blank test", async () => {
    expect(true).toBe(true);
  });
});
