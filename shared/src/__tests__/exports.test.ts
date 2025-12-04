/**
 * Test to verify all permission-related exports are accessible
 */
import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  PermissionTemplates,
  resolveTemplate,
  withPermissions,
  type APIRuleType,
  type PermissionSchema,
  type PermissionTemplate,
  type PermissionTemplateConfig,
  type RuleExpression,
} from "../schema/index";

describe("Permission Exports", () => {
  it("should export withPermissions helper", () => {
    expect(withPermissions).toBeDefined();
    expect(typeof withPermissions).toBe("function");
  });

  it("should export PermissionTemplates", () => {
    expect(PermissionTemplates).toBeDefined();
    expect(typeof PermissionTemplates.public).toBe("function");
    expect(typeof PermissionTemplates.authenticated).toBe("function");
    expect(typeof PermissionTemplates.ownerOnly).toBe("function");
    expect(typeof PermissionTemplates.adminOnly).toBe("function");
    expect(typeof PermissionTemplates.readPublic).toBe("function");
  });

  it("should export resolveTemplate function", () => {
    expect(resolveTemplate).toBeDefined();
    expect(typeof resolveTemplate).toBe("function");
  });

  it("should allow using withPermissions with a schema", () => {
    const testSchema = z.object({
      title: z.string(),
      User: z.string(),
    });

    const schemaWithPermissions = withPermissions(testSchema, {
      template: "owner-only",
      ownerField: "User",
    });

    expect(schemaWithPermissions).toBeDefined();
    expect(schemaWithPermissions._def.description).toBeDefined();
  });

  it("should allow using PermissionTemplates directly", () => {
    const publicRules = PermissionTemplates.public();
    expect(publicRules.listRule).toBe("");
    expect(publicRules.viewRule).toBe("");
    expect(publicRules.createRule).toBe("");

    const authRules = PermissionTemplates.authenticated();
    expect(authRules.listRule).toBe('@request.auth.id != ""');

    const ownerRules = PermissionTemplates.ownerOnly("User");
    expect(ownerRules.listRule).toContain("User = @request.auth.id");
  });

  it("should allow using resolveTemplate", () => {
    const config: PermissionTemplateConfig = {
      template: "owner-only",
      ownerField: "User",
      customRules: {
        listRule: '@request.auth.id != ""',
      },
    };

    const resolved = resolveTemplate(config);
    expect(resolved.listRule).toBe('@request.auth.id != ""');
    expect(resolved.viewRule).toContain("User = @request.auth.id");
  });

  it("should allow type usage", () => {
    // This test verifies that types are properly exported and can be used
    const schema: PermissionSchema = {
      listRule: '@request.auth.id != ""',
      viewRule: null,
      createRule: "",
    };

    const ruleType: APIRuleType = "listRule";
    const expression: RuleExpression = '@request.auth.id != ""';
    const template: PermissionTemplate = "owner-only";

    expect(schema).toBeDefined();
    expect(ruleType).toBe("listRule");
    expect(expression).toBe('@request.auth.id != ""');
    expect(template).toBe("owner-only");
  });
});
