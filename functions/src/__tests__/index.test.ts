import request from "supertest";
import { describe, expect, it, vi } from "vitest";

import app from "../index.js";

vi.mock("../pocket_base.js", () => ({
  validateToken: vi.fn().mockResolvedValue(true),
}));

vi.mock("../moderator.js", () => ({
  processContentModeration: vi.fn().mockResolvedValue({ flagged: false }),
}));

describe("POST /functions/moderator", () => {
  it("should return moderation result for valid token and message", async () => {
    const response = await request(app)
      .post("/functions/moderator")
      .set("Authorization", "Bearer valid-token")
      .send({ message: "Test message" });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("moderation");
    expect(response.body.moderation).toEqual({ flagged: false });
  });
});
