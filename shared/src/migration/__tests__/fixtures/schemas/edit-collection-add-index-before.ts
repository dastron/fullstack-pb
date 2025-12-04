/**
 * Fixture: Edit Collection Add Index (Before State)
 *
 * Purpose: Represents the initial state of a collection before adding an index
 *
 * Expected Behavior:
 * - Collection exists with only base fields (id, created, updated)
 * - No custom fields present
 * - No indexes defined
 * - Collection has null permissions (superuser-only access)
 *
 * Validates Requirements: 2.2, 5.4
 */

import { z } from "zod";
import { withPermissions } from "../../../../schema/base";

// Empty input schema - no custom fields yet
export const EditCollectionAddIndexBeforeInputSchema = z.object({});

export const EditCollectionAddIndexBeforeSchema = withPermissions(
  EditCollectionAddIndexBeforeInputSchema.extend({
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

export const editCollectionAddIndexBeforeName = "edit_collection_add_index";
export const editCollectionAddIndexBeforeType = "base" as const;
export const editCollectionAddIndexBeforeId = "pbc_1780811710";
