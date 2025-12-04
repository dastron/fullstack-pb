/**
 * Schema Analyzer - Parses Zod schemas and extracts field definitions
 */

import * as fs from "fs";
import * as path from "path";
import { z } from "zod";
import type { PermissionSchema } from "../schema/permissions";
import { FileSystemError, SchemaParsingError } from "./errors";
import { PermissionAnalyzer } from "./permission-analyzer";
import type { CollectionSchema, FieldDefinition, SchemaDefinition } from "./types";
import { toCollectionName } from "./utils/pluralize";
import { getMaxSelect, getMinSelect, isRelationField, resolveTargetCollection } from "./utils/relation-detector";
import { extractFieldOptions, isFieldRequired, mapZodTypeToPocketBase } from "./utils/type-mapper";

/**
 * Discovers schema files in the specified directory
 * Filters out base.ts and index.ts files
 *
 * @param schemaDir - Path to the schema directory
 * @returns Array of schema file paths (without extension)
 */
export function discoverSchemaFiles(schemaDir: string): string[] {
  try {
    if (!fs.existsSync(schemaDir)) {
      throw new FileSystemError(`Schema directory not found: ${schemaDir}`, schemaDir, "access", "ENOENT");
    }

    const files = fs.readdirSync(schemaDir);

    // Filter for .ts files, excluding base.ts, index.ts, and permission-related files
    const schemaFiles = files.filter((file) => {
      const isTypeScript = file.endsWith(".ts");
      const isNotBase = file !== "base.ts";
      const isNotIndex = file !== "index.ts";
      const isNotPermissions = file !== "permissions.ts";
      const isNotPermissionTemplates = file !== "permission-templates.ts";

      return isTypeScript && isNotBase && isNotIndex && isNotPermissions && isNotPermissionTemplates;
    });

    // Return full paths without extension (for dynamic import)
    return schemaFiles.map((file) => path.join(schemaDir, file.replace(/\.ts$/, "")));
  } catch (error) {
    if (error instanceof FileSystemError) {
      throw error;
    }

    const fsError = error as NodeJS.ErrnoException;
    if (fsError.code === "EACCES" || fsError.code === "EPERM") {
      throw new FileSystemError(
        `Permission denied reading schema directory: ${schemaDir}`,
        schemaDir,
        "read",
        fsError.code,
        error as Error
      );
    }

    throw new FileSystemError(
      `Failed to read schema directory: ${schemaDir}`,
      schemaDir,
      "read",
      fsError.code,
      error as Error
    );
  }
}

/**
 * Dynamically imports a schema module
 *
 * @param filePath - Path to the schema file (without extension)
 * @returns The imported module
 */
export async function importSchemaModule(filePath: string): Promise<any> {
  try {
    // For ESM, we need to add .js extension even if source is .ts
    const importPath = filePath.endsWith(".js") ? filePath : `${filePath}.js`;

    // Convert to file URL for proper ESM import
    const fileUrl = new URL(`file://${path.resolve(importPath)}`);

    // Use dynamic import to load the module
    const module = await import(fileUrl.href);
    return module;
  } catch (error) {
    throw new SchemaParsingError(
      `Failed to import schema module. Make sure the schema files are compiled to JavaScript.`,
      filePath,
      error as Error
    );
  }
}

/**
 * Gets the collection name from a schema file path
 * Converts the filename (without extension) to a pluralized collection name
 *
 * @param filePath - Path to the schema file (with or without extension)
 * @returns The collection name
 */
export function getCollectionNameFromFile(filePath: string): string {
  // Remove both .ts and .js extensions if present
  const filename = path.basename(filePath).replace(/\.(ts|js)$/, "");
  return toCollectionName(filename);
}

/**
 * Extracts Zod schema definitions from a module
 * Looks for schemas ending with "Schema" or "InputSchema"
 *
 * @param module - The imported schema module
 * @returns Object containing found schemas
 */
export function extractSchemaDefinitions(module: any): { inputSchema?: z.ZodObject<any>; schema?: z.ZodObject<any> } {
  const result: { inputSchema?: z.ZodObject<any>; schema?: z.ZodObject<any> } = {};

  // Look for InputSchema and Schema exports
  for (const [key, value] of Object.entries(module)) {
    // Check if it's a Zod schema
    if (value instanceof z.ZodObject) {
      if (key.endsWith("InputSchema")) {
        result.inputSchema = value as z.ZodObject<any>;
      } else if (key.endsWith("Schema") && !key.endsWith("InputSchema")) {
        result.schema = value as z.ZodObject<any>;
      }
    }
  }

  return result;
}

/**
 * Identifies whether to use InputSchema or Schema pattern
 * Prefers Schema over InputSchema as it includes base fields
 *
 * @param schemas - Object containing inputSchema and/or schema
 * @returns The schema to use for collection definition
 */
export function selectSchemaForCollection(schemas: {
  inputSchema?: z.ZodObject<any>;
  schema?: z.ZodObject<any>;
}): z.ZodObject<any> | null {
  // Prefer the full Schema over InputSchema as it includes base fields
  if (schemas.schema) {
    return schemas.schema;
  }

  if (schemas.inputSchema) {
    return schemas.inputSchema;
  }

  return null;
}

/**
 * Extracts field definitions from a Zod object schema
 * Filters out base schema fields (id, collectionId, created, updated, expand)
 *
 * @param zodSchema - The Zod object schema
 * @returns Array of field names and their Zod types
 */
export function extractFieldDefinitions(zodSchema: z.ZodObject<any>): Array<{ name: string; zodType: z.ZodTypeAny }> {
  const shape = zodSchema.shape;
  const fields: Array<{ name: string; zodType: z.ZodTypeAny }> = [];

  // Base schema fields to exclude (these are system fields in PocketBase)
  const baseFields = ["id", "collectionId", "collectionName", "created", "updated", "expand"];

  // Additional fields to exclude (image file handling fields)
  const excludeFields = ["thumbnailURL", "imageFiles"];

  for (const [fieldName, zodType] of Object.entries(shape)) {
    // Skip base schema fields and special fields
    if (!baseFields.includes(fieldName) && !excludeFields.includes(fieldName)) {
      fields.push({ name: fieldName, zodType: zodType as z.ZodTypeAny });
    }
  }

  return fields;
}

/**
 * Detects if a collection is an auth collection
 * Auth collections have email and password fields
 *
 * @param fields - Array of field definitions
 * @returns True if the collection is an auth collection
 */
export function isAuthCollection(fields: Array<{ name: string; zodType: z.ZodTypeAny }>): boolean {
  const fieldNames = fields.map((f) => f.name.toLowerCase());

  // Auth collections must have both email and password fields
  const hasEmail = fieldNames.includes("email");
  const hasPassword = fieldNames.includes("password");

  return hasEmail && hasPassword;
}

/**
 * Extracts validation constraints from Zod type
 * Includes min, max, required, unique, and other options
 *
 * @param fieldName - The field name
 * @param zodType - The Zod type
 * @returns Field definition with constraints
 */
export function buildFieldDefinition(fieldName: string, zodType: z.ZodTypeAny): FieldDefinition {
  let fieldType = mapZodTypeToPocketBase(zodType, fieldName);
  const required = isFieldRequired(zodType);
  const options = extractFieldOptions(zodType);

  const fieldDef: FieldDefinition = {
    name: fieldName,
    type: fieldType,
    required,
    options,
  };

  // Handle relation fields
  if (isRelationField(fieldName, zodType)) {
    // Override type to 'relation' for relation fields
    fieldDef.type = "relation";

    const targetCollection = resolveTargetCollection(fieldName);
    const maxSelect = getMaxSelect(fieldName, zodType);
    const minSelect = getMinSelect(fieldName, zodType);

    fieldDef.relation = {
      collection: targetCollection,
      maxSelect,
      minSelect,
      cascadeDelete: false, // Default to false, can be configured later
    };
  }

  return fieldDef;
}

/**
 * Extracts index definitions from a Zod schema
 * Parses the schema description metadata to find index definitions
 *
 * @param schema - Zod schema with index metadata
 * @returns Array of index SQL statements or undefined
 */
export function extractIndexes(schema: z.ZodTypeAny): string[] | undefined {
  // Try to extract indexes from schema description
  const schemaDescription = schema.description;

  if (!schemaDescription) {
    return undefined;
  }

  try {
    const metadata = JSON.parse(schemaDescription);

    // Check if indexes are present in metadata
    if (metadata.indexes && Array.isArray(metadata.indexes)) {
      return metadata.indexes;
    }
  } catch {
    // If description is not valid JSON, return undefined
  }

  return undefined;
}

/**
 * Converts a Zod schema to a CollectionSchema interface
 *
 * @param collectionName - The name of the collection
 * @param zodSchema - The Zod object schema
 * @returns CollectionSchema definition
 */
export function convertZodSchemaToCollectionSchema(
  collectionName: string,
  zodSchema: z.ZodObject<any>
): CollectionSchema {
  // Extract field definitions from Zod schema
  const rawFields = extractFieldDefinitions(zodSchema);

  // Determine collection type (auth or base)
  const collectionType = isAuthCollection(rawFields) ? "auth" : "base";

  // Build field definitions with constraints
  const fields: FieldDefinition[] = rawFields.map(({ name, zodType }) => buildFieldDefinition(name, zodType));

  // Extract indexes from schema
  const indexes = extractIndexes(zodSchema) || [];

  // Extract and validate permissions from schema
  const permissionAnalyzer = new PermissionAnalyzer();
  let permissions: PermissionSchema | undefined = undefined;

  // Try to extract permissions from schema description
  const schemaDescription = zodSchema.description;
  const extractedPermissions = permissionAnalyzer.extractPermissions(schemaDescription);

  if (extractedPermissions) {
    // Resolve template configurations to concrete rules
    const resolvedPermissions = permissionAnalyzer.resolvePermissions(extractedPermissions);

    // Validate permissions against collection fields
    const validationResults = permissionAnalyzer.validatePermissions(
      collectionName,
      resolvedPermissions,
      fields,
      collectionType === "auth"
    );

    // Log validation errors and warnings
    for (const [ruleType, result] of validationResults) {
      if (!result.valid) {
        console.error(`[${collectionName}] Permission validation failed for ${ruleType}:`);
        result.errors.forEach((error) => console.error(`  - ${error}`));
      }

      if (result.warnings.length > 0) {
        console.warn(`[${collectionName}] Permission warnings for ${ruleType}:`);
        result.warnings.forEach((warning) => console.warn(`  - ${warning}`));
      }
    }

    // Merge with defaults to ensure all rules are defined
    permissions = permissionAnalyzer.mergeWithDefaults(resolvedPermissions);
  }

  // Build collection schema
  const collectionSchema: CollectionSchema = {
    name: collectionName,
    type: collectionType,
    fields,
    indexes,
    rules: {
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
    },
    permissions,
  };

  return collectionSchema;
}

/**
 * Builds a complete SchemaDefinition from schema files
 * Main entry point for the Schema Analyzer
 *
 * @param schemaDir - Path to the schema directory (source directory)
 * @returns Complete SchemaDefinition with all collections
 */
export async function buildSchemaDefinition(schemaDir: string): Promise<SchemaDefinition> {
  const collections = new Map<string, CollectionSchema>();

  // Discover schema files
  const schemaFiles = discoverSchemaFiles(schemaDir);

  if (schemaFiles.length === 0) {
    throw new SchemaParsingError(
      `No schema files found in ${schemaDir}. Make sure you have schema files in the directory.`,
      schemaDir
    );
  }

  // Process each schema file
  for (const filePath of schemaFiles) {
    try {
      // Convert source path to dist path for import
      // e.g., /path/to/shared/src/schema/user -> /path/to/shared/dist/schema/user
      const distPath = filePath.replace(/\/src\//, "/dist/");

      // Import the module from dist
      const module = await importSchemaModule(distPath);

      // Extract schema definitions
      const schemas = extractSchemaDefinitions(module);

      // Select the appropriate schema
      const zodSchema = selectSchemaForCollection(schemas);

      if (!zodSchema) {
        console.warn(`No valid schema found in ${filePath}, skipping...`);
        continue;
      }

      // Get collection name from file
      const collectionName = getCollectionNameFromFile(filePath);

      // Convert to CollectionSchema
      const collectionSchema = convertZodSchemaToCollectionSchema(collectionName, zodSchema);

      // Add to collections map
      collections.set(collectionName, collectionSchema);
    } catch (error) {
      // If it's already a SchemaParsingError, re-throw it
      if (error instanceof SchemaParsingError) {
        throw error;
      }

      // Otherwise, wrap it in a SchemaParsingError
      throw new SchemaParsingError(
        `Error processing schema file: ${error instanceof Error ? error.message : String(error)}`,
        filePath,
        error as Error
      );
    }
  }

  return { collections };
}

/**
 * Parses schema files and returns SchemaDefinition
 * Alias for buildSchemaDefinition for better semantic clarity
 *
 * @param schemaDir - Path to the schema directory
 * @returns Complete SchemaDefinition with all collections
 */
export async function parseSchemaFiles(schemaDir: string): Promise<SchemaDefinition> {
  return buildSchemaDefinition(schemaDir);
}
