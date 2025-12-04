import { PermissionSchema, PermissionTemplateConfig } from "./permissions";

/**
 * Predefined permission templates for common access control patterns
 */
export const PermissionTemplates = {
  /**
   * Public access - anyone can perform all operations
   */
  public: (): PermissionSchema => ({
    listRule: "",
    viewRule: "",
    createRule: "",
    updateRule: "",
    deleteRule: "",
  }),

  /**
   * Authenticated users only - requires valid authentication for all operations
   */
  authenticated: (): PermissionSchema => ({
    listRule: '@request.auth.id != ""',
    viewRule: '@request.auth.id != ""',
    createRule: '@request.auth.id != ""',
    updateRule: '@request.auth.id != ""',
    deleteRule: '@request.auth.id != ""',
  }),

  /**
   * Owner-only access - users can only manage their own records
   * @param ownerField - Name of the relation field pointing to user (default: 'User')
   */
  ownerOnly: (ownerField: string = "User"): PermissionSchema => ({
    listRule: `@request.auth.id != "" && ${ownerField} = @request.auth.id`,
    viewRule: `@request.auth.id != "" && ${ownerField} = @request.auth.id`,
    createRule: '@request.auth.id != ""',
    updateRule: `@request.auth.id != "" && ${ownerField} = @request.auth.id`,
    deleteRule: `@request.auth.id != "" && ${ownerField} = @request.auth.id`,
  }),

  /**
   * Admin/superuser only access
   * Assumes a 'role' field exists with 'admin' value
   * @param roleField - Name of the role field (default: 'role')
   */
  adminOnly: (roleField: string = "role"): PermissionSchema => ({
    listRule: `@request.auth.id != "" && @request.auth.${roleField} = "admin"`,
    viewRule: `@request.auth.id != "" && @request.auth.${roleField} = "admin"`,
    createRule: `@request.auth.id != "" && @request.auth.${roleField} = "admin"`,
    updateRule: `@request.auth.id != "" && @request.auth.${roleField} = "admin"`,
    deleteRule: `@request.auth.id != "" && @request.auth.${roleField} = "admin"`,
  }),

  /**
   * Public read, authenticated write
   * Anyone can list/view, but only authenticated users can create/update/delete
   */
  readPublic: (): PermissionSchema => ({
    listRule: "",
    viewRule: "",
    createRule: '@request.auth.id != ""',
    updateRule: '@request.auth.id != ""',
    deleteRule: '@request.auth.id != ""',
  }),
};

/**
 * Resolve template configuration to concrete permission schema
 * @param config - Template configuration or direct permission schema
 * @returns Resolved permission schema with all rules defined
 */
export function resolveTemplate(config: PermissionTemplateConfig): PermissionSchema {
  let baseRules: PermissionSchema;

  switch (config.template) {
    case "public":
      baseRules = PermissionTemplates.public();
      break;
    case "authenticated":
      baseRules = PermissionTemplates.authenticated();
      break;
    case "owner-only":
      baseRules = PermissionTemplates.ownerOnly(config.ownerField);
      break;
    case "admin-only":
      baseRules = PermissionTemplates.adminOnly(config.roleField);
      break;
    case "read-public":
      baseRules = PermissionTemplates.readPublic();
      break;
    case "custom":
      baseRules = {};
      break;
    default:
      // Exhaustive check - TypeScript will error if we miss a template type
      const _exhaustive: never = config.template;
      throw new Error(`Unknown template type: ${_exhaustive}`);
  }

  // Merge with custom rules if provided (custom rules override template rules)
  return {
    ...baseRules,
    ...config.customRules,
  };
}
