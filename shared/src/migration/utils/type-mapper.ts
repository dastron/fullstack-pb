/**
 * Zod to PocketBase type mapping utilities
 */

import { z } from "zod";
import type { PocketBaseFieldType } from "../types";

/**
 * Maps Zod string types to PocketBase field types
 */
export function mapZodStringType(zodType: z.ZodString): PocketBaseFieldType {
  const checks = (zodType as any)._def.checks || [];

  // Check for email validation
  const hasEmail = checks.some((check: any) => check.kind === "email");
  if (hasEmail) {
    return "email";
  }

  // Check for URL validation
  const hasUrl = checks.some((check: any) => check.kind === "url");
  if (hasUrl) {
    return "url";
  }

  // Default to text
  return "text";
}

/**
 * Maps Zod number types to PocketBase number type
 */
export function mapZodNumberType(zodType: z.ZodNumber): PocketBaseFieldType {
  return "number";
}

/**
 * Maps Zod boolean types to PocketBase bool type
 */
export function mapZodBooleanType(zodType: z.ZodBoolean): PocketBaseFieldType {
  return "bool";
}

/**
 * Maps Zod enum types to PocketBase select type
 */
export function mapZodEnumType(zodType: z.ZodEnum<any>): PocketBaseFieldType {
  return "select";
}

/**
 * Maps Zod array types to appropriate PocketBase types
 * Arrays of strings could be relations or file fields depending on context
 */
export function mapZodArrayType(zodType: z.ZodArray<any>, fieldName: string): PocketBaseFieldType {
  const elementType = zodType._def.type;

  // Check if it's an array of File instances (file upload)
  if (elementType instanceof z.ZodType) {
    const typeName = elementType._def.typeName;
    if (typeName === "ZodType" && (elementType as any)._def?.innerType?.name === "File") {
      return "file";
    }
  }

  // Check for instanceof File
  if (elementType._def?.typeName === "ZodType") {
    const checks = (elementType as any)._def?.checks || [];
    const isFileInstance = checks.some(
      (check: any) => check.kind === "instanceof" || (elementType as any)._def?.innerType?.name === "File"
    );
    if (isFileInstance) {
      return "file";
    }
  }

  // Array of strings - could be relation (will be determined by relation detector)
  if (elementType instanceof z.ZodString) {
    return "relation";
  }

  // Default to JSON for other array types
  return "json";
}

/**
 * Maps Zod date types to PocketBase date type
 */
export function mapZodDateType(zodType: z.ZodDate): PocketBaseFieldType {
  return "date";
}

/**
 * Maps Zod record/object types to PocketBase JSON type
 */
export function mapZodRecordType(zodType: z.ZodRecord | z.ZodObject<any>): PocketBaseFieldType {
  return "json";
}

/**
 * Main type mapping function that determines PocketBase field type from Zod type
 */
export function mapZodTypeToPocketBase(zodType: z.ZodTypeAny, fieldName: string): PocketBaseFieldType {
  // Handle optional and nullable types by unwrapping
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

  // Check for ZodEffects (which is what z.instanceof() creates)
  if ((unwrappedType as any)._def?.typeName === "ZodEffects") {
    const effect = (unwrappedType as any)._def?.effect;

    // z.instanceof(File) creates a refinement effect
    // We need to check if this is a File instance check
    // The field name 'avatar', 'image', 'file', 'attachment' etc. are hints
    if (effect?.type === "refinement") {
      // Common file field names
      const fileFieldNames = ["avatar", "image", "file", "attachment", "photo", "picture", "document", "upload"];
      if (fileFieldNames.some((name) => fieldName.toLowerCase().includes(name))) {
        return "file";
      }
    }
  }

  // Check for instanceof File (z.instanceof(File)) - legacy check
  if ((unwrappedType as any)._def?.typeName === "ZodType") {
    const checks = (unwrappedType as any)._def?.checks || [];
    const innerType = (unwrappedType as any)._def?.innerType;

    // Check if it's instanceof File
    if (innerType?.name === "File" || checks.some((check: any) => check.kind === "instanceof")) {
      return "file";
    }
  }

  // Map based on Zod type
  if (unwrappedType instanceof z.ZodString) {
    return mapZodStringType(unwrappedType);
  }

  if (unwrappedType instanceof z.ZodNumber) {
    return mapZodNumberType(unwrappedType);
  }

  if (unwrappedType instanceof z.ZodBoolean) {
    return mapZodBooleanType(unwrappedType);
  }

  if (unwrappedType instanceof z.ZodEnum) {
    return mapZodEnumType(unwrappedType);
  }

  if (unwrappedType instanceof z.ZodArray) {
    return mapZodArrayType(unwrappedType, fieldName);
  }

  if (unwrappedType instanceof z.ZodDate) {
    return mapZodDateType(unwrappedType);
  }

  if (unwrappedType instanceof z.ZodRecord || unwrappedType instanceof z.ZodObject) {
    return mapZodRecordType(unwrappedType);
  }

  // Default to text for unknown types
  return "text";
}

/**
 * Extracts field options from Zod type (min, max, pattern, etc.)
 */
export function extractFieldOptions(zodType: z.ZodTypeAny): Record<string, any> {
  const options: Record<string, any> = {};

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

  const checks = (unwrappedType as any)._def?.checks || [];

  // Extract string constraints
  if (unwrappedType instanceof z.ZodString) {
    for (const check of checks) {
      if (check.kind === "min") {
        options.min = check.value;
      }
      if (check.kind === "max") {
        options.max = check.value;
      }
      if (check.kind === "regex") {
        options.pattern = check.regex.source;
      }
    }
  }

  // Extract number constraints
  if (unwrappedType instanceof z.ZodNumber) {
    for (const check of checks) {
      if (check.kind === "min") {
        options.min = check.value;
      }
      if (check.kind === "max") {
        options.max = check.value;
      }
    }
  }

  // Extract enum values
  if (unwrappedType instanceof z.ZodEnum) {
    options.values = unwrappedType._def.values;
  }

  // Extract array constraints
  if (unwrappedType instanceof z.ZodArray) {
    const arrayChecks = (unwrappedType as any)._def?.checks || [];
    for (const check of arrayChecks) {
      if (check.kind === "min") {
        options.minSelect = check.value;
      }
      if (check.kind === "max") {
        options.maxSelect = check.value;
      }
    }
  }

  return options;
}

/**
 * Determines if a Zod field is required (not optional)
 */
export function isFieldRequired(zodType: z.ZodTypeAny): boolean {
  // Check if it's optional
  if (zodType instanceof z.ZodOptional) {
    return false;
  }

  // Check if it has a default value (makes it optional)
  if (zodType instanceof z.ZodDefault) {
    return false;
  }

  // Check for nullable (in PocketBase context, nullable means optional)
  if (zodType instanceof z.ZodNullable) {
    return false;
  }

  return true;
}
