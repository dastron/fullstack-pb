/**
 * Fixture: Auth Collection with Manage Rule
 *
 * Purpose: Tests that the migration generator correctly handles auth collections with all six rules including manageRule
 *
 * Expected Behavior:
 * - Generates an auth collection with all six API rules (listRule, viewRule, createRule, updateRule, deleteRule, manageRule)
 * - Auth collections have special system fields (email, emailVisibility, verified, password, tokenKey)
 * - manageRule controls user-to-user management permissions
 *
 * Validates Requirements: 4.4
 */

import type { CollectionSchema, FieldDefinition } from "../../../types";

export const createAuthCollectionWithManageRuleName = "test_auth_users";
export const createAuthCollectionWithManageRuleType = "auth" as const;

export const createAuthCollectionWithManageRuleFields: FieldDefinition[] = [
  {
    name: "name",
    type: "text",
    required: false,
    options: {
      min: 0,
      max: 100,
      pattern: "",
      autogeneratePattern: "",
      primaryKey: false,
    },
  },
];

export const CreateAuthCollectionWithManageRuleSchema: CollectionSchema = {
  name: createAuthCollectionWithManageRuleName,
  type: createAuthCollectionWithManageRuleType,
  fields: createAuthCollectionWithManageRuleFields,
  indexes: [],
  permissions: {
    listRule: "id = @request.auth.id",
    viewRule: "id = @request.auth.id",
    createRule: "",
    updateRule: "id = @request.auth.id",
    deleteRule: "id = @request.auth.id",
    manageRule: "id = @request.auth.id",
  },
};
