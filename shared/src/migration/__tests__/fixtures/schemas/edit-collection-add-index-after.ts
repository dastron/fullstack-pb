/**
 * Fixture: Edit Collection Add Index (After State)
 *
 * Purpose: Represents the state of a collection after adding a field and an index
 *
 * Expected Behavior:
 * - Collection has base fields plus a new number field "add_number_column"
 * - Field is added at position 1 (after id, before created)
 * - Index is created on the new number field
 * - Migration uses collection.fields.addAt() and unmarshal() for index
 *
 * Validates Requirements: 2.2, 5.4
 */

import { z } from "zod";
import { withIndexes, withPermissions } from "../../../../schema/base";

// Input schema with the new number field
export const EditCollectionAddIndexAfterInputSchema = z.object({
  add_number_column: z.number().optional(),
});

// Apply both permissions and indexes
const schemaWithPermissions = withPermissions(
  EditCollectionAddIndexAfterInputSchema.extend({
    id: z.string(),
    created: z.string().datetime(),
    updated: z.string().datetime(),
  }),
  {
    listRule: null,
    viewRule: null,
    createRule: null,
    updateRule: null,
    deleteRule: null,
  }
);

export const EditCollectionAddIndexAfterSchema = withIndexes(schemaWithPermissions, [
  "CREATE INDEX `idx_gSNqhBRErC` ON `edit_collection_add_index` (`add_number_column`)",
]);

export const editCollectionAddIndexAfterName = "edit_collection_add_index";
export const editCollectionAddIndexAfterType = "base" as const;
export const editCollectionAddIndexAfterId = "pbc_1780811710";
