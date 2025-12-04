/**
 * Snapshot Manager component
 * Handles saving and loading schema snapshots
 */

import * as fs from "fs";
import * as path from "path";
import { FileSystemError, SnapshotError } from "./errors";
import type { CollectionSchema, SchemaDefinition, SchemaSnapshot } from "./types";

const SNAPSHOT_VERSION = "1.0.0";
const DEFAULT_SNAPSHOT_FILENAME = ".migration-snapshot.json";

/**
 * Configuration for snapshot operations
 */
export interface SnapshotConfig {
  snapshotPath?: string;
  workspaceRoot?: string;
}

/**
 * Gets the snapshot file path from configuration
 *
 * @param config - Snapshot configuration
 * @returns Absolute path to the snapshot file
 */
export function getSnapshotPath(config: SnapshotConfig = {}): string {
  const workspaceRoot = config.workspaceRoot || process.cwd();
  const snapshotFilename = config.snapshotPath || DEFAULT_SNAPSHOT_FILENAME;

  // If snapshotPath is absolute, use it directly
  if (path.isAbsolute(snapshotFilename)) {
    return snapshotFilename;
  }

  // Otherwise, resolve relative to workspaceRoot (which should already be the shared directory)
  return path.join(workspaceRoot, snapshotFilename);
}

/**
 * Checks if snapshot file exists
 *
 * @param config - Snapshot configuration
 * @returns True if snapshot file exists
 */
export function snapshotExists(config: SnapshotConfig = {}): boolean {
  try {
    const snapshotPath = getSnapshotPath(config);
    return fs.existsSync(snapshotPath);
  } catch (error) {
    // If there's any error checking existence, treat as non-existent
    return false;
  }
}

/**
 * Handles file system errors with descriptive messages
 *
 * @param error - The error object
 * @param operation - The operation being performed
 * @param filePath - The file path involved
 * @throws SnapshotError or FileSystemError with descriptive message
 */
function handleFileSystemError(error: any, operation: "read" | "write", filePath: string): never {
  const fsError = error as NodeJS.ErrnoException;

  if (fsError.code === "ENOENT") {
    throw new SnapshotError(`Snapshot file not found: ${filePath}`, filePath, operation, error);
  } else if (fsError.code === "EACCES" || fsError.code === "EPERM") {
    throw new FileSystemError(
      `Permission denied ${operation === "read" ? "reading" : "writing"} snapshot file. Check file permissions.`,
      filePath,
      operation,
      fsError.code,
      error
    );
  } else if (fsError.code === "ENOSPC") {
    throw new FileSystemError(
      `No space left on device when ${operation === "read" ? "reading" : "writing"} snapshot file.`,
      filePath,
      operation,
      fsError.code,
      error
    );
  } else {
    throw new SnapshotError(`Failed to ${operation} snapshot file: ${error.message}`, filePath, operation, error);
  }
}

/**
 * Serializes a Map to a plain object for JSON serialization
 *
 * @param map - Map to serialize
 * @returns Plain object representation
 */
function serializeMap<K extends string, V>(map: Map<K, V>): Record<K, V> {
  const obj: Record<string, V> = {};
  for (const [key, value] of map.entries()) {
    obj[key] = value;
  }
  return obj as Record<K, V>;
}

/**
 * Deserializes a plain object to a Map
 *
 * @param obj - Plain object to deserialize
 * @returns Map representation
 */
function deserializeMap<K extends string, V>(obj: Record<K, V>): Map<K, V> {
  const map = new Map<K, V>();
  for (const [key, value] of Object.entries(obj)) {
    map.set(key as K, value as V);
  }
  return map;
}

/**
 * Serializes SchemaDefinition to JSON format
 * Converts Map to plain object for JSON compatibility
 *
 * @param schema - Schema definition to serialize
 * @returns JSON-serializable object
 */
function serializeSchemaDefinition(schema: SchemaDefinition): any {
  return {
    collections: serializeMap(schema.collections),
  };
}

/**
 * Adds version and timestamp metadata to snapshot
 *
 * @param schema - Schema definition
 * @returns Snapshot with metadata
 */
function addSnapshotMetadata(schema: SchemaDefinition): any {
  return {
    version: SNAPSHOT_VERSION,
    timestamp: new Date().toISOString(),
    ...serializeSchemaDefinition(schema),
  };
}

/**
 * Saves schema snapshot to file
 * Serializes SchemaDefinition to JSON with version and timestamp metadata
 * Writes with pretty printing for readability
 *
 * @param schema - Schema definition to save
 * @param config - Snapshot configuration
 */
export function saveSnapshot(schema: SchemaDefinition, config: SnapshotConfig = {}): void {
  const snapshotPath = getSnapshotPath(config);

  try {
    // Ensure directory exists
    const snapshotDir = path.dirname(snapshotPath);
    if (!fs.existsSync(snapshotDir)) {
      fs.mkdirSync(snapshotDir, { recursive: true });
    }

    // Add metadata and serialize
    const snapshotData = addSnapshotMetadata(schema);

    // Write with pretty printing (2 spaces indentation)
    const jsonContent = JSON.stringify(snapshotData, null, 2);
    fs.writeFileSync(snapshotPath, jsonContent, "utf-8");
  } catch (error) {
    handleFileSystemError(error, "write", snapshotPath);
  }
}

/**
 * Parses JSON and validates snapshot format
 *
 * @param jsonContent - Raw JSON content
 * @param snapshotPath - Path to snapshot file (for error messages)
 * @returns Parsed snapshot data
 */
function parseAndValidateSnapshot(jsonContent: string, snapshotPath: string): any {
  try {
    const data = JSON.parse(jsonContent);

    // Validate required fields
    if (!data.version) {
      throw new SnapshotError(
        "Snapshot file is missing version field. The snapshot may be corrupted.",
        snapshotPath,
        "validate"
      );
    }

    if (!data.timestamp) {
      throw new SnapshotError(
        "Snapshot file is missing timestamp field. The snapshot may be corrupted.",
        snapshotPath,
        "validate"
      );
    }

    if (!data.collections) {
      throw new SnapshotError(
        "Snapshot file is missing collections field. The snapshot may be corrupted.",
        snapshotPath,
        "validate"
      );
    }

    return data;
  } catch (error) {
    if (error instanceof SnapshotError) {
      throw error;
    }

    if (error instanceof SyntaxError) {
      throw new SnapshotError(
        `Invalid JSON in snapshot file. The file may be corrupted or manually edited incorrectly.`,
        snapshotPath,
        "parse",
        error
      );
    }
    throw error;
  }
}

/**
 * Migrates old snapshot formats to current version
 * Currently supports only version 1.0.0, but provides extensibility
 *
 * @param data - Parsed snapshot data
 * @returns Migrated snapshot data
 */
function migrateSnapshotFormat(data: any): any {
  const currentVersion = data.version;

  // Currently only version 1.0.0 exists, but this provides a place
  // for future format migrations
  if (currentVersion === "1.0.0") {
    return data;
  }

  // If we encounter an unknown version, log a warning but try to proceed
  console.warn(`Unknown snapshot version ${currentVersion}, attempting to load anyway...`);
  return data;
}

/**
 * Deserializes snapshot data to SchemaSnapshot
 *
 * @param data - Parsed and validated snapshot data
 * @returns SchemaSnapshot object
 */
function deserializeSnapshot(data: any): SchemaSnapshot {
  return {
    version: data.version,
    timestamp: data.timestamp,
    collections: deserializeMap<string, CollectionSchema>(data.collections),
  };
}

/**
 * Loads schema snapshot from file
 * Reads snapshot file, parses JSON, validates format, and handles migrations
 *
 * @param config - Snapshot configuration
 * @returns SchemaSnapshot object
 * @throws Error if snapshot file doesn't exist or is invalid
 */
export function loadSnapshot(config: SnapshotConfig = {}): SchemaSnapshot {
  const snapshotPath = getSnapshotPath(config);

  try {
    // Read file
    const jsonContent = fs.readFileSync(snapshotPath, "utf-8");

    // Parse and validate
    const data = parseAndValidateSnapshot(jsonContent, snapshotPath);

    // Migrate format if needed
    const migratedData = migrateSnapshotFormat(data);

    // Deserialize to SchemaSnapshot
    return deserializeSnapshot(migratedData);
  } catch (error) {
    // If it's already a SnapshotError or FileSystemError, re-throw it
    if (error instanceof SnapshotError || error instanceof FileSystemError) {
      throw error;
    }

    // If file doesn't exist, throw specific error
    if ((error as any).code === "ENOENT") {
      throw new SnapshotError(
        `Snapshot file not found. This may be the first migration run.`,
        snapshotPath,
        "read",
        error as Error
      );
    }

    // Handle other file system errors
    handleFileSystemError(error, "read", snapshotPath);
  }
}

/**
 * Merges base schema with custom snapshot
 * Base schema collections are preserved, custom collections are added
 * Custom collections override base collections if they have the same name
 *
 * @param baseSnapshot - PocketBase base schema
 * @param customSnapshot - User's custom schema snapshot (may be null)
 * @returns Merged SchemaSnapshot
 */
export function mergeSnapshots(baseSnapshot: SchemaSnapshot, customSnapshot: SchemaSnapshot | null): SchemaSnapshot {
  // If no custom snapshot, return base snapshot
  if (!customSnapshot) {
    return baseSnapshot;
  }

  // Create a new collections map starting with base collections
  const mergedCollections = new Map<string, CollectionSchema>(baseSnapshot.collections);

  // Add or override with custom collections
  for (const [name, schema] of customSnapshot.collections.entries()) {
    mergedCollections.set(name, schema);
  }

  return {
    version: customSnapshot.version || baseSnapshot.version,
    timestamp: customSnapshot.timestamp || baseSnapshot.timestamp,
    collections: mergedCollections,
  };
}

/**
 * Finds the most recent snapshot file in the migrations directory
 * Identifies snapshot files by naming pattern (e.g., *_collections_snapshot.js)
 *
 * @param migrationsPath - Path to pb_migrations directory
 * @returns Path to most recent snapshot file or null if none exist
 */
export function findLatestSnapshot(migrationsPath: string): string | null {
  try {
    // Check if migrations directory exists
    if (!fs.existsSync(migrationsPath)) {
      return null;
    }

    // Read all files in migrations directory
    const files = fs.readdirSync(migrationsPath);

    // Filter for snapshot files (files ending with _collections_snapshot.js or _snapshot.js)
    const snapshotFiles = files.filter(
      (file) => file.endsWith("_collections_snapshot.js") || file.endsWith("_snapshot.js")
    );

    if (snapshotFiles.length === 0) {
      return null;
    }

    // Sort by filename (timestamp prefix) to get most recent
    // Snapshot files are named with timestamp prefix: [timestamp]_collections_snapshot.js
    snapshotFiles.sort().reverse();

    // Return full path to most recent snapshot
    return path.join(migrationsPath, snapshotFiles[0]);
  } catch (error) {
    // If there's any error reading directory, return null
    console.warn(`Error finding latest snapshot: ${error}`);
    return null;
  }
}

/**
 * Loads snapshot if it exists, returns null for first run
 * Convenience method that handles missing snapshot gracefully
 * Uses the most recent snapshot file from migrations directory
 *
 * @param config - Snapshot configuration
 * @param migrationsPath - Optional path to migrations directory for finding snapshots
 * @returns SchemaSnapshot object or null if snapshot doesn't exist
 */
export function loadSnapshotIfExists(config: SnapshotConfig = {}, migrationsPath?: string): SchemaSnapshot | null {
  // If migrationsPath is provided, try to find and load the most recent snapshot
  if (migrationsPath) {
    // Check if migrationsPath is actually a file (for backward compatibility with tests)
    // If it's a file, treat it as a direct snapshot file path
    if (fs.existsSync(migrationsPath) && fs.statSync(migrationsPath).isFile()) {
      try {
        const migrationContent = fs.readFileSync(migrationsPath, "utf-8");
        return convertPocketBaseMigration(migrationContent);
      } catch (error) {
        console.warn(`Failed to load snapshot from ${migrationsPath}: ${error}`);
        // Fall through to try loading from config path
      }
    } else {
      // It's a directory, find the latest snapshot
      const latestSnapshotPath = findLatestSnapshot(migrationsPath);

      if (latestSnapshotPath) {
        try {
          // Read and convert the PocketBase snapshot file
          const migrationContent = fs.readFileSync(latestSnapshotPath, "utf-8");
          return convertPocketBaseMigration(migrationContent);
        } catch (error) {
          console.warn(`Failed to load snapshot from ${latestSnapshotPath}: ${error}`);
          // Fall through to try loading from config path
        }
      }
    }
  }

  // Fall back to loading from config path (custom snapshot)
  if (snapshotExists(config)) {
    try {
      return loadSnapshot(config);
    } catch (error) {
      console.warn(`Failed to load existing snapshot: ${error}`);
    }
  }

  // No snapshot found - return null (empty database)
  return null;
}

/**
 * Converts a PocketBase collection object to CollectionSchema format
 *
 * @param pbCollection - PocketBase collection object from migration file
 * @returns CollectionSchema object
 */
function convertPocketBaseCollection(pbCollection: any): CollectionSchema {
  const fields: any[] = [];

  // System field names that should always be excluded
  const systemFieldNames = ["id", "created", "updated", "collectionId", "collectionName", "expand"];

  // Auth collection system field names
  const authSystemFieldNames = ["email", "emailVisibility", "verified", "password", "tokenKey"];

  // Convert PocketBase fields to our FieldDefinition format
  if (pbCollection.fields && Array.isArray(pbCollection.fields)) {
    for (const pbField of pbCollection.fields) {
      // Skip system fields by checking both the system flag and field name
      // Some PocketBase exports mark created/updated as system: false
      if (pbField.system || systemFieldNames.includes(pbField.name)) {
        continue;
      }

      // Skip auth system fields for auth collections
      if (pbCollection.type === "auth" && authSystemFieldNames.includes(pbField.name)) {
        continue;
      }

      const field: any = {
        name: pbField.name,
        type: pbField.type,
        required: pbField.required || false,
      };

      // Add options if present
      if (pbField.options) {
        field.options = pbField.options;
      }

      // Handle relation fields
      if (pbField.type === "relation") {
        field.relation = {
          collection: pbField.options?.collectionId || "",
          cascadeDelete: pbField.options?.cascadeDelete || false,
          maxSelect: pbField.options?.maxSelect,
          minSelect: pbField.options?.minSelect,
        };
      }

      fields.push(field);
    }
  }

  const schema: CollectionSchema = {
    name: pbCollection.name,
    type: pbCollection.type || "base",
    fields,
  };

  // Add indexes if present
  if (pbCollection.indexes && Array.isArray(pbCollection.indexes)) {
    schema.indexes = pbCollection.indexes;
  }

  // Add rules/permissions
  const rules: any = {};
  if (pbCollection.listRule !== undefined) rules.listRule = pbCollection.listRule;
  if (pbCollection.viewRule !== undefined) rules.viewRule = pbCollection.viewRule;
  if (pbCollection.createRule !== undefined) rules.createRule = pbCollection.createRule;
  if (pbCollection.updateRule !== undefined) rules.updateRule = pbCollection.updateRule;
  if (pbCollection.deleteRule !== undefined) rules.deleteRule = pbCollection.deleteRule;
  if (pbCollection.manageRule !== undefined) rules.manageRule = pbCollection.manageRule;

  if (Object.keys(rules).length > 0) {
    schema.rules = rules;
  }

  return schema;
}

/**
 * Converts PocketBase migration format to SchemaSnapshot
 * Extracts the snapshot array from the migration file content
 *
 * @param migrationContent - Raw migration file content
 * @returns SchemaSnapshot with collections map
 */
export function convertPocketBaseMigration(migrationContent: string): SchemaSnapshot {
  try {
    // Extract the snapshot array from the migration file
    // The format is: migrate((app) => { const snapshot = [...]; ... })
    const snapshotMatch = migrationContent.match(/const\s+snapshot\s*=\s*(\[[\s\S]*?\]);/);

    if (!snapshotMatch) {
      throw new Error("Could not find snapshot array in migration file");
    }

    // Parse the snapshot array as JSON
    // We need to evaluate it as JavaScript since it's not pure JSON
    const snapshotArrayStr = snapshotMatch[1];
    let snapshotArray: any[];

    try {
      // Use Function constructor to safely evaluate the array
      // This is safer than eval() and works for our use case
      snapshotArray = new Function(`return ${snapshotArrayStr}`)();
    } catch (parseError) {
      throw new Error(`Failed to parse snapshot array: ${parseError}`);
    }

    if (!Array.isArray(snapshotArray)) {
      throw new Error("Snapshot is not an array");
    }

    // Convert each collection to our format
    const collections = new Map<string, CollectionSchema>();

    for (const pbCollection of snapshotArray) {
      if (!pbCollection.name) {
        console.warn("Skipping collection without name");
        continue;
      }

      const schema = convertPocketBaseCollection(pbCollection);
      collections.set(pbCollection.name, schema);
    }

    return {
      version: SNAPSHOT_VERSION,
      timestamp: new Date().toISOString(),
      collections,
    };
  } catch (error) {
    throw new SnapshotError(
      `Failed to convert PocketBase migration: ${error instanceof Error ? error.message : String(error)}`,
      undefined,
      "parse",
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Loads the base PocketBase schema from the initial migration file
 *
 * @param migrationPath - Path to pocketbase/pb_migrations/000000000_collections_snapshot.js
 * @returns SchemaSnapshot representing PocketBase's initial state
 * @throws SnapshotError if file not found or invalid format
 */
export function loadBaseMigration(migrationPath: string): SchemaSnapshot {
  try {
    // Check if file exists
    if (!fs.existsSync(migrationPath)) {
      throw new SnapshotError(
        `Base migration file not found: ${migrationPath}\n\n` +
          `This file should contain PocketBase's initial schema.\n` +
          `Please ensure PocketBase is properly set up by running 'yarn setup'.\n` +
          `If the file exists in a different location, update the configuration.`,
        migrationPath,
        "read"
      );
    }

    // Read the migration file
    const migrationContent = fs.readFileSync(migrationPath, "utf-8");

    // Convert to SchemaSnapshot
    const snapshot = convertPocketBaseMigration(migrationContent);

    return snapshot;
  } catch (error) {
    // If it's already a SnapshotError, re-throw it
    if (error instanceof SnapshotError) {
      throw error;
    }

    // Handle file system errors
    if ((error as any).code === "ENOENT") {
      throw new SnapshotError(
        `Base migration file not found: ${migrationPath}\n\n` +
          `This file should contain PocketBase's initial schema.\n` +
          `Please ensure PocketBase is properly set up by running 'yarn setup'.`,
        migrationPath,
        "read",
        error as Error
      );
    }

    if ((error as any).code === "EACCES" || (error as any).code === "EPERM") {
      throw new FileSystemError(
        `Permission denied reading base migration file. Check file permissions.`,
        migrationPath,
        "read",
        (error as any).code,
        error as Error
      );
    }

    // Other errors
    throw new SnapshotError(
      `Failed to load base migration: ${error instanceof Error ? error.message : String(error)}`,
      migrationPath,
      "read",
      error instanceof Error ? error : undefined
    );
  }
}
