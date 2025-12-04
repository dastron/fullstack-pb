/**
 * Tests for PermissionAnalyzer
 */

import { describe, expect, it } from "vitest";
import { PermissionSchema, PermissionTemplateConfig } from "../../schema/permissions";
import { PermissionAnalyzer } from "../permission-analyzer";
import { FieldDefinition } from "../types";

describe("PermissionAnalyzer", () => {
  const analyzer = new PermissionAnalyzer();

  const mockFields: FieldDefinition[] = [
    { name: "title", type: "text", required: true },
    { name: "status", type: "text", required: false },
    { name: "User", type: "relation", required: true, relation: { collection: "users" } },
  ];

  describe("extractPermissions", () => {
    it("should extract permissions from valid JSON description", () => {
      const description = JSON.stringify({
        permissions: {
          listRule: '@request.auth.id != ""',
          viewRule: '@request.auth.id != ""',
        },
      });

      const result = analyzer.extractPermissions(description);

      expect(result).not.toBeNull();
      expect(result?.listRule).toBe('@request.auth.id != ""');
      expect(result?.viewRule).toBe('@request.auth.id != ""');
    });

    it("should return null for undefined description", () => {
      const result = analyzer.extractPermissions(undefined);
      expect(result).toBeNull();
    });

    it("should return null for non-JSON description", () => {
      const result = analyzer.extractPermissions("not json");
      expect(result).toBeNull();
    });

    it("should return null for JSON without permissions", () => {
      const description = JSON.stringify({ other: "data" });
      const result = analyzer.extractPermissions(description);
      expect(result).toBeNull();
    });
  });

  describe("resolvePermissions", () => {
    it("should return permission schema as-is when passed directly", () => {
      const permissions: PermissionSchema = {
        listRule: '@request.auth.id != ""',
        viewRule: "User = @request.auth.id",
      };

      const result = analyzer.resolvePermissions(permissions);

      expect(result).toEqual(permissions);
    });

    it("should resolve public template", () => {
      const config: PermissionTemplateConfig = {
        template: "public",
      };

      const result = analyzer.resolvePermissions(config);

      expect(result.listRule).toBe("");
      expect(result.viewRule).toBe("");
      expect(result.createRule).toBe("");
      expect(result.updateRule).toBe("");
      expect(result.deleteRule).toBe("");
    });

    it("should resolve authenticated template", () => {
      const config: PermissionTemplateConfig = {
        template: "authenticated",
      };

      const result = analyzer.resolvePermissions(config);

      expect(result.listRule).toBe('@request.auth.id != ""');
      expect(result.viewRule).toBe('@request.auth.id != ""');
    });

    it("should resolve owner-only template with default field", () => {
      const config: PermissionTemplateConfig = {
        template: "owner-only",
      };

      const result = analyzer.resolvePermissions(config);

      expect(result.listRule).toContain("User = @request.auth.id");
      expect(result.viewRule).toContain("User = @request.auth.id");
    });

    it("should resolve owner-only template with custom field", () => {
      const config: PermissionTemplateConfig = {
        template: "owner-only",
        ownerField: "author",
      };

      const result = analyzer.resolvePermissions(config);

      expect(result.listRule).toContain("author = @request.auth.id");
      expect(result.viewRule).toContain("author = @request.auth.id");
    });

    it("should merge custom rules with template", () => {
      const config: PermissionTemplateConfig = {
        template: "owner-only",
        customRules: {
          listRule: '@request.auth.id != ""', // Override template
        },
      };

      const result = analyzer.resolvePermissions(config);

      expect(result.listRule).toBe('@request.auth.id != ""');
      expect(result.viewRule).toContain("User = @request.auth.id"); // From template
    });
  });

  describe("validatePermissions", () => {
    it("should validate all rules in permission schema", () => {
      const permissions: PermissionSchema = {
        listRule: '@request.auth.id != ""',
        viewRule: "User = @request.auth.id",
        createRule: '@request.auth.id != ""',
      };

      const results = analyzer.validatePermissions("posts", permissions, mockFields, false);

      expect(results.size).toBe(3);
      expect(results.get("listRule")?.valid).toBe(true);
      expect(results.get("viewRule")?.valid).toBe(true);
      expect(results.get("createRule")?.valid).toBe(true);
    });

    it("should detect invalid field references", () => {
      const permissions: PermissionSchema = {
        listRule: 'nonexistent = "value"',
      };

      const results = analyzer.validatePermissions("posts", permissions, mockFields, false);

      const listResult = results.get("listRule");
      expect(listResult?.valid).toBe(false);
      expect(listResult?.errors.length).toBeGreaterThan(0);
    });

    it("should validate manageRule for auth collections", () => {
      const permissions: PermissionSchema = {
        manageRule: '@request.auth.id != ""',
      };

      const results = analyzer.validatePermissions("users", permissions, mockFields, true);

      expect(results.get("manageRule")?.valid).toBe(true);
    });

    it("should not validate manageRule for base collections", () => {
      const permissions: PermissionSchema = {
        manageRule: '@request.auth.id != ""',
      };

      const results = analyzer.validatePermissions("posts", permissions, mockFields, false);

      // manageRule should not be validated for base collections
      expect(results.has("manageRule")).toBe(false);
    });

    it("should only validate defined rules", () => {
      const permissions: PermissionSchema = {
        listRule: '@request.auth.id != ""',
        // other rules undefined
      };

      const results = analyzer.validatePermissions("posts", permissions, mockFields, false);

      expect(results.size).toBe(1);
      expect(results.has("listRule")).toBe(true);
      expect(results.has("viewRule")).toBe(false);
    });
  });

  describe("mergeWithDefaults", () => {
    it("should set undefined rules to null", () => {
      const permissions: PermissionSchema = {
        listRule: '@request.auth.id != ""',
        // other rules undefined
      };

      const result = analyzer.mergeWithDefaults(permissions);

      expect(result.listRule).toBe('@request.auth.id != ""');
      expect(result.viewRule).toBeNull();
      expect(result.createRule).toBeNull();
      expect(result.updateRule).toBeNull();
      expect(result.deleteRule).toBeNull();
      expect(result.manageRule).toBeNull();
    });

    it("should preserve null rules", () => {
      const permissions: PermissionSchema = {
        listRule: null,
        viewRule: "",
      };

      const result = analyzer.mergeWithDefaults(permissions);

      expect(result.listRule).toBeNull();
      expect(result.viewRule).toBe("");
    });

    it("should preserve all defined rules", () => {
      const permissions: PermissionSchema = {
        listRule: "",
        viewRule: '@request.auth.id != ""',
        createRule: "User = @request.auth.id",
        updateRule: null,
        deleteRule: '@request.auth.role = "admin"',
      };

      const result = analyzer.mergeWithDefaults(permissions);

      expect(result.listRule).toBe("");
      expect(result.viewRule).toBe('@request.auth.id != ""');
      expect(result.createRule).toBe("User = @request.auth.id");
      expect(result.updateRule).toBeNull();
      expect(result.deleteRule).toBe('@request.auth.role = "admin"');
      expect(result.manageRule).toBeNull();
    });
  });
});
