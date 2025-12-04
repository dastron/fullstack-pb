/**
 * Unit tests for relation field detection
 */

import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  getMaxSelect,
  getMinSelect,
  isMultipleRelationField,
  isRelationField,
  isSingleRelationField,
  resolveTargetCollection,
} from "../relation-detector";

describe("Relation Detector", () => {
  describe("isSingleRelationField", () => {
    it("should detect single relation field with uppercase name", () => {
      const zodType = z.string();
      expect(isSingleRelationField("User", zodType)).toBe(true);
      expect(isSingleRelationField("Author", zodType)).toBe(true);
      expect(isSingleRelationField("Category", zodType)).toBe(true);
    });

    it("should not detect common string fields as relations", () => {
      const zodType = z.string();
      expect(isSingleRelationField("Title", zodType)).toBe(false);
      expect(isSingleRelationField("Name", zodType)).toBe(false);
      expect(isSingleRelationField("Description", zodType)).toBe(false);
      expect(isSingleRelationField("Content", zodType)).toBe(false);
      expect(isSingleRelationField("Summary", zodType)).toBe(false);
      expect(isSingleRelationField("Status", zodType)).toBe(false);
      expect(isSingleRelationField("Type", zodType)).toBe(false);
    });

    it("should not detect lowercase fields as relations", () => {
      const zodType = z.string();
      expect(isSingleRelationField("user", zodType)).toBe(false);
      expect(isSingleRelationField("author", zodType)).toBe(false);
    });

    it("should not detect non-string types as single relations", () => {
      expect(isSingleRelationField("User", z.number())).toBe(false);
      expect(isSingleRelationField("User", z.boolean())).toBe(false);
      expect(isSingleRelationField("User", z.array(z.string()))).toBe(false);
    });

    it("should detect optional string relations", () => {
      const zodType = z.string().optional();
      expect(isSingleRelationField("User", zodType)).toBe(true);
    });

    it("should detect nullable string relations", () => {
      const zodType = z.string().nullable();
      expect(isSingleRelationField("User", zodType)).toBe(true);
    });

    it("should detect string relations with default", () => {
      const zodType = z.string().default("");
      expect(isSingleRelationField("User", zodType)).toBe(true);
    });
  });

  describe("isMultipleRelationField", () => {
    it("should detect multiple relation field with array of strings", () => {
      const zodType = z.array(z.string());
      expect(isMultipleRelationField("Users", zodType)).toBe(true);
      expect(isMultipleRelationField("SubscriberUsers", zodType)).toBe(true);
      expect(isMultipleRelationField("RelatedPosts", zodType)).toBe(true);
    });

    it("should not detect arrays without uppercase as relations", () => {
      const zodType = z.array(z.string());
      expect(isMultipleRelationField("tags", zodType)).toBe(false);
      expect(isMultipleRelationField("items", zodType)).toBe(false);
    });

    it("should not detect non-array types as multiple relations", () => {
      expect(isMultipleRelationField("Users", z.string())).toBe(false);
      expect(isMultipleRelationField("Users", z.number())).toBe(false);
    });

    it("should not detect array of non-strings as relations", () => {
      expect(isMultipleRelationField("Users", z.array(z.number()))).toBe(false);
      expect(isMultipleRelationField("Users", z.array(z.boolean()))).toBe(false);
    });

    it("should detect optional array relations", () => {
      const zodType = z.array(z.string()).optional();
      expect(isMultipleRelationField("Users", zodType)).toBe(true);
    });

    it("should detect nullable array relations", () => {
      const zodType = z.array(z.string()).nullable();
      expect(isMultipleRelationField("Users", zodType)).toBe(true);
    });

    it("should detect array relations with default", () => {
      const zodType = z.array(z.string()).default([]);
      expect(isMultipleRelationField("Users", zodType)).toBe(true);
    });
  });

  describe("isRelationField", () => {
    it("should detect single relations", () => {
      const zodType = z.string();
      expect(isRelationField("User", zodType)).toBe(true);
    });

    it("should detect multiple relations", () => {
      const zodType = z.array(z.string());
      expect(isRelationField("Users", zodType)).toBe(true);
    });

    it("should not detect non-relations", () => {
      expect(isRelationField("title", z.string())).toBe(false);
      expect(isRelationField("Title", z.string())).toBe(false);
      expect(isRelationField("count", z.number())).toBe(false);
    });
  });

  describe("resolveTargetCollection", () => {
    it("should resolve single entity names", () => {
      expect(resolveTargetCollection("User")).toBe("Users");
      expect(resolveTargetCollection("Author")).toBe("Authors");
      expect(resolveTargetCollection("Category")).toBe("Categories");
      expect(resolveTargetCollection("Project")).toBe("Projects");
    });

    it("should resolve compound relation names", () => {
      expect(resolveTargetCollection("SubscriberUsers")).toBe("Users");
      expect(resolveTargetCollection("RelatedPosts")).toBe("Posts");
      expect(resolveTargetCollection("AssignedTasks")).toBe("Tasks");
    });

    it("should handle special pluralization cases", () => {
      expect(resolveTargetCollection("Person")).toBe("People");
      expect(resolveTargetCollection("Child")).toBe("Children");
    });

    it("should handle already plural names", () => {
      expect(resolveTargetCollection("Users")).toBe("Users");
      expect(resolveTargetCollection("Categories")).toBe("Categories");
    });
  });

  describe("getMaxSelect", () => {
    it("should return 1 for single relations", () => {
      const zodType = z.string();
      expect(getMaxSelect("User", zodType)).toBe(1);
    });

    it("should return 999 for multiple relations without max", () => {
      const zodType = z.array(z.string());
      expect(getMaxSelect("Users", zodType)).toBe(999);
    });

    it("should return specified max for multiple relations", () => {
      const zodType = z.array(z.string()).max(5);
      expect(getMaxSelect("Users", zodType)).toBe(5);
    });

    it("should handle optional single relations", () => {
      const zodType = z.string().optional();
      expect(getMaxSelect("User", zodType)).toBe(1);
    });

    it("should handle optional multiple relations", () => {
      const zodType = z.array(z.string()).optional();
      expect(getMaxSelect("Users", zodType)).toBe(999);
    });

    it("should handle nullable multiple relations with max", () => {
      const zodType = z.array(z.string()).max(10).nullable();
      expect(getMaxSelect("Users", zodType)).toBe(10);
    });
  });

  describe("getMinSelect", () => {
    it("should return undefined for single relations", () => {
      const zodType = z.string();
      expect(getMinSelect("User", zodType)).toBeUndefined();
    });

    it("should return undefined for multiple relations without min", () => {
      const zodType = z.array(z.string());
      expect(getMinSelect("Users", zodType)).toBeUndefined();
    });

    it("should return specified min for multiple relations", () => {
      const zodType = z.array(z.string()).min(1);
      expect(getMinSelect("Users", zodType)).toBe(1);
    });

    it("should handle optional multiple relations with min", () => {
      const zodType = z.array(z.string()).min(2).optional();
      expect(getMinSelect("Users", zodType)).toBe(2);
    });

    it("should handle nullable multiple relations with min", () => {
      const zodType = z.array(z.string()).min(3).nullable();
      expect(getMinSelect("Users", zodType)).toBe(3);
    });

    it("should handle multiple relations with both min and max", () => {
      const zodType = z.array(z.string()).min(1).max(5);
      expect(getMinSelect("Users", zodType)).toBe(1);
      expect(getMaxSelect("Users", zodType)).toBe(5);
    });
  });
});
