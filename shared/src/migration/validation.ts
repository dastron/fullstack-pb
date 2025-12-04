/**
 * Validation and warning utilities for migration tool
 * Detects destructive changes and provides warnings
 */

import type { SchemaDiff } from "./types";

/**
 * Types of destructive changes
 */
export enum DestructiveChangeType {
  COLLECTION_DELETION = "collection_deletion",
  FIELD_DELETION = "field_deletion",
  FIELD_TYPE_CHANGE = "field_type_change",
  FIELD_REQUIRED_CHANGE = "field_required_change",
}

/**
 * Represents a destructive change with details
 */
export interface DestructiveChange {
  type: DestructiveChangeType;
  description: string;
  collection: string;
  field?: string;
  details?: {
    oldValue?: any;
    newValue?: any;
  };
  severity: "high" | "medium" | "low";
  warning: string;
}

/**
 * Detects collection deletions
 *
 * @param diff - Schema diff
 * @returns Array of destructive changes for collection deletions
 */
function detectCollectionDeletions(diff: SchemaDiff): DestructiveChange[] {
  const changes: DestructiveChange[] = [];

  for (const collection of diff.collectionsToDelete) {
    changes.push({
      type: DestructiveChangeType.COLLECTION_DELETION,
      description: `Delete collection: ${collection.name}`,
      collection: collection.name,
      severity: "high",
      warning: `All data in the "${collection.name}" collection will be permanently deleted.`,
    });
  }

  return changes;
}

/**
 * Detects field deletions
 *
 * @param diff - Schema diff
 * @returns Array of destructive changes for field deletions
 */
function detectFieldDeletions(diff: SchemaDiff): DestructiveChange[] {
  const changes: DestructiveChange[] = [];

  for (const modification of diff.collectionsToModify) {
    for (const field of modification.fieldsToRemove) {
      changes.push({
        type: DestructiveChangeType.FIELD_DELETION,
        description: `Delete field: ${modification.collection}.${field.name}`,
        collection: modification.collection,
        field: field.name,
        severity: "high",
        warning: `All data in the "${field.name}" field of "${modification.collection}" will be permanently deleted.`,
      });
    }
  }

  return changes;
}

/**
 * Detects field type changes
 *
 * @param diff - Schema diff
 * @returns Array of destructive changes for field type changes
 */
function detectFieldTypeChanges(diff: SchemaDiff): DestructiveChange[] {
  const changes: DestructiveChange[] = [];

  for (const modification of diff.collectionsToModify) {
    for (const fieldMod of modification.fieldsToModify) {
      const typeChange = fieldMod.changes.find((c) => c.property === "type");

      if (typeChange) {
        changes.push({
          type: DestructiveChangeType.FIELD_TYPE_CHANGE,
          description: `Change field type: ${modification.collection}.${fieldMod.fieldName}`,
          collection: modification.collection,
          field: fieldMod.fieldName,
          details: {
            oldValue: typeChange.oldValue,
            newValue: typeChange.newValue,
          },
          severity: "high",
          warning: `Changing field type from "${typeChange.oldValue}" to "${typeChange.newValue}" may cause data loss or conversion errors.`,
        });
      }
    }
  }

  return changes;
}

/**
 * Detects field required changes (making optional field required)
 *
 * @param diff - Schema diff
 * @returns Array of destructive changes for required field changes
 */
function detectFieldRequiredChanges(diff: SchemaDiff): DestructiveChange[] {
  const changes: DestructiveChange[] = [];

  for (const modification of diff.collectionsToModify) {
    for (const fieldMod of modification.fieldsToModify) {
      const requiredChange = fieldMod.changes.find(
        (c) => c.property === "required" && c.newValue === true && c.oldValue === false
      );

      if (requiredChange) {
        changes.push({
          type: DestructiveChangeType.FIELD_REQUIRED_CHANGE,
          description: `Make field required: ${modification.collection}.${fieldMod.fieldName}`,
          collection: modification.collection,
          field: fieldMod.fieldName,
          details: {
            oldValue: false,
            newValue: true,
          },
          severity: "medium",
          warning: `Making "${fieldMod.fieldName}" required may cause issues with existing records that have null/empty values.`,
        });
      }
    }
  }

  return changes;
}

/**
 * Detects all destructive changes in a schema diff
 *
 * @param diff - Schema diff to analyze
 * @returns Array of all destructive changes
 */
export function detectDestructiveChanges(diff: SchemaDiff): DestructiveChange[] {
  const changes: DestructiveChange[] = [];

  // Detect collection deletions
  changes.push(...detectCollectionDeletions(diff));

  // Detect field deletions
  changes.push(...detectFieldDeletions(diff));

  // Detect field type changes
  changes.push(...detectFieldTypeChanges(diff));

  // Detect field required changes
  changes.push(...detectFieldRequiredChanges(diff));

  return changes;
}

/**
 * Checks if a diff contains any destructive changes
 *
 * @param diff - Schema diff to check
 * @returns True if there are destructive changes
 */
export function hasDestructiveChanges(diff: SchemaDiff): boolean {
  const changes = detectDestructiveChanges(diff);
  return changes.length > 0;
}

/**
 * Formats destructive changes for display
 * Groups changes by severity and provides clear warnings
 *
 * @param changes - Array of destructive changes
 * @returns Formatted string for display
 */
export function formatDestructiveChanges(changes: DestructiveChange[]): string {
  if (changes.length === 0) {
    return "No destructive changes detected.";
  }

  const lines: string[] = [];

  // Group by severity
  const highSeverity = changes.filter((c) => c.severity === "high");
  const mediumSeverity = changes.filter((c) => c.severity === "medium");
  const lowSeverity = changes.filter((c) => c.severity === "low");

  // Display high severity changes
  if (highSeverity.length > 0) {
    lines.push("🔴 HIGH SEVERITY CHANGES (Data Loss Risk):");
    lines.push("");
    for (const change of highSeverity) {
      lines.push(`  • ${change.description}`);
      lines.push(`    ⚠️  ${change.warning}`);
      if (change.details) {
        if (change.details.oldValue !== undefined && change.details.newValue !== undefined) {
          lines.push(`    Old: ${change.details.oldValue} → New: ${change.details.newValue}`);
        }
      }
      lines.push("");
    }
  }

  // Display medium severity changes
  if (mediumSeverity.length > 0) {
    lines.push("🟡 MEDIUM SEVERITY CHANGES (Potential Issues):");
    lines.push("");
    for (const change of mediumSeverity) {
      lines.push(`  • ${change.description}`);
      lines.push(`    ⚠️  ${change.warning}`);
      if (change.details) {
        if (change.details.oldValue !== undefined && change.details.newValue !== undefined) {
          lines.push(`    Old: ${change.details.oldValue} → New: ${change.details.newValue}`);
        }
      }
      lines.push("");
    }
  }

  // Display low severity changes
  if (lowSeverity.length > 0) {
    lines.push("🟢 LOW SEVERITY CHANGES:");
    lines.push("");
    for (const change of lowSeverity) {
      lines.push(`  • ${change.description}`);
      lines.push(`    ℹ️  ${change.warning}`);
      lines.push("");
    }
  }

  return lines.join("\n");
}

/**
 * Generates a summary of destructive changes
 *
 * @param changes - Array of destructive changes
 * @returns Summary object with counts by severity
 */
export function summarizeDestructiveChanges(changes: DestructiveChange[]): {
  total: number;
  high: number;
  medium: number;
  low: number;
} {
  return {
    total: changes.length,
    high: changes.filter((c) => c.severity === "high").length,
    medium: changes.filter((c) => c.severity === "medium").length,
    low: changes.filter((c) => c.severity === "low").length,
  };
}

/**
 * Checks if force flag is required for the given changes
 * Force is required if there are any high or medium severity changes
 *
 * @param changes - Array of destructive changes
 * @returns True if force flag should be required
 */
export function requiresForceFlag(changes: DestructiveChange[]): boolean {
  return changes.some((c) => c.severity === "high" || c.severity === "medium");
}
