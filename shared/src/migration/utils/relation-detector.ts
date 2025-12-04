/**
 * Relation field detection utilities
 */

import { z } from "zod";
import { pluralize } from "./pluralize";

/**
 * Detects if a field is a single relation based on naming convention
 * Single relation: field name matches a collection name (e.g., "User" -> "Users" collection)
 */
export function isSingleRelationField(fieldName: string, zodType: z.ZodTypeAny): boolean {
  // Unwrap optional/nullable/default
  let unwrappedType = zodType;
  if (zodType instanceof z.ZodOptional) {
    unwrappedType = zodType._def.innerType;
  }
  if (unwrappedType instanceof z.ZodNullable) {
    unwrappedType = unwrappedType._def.innerType;
  }
  if (unwrappedType instanceof z.ZodDefault) {
    unwrappedType = unwrappedType._def.innerType;
  }

  // Must be a string type
  if (!(unwrappedType instanceof z.ZodString)) {
    return false;
  }

  // Field name should start with uppercase (convention for entity references)
  // and not be a common string field name
  const startsWithUppercase = /^[A-Z]/.test(fieldName);

  // Exclude common string fields that start with uppercase
  const commonStringFields = ["Title", "Name", "Description", "Content", "Summary", "Status", "Type"];
  const isCommonField = commonStringFields.includes(fieldName);

  return startsWithUppercase && !isCommonField;
}

/**
 * Detects if a field is a multiple relation based on naming convention
 * Multiple relation: field name is an array of strings ending with entity name
 * (e.g., "SubscriberUsers" -> "Users" collection)
 */
export function isMultipleRelationField(fieldName: string, zodType: z.ZodTypeAny): boolean {
  // Unwrap optional/nullable/default
  let unwrappedType = zodType;
  if (zodType instanceof z.ZodOptional) {
    unwrappedType = zodType._def.innerType;
  }
  if (unwrappedType instanceof z.ZodNullable) {
    unwrappedType = unwrappedType._def.innerType;
  }
  if (unwrappedType instanceof z.ZodDefault) {
    unwrappedType = unwrappedType._def.innerType;
  }

  // Must be an array type
  if (!(unwrappedType instanceof z.ZodArray)) {
    return false;
  }

  // Element type must be string
  const elementType = unwrappedType._def.type;
  if (!(elementType instanceof z.ZodString)) {
    return false;
  }

  // Field name should contain an uppercase letter (entity reference pattern)
  const hasUppercase = /[A-Z]/.test(fieldName);

  return hasUppercase;
}

/**
 * Resolves the target collection name from a relation field name
 * Examples:
 * - "User" -> "Users"
 * - "SubscriberUsers" -> "Users"
 * - "Author" -> "Authors"
 * - "Category" -> "Categories"
 */
export function resolveTargetCollection(fieldName: string): string {
  // For single relations, the field name is typically the entity name
  // For multiple relations, extract the entity name from the end

  // Check if field name ends with a known plural entity name
  // Common patterns: "SubscriberUsers", "RelatedPosts", "Tags"

  // Try to find the entity name by looking for uppercase letters
  const matches = fieldName.match(/[A-Z][a-z]+/g);

  if (!matches || matches.length === 0) {
    // Fallback: pluralize the entire field name
    return pluralize(fieldName);
  }

  // Take the last matched entity name (e.g., "Users" from "SubscriberUsers")
  const entityName = matches[matches.length - 1];

  // Pluralize the entity name to get collection name
  return pluralize(entityName);
}

/**
 * Detects if a field is any type of relation (single or multiple)
 */
export function isRelationField(fieldName: string, zodType: z.ZodTypeAny): boolean {
  return isSingleRelationField(fieldName, zodType) || isMultipleRelationField(fieldName, zodType);
}

/**
 * Gets the maximum number of relations allowed for a relation field
 * Returns 1 for single relations, or the max constraint for multiple relations
 */
export function getMaxSelect(fieldName: string, zodType: z.ZodTypeAny): number {
  if (isSingleRelationField(fieldName, zodType)) {
    return 1;
  }

  if (isMultipleRelationField(fieldName, zodType)) {
    // Unwrap to get to the array type
    let unwrappedType = zodType;
    if (zodType instanceof z.ZodOptional) {
      unwrappedType = zodType._def.innerType;
    }
    if (unwrappedType instanceof z.ZodNullable) {
      unwrappedType = unwrappedType._def.innerType;
    }
    if (unwrappedType instanceof z.ZodDefault) {
      unwrappedType = unwrappedType._def.innerType;
    }

    if (unwrappedType instanceof z.ZodArray) {
      // Access the checks array from the array definition
      const arrayDef = unwrappedType._def;
      if (arrayDef.maxLength) {
        return arrayDef.maxLength.value;
      }
      // Default to 999 for multiple relations without explicit max
      return 999;
    }
  }

  return 1;
}

/**
 * Gets the minimum number of relations required for a relation field
 */
export function getMinSelect(fieldName: string, zodType: z.ZodTypeAny): number | undefined {
  if (!isMultipleRelationField(fieldName, zodType)) {
    return undefined;
  }

  // Unwrap to get to the array type
  let unwrappedType = zodType;
  if (zodType instanceof z.ZodOptional) {
    unwrappedType = zodType._def.innerType;
  }
  if (unwrappedType instanceof z.ZodNullable) {
    unwrappedType = unwrappedType._def.innerType;
  }
  if (unwrappedType instanceof z.ZodDefault) {
    unwrappedType = unwrappedType._def.innerType;
  }

  if (unwrappedType instanceof z.ZodArray) {
    // Access the minLength from the array definition
    const arrayDef = unwrappedType._def;
    if (arrayDef.minLength) {
      return arrayDef.minLength.value;
    }
  }

  return undefined;
}
