/**
 * Permission schema types and interfaces for PocketBase API rules
 *
 * This module defines the core types for managing collection-level permissions
 * that control access to list, view, create, update, delete, and manage operations.
 */

/**
 * PocketBase API rule types
 *
 * Each rule type corresponds to a specific API operation:
 * - listRule: Controls who can list/query records
 * - viewRule: Controls who can view individual records
 * - createRule: Controls who can create new records
 * - updateRule: Controls who can update existing records
 * - deleteRule: Controls who can delete records
 * - manageRule: Controls who can manage auth records (auth collections only)
 */
export type APIRuleType = "listRule" | "viewRule" | "createRule" | "updateRule" | "deleteRule" | "manageRule"; // Only for auth collections

/**
 * Rule expression - can be null (locked), empty string (public), or filter expression
 *
 * - null: Locked to superusers only
 * - "" (empty string): Public access - anyone can perform the operation
 * - string: Filter expression using PocketBase syntax (e.g., "@request.auth.id != ''")
 */
export type RuleExpression = string | null;

/**
 * Permission schema definition
 *
 * Defines the complete set of API rules for a collection.
 * All fields are optional - undefined rules will default to null (locked).
 */
export interface PermissionSchema {
  listRule?: RuleExpression;
  viewRule?: RuleExpression;
  createRule?: RuleExpression;
  updateRule?: RuleExpression;
  deleteRule?: RuleExpression;
  manageRule?: RuleExpression; // Only valid for auth collections
}

/**
 * Permission template types for common patterns
 *
 * Predefined templates that generate standard permission configurations:
 * - public: All operations are publicly accessible
 * - authenticated: Requires user authentication for all operations
 * - owner-only: Users can only manage their own records
 * - admin-only: Only admin/superusers can perform operations
 * - read-public: Public read access, authenticated write access
 * - custom: Fully custom rules defined by the developer
 */
export type PermissionTemplate =
  | "public" // All operations public
  | "authenticated" // Requires authentication
  | "owner-only" // Owner can manage their own records
  | "admin-only" // Only admins/superusers
  | "read-public" // Public read, authenticated write
  | "custom"; // Custom rules

/**
 * Template configuration
 *
 * Configuration object for applying permission templates with customization options.
 * Allows templates to be parameterized (e.g., specifying the owner field name)
 * and overridden with custom rules.
 */
export interface PermissionTemplateConfig {
  /** The template to apply */
  template: PermissionTemplate;

  /** Field name for owner relation (default: 'User') - used with 'owner-only' template */
  ownerField?: string;

  /** Field name for role checking - used with 'admin-only' template */
  roleField?: string;

  /** Custom rules that override template-generated rules */
  customRules?: Partial<PermissionSchema>;
}
