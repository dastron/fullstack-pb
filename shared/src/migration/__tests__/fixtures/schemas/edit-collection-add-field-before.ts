/**
 * Fixture: Edit Collection Add Field (Before State)
 *
 * Purpose: Represents the initial state of a collection before adding a field
 *
 * Expected Behavior:
 * - Collection exists with only base fields (id, created, updated)
 * - No custom fields present
 * - Collection has null permissions (superuser-only access)
 *
 * Validates Requirements: 2.1
 */

import { z } from "zod";
import { withPermissions } from "../../../../schema/base";

// Empty input schema - no custom fields yet
export const EditCollectionAddFieldBeforeInputSchema = z.object({});

export const EditCollectionAddFieldBeforeSchema = withPermissions(
  EditCollectionAddFieldBeforeInputSchema.extend({
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

export const editCollectionAddFieldBeforeName = "edit_collection_add_field";
export const editCollectionAddFieldBeforeType = "base" as const;
export const editCollectionAddFieldBeforeId = "pbc_2980259303";
