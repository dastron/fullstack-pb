/**
 * Fixture: Collection with Restricted API Rules
 *
 * Purpose: Tests that the migration generator correctly handles restricted permissions with filter expressions
 *
 * Expected Behavior:
 * - Generates a collection with API rules containing PocketBase filter expressions
 * - Filter expressions are preserved exactly as defined
 * - Rules reference relation fields (user_relationship_column)
 * - Different rules for different operations (create vs list/view/update/delete)
 *
 * Validates Requirements: 1.5, 4.3
 */

import type { CollectionSchema, FieldDefinition } from "../../../types";

export const createCollectionWithRestrictedApiRulesName = "create_new_collection_with_restricted_api_rules";
export const createCollectionWithRestrictedApiRulesType = "base" as const;

export const createCollectionWithRestrictedApiRulesFields: FieldDefinition[] = [
  {
    name: "user_relationship_column",
    type: "relation",
    required: false,
    options: {},
    relation: {
      collection: "users",
      maxSelect: 1,
      minSelect: 0,
      cascadeDelete: false,
    },
  },
];

export const CreateCollectionWithRestrictedApiRulesSchema: CollectionSchema = {
  name: createCollectionWithRestrictedApiRulesName,
  type: createCollectionWithRestrictedApiRulesType,
  fields: createCollectionWithRestrictedApiRulesFields,
  indexes: [],
  permissions: {
    listRule: "@request.auth.id = user_relationship_column.id",
    viewRule: "@request.auth.id = user_relationship_column.id",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id = user_relationship_column.id",
    deleteRule: "@request.auth.id = user_relationship_column.id",
  },
};
