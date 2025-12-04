/**
 * Shared types for migration tool
 */

export type PocketBaseFieldType =
  | "text"
  | "email"
  | "url"
  | "number"
  | "bool"
  | "date"
  | "select"
  | "relation"
  | "file"
  | "json";

/**
 * PocketBase API rule types
 */
export type APIRuleType = "listRule" | "viewRule" | "createRule" | "updateRule" | "deleteRule" | "manageRule";

export interface FieldDefinition {
  name: string;
  type: PocketBaseFieldType;
  required: boolean;
  unique?: boolean;
  options?: Record<string, any>;
  relation?: {
    collection: string;
    cascadeDelete?: boolean;
    maxSelect?: number;
    minSelect?: number;
  };
}

export interface CollectionSchema {
  name: string;
  type: "base" | "auth";
  fields: FieldDefinition[];
  indexes?: string[];
  rules?: {
    listRule?: string | null;
    viewRule?: string | null;
    createRule?: string | null;
    updateRule?: string | null;
    deleteRule?: string | null;
    manageRule?: string | null;
  };
  permissions?: {
    listRule?: string | null;
    viewRule?: string | null;
    createRule?: string | null;
    updateRule?: string | null;
    deleteRule?: string | null;
    manageRule?: string | null;
  };
}

export interface SchemaDefinition {
  collections: Map<string, CollectionSchema>;
}

export interface SchemaSnapshot {
  version: string;
  timestamp: string;
  collections: Map<string, CollectionSchema>;
}

export interface FieldChange {
  property: string;
  oldValue: any;
  newValue: any;
}

export interface FieldModification {
  fieldName: string;
  currentDefinition: any;
  newDefinition: FieldDefinition;
  changes: FieldChange[];
}

export interface RuleUpdate {
  ruleType: "listRule" | "viewRule" | "createRule" | "updateRule" | "deleteRule" | "manageRule";
  oldValue: string | null;
  newValue: string | null;
}

/**
 * Permission change tracking for migrations
 */
export interface PermissionChange {
  ruleType: APIRuleType;
  oldValue: string | null;
  newValue: string | null;
}

export interface CollectionModification {
  collection: string;
  fieldsToAdd: FieldDefinition[];
  fieldsToRemove: any[];
  fieldsToModify: FieldModification[];
  indexesToAdd: string[];
  indexesToRemove: string[];
  rulesToUpdate: RuleUpdate[];
  permissionsToUpdate: PermissionChange[];
}

export interface SchemaDiff {
  collectionsToCreate: CollectionSchema[];
  collectionsToDelete: any[];
  collectionsToModify: CollectionModification[];
}
