import { z } from "zod";
import type { PermissionSchema, PermissionTemplateConfig } from "./permissions";

export const baseSchema = {
  id: z.string().describe("unique id"),
  collectionId: z.string().describe("collection id"),
  collectionName: z.string().describe("collection name"),
  expand: z.record(z.any()).describe("expandable fields"),
};

export const baseImageFileSchema = {
  ...baseSchema,
  thumbnailURL: z.string().optional(),
  imageFiles: z.array(z.string()),
};

export const inputImageFileSchema = {
  imageFiles: z.array(z.instanceof(File)),
};

export const omitImageFilesSchema = {
  imageFiles: true,
} as const;

/**
 * Attach permission metadata to a Zod schema
 *
 * This helper function allows you to define PocketBase API rules alongside your
 * entity schema definitions. The permissions are stored as metadata using Zod's
 * describe() method and will be extracted during migration generation.
 *
 * @param schema - The Zod schema to attach permissions to
 * @param config - Either a PermissionTemplateConfig (for template-based permissions)
 *                 or a PermissionSchema (for custom permissions)
 * @returns The schema with permission metadata attached
 *
 * @example
 * // Using a template
 * const ProjectSchema = withPermissions(
 *   z.object({ title: z.string(), User: z.string() }),
 *   { template: 'owner-only', ownerField: 'User' }
 * );
 *
 * @example
 * // Using custom rules
 * const ProjectSchema = withPermissions(
 *   z.object({ title: z.string() }),
 *   { listRule: '@request.auth.id != ""', viewRule: '' }
 * );
 *
 * @example
 * // Using template with custom rule overrides
 * const ProjectSchema = withPermissions(
 *   z.object({ title: z.string(), User: z.string() }),
 *   {
 *     template: 'owner-only',
 *     ownerField: 'User',
 *     customRules: { listRule: '@request.auth.id != ""' }
 *   }
 * );
 */
export function withPermissions<T extends z.ZodTypeAny>(
  schema: T,
  config: PermissionTemplateConfig | PermissionSchema
): T {
  // Create metadata object with permissions config directly
  // The PermissionAnalyzer will handle resolving templates vs direct schemas
  const metadata = {
    permissions: config,
  };

  // Attach permission metadata to schema using Zod's describe() method
  // The metadata is serialized as JSON and stored in the schema's description
  return schema.describe(JSON.stringify(metadata)) as T;
}

/**
 * Attach index definitions to a Zod schema
 *
 * This helper function allows you to define PocketBase indexes alongside your
 * entity schema definitions. The indexes are stored as metadata using Zod's
 * describe() method and will be extracted during migration generation.
 *
 * @param schema - The Zod schema to attach indexes to
 * @param indexes - Array of PocketBase index SQL statements
 * @returns The schema with index metadata attached
 *
 * @example
 * // Define indexes for a user schema
 * const UserSchema = withIndexes(
 *   withPermissions(
 *     z.object({ name: z.string(), email: z.string().email() }),
 *     userPermissions
 *   ),
 *   [
 *     'CREATE UNIQUE INDEX idx_users_email ON users (email)',
 *     'CREATE INDEX idx_users_name ON users (name)'
 *   ]
 * );
 *
 * @example
 * // Single index
 * const ProjectSchema = withIndexes(
 *   ProjectDatabaseSchema,
 *   ['CREATE INDEX idx_projects_status ON projects (status)']
 * );
 */
export function withIndexes<T extends z.ZodTypeAny>(schema: T, indexes: string[]): T {
  // Extract existing metadata if present
  let existingMetadata: any = {};

  if (schema.description) {
    try {
      existingMetadata = JSON.parse(schema.description);
    } catch {
      // If description is not JSON, ignore it
    }
  }

  // Merge indexes with existing metadata
  const metadata = {
    ...existingMetadata,
    indexes,
  };

  // Attach metadata to schema using Zod's describe() method
  return schema.describe(JSON.stringify(metadata)) as T;
}
