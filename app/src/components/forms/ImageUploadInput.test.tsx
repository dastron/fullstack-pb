import { render, screen } from "@testing-library/react";
import { expect, describe, it } from "vitest";

import ImageUploadInput from "./ImageUploadInput";
import { imageUpload } from "./utils.image.test";

describe("ImageUploadSingleInput Component", () => {
  it("renders the select button", () => {
    render(<ImageUploadInput name="test" />);
    expect(screen.getByTestId("image-upload-button")).toBeTruthy();
  });

  it("uploads a single file and displays the image preview", async () => {
    render(<ImageUploadInput name="test" />);

    // Create a dummy image file
    const file = new File(["dummy content"], "test.png", { type: "image/png" });
    await imageUpload.uploadFiles([file]);
  });
});
