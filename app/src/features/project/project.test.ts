import { describe, expect, it } from "vitest";
import { ProjectInputSchema } from "@project/schema";
import type { ProjectInputType } from "@project/schema";
import { createProject } from "./project";

describe("createProject function", () => {
  it("should create a new project", async () => {
    // Arrange
    const formData: ProjectInputType = {
      title: "New Project",
      content: "Test description",
      status: "draft",
      User: "1",
      SubscriberUsers: ["1"],
      imageFiles: [],
    };

    const expectedData = {
      ...formData,
      id: "new-id",
      updated: "0000",
      created: "0000",
    };

    const inputData = ProjectInputSchema.parse(formData);

    // Act
    const result = await createProject("1", inputData);

    // Assert
    expect(result).toEqual(expectedData);
  });
});
