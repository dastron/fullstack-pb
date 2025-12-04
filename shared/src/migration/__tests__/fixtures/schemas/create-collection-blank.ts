/**
 * Fixture: Blank Collection
 *
 * Purpose: Tests that the migration generator correctly handles a minimal collection with only base fields
 *
 * Expected Behavior:
 * - Generates a collection with only id, created, and updated fields
 * - No custom fields are added
 * - Collection has null permissions (superuser-only access)
 *
 * Validates Requirements: 1.2
 */

import type { CollectionSchema } from "../../../types";

export const createCollectionBlankName = "create_new_collection_blank";
export const createCollectionBlankType = "base" as const;

export const CreateCollectionBlankSchema: CollectionSchema = {
  name: createCollectionBlankName,
  type: createCollectionBlankType,
  fields: [], // No custom fields - only base fields (id, created, updated) will be added by PocketBase
  indexes: [],
  permissions: {
    listRule: null,
    viewRule: null,
    createRule: null,
    updateRule: null,
    deleteRule: null,
  },
};
