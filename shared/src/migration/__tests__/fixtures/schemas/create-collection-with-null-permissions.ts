/**
 * Fixture: Collection with Null Permissions
 *
 * Purpose: Tests that the migration generator correctly handles null permissions (superuser-only access)
 *
 * Expected Behavior:
 * - Generates a collection with all API rules set to null
 * - Null values indicate superuser-only access (locked)
 * - All standard CRUD operations require superuser privileges
 *
 * Validates Requirements: 4.1
 */

import type { CollectionSchema, FieldDefinition } from "../../../types";

export const createCollectionWithNullPermissionsName = "create_new_collection_with_null_permissions";
export const createCollectionWithNullPermissionsType = "base" as const;

export const createCollectionWithNullPermissionsFields: FieldDefinition[] = [
  {
    name: "title",
    type: "text",
    required: true,
    options: {
      min: 0,
      max: 200,
      pattern: "",
      autogeneratePattern: "",
      primaryKey: false,
    },
  },
  {
    name: "description",
    type: "text",
    required: false,
    options: {
      min: 0,
      max: 0,
      pattern: "",
      autogeneratePattern: "",
      primaryKey: false,
    },
  },
];

export const CreateCollectionWithNullPermissionsSchema: CollectionSchema = {
  name: createCollectionWithNullPermissionsName,
  type: createCollectionWithNullPermissionsType,
  fields: createCollectionWithNullPermissionsFields,
  indexes: [],
  permissions: {
    listRule: null,
    viewRule: null,
    createRule: null,
    updateRule: null,
    deleteRule: null,
  },
};
