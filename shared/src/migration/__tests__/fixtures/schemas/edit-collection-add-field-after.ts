/**
 * Fixture: Edit Collection Add Field (After State)
 *
 * Purpose: Represents the state of a collection after adding a text field
 *
 * Expected Behavior:
 * - Collection has base fields plus a new text field "add_text_column"
 * - Field is added at position 1 (after id, before created)
 * - Migration uses collection.fields.addAt() method
 *
 * Validates Requirements: 2.1
 */

import { z } from "zod";
import { withPermissions } from "../../../../schema/base";

// Input schema with the new text field
export const EditCollectionAddFieldAfterInputSchema = z.object({
  add_text_column: z.string().optional(),
});

export const EditCollectionAddFieldAfterSchema = withPermissions(
  EditCollectionAddFieldAfterInputSchema.extend({
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

export const editCollectionAddFieldAfterName = "edit_collection_add_field";
export const editCollectionAddFieldAfterType = "base" as const;
export const editCollectionAddFieldAfterId = "pbc_2980259303";
