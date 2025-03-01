import { render, screen } from "@testing-library/react";
import ImageUploadMultiple from "./ImageUploadMultiple";
import { expect, describe, it, vi } from "vitest";
import { imageUpload } from "./utils.image.test";

describe("ImageUploadMultipleInput Component", () => {
  it("renders the select button", () => {
    render(<ImageUploadMultiple name="test" multiple />);
    expect(screen.getByTestId("image-upload-button")).toBeTruthy();
  });

  it("uploads files and displays image previews", async () => {
    render(<ImageUploadMultiple name="test" multiple />);

    const file = new File(["dummy content"], "test.png", { type: "image/png" });
    await imageUpload.uploadFiles([file]);

    expect(screen.getByTestId("image-preview-grid").children.length).toBe(1);
  });

  it("deletes an uploaded image", async () => {
    render(<ImageUploadMultiple name="test" multiple />);

    // Upload two dummy files
    const file1 = new File(["dummy content"], "test1.png", { type: "image/png" });
    const file2 = new File(["dummy content"], "test2.png", { type: "image/png" });
    await imageUpload.uploadFiles([file1, file2]);

    // Ensure two previews are rendered
    expect(screen.getByTestId("image-preview-grid").children.length).toBe(2);

    // Delete the first image
    imageUpload.deleteImageByIndex(0);

    // Wait for the state update and verify only one preview remains
    await vi.waitFor(() => {
      expect(screen.getByTestId("image-preview-grid").children.length).toBe(1);
    });
  });
});
