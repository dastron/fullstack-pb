/**
 * Fixture: Collection with Unrestricted API Rules
 *
 * Purpose: Tests that the migration generator correctly handles unrestricted permissions (empty string rules)
 *
 * Expected Behavior:
 * - Generates a collection with all API rules set to empty strings ("")
 * - Empty string rules allow anyone to perform the action (unrestricted access)
 * - Rules are not null (which would be superuser-only)
 *
 * Validates Requirements: 1.4, 4.2
 */

import type { CollectionSchema } from "../../../types";

export const createCollectionWithUnrestrictedApiRulesName = "create_new_collection_with_unrestricted_api_rules";
export const createCollectionWithUnrestrictedApiRulesType = "base" as const;

export const CreateCollectionWithUnrestrictedApiRulesSchema: CollectionSchema = {
  name: createCollectionWithUnrestrictedApiRulesName,
  type: createCollectionWithUnrestrictedApiRulesType,
  fields: [], // No custom fields
  indexes: [],
  permissions: {
    listRule: "",
    viewRule: "",
    createRule: "",
    updateRule: "",
    deleteRule: "",
  },
};
