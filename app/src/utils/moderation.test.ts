import type { Mock } from "vitest";
import { vi, describe, it, expect } from "vitest";
import { moderateObject } from "./moderation"; // Adjust the import based on your actual function

describe("Moderation Utility Functions", () => {
  vi.unmock("@/utils/moderation");

  const mockObject = { userId: 1, id: 1, title: "Test Todo", completed: false };

  const mockResponse = {
    moderation: {
      flagged: false,
      category_scores: {
        violence: 0.001,
        adult: 0.00002,
        spoof: 0.000003,
      },
    },
  };

  (fetch as Mock).mockResolvedValue({
    ok: true,
    json: async () => mockResponse,
  });

  it("should return moderate results", async () => {
    const result = await moderateObject("1", "Projects", mockObject);

    expect(result.flagged).toEqual(mockResponse.moderation.flagged);
    expect(result.category).toEqual({
      violence: 0.001,
      adult: 0.00002,
      spoof: 0,
    });
  });

  // Add more test cases as needed
});
