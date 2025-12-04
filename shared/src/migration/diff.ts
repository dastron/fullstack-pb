/**
 * Diff Engine component
 * Compares current schema with previous snapshot and identifies changes
 */

import type {
  APIRuleType,
  CollectionModification,
  CollectionSchema,
  FieldChange,
  FieldDefinition,
  FieldModification,
  PermissionChange,
  RuleUpdate,
  SchemaDefinition,
  SchemaDiff,
  SchemaSnapshot,
} from "./types";

/**
 * List of PocketBase system collections that should not be created or deleted
 */
const SYSTEM_COLLECTIONS = new Set(["_mfas", "_otps", "_externalAuths", "_authOrigins", "_superusers"]);

/**
 * List of system fields in the users collection that should not be included in migrations
 * These fields are automatically managed by PocketBase for auth collections
 */
const USERS_SYSTEM_FIELDS = new Set([
  "id",
  "password",
  "tokenKey",
  "email",
  "emailVisibility",
  "verified",
  "created",
  "updated",
]);

/**
 * Checks if a collection is a PocketBase system collection
 * System collections are internal to PocketBase and should not be created or deleted
 *
 * @param collectionName - Name of the collection to check
 * @returns True if the collection is a system collection
 */
export function isSystemCollection(collectionName: string): boolean {
  return SYSTEM_COLLECTIONS.has(collectionName);
}

/**
 * Returns the list of system field names for the users collection
 * These fields are automatically provided by PocketBase for auth collections
 * and should not be included when generating migrations for users collection extensions
 *
 * @returns Set of system field names
 */
export function getUsersSystemFields(): Set<string> {
  return new Set(USERS_SYSTEM_FIELDS);
}

/**
 * Filters system collections from a schema definition
 * Returns a new SchemaDefinition with only custom (non-system) collections
 *
 * @param schema - Schema definition to filter
 * @returns Filtered SchemaDefinition without system collections
 */
export function filterSystemCollections(schema: SchemaDefinition): SchemaDefinition {
  const filteredCollections = new Map<string, CollectionSchema>();

  for (const [collectionName, collectionSchema] of schema.collections) {
    if (!isSystemCollection(collectionName)) {
      filteredCollections.set(collectionName, collectionSchema);
    }
  }

  return {
    collections: filteredCollections,
  };
}

/**
 * Identifies new collections in schema that don't exist in snapshot
 *
 * @param currentSchema - Current schema definition
 * @param previousSnapshot - Previous schema snapshot
 * @returns Array of new collections
 */
export function findNewCollections(
  currentSchema: SchemaDefinition,
  previousSnapshot: SchemaSnapshot | null
): CollectionSchema[] {
  const newCollections: CollectionSchema[] = [];

  // If no previous snapshot, all collections are new
  if (!previousSnapshot) {
    return Array.from(currentSchema.collections.values());
  }

  // Find collections in current schema that don't exist in snapshot
  for (const [collectionName, collectionSchema] of currentSchema.collections) {
    if (!previousSnapshot.collections.has(collectionName)) {
      newCollections.push(collectionSchema);
    }
  }

  return newCollections;
}

/**
 * Identifies collections removed from schema (exist in snapshot but not in current schema)
 *
 * @param currentSchema - Current schema definition
 * @param previousSnapshot - Previous schema snapshot
 * @returns Array of removed collections
 */
export function findRemovedCollections(
  currentSchema: SchemaDefinition,
  previousSnapshot: SchemaSnapshot | null
): CollectionSchema[] {
  const removedCollections: CollectionSchema[] = [];

  // If no previous snapshot, nothing can be removed
  if (!previousSnapshot) {
    return removedCollections;
  }

  // Find collections in snapshot that don't exist in current schema
  for (const [collectionName, collectionSchema] of previousSnapshot.collections) {
    if (!currentSchema.collections.has(collectionName)) {
      removedCollections.push(collectionSchema);
    }
  }

  return removedCollections;
}

/**
 * Matches collections by name between current schema and snapshot
 * Returns pairs of [current, previous] for collections that exist in both
 *
 * @param currentSchema - Current schema definition
 * @param previousSnapshot - Previous schema snapshot
 * @returns Array of matched collection pairs
 */
export function matchCollectionsByName(
  currentSchema: SchemaDefinition,
  previousSnapshot: SchemaSnapshot | null
): Array<[CollectionSchema, CollectionSchema]> {
  const matches: Array<[CollectionSchema, CollectionSchema]> = [];

  // If no previous snapshot, no matches possible
  if (!previousSnapshot) {
    return matches;
  }

  // Find collections that exist in both current and previous
  for (const [collectionName, currentCollection] of currentSchema.collections) {
    const previousCollection = previousSnapshot.collections.get(collectionName);

    if (previousCollection) {
      matches.push([currentCollection, previousCollection]);
    }
  }

  return matches;
}

/**
 * Identifies new fields in current collection that don't exist in previous
 *
 * @param currentFields - Current collection fields
 * @param previousFields - Previous collection fields
 * @returns Array of new fields
 */
export function findNewFields(currentFields: FieldDefinition[], previousFields: FieldDefinition[]): FieldDefinition[] {
  const newFields: FieldDefinition[] = [];
  const previousFieldNames = new Set(previousFields.map((f) => f.name));

  for (const currentField of currentFields) {
    if (!previousFieldNames.has(currentField.name)) {
      newFields.push(currentField);
    }
  }

  return newFields;
}

/**
 * Identifies fields removed from current collection (exist in previous but not in current)
 *
 * @param currentFields - Current collection fields
 * @param previousFields - Previous collection fields
 * @returns Array of removed fields
 */
export function findRemovedFields(
  currentFields: FieldDefinition[],
  previousFields: FieldDefinition[]
): FieldDefinition[] {
  const removedFields: FieldDefinition[] = [];
  const currentFieldNames = new Set(currentFields.map((f) => f.name));

  for (const previousField of previousFields) {
    if (!currentFieldNames.has(previousField.name)) {
      removedFields.push(previousField);
    }
  }

  return removedFields;
}

/**
 * Matches fields by name between current and previous collections
 * Returns pairs of [current, previous] for fields that exist in both
 *
 * @param currentFields - Current collection fields
 * @param previousFields - Previous collection fields
 * @returns Array of matched field pairs
 */
export function matchFieldsByName(
  currentFields: FieldDefinition[],
  previousFields: FieldDefinition[]
): Array<[FieldDefinition, FieldDefinition]> {
  const matches: Array<[FieldDefinition, FieldDefinition]> = [];

  // Create a map of previous fields by name for efficient lookup
  const previousFieldMap = new Map<string, FieldDefinition>();
  for (const previousField of previousFields) {
    previousFieldMap.set(previousField.name, previousField);
  }

  // Find matching fields
  for (const currentField of currentFields) {
    const previousField = previousFieldMap.get(currentField.name);

    if (previousField) {
      matches.push([currentField, previousField]);
    }
  }

  return matches;
}

/**
 * Compares two values for equality, handling deep object comparison
 *
 * @param a - First value
 * @param b - Second value
 * @returns True if values are equal
 */
function areValuesEqual(a: any, b: any): boolean {
  // Handle null/undefined
  if (a === b) return true;
  if (a == null || b == null) return false;

  // Handle arrays
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((val, idx) => areValuesEqual(val, b[idx]));
  }

  // Handle objects
  if (typeof a === "object" && typeof b === "object") {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) return false;

    return keysA.every((key) => areValuesEqual(a[key], b[key]));
  }

  // Primitive comparison
  return a === b;
}

/**
 * Compares field types between current and previous
 *
 * @param currentField - Current field definition
 * @param previousField - Previous field definition
 * @returns FieldChange if types differ, null otherwise
 */
export function compareFieldTypes(currentField: FieldDefinition, previousField: FieldDefinition): FieldChange | null {
  if (currentField.type !== previousField.type) {
    return {
      property: "type",
      oldValue: previousField.type,
      newValue: currentField.type,
    };
  }

  return null;
}

/**
 * Compares field constraints (required, unique) between current and previous
 *
 * @param currentField - Current field definition
 * @param previousField - Previous field definition
 * @returns Array of FieldChange for constraint differences
 */
export function compareFieldConstraints(currentField: FieldDefinition, previousField: FieldDefinition): FieldChange[] {
  const changes: FieldChange[] = [];

  // Compare required constraint
  if (currentField.required !== previousField.required) {
    changes.push({
      property: "required",
      oldValue: previousField.required,
      newValue: currentField.required,
    });
  }

  // Compare unique constraint
  if (currentField.unique !== previousField.unique) {
    changes.push({
      property: "unique",
      oldValue: previousField.unique,
      newValue: currentField.unique,
    });
  }

  return changes;
}

/**
 * Compares field options (min, max, pattern, etc.) between current and previous
 *
 * @param currentField - Current field definition
 * @param previousField - Previous field definition
 * @returns Array of FieldChange for option differences
 */
export function compareFieldOptions(currentField: FieldDefinition, previousField: FieldDefinition): FieldChange[] {
  const changes: FieldChange[] = [];

  const currentOptions = currentField.options || {};
  const previousOptions = previousField.options || {};

  // Get all unique option keys
  const allKeys = new Set([...Object.keys(currentOptions), ...Object.keys(previousOptions)]);

  // Compare each option
  for (const key of allKeys) {
    const currentValue = currentOptions[key];
    const previousValue = previousOptions[key];

    if (!areValuesEqual(currentValue, previousValue)) {
      changes.push({
        property: `options.${key}`,
        oldValue: previousValue,
        newValue: currentValue,
      });
    }
  }

  return changes;
}

/**
 * Compares relation configurations between current and previous
 *
 * @param currentField - Current field definition
 * @param previousField - Previous field definition
 * @returns Array of FieldChange for relation differences
 */
export function compareRelationConfigurations(
  currentField: FieldDefinition,
  previousField: FieldDefinition
): FieldChange[] {
  const changes: FieldChange[] = [];

  const currentRelation = currentField.relation;
  const previousRelation = previousField.relation;

  // If one has relation and other doesn't, that's a type change (handled elsewhere)
  if (!currentRelation && !previousRelation) {
    return changes;
  }

  if (!currentRelation || !previousRelation) {
    // This shouldn't happen if types match, but handle gracefully
    return changes;
  }

  // Compare relation properties
  if (currentRelation.collection !== previousRelation.collection) {
    changes.push({
      property: "relation.collection",
      oldValue: previousRelation.collection,
      newValue: currentRelation.collection,
    });
  }

  if (currentRelation.cascadeDelete !== previousRelation.cascadeDelete) {
    changes.push({
      property: "relation.cascadeDelete",
      oldValue: previousRelation.cascadeDelete,
      newValue: currentRelation.cascadeDelete,
    });
  }

  if (currentRelation.maxSelect !== previousRelation.maxSelect) {
    changes.push({
      property: "relation.maxSelect",
      oldValue: previousRelation.maxSelect,
      newValue: currentRelation.maxSelect,
    });
  }

  if (currentRelation.minSelect !== previousRelation.minSelect) {
    changes.push({
      property: "relation.minSelect",
      oldValue: previousRelation.minSelect,
      newValue: currentRelation.minSelect,
    });
  }

  return changes;
}

/**
 * Detects all changes between two field definitions
 * Combines type, constraint, option, and relation changes
 *
 * @param currentField - Current field definition
 * @param previousField - Previous field definition
 * @returns Array of all detected changes
 */
export function detectFieldChanges(currentField: FieldDefinition, previousField: FieldDefinition): FieldChange[] {
  const changes: FieldChange[] = [];

  // Compare types
  const typeChange = compareFieldTypes(currentField, previousField);
  if (typeChange) {
    changes.push(typeChange);
  }

  // Compare constraints
  changes.push(...compareFieldConstraints(currentField, previousField));

  // Compare options
  changes.push(...compareFieldOptions(currentField, previousField));

  // Compare relation configurations (if applicable)
  if (currentField.type === "relation" && previousField.type === "relation") {
    changes.push(...compareRelationConfigurations(currentField, previousField));
  }

  return changes;
}

/**
 * Compares indexes between current and previous collections
 *
 * @param currentIndexes - Current collection indexes
 * @param previousIndexes - Previous collection indexes
 * @returns Object with indexes to add and remove
 */
function compareIndexes(
  currentIndexes: string[] = [],
  previousIndexes: string[] = []
): { indexesToAdd: string[]; indexesToRemove: string[] } {
  const currentSet = new Set(currentIndexes);
  const previousSet = new Set(previousIndexes);

  const indexesToAdd = currentIndexes.filter((idx) => !previousSet.has(idx));
  const indexesToRemove = previousIndexes.filter((idx) => !currentSet.has(idx));

  return { indexesToAdd, indexesToRemove };
}

/**
 * Compares API rules between current and previous collections
 *
 * @param currentRules - Current collection rules
 * @param previousRules - Previous collection rules
 * @returns Array of rule updates
 */
function compareRules(currentRules: CollectionSchema["rules"], previousRules: CollectionSchema["rules"]): RuleUpdate[] {
  const updates: RuleUpdate[] = [];

  const ruleTypes: Array<keyof NonNullable<CollectionSchema["rules"]>> = [
    "listRule",
    "viewRule",
    "createRule",
    "updateRule",
    "deleteRule",
    "manageRule",
  ];

  for (const ruleType of ruleTypes) {
    const currentValue = currentRules?.[ruleType] ?? null;
    const previousValue = previousRules?.[ruleType] ?? null;

    if (currentValue !== previousValue) {
      updates.push({
        ruleType: ruleType as RuleUpdate["ruleType"],
        oldValue: previousValue,
        newValue: currentValue,
      });
    }
  }

  return updates;
}

/**
 * Compares permissions between current and previous collections
 * Detects changes in permission rules defined in schema
 *
 * @param currentPermissions - Current collection permissions
 * @param previousPermissions - Previous collection permissions
 * @returns Array of permission changes
 */
export function comparePermissions(
  currentPermissions: CollectionSchema["permissions"],
  previousPermissions: CollectionSchema["permissions"]
): PermissionChange[] {
  const changes: PermissionChange[] = [];

  const ruleTypes: APIRuleType[] = ["listRule", "viewRule", "createRule", "updateRule", "deleteRule", "manageRule"];

  for (const ruleType of ruleTypes) {
    const currentValue = currentPermissions?.[ruleType] ?? null;
    const previousValue = previousPermissions?.[ruleType] ?? null;

    // Compare permission values
    if (currentValue !== previousValue) {
      changes.push({
        ruleType,
        oldValue: previousValue,
        newValue: currentValue,
      });
    }
  }

  return changes;
}

/**
 * Compares fields between current and previous collections
 * Identifies new, removed, and modified fields
 * For the users collection, filters out system fields from fieldsToAdd
 *
 * @param currentCollection - Current collection schema
 * @param previousCollection - Previous collection schema
 * @returns Object with field changes
 */
function compareCollectionFields(
  currentCollection: CollectionSchema,
  previousCollection: CollectionSchema
): {
  fieldsToAdd: FieldDefinition[];
  fieldsToRemove: FieldDefinition[];
  fieldsToModify: FieldModification[];
} {
  let fieldsToAdd = findNewFields(currentCollection.fields, previousCollection.fields);
  const fieldsToRemove = findRemovedFields(currentCollection.fields, previousCollection.fields);
  const fieldsToModify: FieldModification[] = [];

  // For users collection, filter out system fields from fieldsToAdd
  // System fields are automatically provided by PocketBase and should not be in migrations
  if (currentCollection.name === "users") {
    const systemFields = getUsersSystemFields();
    fieldsToAdd = fieldsToAdd.filter((field) => !systemFields.has(field.name));
  }

  // Check for modified fields
  const matchedFields = matchFieldsByName(currentCollection.fields, previousCollection.fields);

  for (const [currentField, previousField] of matchedFields) {
    const changes = detectFieldChanges(currentField, previousField);

    if (changes.length > 0) {
      fieldsToModify.push({
        fieldName: currentField.name,
        currentDefinition: previousField,
        newDefinition: currentField,
        changes,
      });
    }
  }

  return { fieldsToAdd, fieldsToRemove, fieldsToModify };
}

/**
 * Builds a CollectionModification for a matched collection pair
 *
 * @param currentCollection - Current collection schema
 * @param previousCollection - Previous collection schema
 * @returns CollectionModification object
 */
function buildCollectionModification(
  currentCollection: CollectionSchema,
  previousCollection: CollectionSchema
): CollectionModification {
  // Compare fields
  const { fieldsToAdd, fieldsToRemove, fieldsToModify } = compareCollectionFields(
    currentCollection,
    previousCollection
  );

  // Compare indexes
  const { indexesToAdd, indexesToRemove } = compareIndexes(currentCollection.indexes, previousCollection.indexes);

  // Compare rules
  const rulesToUpdate = compareRules(currentCollection.rules, previousCollection.rules);

  // Compare permissions
  const permissionsToUpdate = comparePermissions(currentCollection.permissions, previousCollection.permissions);

  return {
    collection: currentCollection.name,
    fieldsToAdd,
    fieldsToRemove,
    fieldsToModify,
    indexesToAdd,
    indexesToRemove,
    rulesToUpdate,
    permissionsToUpdate,
  };
}

/**
 * Checks if a collection modification has any actual changes
 *
 * @param modification - Collection modification to check
 * @returns True if there are any changes
 */
function hasChanges(modification: CollectionModification): boolean {
  return (
    modification.fieldsToAdd.length > 0 ||
    modification.fieldsToRemove.length > 0 ||
    modification.fieldsToModify.length > 0 ||
    modification.indexesToAdd.length > 0 ||
    modification.indexesToRemove.length > 0 ||
    modification.rulesToUpdate.length > 0 ||
    modification.permissionsToUpdate.length > 0
  );
}

/**
 * Aggregates all detected changes into a SchemaDiff
 * Main entry point for diff comparison
 *
 * @param currentSchema - Current schema definition
 * @param previousSnapshot - Previous schema snapshot
 * @returns Complete SchemaDiff with all changes
 */
export function aggregateChanges(currentSchema: SchemaDefinition, previousSnapshot: SchemaSnapshot | null): SchemaDiff {
  // Find new and removed collections
  const collectionsToCreate = findNewCollections(currentSchema, previousSnapshot);
  const collectionsToDelete = findRemovedCollections(currentSchema, previousSnapshot);

  // Filter out system collections from create and delete operations
  const filteredCollectionsToCreate = collectionsToCreate.filter((collection) => !isSystemCollection(collection.name));
  const filteredCollectionsToDelete = collectionsToDelete.filter((collection) => !isSystemCollection(collection.name));

  // Find modified collections
  const collectionsToModify: CollectionModification[] = [];
  const matchedCollections = matchCollectionsByName(currentSchema, previousSnapshot);

  for (const [currentCollection, previousCollection] of matchedCollections) {
    const modification = buildCollectionModification(currentCollection, previousCollection);

    // Only include if there are actual changes
    // Note: We allow modifications to the users collection (non-system)
    if (hasChanges(modification)) {
      collectionsToModify.push(modification);
    }
  }

  return {
    collectionsToCreate: filteredCollectionsToCreate,
    collectionsToDelete: filteredCollectionsToDelete,
    collectionsToModify,
  };
}

/**
 * Categorizes changes by severity
 * Returns object with destructive and non-destructive changes
 *
 * @param diff - Schema diff to categorize
 * @returns Object with categorized changes
 */
export function categorizeChangesBySeverity(diff: SchemaDiff): {
  destructive: string[];
  nonDestructive: string[];
} {
  const destructive: string[] = [];
  const nonDestructive: string[] = [];

  // Collection deletions are destructive
  for (const collection of diff.collectionsToDelete) {
    destructive.push(`Delete collection: ${collection.name}`);
  }

  // Collection creations are non-destructive
  for (const collection of diff.collectionsToCreate) {
    nonDestructive.push(`Create collection: ${collection.name}`);
  }

  // Analyze modifications
  for (const modification of diff.collectionsToModify) {
    const collectionName = modification.collection;

    // Field deletions are destructive
    for (const field of modification.fieldsToRemove) {
      destructive.push(`Delete field: ${collectionName}.${field.name}`);
    }

    // Field additions are non-destructive
    for (const field of modification.fieldsToAdd) {
      nonDestructive.push(`Add field: ${collectionName}.${field.name}`);
    }

    // Field modifications can be destructive or non-destructive
    for (const fieldMod of modification.fieldsToModify) {
      const hasTypeChange = fieldMod.changes.some((c) => c.property === "type");
      const hasRequiredChange = fieldMod.changes.some((c) => c.property === "required" && c.newValue === true);

      if (hasTypeChange) {
        destructive.push(
          `Change field type: ${collectionName}.${fieldMod.fieldName} (${fieldMod.changes.find((c) => c.property === "type")?.oldValue} → ${fieldMod.changes.find((c) => c.property === "type")?.newValue})`
        );
      } else if (hasRequiredChange) {
        destructive.push(`Make field required: ${collectionName}.${fieldMod.fieldName}`);
      } else {
        nonDestructive.push(`Modify field: ${collectionName}.${fieldMod.fieldName}`);
      }
    }

    // Index changes are generally non-destructive
    for (const _index of modification.indexesToAdd) {
      nonDestructive.push(`Add index: ${collectionName}`);
    }

    for (const _index of modification.indexesToRemove) {
      nonDestructive.push(`Remove index: ${collectionName}`);
    }

    // Rule changes are non-destructive
    for (const rule of modification.rulesToUpdate) {
      nonDestructive.push(`Update rule: ${collectionName}.${rule.ruleType}`);
    }
  }

  return { destructive, nonDestructive };
}

/**
 * Main comparison function
 * Compares current schema with previous snapshot and returns complete diff
 *
 * @param currentSchema - Current schema definition
 * @param previousSnapshot - Previous schema snapshot (null for first run)
 * @returns Complete SchemaDiff with all detected changes
 */
export function compare(currentSchema: SchemaDefinition, previousSnapshot: SchemaSnapshot | null): SchemaDiff {
  return aggregateChanges(currentSchema, previousSnapshot);
}
