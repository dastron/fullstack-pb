/**
 * Property-based tests for field type mapping completeness
 *
 * Feature: migration-test-suite, Property 10: Field type mapping completeness
 * Validates: Requirements 3.1-3.13
 *
 * These tests use fast-check to verify that all PocketBase field types
 * generate correct configuration across all valid inputs.
 */

import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { generateFieldDefinitionObject } from "../../generator";
import type { FieldDefinition, PocketBaseFieldType } from "../../types";

/**
 * Arbitrary for generating field names
 */
const fieldNameArb = fc.stringMatching(/^[a-z][a-z0-9_]{0,19}$/);

/**
 * Arbitrary for generating text field options
 */
const textOptionsArb = fc.record({
  min: fc.nat({ max: 100 }),
  max: fc.nat({ max: 1000 }),
  pattern: fc.oneof(fc.constant(""), fc.stringMatching(/^\^[a-z0-9\-\[\]]+\$$/)),
  autogeneratePattern: fc.constant(""),
  primaryKey: fc.boolean(),
});

/**
 * Arbitrary for generating number field options
 */
const numberOptionsArb = fc.record({
  min: fc.oneof(fc.constant(null), fc.integer({ min: -1000, max: 1000 })),
  max: fc.oneof(fc.constant(null), fc.integer({ min: -1000, max: 1000 })),
  onlyInt: fc.boolean(),
});

/**
 * Arbitrary for generating email/url field options
 */
const domainOptionsArb = fc.record({
  exceptDomains: fc.oneof(fc.constant(null), fc.array(fc.domain(), { maxLength: 3 })),
  onlyDomains: fc.oneof(fc.constant(null), fc.array(fc.domain(), { maxLength: 3 })),
});

/**
 * Arbitrary for generating date field options
 */
const dateOptionsArb = fc.record({
  min: fc.oneof(
    fc.constant(""),
    fc.date().map((d) => d.toISOString())
  ),
  max: fc.oneof(
    fc.constant(""),
    fc.date().map((d) => d.toISOString())
  ),
});

/**
 * Arbitrary for generating select field options
 */
const selectOptionsArb = fc.record({
  values: fc.array(fc.stringMatching(/^[a-z][a-z0-9_]{0,19}$/), { minLength: 1, maxLength: 10 }),
  maxSelect: fc.integer({ min: 1, max: 10 }),
});

/**
 * Arbitrary for generating file field options
 */
const fileOptionsArb = fc.record({
  maxSelect: fc.integer({ min: 1, max: 10 }),
  maxSize: fc.integer({ min: 0, max: 10485760 }), // Up to 10MB
  mimeTypes: fc.array(fc.constantFrom("image/jpeg", "image/png", "application/pdf"), { maxLength: 5 }),
  thumbs: fc.array(fc.constantFrom("100x100", "300x300", "800x600"), { maxLength: 3 }),
  protected: fc.boolean(),
});

/**
 * Arbitrary for generating relation field configuration
 */
const relationArb = fc.record({
  collection: fc.oneof(fc.constant("Users"), fc.stringMatching(/^[a-z][a-z0-9_]{0,19}$/)),
  cascadeDelete: fc.boolean(),
  maxSelect: fc.integer({ min: 1, max: 10 }),
  minSelect: fc.constant(0),
});

/**
 * Arbitrary for generating json field options
 */
const jsonOptionsArb = fc.record({
  maxSize: fc.integer({ min: 0, max: 2097152 }), // Up to 2MB
});

/**
 * Arbitrary for generating editor field options
 */
const editorOptionsArb = fc.record({
  convertURLs: fc.boolean(),
});

/**
 * Arbitrary for generating autodate field options
 */
const autodateOptionsArb = fc.record({
  onCreate: fc.boolean(),
  onUpdate: fc.boolean(),
});

/**
 * Helper to create field definition for a given type
 */
function createFieldForType(name: string, type: PocketBaseFieldType, required: boolean): fc.Arbitrary<FieldDefinition> {
  switch (type) {
    case "text":
      return textOptionsArb.map((options) => ({
        name,
        type,
        required,
        options,
      }));

    case "number":
      return numberOptionsArb.map((options) => ({
        name,
        type,
        required,
        options,
      }));

    case "bool":
      return fc.constant({
        name,
        type,
        required,
      });

    case "email":
    case "url":
      return domainOptionsArb.map((options) => ({
        name,
        type,
        required,
        options,
      }));

    case "date":
      return dateOptionsArb.map((options) => ({
        name,
        type,
        required,
        options,
      }));

    case "select":
      return selectOptionsArb.map((options) => ({
        name,
        type,
        required,
        options,
      }));

    case "file":
      return fileOptionsArb.map((options) => ({
        name,
        type,
        required,
        options,
      }));

    case "relation":
      return relationArb.map((relation) => ({
        name,
        type,
        required,
        relation,
      }));

    case "json":
      return jsonOptionsArb.map((options) => ({
        name,
        type,
        required,
        options,
      }));

    case "editor":
      return editorOptionsArb.map((options) => ({
        name,
        type,
        required,
        options,
      }));

    case "autodate":
      return autodateOptionsArb.map((options) => ({
        name,
        type,
        required,
        options,
      }));

    case "geoPoint":
      return fc.constant({
        name,
        type,
        required,
      });

    default:
      return fc.constant({
        name,
        type,
        required,
      });
  }
}

describe("Field Type Mapping Property Tests", () => {
  // Feature: migration-test-suite, Property 10: Field type mapping completeness
  describe("Property 10: Field type mapping completeness", () => {
    const allFieldTypes: PocketBaseFieldType[] = [
      "text",
      "number",
      "bool",
      "email",
      "url",
      "date",
      "select",
      "file",
      "relation",
      "json",
      "editor",
      "autodate",
      "geoPoint",
    ];

    allFieldTypes.forEach((fieldType) => {
      it(`should generate correct configuration for ${fieldType} field type`, () => {
        fc.assert(
          fc.property(
            fieldNameArb,
            fc.boolean(),
            createFieldForType("dummy", fieldType, false),
            (fieldName, required, fieldTemplate) => {
              // Create field with generated name and required flag
              const field = { ...fieldTemplate, name: fieldName, required };

              // Generate the field definition
              const generated = generateFieldDefinitionObject(field);

              // Verify basic properties are always present
              expect(generated).toContain(`name: "${field.name}"`);
              expect(generated).toContain(`type: "${field.type}"`);
              expect(generated).toContain(`required: ${field.required}`);

              // Verify type-specific properties
              switch (fieldType) {
                case "text":
                  if (field.options) {
                    expect(generated).toContain("min:");
                    expect(generated).toContain("max:");
                  }
                  break;

                case "number":
                  if (field.options) {
                    expect(generated).toContain("min:");
                    expect(generated).toContain("max:");
                    expect(generated).toContain("onlyInt:");
                  }
                  break;

                case "email":
                case "url":
                  if (field.options) {
                    expect(generated).toContain("exceptDomains:");
                    expect(generated).toContain("onlyDomains:");
                  }
                  break;

                case "date":
                  if (field.options) {
                    expect(generated).toContain("min:");
                    expect(generated).toContain("max:");
                  }
                  break;

                case "select":
                  if (field.options) {
                    expect(generated).toContain("values:");
                    expect(generated).toContain("maxSelect:");
                  }
                  break;

                case "file":
                  if (field.options) {
                    expect(generated).toContain("maxSelect:");
                    expect(generated).toContain("maxSize:");
                    expect(generated).toContain("mimeTypes:");
                    expect(generated).toContain("thumbs:");
                    expect(generated).toContain("protected:");
                  }
                  break;

                case "relation":
                  if (field.relation) {
                    expect(generated).toContain("collectionId:");
                    expect(generated).toContain("maxSelect:");
                    expect(generated).toContain("cascadeDelete:");

                    // Verify special handling for Users collection
                    if (field.relation.collection === "Users") {
                      expect(generated).toContain("_pb_users_auth_");
                    } else {
                      expect(generated).toContain("app.findCollectionByNameOrId");
                    }
                  }
                  break;

                case "json":
                  if (field.options) {
                    expect(generated).toContain("maxSize:");
                  }
                  break;

                case "editor":
                  if (field.options) {
                    expect(generated).toContain("convertURLs:");
                  }
                  break;

                case "autodate":
                  if (field.options) {
                    expect(generated).toContain("onCreate:");
                    expect(generated).toContain("onUpdate:");
                  }
                  break;

                case "geoPoint":
                  // geoPoint has no special options
                  break;
              }
            }
          ),
          { numRuns: 100 }
        );
      });
    });

    it("should handle all field types without errors", () => {
      fc.assert(
        fc.property(fieldNameArb, fc.constantFrom(...allFieldTypes), fc.boolean(), (fieldName, fieldType, required) => {
          const fieldArb = createFieldForType(fieldName, fieldType, required);

          return fc.assert(
            fc.property(fieldArb, (field) => {
              // Should not throw an error
              expect(() => generateFieldDefinitionObject(field)).not.toThrow();

              // Should produce non-empty output
              const generated = generateFieldDefinitionObject(field);
              expect(generated.length).toBeGreaterThan(0);

              // Should be valid JavaScript object syntax
              expect(generated).toMatch(/^\s*\{[\s\S]*\}\s*$/);
            }),
            { numRuns: 1 } // Run once per outer iteration
          );
        }),
        { numRuns: 100 }
      );
    });

    it("should preserve field name and type for all field types", () => {
      fc.assert(
        fc.property(fieldNameArb, fc.constantFrom(...allFieldTypes), fc.boolean(), (fieldName, fieldType, required) => {
          const fieldArb = createFieldForType(fieldName, fieldType, required);

          return fc.assert(
            fc.property(fieldArb, (field) => {
              const generated = generateFieldDefinitionObject(field);

              // Name should be preserved exactly
              expect(generated).toContain(`name: "${field.name}"`);

              // Type should be preserved exactly
              expect(generated).toContain(`type: "${field.type}"`);

              // Required flag should be preserved
              expect(generated).toContain(`required: ${field.required}`);
            }),
            { numRuns: 1 } // Run once per outer iteration
          );
        }),
        { numRuns: 100 }
      );
    });

    it("should generate valid JavaScript for all field types", () => {
      fc.assert(
        fc.property(fieldNameArb, fc.constantFrom(...allFieldTypes), fc.boolean(), (fieldName, fieldType, required) => {
          const fieldArb = createFieldForType(fieldName, fieldType, required);

          return fc.assert(
            fc.property(fieldArb, (field) => {
              const generated = generateFieldDefinitionObject(field);

              // Should start with opening brace
              expect(generated.trim()).toMatch(/^\{/);

              // Should end with closing brace
              expect(generated.trim()).toMatch(/\}$/);

              // Should contain valid property syntax
              expect(generated).toMatch(/\w+:\s*[^,]+/);
            }),
            { numRuns: 1 } // Run once per outer iteration
          );
        }),
        { numRuns: 100 }
      );
    });
  });
});
