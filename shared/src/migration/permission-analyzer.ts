/**
 * Permission analyzer for extracting and validating permissions from Zod schemas
 *
 * This module provides utilities to:
 * - Extract permission metadata from Zod schema descriptions
 * - Resolve template configurations to concrete permission schemas
 * - Validate permission rules against collection fields
 * - Merge permissions with default values
 */

import { resolveTemplate } from "../schema/permission-templates";
import { APIRuleType, PermissionSchema, PermissionTemplateConfig } from "../schema/permissions";
import { RuleValidationResult, RuleValidator } from "./rule-validator";
import { FieldDefinition } from "./types";

/**
 * Extract and analyze permissions from schema
 *
 * The PermissionAnalyzer class provides methods to work with permission
 * definitions attached to Zod schemas, including extraction, resolution,
 * validation, and normalization.
 */
export class PermissionAnalyzer {
  /**
   * Extract permission metadata from Zod schema description
   *
   * Zod schemas can have permission metadata attached via the describe() method.
   * This method parses the description and extracts the permission configuration.
   *
   * @param schemaDescription - The Zod schema description string
   * @returns Permission schema if found, null otherwise
   *
   * @example
   * ```typescript
   * const analyzer = new PermissionAnalyzer();
   * const permissions = analyzer.extractPermissions(schema.description);
   * ```
   */
  extractPermissions(schemaDescription: string | undefined): PermissionSchema | null {
    if (!schemaDescription) {
      return null;
    }

    try {
      const metadata = JSON.parse(schemaDescription);
      if (metadata.permissions) {
        return metadata.permissions;
      }
    } catch {
      // Not JSON or no permissions - this is expected for schemas without permissions
      return null;
    }

    return null;
  }

  /**
   * Resolve template configuration to concrete rules
   *
   * Takes either a template configuration or a direct permission schema
   * and returns a fully resolved permission schema with all rules defined.
   *
   * If the input is already a permission schema (has rule properties),
   * it's returned as-is. Otherwise, the template is resolved using the
   * template resolver.
   *
   * @param config - Template configuration or direct permission schema
   * @returns Resolved permission schema
   *
   * @example
   * ```typescript
   * const analyzer = new PermissionAnalyzer();
   *
   * // Resolve from template
   * const permissions = analyzer.resolvePermissions({
   *   template: 'owner-only',
   *   ownerField: 'User'
   * });
   *
   * // Or pass direct schema
   * const permissions = analyzer.resolvePermissions({
   *   listRule: '@request.auth.id != ""',
   *   viewRule: '@request.auth.id != ""'
   * });
   * ```
   */
  resolvePermissions(config: PermissionTemplateConfig | PermissionSchema): PermissionSchema {
    // If it's already a permission schema (has rule properties), return as-is
    if (
      "listRule" in config ||
      "viewRule" in config ||
      "createRule" in config ||
      "updateRule" in config ||
      "deleteRule" in config ||
      "manageRule" in config
    ) {
      return config as PermissionSchema;
    }

    // Otherwise resolve template
    return resolveTemplate(config as PermissionTemplateConfig);
  }

  /**
   * Validate all rules in a permission schema
   *
   * Validates each rule in the permission schema against the collection's
   * field definitions. Returns a map of validation results keyed by rule type.
   *
   * Only validates rules that are defined (not undefined). Undefined rules
   * are treated as null (locked) by default.
   *
   * @param collectionName - Name of the collection being validated
   * @param permissions - Permission schema to validate
   * @param fields - Collection field definitions
   * @param isAuthCollection - Whether this is an auth collection (allows manageRule)
   * @returns Map of validation results by rule type
   *
   * @example
   * ```typescript
   * const analyzer = new PermissionAnalyzer();
   * const results = analyzer.validatePermissions(
   *   'posts',
   *   { listRule: '@request.auth.id != ""', viewRule: 'author = @request.auth.id' },
   *   fields,
   *   false
   * );
   *
   * for (const [ruleType, result] of results) {
   *   if (!result.valid) {
   *     console.error(`${ruleType} validation failed:`, result.errors);
   *   }
   * }
   * ```
   */
  validatePermissions(
    collectionName: string,
    permissions: PermissionSchema,
    fields: FieldDefinition[],
    isAuthCollection: boolean = false
  ): Map<APIRuleType, RuleValidationResult> {
    const validator = new RuleValidator(collectionName, fields, isAuthCollection);
    const results = new Map<APIRuleType, RuleValidationResult>();

    // Define all possible rule types
    const ruleTypes: APIRuleType[] = ["listRule", "viewRule", "createRule", "updateRule", "deleteRule"];

    // Add manageRule for auth collections
    if (isAuthCollection) {
      ruleTypes.push("manageRule");
    }

    // Validate each defined rule
    for (const ruleType of ruleTypes) {
      const expression = permissions[ruleType];
      if (expression !== undefined) {
        results.set(ruleType, validator.validate(ruleType, expression));
      }
    }

    return results;
  }

  /**
   * Merge permissions with defaults
   *
   * Ensures all rule types have a defined value. Undefined rules are set
   * to null (locked to superusers only), which is the PocketBase default.
   *
   * This is useful when generating migrations to ensure all rules are
   * explicitly set in the collection configuration.
   *
   * @param permissions - Permission schema (may have undefined rules)
   * @returns Permission schema with all rules defined (null if not specified)
   *
   * @example
   * ```typescript
   * const analyzer = new PermissionAnalyzer();
   * const merged = analyzer.mergeWithDefaults({
   *   listRule: '@request.auth.id != ""'
   *   // other rules undefined
   * });
   *
   * // Result:
   * // {
   * //   listRule: '@request.auth.id != ""',
   * //   viewRule: null,
   * //   createRule: null,
   * //   updateRule: null,
   * //   deleteRule: null,
   * //   manageRule: null
   * // }
   * ```
   */
  mergeWithDefaults(permissions: PermissionSchema): PermissionSchema {
    return {
      listRule: permissions.listRule ?? null,
      viewRule: permissions.viewRule ?? null,
      createRule: permissions.createRule ?? null,
      updateRule: permissions.updateRule ?? null,
      deleteRule: permissions.deleteRule ?? null,
      manageRule: permissions.manageRule ?? null,
    };
  }
}
