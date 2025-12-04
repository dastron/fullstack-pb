/**
 * Tests for RuleValidator
 */

import { describe, expect, it } from "vitest";
import { RuleValidator } from "../rule-validator";
import { FieldDefinition } from "../types";

describe("RuleValidator", () => {
  const mockFields: FieldDefinition[] = [
    { name: "title", type: "text", required: true },
    { name: "status", type: "text", required: false },
    { name: "User", type: "relation", required: true, relation: { collection: "users" } },
    { name: "tags", type: "relation", required: false, relation: { collection: "tags", maxSelect: 5 } },
  ];

  describe("validate - null and empty rules", () => {
    it("should accept null rules (locked)", () => {
      const validator = new RuleValidator("posts", mockFields);
      const result = validator.validate("listRule", null);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it("should accept empty string rules (public) with warning", () => {
      const validator = new RuleValidator("posts", mockFields);
      const result = validator.validate("listRule", "");

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain("public");
    });
  });

  describe("validate - field references", () => {
    it("should validate existing field references", () => {
      const validator = new RuleValidator("posts", mockFields);
      const result = validator.validate("listRule", 'status = "active"');

      expect(result.valid).toBe(true);
      expect(result.fieldReferences).toContain("status");
    });

    it("should error on non-existent field references", () => {
      const validator = new RuleValidator("posts", mockFields);
      const result = validator.validate("listRule", 'nonexistent = "value"');

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain("nonexistent");
      expect(result.errors[0]).toContain("does not exist");
    });

    it("should validate nested relation field references with warning", () => {
      const validator = new RuleValidator("posts", mockFields);
      const result = validator.validate("listRule", 'User.email = "test@example.com"');

      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain("Nested field reference");
    });

    it("should error on nested reference for non-relation field", () => {
      const validator = new RuleValidator("posts", mockFields);
      const result = validator.validate("listRule", 'title.something = "value"');

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain("not a relation field");
    });
  });

  describe("validate - @request references", () => {
    it("should validate @request.auth.id", () => {
      const validator = new RuleValidator("posts", mockFields);
      const result = validator.validate("listRule", '@request.auth.id != ""');

      expect(result.valid).toBe(true);
    });

    it("should validate @request.auth.* references", () => {
      const validator = new RuleValidator("posts", mockFields);
      const result = validator.validate("listRule", '@request.auth.role = "admin"');

      expect(result.valid).toBe(true);
    });

    it("should validate @request.body.* references", () => {
      const validator = new RuleValidator("posts", mockFields);
      const result = validator.validate("createRule", '@request.body.title != ""');

      expect(result.valid).toBe(true);
    });

    it("should error on invalid @request references", () => {
      const validator = new RuleValidator("posts", mockFields);
      const result = validator.validate("listRule", '@request.invalid.field = "value"');

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain("Invalid @request reference");
    });
  });

  describe("validate - syntax", () => {
    it("should validate balanced parentheses", () => {
      const validator = new RuleValidator("posts", mockFields);
      const result = validator.validate("listRule", '(status = "active" || status = "pending")');

      expect(result.valid).toBe(true);
    });

    it("should error on unbalanced parentheses", () => {
      const validator = new RuleValidator("posts", mockFields);
      const result = validator.validate("listRule", '(status = "active"');

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain("Unbalanced parentheses");
    });

    it("should warn on == operator usage", () => {
      const validator = new RuleValidator("posts", mockFields);
      const result = validator.validate("listRule", 'status == "active"');

      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain("Use '=' instead of '=='");
    });
  });

  describe("validate - manageRule", () => {
    it("should error on manageRule for base collection", () => {
      const validator = new RuleValidator("posts", mockFields, false);
      const result = validator.validate("manageRule", '@request.auth.id != ""');

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain("only valid for auth collections");
    });

    it("should accept manageRule for auth collection", () => {
      const validator = new RuleValidator("users", mockFields, true);
      const result = validator.validate("manageRule", '@request.auth.id != ""');

      expect(result.valid).toBe(true);
    });
  });

  describe("validate - complex expressions", () => {
    it("should validate complex rule with multiple conditions", () => {
      const validator = new RuleValidator("posts", mockFields);
      const result = validator.validate(
        "listRule",
        '@request.auth.id != "" && (status = "active" || User = @request.auth.id)'
      );

      expect(result.valid).toBe(true);
      expect(result.fieldReferences).toContain("status");
      expect(result.fieldReferences).toContain("User");
    });
  });
});
