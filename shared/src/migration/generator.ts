/**
 * Migration Generator component
 * Creates PocketBase migration files based on detected differences
 */

import * as fs from "fs";
import * as path from "path";
import { FileSystemError, MigrationGenerationError } from "./errors";
import type { CollectionSchema, FieldDefinition, FieldModification, SchemaDiff } from "./types";

/**
 * Generates a timestamp for migration filename
 * Format: Unix timestamp in seconds (e.g., 1687801090)
 *
 * @returns Timestamp string
 */
export function generateTimestamp(): string {
  return Math.floor(Date.now() / 1000).toString();
}

/**
 * Generates a human-readable description from the diff
 * Creates a concise summary of the main changes
 *
 * @param diff - Schema diff containing all changes
 * @returns Description string for filename
 */
export function generateMigrationDescription(diff: SchemaDiff): string {
  const parts: string[] = [];

  // Summarize collection changes
  if (diff.collectionsToCreate.length > 0) {
    if (diff.collectionsToCreate.length === 1) {
      parts.push(`created_${diff.collectionsToCreate[0].name}`);
    } else {
      parts.push(`created_${diff.collectionsToCreate.length}_collections`);
    }
  }

  if (diff.collectionsToDelete.length > 0) {
    if (diff.collectionsToDelete.length === 1) {
      parts.push(`deleted_${diff.collectionsToDelete[0].name}`);
    } else {
      parts.push(`deleted_${diff.collectionsToDelete.length}_collections`);
    }
  }

  if (diff.collectionsToModify.length > 0) {
    if (diff.collectionsToModify.length === 1) {
      parts.push(`updated_${diff.collectionsToModify[0].collection}`);
    } else {
      parts.push(`updated_${diff.collectionsToModify.length}_collections`);
    }
  }

  // Default description if no changes
  if (parts.length === 0) {
    return "no_changes";
  }

  // Join parts with underscores and limit length
  let description = parts.join("_");

  // Truncate if too long (keep under 100 chars for filename)
  if (description.length > 80) {
    description = description.substring(0, 77) + "...";
  }

  return description;
}

/**
 * Generates the migration filename
 * Format: {timestamp}_{description}.js
 *
 * @param diff - Schema diff containing all changes
 * @returns Migration filename
 */
export function generateMigrationFilename(diff: SchemaDiff): string {
  const timestamp = generateTimestamp();
  const description = generateMigrationDescription(diff);

  return `${timestamp}_${description}.js`;
}

/**
 * Creates the migration file structure with up and down functions
 *
 * @param upCode - Code for the up migration
 * @param downCode - Code for the down migration
 * @returns Complete migration file content
 */
export function createMigrationFileStructure(upCode: string, downCode: string): string {
  return `/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
${upCode}
  return true;
}, (app) => {
${downCode}
  return true;
});
`;
}

/**
 * Writes migration file to the specified directory
 * Creates directory if it doesn't exist
 *
 * @param migrationDir - Directory to write migration file
 * @param filename - Migration filename
 * @param content - Migration file content
 * @returns Full path to the created migration file
 */
export function writeMigrationFile(migrationDir: string, filename: string, content: string): string {
  try {
    // Ensure migration directory exists
    if (!fs.existsSync(migrationDir)) {
      try {
        fs.mkdirSync(migrationDir, { recursive: true });
      } catch (error) {
        const fsError = error as NodeJS.ErrnoException;
        if (fsError.code === "EACCES" || fsError.code === "EPERM") {
          throw new FileSystemError(
            `Permission denied creating migration directory. Check directory permissions.`,
            migrationDir,
            "create",
            fsError.code,
            error as Error
          );
        }
        throw new FileSystemError(
          `Failed to create migration directory: ${fsError.message}`,
          migrationDir,
          "create",
          fsError.code,
          error as Error
        );
      }
    }

    // Full path to migration file
    const filePath = path.join(migrationDir, filename);

    // Write migration file
    fs.writeFileSync(filePath, content, "utf-8");

    return filePath;
  } catch (error) {
    // If it's already a FileSystemError, re-throw it
    if (error instanceof FileSystemError) {
      throw error;
    }

    const fsError = error as NodeJS.ErrnoException;
    const filePath = path.join(migrationDir, filename);

    if (fsError.code === "EACCES" || fsError.code === "EPERM") {
      throw new FileSystemError(
        `Permission denied writing migration file. Check file and directory permissions.`,
        filePath,
        "write",
        fsError.code,
        error as Error
      );
    } else if (fsError.code === "ENOSPC") {
      throw new FileSystemError(
        `No space left on device when writing migration file.`,
        filePath,
        "write",
        fsError.code,
        error as Error
      );
    }

    throw new MigrationGenerationError(`Failed to write migration file: ${fsError.message}`, filePath, error as Error);
  }
}

/**
 * Formats a value for JavaScript code generation
 * Handles strings, numbers, booleans, null, arrays, and objects
 *
 * @param value - Value to format
 * @returns Formatted string representation
 */
function formatValue(value: any): string {
  if (value === null || value === undefined) {
    return "null";
  }

  if (typeof value === "string") {
    // Escape quotes and special characters
    return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n")}"`;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    const items = value.map((v) => formatValue(v)).join(", ");
    return `[${items}]`;
  }

  if (typeof value === "object") {
    const entries = Object.entries(value)
      .map(([k, v]) => `${k}: ${formatValue(v)}`)
      .join(", ");
    return `{ ${entries} }`;
  }

  return String(value);
}

/**
 * Generates field definition object for collection creation
 * Creates the field configuration object used in Collection constructor
 *
 * @param field - Field definition
 * @returns Field definition object as string
 */
export function generateFieldDefinitionObject(field: FieldDefinition): string {
  const parts: string[] = [];

  // Add field name
  parts.push(`      name: "${field.name}"`);

  // Add field type
  parts.push(`      type: "${field.type}"`);

  // Add required flag
  parts.push(`      required: ${field.required}`);

  // Add unique flag if present
  if (field.unique !== undefined) {
    parts.push(`      unique: ${field.unique}`);
  }

  // Add options if present
  if (field.options && Object.keys(field.options).length > 0) {
    for (const [key, value] of Object.entries(field.options)) {
      parts.push(`      ${key}: ${formatValue(value)}`);
    }
  }

  // Add relation configuration if present
  if (field.relation) {
    // For relation fields, we need to resolve the collection ID
    // For now, we'll use a placeholder that needs to be resolved at runtime
    const collectionIdPlaceholder =
      field.relation.collection === "Users"
        ? '"_pb_users_auth_"'
        : `app.findCollectionByNameOrId("${field.relation.collection}").id`;

    parts.push(`      collectionId: ${collectionIdPlaceholder}`);

    if (field.relation.maxSelect !== undefined) {
      parts.push(`      maxSelect: ${field.relation.maxSelect}`);
    }

    if (field.relation.minSelect !== undefined) {
      parts.push(`      minSelect: ${field.relation.minSelect}`);
    }

    if (field.relation.cascadeDelete !== undefined) {
      parts.push(`      cascadeDelete: ${field.relation.cascadeDelete}`);
    }
  }

  return `    {\n${parts.join(",\n")},\n    }`;
}

/**
 * Generates fields array for collection creation
 *
 * @param fields - Array of field definitions
 * @returns Fields array as string
 */
export function generateFieldsArray(fields: FieldDefinition[]): string {
  if (fields.length === 0) {
    return "[]";
  }

  const fieldObjects = fields.map((field) => generateFieldDefinitionObject(field));
  return `[\n${fieldObjects.join(",\n")},\n  ]`;
}

/**
 * Generates collection rules object
 *
 * @param rules - Collection rules
 * @returns Rules configuration as string
 */
export function generateCollectionRules(rules?: CollectionSchema["rules"]): string {
  if (!rules) {
    return "";
  }

  const parts: string[] = [];

  if (rules.listRule !== undefined) {
    parts.push(`listRule: ${formatValue(rules.listRule)}`);
  }

  if (rules.viewRule !== undefined) {
    parts.push(`viewRule: ${formatValue(rules.viewRule)}`);
  }

  if (rules.createRule !== undefined) {
    parts.push(`createRule: ${formatValue(rules.createRule)}`);
  }

  if (rules.updateRule !== undefined) {
    parts.push(`updateRule: ${formatValue(rules.updateRule)}`);
  }

  if (rules.deleteRule !== undefined) {
    parts.push(`deleteRule: ${formatValue(rules.deleteRule)}`);
  }

  if (rules.manageRule !== undefined) {
    parts.push(`manageRule: ${formatValue(rules.manageRule)}`);
  }

  return parts.join(",\n    ");
}

/**
 * Generates collection permissions object
 * Permissions are the same as rules but extracted from schema metadata
 *
 * @param permissions - Collection permissions
 * @returns Permissions configuration as string
 */
export function generateCollectionPermissions(permissions?: CollectionSchema["permissions"]): string {
  if (!permissions) {
    return "";
  }

  const parts: string[] = [];

  if (permissions.listRule !== undefined) {
    parts.push(`listRule: ${formatValue(permissions.listRule)}`);
  }

  if (permissions.viewRule !== undefined) {
    parts.push(`viewRule: ${formatValue(permissions.viewRule)}`);
  }

  if (permissions.createRule !== undefined) {
    parts.push(`createRule: ${formatValue(permissions.createRule)}`);
  }

  if (permissions.updateRule !== undefined) {
    parts.push(`updateRule: ${formatValue(permissions.updateRule)}`);
  }

  if (permissions.deleteRule !== undefined) {
    parts.push(`deleteRule: ${formatValue(permissions.deleteRule)}`);
  }

  if (permissions.manageRule !== undefined) {
    parts.push(`manageRule: ${formatValue(permissions.manageRule)}`);
  }

  return parts.join(",\n    ");
}

/**
 * Generates indexes array for collection creation
 *
 * @param indexes - Array of index definitions
 * @returns Indexes array as string
 */
export function generateIndexesArray(indexes?: string[]): string {
  if (!indexes || indexes.length === 0) {
    return "[]";
  }

  const indexStrings = indexes.map((idx) => `"${idx}"`);
  return `[\n    ${indexStrings.join(",\n    ")},\n  ]`;
}

/**
 * Generates Collection constructor call for creating a new collection
 *
 * @param collection - Collection schema
 * @param varName - Variable name to use for the collection (default: 'collection')
 * @returns JavaScript code for creating the collection
 */
export function generateCollectionCreation(collection: CollectionSchema, varName: string = "collection"): string {
  const lines: string[] = [];

  lines.push(`  const ${varName} = new Collection({`);
  lines.push(`    name: "${collection.name}",`);
  lines.push(`    type: "${collection.type}",`);

  // Add permissions (preferred) or rules
  // Permissions take precedence if both are defined
  const permissionsCode = generateCollectionPermissions(collection.permissions);
  const rulesCode = generateCollectionRules(collection.rules);

  if (permissionsCode) {
    lines.push(`    ${permissionsCode},`);
  } else if (rulesCode) {
    lines.push(`    ${rulesCode},`);
  }

  // Add fields
  lines.push(`    fields: ${generateFieldsArray(collection.fields)},`);

  // Add indexes
  lines.push(`    indexes: ${generateIndexesArray(collection.indexes)},`);

  lines.push(`  });`);
  lines.push(``);
  lines.push(`  app.save(${varName});`);

  return lines.join("\n");
}

/**
 * Gets the appropriate Field constructor name for a field type
 *
 * @param fieldType - PocketBase field type
 * @returns Field constructor name
 */
function getFieldConstructorName(fieldType: string): string {
  const constructorMap: Record<string, string> = {
    text: "TextField",
    email: "EmailField",
    url: "URLField",
    number: "NumberField",
    bool: "BoolField",
    date: "DateField",
    select: "SelectField",
    relation: "RelationField",
    file: "FileField",
    json: "JSONField",
  };

  return constructorMap[fieldType] || "TextField";
}

/**
 * Generates field constructor options object
 *
 * @param field - Field definition
 * @returns Options object as string
 */
function generateFieldConstructorOptions(field: FieldDefinition): string {
  const parts: string[] = [];

  // Add field name
  parts.push(`    name: "${field.name}"`);

  // Add required flag
  parts.push(`    required: ${field.required}`);

  // Add unique flag if present
  if (field.unique !== undefined) {
    parts.push(`    unique: ${field.unique}`);
  }

  // Add options if present
  if (field.options && Object.keys(field.options).length > 0) {
    for (const [key, value] of Object.entries(field.options)) {
      parts.push(`    ${key}: ${formatValue(value)}`);
    }
  }

  // Add relation-specific options
  if (field.relation && field.type === "relation") {
    const collectionIdPlaceholder =
      field.relation.collection === "Users"
        ? '"_pb_users_auth_"'
        : `app.findCollectionByNameOrId("${field.relation.collection}").id`;

    parts.push(`    collectionId: ${collectionIdPlaceholder}`);

    if (field.relation.maxSelect !== undefined) {
      parts.push(`    maxSelect: ${field.relation.maxSelect}`);
    }

    if (field.relation.minSelect !== undefined) {
      parts.push(`    minSelect: ${field.relation.minSelect}`);
    }

    if (field.relation.cascadeDelete !== undefined) {
      parts.push(`    cascadeDelete: ${field.relation.cascadeDelete}`);
    }
  }

  return parts.join(",\n");
}

/**
 * Generates code for adding a field to an existing collection
 * Uses the appropriate Field constructor based on field type
 *
 * @param collectionName - Name of the collection
 * @param field - Field definition to add
 * @param varName - Variable name to use for the collection (default: auto-generated)
 * @returns JavaScript code for adding the field
 */
export function generateFieldAddition(collectionName: string, field: FieldDefinition, varName?: string): string {
  const lines: string[] = [];
  const constructorName = getFieldConstructorName(field.type);
  const collectionVar = varName || `collection_${collectionName}_${field.name}`;

  lines.push(`  const ${collectionVar} = app.findCollectionByNameOrId("${collectionName}");`);
  lines.push(``);
  lines.push(`  ${collectionVar}.fields.add(new ${constructorName}({`);
  lines.push(generateFieldConstructorOptions(field));
  lines.push(`  }));`);
  lines.push(``);
  lines.push(`  app.save(${collectionVar});`);

  return lines.join("\n");
}

/**
 * Generates code for modifying an existing field
 * Updates field properties based on detected changes
 *
 * @param collectionName - Name of the collection
 * @param modification - Field modification details
 * @param varName - Variable name to use for the collection (default: auto-generated)
 * @returns JavaScript code for modifying the field
 */
export function generateFieldModification(
  collectionName: string,
  modification: FieldModification,
  varName?: string
): string {
  const lines: string[] = [];
  const collectionVar = varName || `collection_${collectionName}_${modification.fieldName}`;
  const fieldVar = `${collectionVar}_field`;

  lines.push(`  const ${collectionVar} = app.findCollectionByNameOrId("${collectionName}");`);
  lines.push(`  const ${fieldVar} = ${collectionVar}.fields.getByName("${modification.fieldName}");`);
  lines.push(``);

  // Apply each change
  for (const change of modification.changes) {
    if (change.property.startsWith("options.")) {
      // Handle nested options properties
      const optionKey = change.property.replace("options.", "");
      // In PocketBase, field properties are set directly on the field, not in an options object
      lines.push(`  ${fieldVar}.${optionKey} = ${formatValue(change.newValue)};`);
    } else if (change.property.startsWith("relation.")) {
      // Handle nested relation properties
      const relationKey = change.property.replace("relation.", "");

      if (relationKey === "collection") {
        // Special handling for collection ID
        const collectionIdValue =
          change.newValue === "Users" ? '"_pb_users_auth_"' : `app.findCollectionByNameOrId("${change.newValue}").id`;
        lines.push(`  ${fieldVar}.collectionId = ${collectionIdValue};`);
      } else {
        lines.push(`  ${fieldVar}.${relationKey} = ${formatValue(change.newValue)};`);
      }
    } else {
      // Handle top-level properties
      lines.push(`  ${fieldVar}.${change.property} = ${formatValue(change.newValue)};`);
    }
  }

  lines.push(``);
  lines.push(`  app.save(${collectionVar});`);

  return lines.join("\n");
}

/**
 * Generates code for deleting a field from a collection
 *
 * @param collectionName - Name of the collection
 * @param fieldName - Name of the field to delete
 * @param varName - Variable name to use for the collection (default: auto-generated)
 * @returns JavaScript code for deleting the field
 */
export function generateFieldDeletion(collectionName: string, fieldName: string, varName?: string): string {
  const lines: string[] = [];
  const collectionVar = varName || `collection_${collectionName}_${fieldName}`;
  const fieldVar = `${collectionVar}_field`;

  lines.push(`  const ${collectionVar} = app.findCollectionByNameOrId("${collectionName}");`);
  lines.push(`  const ${fieldVar} = ${collectionVar}.fields.getByName("${fieldName}");`);
  lines.push(``);
  lines.push(`  ${collectionVar}.fields.remove(${fieldVar}.id);`);
  lines.push(``);
  lines.push(`  app.save(${collectionVar});`);

  return lines.join("\n");
}

/**
 * Generates code for adding an index to a collection
 *
 * @param collectionName - Name of the collection
 * @param index - Index SQL statement
 * @param varName - Variable name to use for the collection (default: auto-generated)
 * @returns JavaScript code for adding the index
 */
function generateIndexAddition(collectionName: string, index: string, varName?: string): string {
  const lines: string[] = [];
  const collectionVar = varName || `collection_${collectionName}_idx`;

  lines.push(`  const ${collectionVar} = app.findCollectionByNameOrId("${collectionName}");`);
  lines.push(`  ${collectionVar}.indexes.push("${index}");`);
  lines.push(`  app.save(${collectionVar});`);

  return lines.join("\n");
}

/**
 * Generates code for removing an index from a collection
 *
 * @param collectionName - Name of the collection
 * @param index - Index SQL statement
 * @param varName - Variable name to use for the collection (default: auto-generated)
 * @returns JavaScript code for removing the index
 */
function generateIndexRemoval(collectionName: string, index: string, varName?: string): string {
  const lines: string[] = [];
  const collectionVar = varName || `collection_${collectionName}_idx`;
  const indexVar = `${collectionVar}_indexToRemove`;

  lines.push(`  const ${collectionVar} = app.findCollectionByNameOrId("${collectionName}");`);
  lines.push(`  const ${indexVar} = ${collectionVar}.indexes.findIndex(idx => idx === "${index}");`);
  lines.push(`  if (${indexVar} !== -1) {`);
  lines.push(`    ${collectionVar}.indexes.splice(${indexVar}, 1);`);
  lines.push(`  }`);
  lines.push(`  app.save(${collectionVar});`);

  return lines.join("\n");
}

/**
 * Generates code for updating collection rules
 *
 * @param collectionName - Name of the collection
 * @param ruleType - Type of rule to update
 * @param newValue - New rule value
 * @param varName - Variable name to use for the collection (default: auto-generated)
 * @returns JavaScript code for updating the rule
 */
function generateRuleUpdate(
  collectionName: string,
  ruleType: string,
  newValue: string | null,
  varName?: string
): string {
  const lines: string[] = [];
  const collectionVar = varName || `collection_${collectionName}_${ruleType}`;

  lines.push(`  const ${collectionVar} = app.findCollectionByNameOrId("${collectionName}");`);
  lines.push(`  ${collectionVar}.${ruleType} = ${formatValue(newValue)};`);
  lines.push(`  app.save(${collectionVar});`);

  return lines.join("\n");
}

/**
 * Generates code for updating collection permissions
 * Handles permission rule updates including manageRule for auth collections
 *
 * @param collectionName - Name of the collection
 * @param ruleType - Type of permission rule to update
 * @param newValue - New permission rule value
 * @param varName - Variable name to use for the collection (default: auto-generated)
 * @returns JavaScript code for updating the permission
 */
export function generatePermissionUpdate(
  collectionName: string,
  ruleType: string,
  newValue: string | null,
  varName?: string
): string {
  const lines: string[] = [];
  const collectionVar = varName || `collection_${collectionName}_${ruleType}`;

  lines.push(`  const ${collectionVar} = app.findCollectionByNameOrId("${collectionName}");`);
  lines.push(`  ${collectionVar}.${ruleType} = ${formatValue(newValue)};`);
  lines.push(`  app.save(${collectionVar});`);

  return lines.join("\n");
}

/**
 * Generates code for deleting a collection
 *
 * @param collectionName - Name of the collection to delete
 * @param varName - Variable name to use for the collection (default: 'collection')
 * @returns JavaScript code for deleting the collection
 */
function generateCollectionDeletion(collectionName: string, varName: string = "collection"): string {
  const lines: string[] = [];

  lines.push(`  const ${varName} = app.findCollectionByNameOrId("${collectionName}");`);
  lines.push(`  app.delete(${varName});`);

  return lines.join("\n");
}

/**
 * Generates the up migration function code
 * Applies all changes from the diff in the correct order
 *
 * @param diff - Schema diff containing all changes
 * @returns JavaScript code for up migration
 */
export function generateUpMigration(diff: SchemaDiff): string {
  const lines: string[] = [];

  // Add comment header
  lines.push(`  // UP MIGRATION`);
  lines.push(``);

  // 1. Create new collections
  if (diff.collectionsToCreate.length > 0) {
    lines.push(`  // Create new collections`);
    for (let i = 0; i < diff.collectionsToCreate.length; i++) {
      const collection = diff.collectionsToCreate[i];
      const varName = `collection_${collection.name}_create`;
      lines.push(generateCollectionCreation(collection, varName));
      lines.push(``);
    }
  }

  // 2. Modify existing collections
  if (diff.collectionsToModify.length > 0) {
    lines.push(`  // Modify existing collections`);
    for (const modification of diff.collectionsToModify) {
      const collectionName = modification.collection;
      let operationCounter = 0;

      // Add new fields
      if (modification.fieldsToAdd.length > 0) {
        lines.push(`  // Add fields to ${collectionName}`);
        for (const field of modification.fieldsToAdd) {
          const varName = `collection_${collectionName}_add_${field.name}`;
          lines.push(generateFieldAddition(collectionName, field, varName));
          lines.push(``);
          operationCounter++;
        }
      }

      // Modify existing fields
      if (modification.fieldsToModify.length > 0) {
        lines.push(`  // Modify fields in ${collectionName}`);
        for (const fieldMod of modification.fieldsToModify) {
          const varName = `collection_${collectionName}_modify_${fieldMod.fieldName}`;
          lines.push(generateFieldModification(collectionName, fieldMod, varName));
          lines.push(``);
          operationCounter++;
        }
      }

      // Remove fields
      if (modification.fieldsToRemove.length > 0) {
        lines.push(`  // Remove fields from ${collectionName}`);
        for (const field of modification.fieldsToRemove) {
          const varName = `collection_${collectionName}_remove_${field.name}`;
          lines.push(generateFieldDeletion(collectionName, field.name, varName));
          lines.push(``);
          operationCounter++;
        }
      }

      // Add indexes
      if (modification.indexesToAdd.length > 0) {
        lines.push(`  // Add indexes to ${collectionName}`);
        for (let i = 0; i < modification.indexesToAdd.length; i++) {
          const index = modification.indexesToAdd[i];
          const varName = `collection_${collectionName}_addidx_${i}`;
          lines.push(generateIndexAddition(collectionName, index, varName));
          lines.push(``);
          operationCounter++;
        }
      }

      // Remove indexes
      if (modification.indexesToRemove.length > 0) {
        lines.push(`  // Remove indexes from ${collectionName}`);
        for (let i = 0; i < modification.indexesToRemove.length; i++) {
          const index = modification.indexesToRemove[i];
          const varName = `collection_${collectionName}_rmidx_${i}`;
          lines.push(generateIndexRemoval(collectionName, index, varName));
          lines.push(``);
          operationCounter++;
        }
      }

      // Update permissions (preferred) or rules (fallback)
      // If permissions are defined, use them; otherwise use rules
      if (modification.permissionsToUpdate && modification.permissionsToUpdate.length > 0) {
        lines.push(`  // Update permissions for ${collectionName}`);
        for (const permission of modification.permissionsToUpdate) {
          const varName = `collection_${collectionName}_perm_${permission.ruleType}`;
          lines.push(generatePermissionUpdate(collectionName, permission.ruleType, permission.newValue, varName));
          lines.push(``);
          operationCounter++;
        }
      } else if (modification.rulesToUpdate.length > 0) {
        lines.push(`  // Update rules for ${collectionName}`);
        for (const rule of modification.rulesToUpdate) {
          const varName = `collection_${collectionName}_rule_${rule.ruleType}`;
          lines.push(generateRuleUpdate(collectionName, rule.ruleType, rule.newValue, varName));
          lines.push(``);
          operationCounter++;
        }
      }
    }
  }

  // 3. Delete collections
  if (diff.collectionsToDelete.length > 0) {
    lines.push(`  // Delete collections`);
    for (let i = 0; i < diff.collectionsToDelete.length; i++) {
      const collection = diff.collectionsToDelete[i];
      const varName = `collection_${collection.name}_delete`;
      lines.push(generateCollectionDeletion(collection.name, varName));
      lines.push(``);
    }
  }

  // If no changes, add a comment
  if (lines.length === 2) {
    lines.push(`  // No changes detected`);
    lines.push(``);
  }

  return lines.join("\n");
}

/**
 * Generates the down migration function code
 * Reverts all changes from the diff in reverse order
 *
 * @param diff - Schema diff containing all changes
 * @returns JavaScript code for down migration
 */
export function generateDownMigration(diff: SchemaDiff): string {
  const lines: string[] = [];

  // Add comment header
  lines.push(`  // DOWN MIGRATION (ROLLBACK)`);
  lines.push(``);

  // Reverse order: delete -> modify -> create

  // 1. Recreate deleted collections
  if (diff.collectionsToDelete.length > 0) {
    lines.push(`  // Recreate deleted collections`);
    for (let i = 0; i < diff.collectionsToDelete.length; i++) {
      const collection = diff.collectionsToDelete[i];
      const varName = `collection_${collection.name}_recreate`;
      lines.push(generateCollectionCreation(collection, varName));
      lines.push(``);
    }
  }

  // 2. Revert modifications (in reverse order)
  if (diff.collectionsToModify.length > 0) {
    lines.push(`  // Revert modifications`);
    for (const modification of diff.collectionsToModify) {
      const collectionName = modification.collection;
      let operationCounter = 0;

      // Revert permissions (preferred) or rules (fallback)
      // If permissions were updated, revert them; otherwise revert rules
      if (modification.permissionsToUpdate && modification.permissionsToUpdate.length > 0) {
        lines.push(`  // Revert permissions for ${collectionName}`);
        for (const permission of modification.permissionsToUpdate) {
          const varName = `collection_${collectionName}_revert_perm_${permission.ruleType}`;
          lines.push(generatePermissionUpdate(collectionName, permission.ruleType, permission.oldValue, varName));
          lines.push(``);
          operationCounter++;
        }
      } else if (modification.rulesToUpdate.length > 0) {
        lines.push(`  // Revert rules for ${collectionName}`);
        for (const rule of modification.rulesToUpdate) {
          const varName = `collection_${collectionName}_revert_rule_${rule.ruleType}`;
          lines.push(generateRuleUpdate(collectionName, rule.ruleType, rule.oldValue, varName));
          lines.push(``);
          operationCounter++;
        }
      }

      // Revert index removals (add them back)
      if (modification.indexesToRemove.length > 0) {
        lines.push(`  // Restore indexes to ${collectionName}`);
        for (let i = 0; i < modification.indexesToRemove.length; i++) {
          const index = modification.indexesToRemove[i];
          const varName = `collection_${collectionName}_restore_idx_${i}`;
          lines.push(generateIndexAddition(collectionName, index, varName));
          lines.push(``);
          operationCounter++;
        }
      }

      // Revert index additions (remove them)
      if (modification.indexesToAdd.length > 0) {
        lines.push(`  // Remove indexes from ${collectionName}`);
        for (let i = 0; i < modification.indexesToAdd.length; i++) {
          const index = modification.indexesToAdd[i];
          const varName = `collection_${collectionName}_revert_idx_${i}`;
          lines.push(generateIndexRemoval(collectionName, index, varName));
          lines.push(``);
          operationCounter++;
        }
      }

      // Revert field removals (add them back)
      if (modification.fieldsToRemove.length > 0) {
        lines.push(`  // Restore fields to ${collectionName}`);
        for (const field of modification.fieldsToRemove) {
          const varName = `collection_${collectionName}_restore_${field.name}`;
          lines.push(generateFieldAddition(collectionName, field, varName));
          lines.push(``);
          operationCounter++;
        }
      }

      // Revert field modifications
      if (modification.fieldsToModify.length > 0) {
        lines.push(`  // Revert field modifications in ${collectionName}`);
        for (const fieldMod of modification.fieldsToModify) {
          // Create a reverse modification
          const reverseChanges = fieldMod.changes.map((change) => ({
            property: change.property,
            oldValue: change.newValue,
            newValue: change.oldValue,
          }));

          const reverseMod: FieldModification = {
            fieldName: fieldMod.fieldName,
            currentDefinition: fieldMod.newDefinition,
            newDefinition: fieldMod.currentDefinition,
            changes: reverseChanges,
          };

          const varName = `collection_${collectionName}_revert_${fieldMod.fieldName}`;
          lines.push(generateFieldModification(collectionName, reverseMod, varName));
          lines.push(``);
          operationCounter++;
        }
      }

      // Revert field additions (remove them)
      if (modification.fieldsToAdd.length > 0) {
        lines.push(`  // Remove added fields from ${collectionName}`);
        for (const field of modification.fieldsToAdd) {
          const varName = `collection_${collectionName}_revert_add_${field.name}`;
          lines.push(generateFieldDeletion(collectionName, field.name, varName));
          lines.push(``);
          operationCounter++;
        }
      }
    }
  }

  // 3. Delete created collections
  if (diff.collectionsToCreate.length > 0) {
    lines.push(`  // Delete created collections`);
    for (let i = 0; i < diff.collectionsToCreate.length; i++) {
      const collection = diff.collectionsToCreate[i];
      const varName = `collection_${collection.name}_rollback`;
      lines.push(generateCollectionDeletion(collection.name, varName));
      lines.push(``);
    }
  }

  // If no changes, add a comment
  if (lines.length === 2) {
    lines.push(`  // No changes to revert`);
    lines.push(``);
  }

  return lines.join("\n");
}

/**
 * Main generation function
 * Generates complete migration file from schema diff
 *
 * @param diff - Schema diff containing all changes
 * @param migrationDir - Directory to write migration file
 * @returns Path to the generated migration file
 */
export function generate(diff: SchemaDiff, migrationDir: string): string {
  try {
    // Generate up and down migration code
    const upCode = generateUpMigration(diff);
    const downCode = generateDownMigration(diff);

    // Create migration file structure
    const content = createMigrationFileStructure(upCode, downCode);

    // Generate filename
    const filename = generateMigrationFilename(diff);

    // Write migration file
    const filePath = writeMigrationFile(migrationDir, filename, content);

    return filePath;
  } catch (error) {
    // If it's already a MigrationGenerationError or FileSystemError, re-throw it
    if (error instanceof MigrationGenerationError || error instanceof FileSystemError) {
      throw error;
    }

    // Otherwise, wrap it in a MigrationGenerationError
    throw new MigrationGenerationError(
      `Failed to generate migration: ${error instanceof Error ? error.message : String(error)}`,
      migrationDir,
      error as Error
    );
  }
}
