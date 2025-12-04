/**
 * Property-based tests for permission handling
 *
 * Feature: migration-test-suite, Property 11: Null permission translation
 * Feature: migration-test-suite, Property 12: Auth collection completeness
 * Validates: Requirements 4.1, 4.4
 *
 * These tests use fast-check to verify that permission configurations
 * are correctly translated into PocketBase migrations.
 */

import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { compare } from "../../diff";
import { generateCollectionCreation, generateCollectionPermissions } from "../../generator";
import type { CollectionSchema, SchemaDefinition } from "../../types";

describe("Permission Handling Property Tests", () => {
  /**
   * Arbitrary for generating collection names
   */
  const collectionNameArb = fc.stringMatching(/^[a-z][a-z0-9_]{2,30}$/);

  /**
   * Arbitrary for generating field names
   */
  const fieldNameArb = fc.stringMatching(/^[a-z][a-z0-9_]{0,19}$/);

  /**
   * Arbitrary for generating basic text fields
   */
  const textFieldArb = fc.record({
    name: fieldNameArb,
    type: fc.constant("text" as const),
    required: fc.boolean(),
    options: fc.record({
      min: fc.constant(0),
      max: fc.nat({ max: 500 }),
      pattern: fc.constant(""),
      autogeneratePattern: fc.constant(""),
      primaryKey: fc.constant(false),
    }),
  });

  /**
   * Helper to create a schema definition from a collection schema
   */
  function createSchemaDefinition(collectionSchema: CollectionSchema): SchemaDefinition {
    return {
      collections: new Map([[collectionSchema.name, collectionSchema]]),
    };
  }

  // Feature: migration-test-suite, Property 11: Null permission translation
  describe("Property 11: Null permission translation", () => {
    it("should preserve null permissions for any base collection", () => {
      fc.assert(
        fc.property(
          collectionNameArb,
          fc.array(textFieldArb, { minLength: 0, maxLength: 3 }),
          (collectionName, fields) => {
            // Create collection with all null permissions
            const collection: CollectionSchema = {
              name: collectionName,
              type: "base",
              fields,
              indexes: [],
              permissions: {
                listRule: null,
                viewRule: null,
                createRule: null,
                updateRule: null,
                deleteRule: null,
              },
            };

            // Generate permissions code
            const permissionsCode = generateCollectionPermissions(collection.permissions);

            // Verify null values are represented correctly in generated code
            expect(permissionsCode).toContain("listRule: null");
            expect(permissionsCode).toContain("viewRule: null");
            expect(permissionsCode).toContain("createRule: null");
            expect(permissionsCode).toContain("updateRule: null");
            expect(permissionsCode).toContain("deleteRule: null");

            // Verify no empty strings are used
            expect(permissionsCode).not.toContain('listRule: ""');
            expect(permissionsCode).not.toContain('viewRule: ""');
            expect(permissionsCode).not.toContain('createRule: ""');
            expect(permissionsCode).not.toContain('updateRule: ""');
            expect(permissionsCode).not.toContain('deleteRule: ""');
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should distinguish between null (locked) and empty string (public) permissions", () => {
      fc.assert(
        fc.property(collectionNameArb, fc.array(textFieldArb, { minLength: 0, maxLength: 2 }), (collectionName, fields) => {
          // Create collection with mixed null and empty string permissions
          const collection: CollectionSchema = {
            name: collectionName,
            type: "base",
            fields,
            indexes: [],
            permissions: {
              listRule: null, // Locked
              viewRule: null, // Locked
              createRule: "", // Public
              updateRule: null, // Locked
              deleteRule: null, // Locked
            },
          };

          // Generate permissions code
          const permissionsCode = generateCollectionPermissions(collection.permissions);

          // Verify null permissions are preserved as null
          expect(permissionsCode).toContain("listRule: null");
          expect(permissionsCode).toContain("viewRule: null");
          expect(permissionsCode).toContain("updateRule: null");
          expect(permissionsCode).toContain("deleteRule: null");

          // Verify empty string permission is preserved as empty string
          expect(permissionsCode).toContain('createRule: ""');
        }),
        { numRuns: 100 }
      );
    });
  });

  // Feature: migration-test-suite, Property 12: Auth collection completeness
  describe("Property 12: Auth collection completeness", () => {
    it("should include all six rules (including manageRule) for any auth collection", () => {
      fc.assert(
        fc.property(
          collectionNameArb,
          fc.array(textFieldArb, { minLength: 0, maxLength: 3 }),
          fc.constantFrom("id = @request.auth.id", "@request.auth.id != ''", "", null),
          (collectionName, fields, ruleValue) => {
            // Create auth collection with all six rules
            const collection: CollectionSchema = {
              name: collectionName,
              type: "auth",
              fields,
              indexes: [],
              permissions: {
                listRule: ruleValue,
                viewRule: ruleValue,
                createRule: ruleValue,
                updateRule: ruleValue,
                deleteRule: ruleValue,
                manageRule: ruleValue,
              },
            };

            // Generate permissions code
            const permissionsCode = generateCollectionPermissions(collection.permissions);

            // Verify all six rules are present in generated code
            expect(permissionsCode).toContain("listRule:");
            expect(permissionsCode).toContain("viewRule:");
            expect(permissionsCode).toContain("createRule:");
            expect(permissionsCode).toContain("updateRule:");
            expect(permissionsCode).toContain("deleteRule:");
            expect(permissionsCode).toContain("manageRule:");

            // Verify the rule value is correctly formatted
            const expectedValue = ruleValue === null ? "null" : `"${ruleValue}"`;
            expect(permissionsCode).toContain(`listRule: ${expectedValue}`);
            expect(permissionsCode).toContain(`viewRule: ${expectedValue}`);
            expect(permissionsCode).toContain(`createRule: ${expectedValue}`);
            expect(permissionsCode).toContain(`updateRule: ${expectedValue}`);
            expect(permissionsCode).toContain(`deleteRule: ${expectedValue}`);
            expect(permissionsCode).toContain(`manageRule: ${expectedValue}`);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should not include manageRule for base collections", () => {
      fc.assert(
        fc.property(
          collectionNameArb,
          fc.array(textFieldArb, { minLength: 0, maxLength: 3 }),
          (collectionName, fields) => {
            // Create base collection (not auth)
            const collection: CollectionSchema = {
              name: collectionName,
              type: "base",
              fields,
              indexes: [],
              permissions: {
                listRule: "",
                viewRule: "",
                createRule: "",
                updateRule: "",
                deleteRule: "",
                // No manageRule for base collections
              },
            };

            // Generate permissions code
            const permissionsCode = generateCollectionPermissions(collection.permissions);

            // Verify manageRule is not present for base collections
            expect(permissionsCode).not.toContain("manageRule:");

            // Verify standard five rules are present
            expect(permissionsCode).toContain("listRule:");
            expect(permissionsCode).toContain("viewRule:");
            expect(permissionsCode).toContain("createRule:");
            expect(permissionsCode).toContain("updateRule:");
            expect(permissionsCode).toContain("deleteRule:");
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
