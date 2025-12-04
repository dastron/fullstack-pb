/**
 * Fixture: Collection with Unique Index
 *
 * Purpose: Tests that the migration generator correctly handles unique index definitions
 *
 * Expected Behavior:
 * - Generates a collection with a text field that has a unique index
 * - Index SQL statement includes UNIQUE keyword
 * - Index is properly formatted in the indexes array
 *
 * Validates Requirements: 1.3, 5.1
 */

import type { CollectionSchema, FieldDefinition } from "../../../types";

export const createCollectionWithUniqueIndexName = "create_new_collection_with_unique_index";
export const createCollectionWithUniqueIndexType = "base" as const;

export const createCollectionWithUniqueIndexFields: FieldDefinition[] = [
  {
    name: "indexed_column",
    type: "text",
    required: false,
    options: {},
  },
];

export const CreateCollectionWithUniqueIndexSchema: CollectionSchema = {
  name: createCollectionWithUniqueIndexName,
  type: createCollectionWithUniqueIndexType,
  fields: createCollectionWithUniqueIndexFields,
  indexes: ["CREATE UNIQUE INDEX `idx_cGTIAGN7YU` ON `create_new_collection_with_unique_index` (`indexed_column`)"],
  permissions: {
    listRule: null,
    viewRule: null,
    createRule: null,
    updateRule: null,
    deleteRule: null,
  },
};
