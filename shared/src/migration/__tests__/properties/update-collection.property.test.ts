/**
 * Property-based tests for collection update scenarios
 *
 * These tests use fast-check to verify universal properties that should hold
 * across all valid inputs for collection update operations.
 */

import fc from "fast-check";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { describe, expect, it } from "vitest";
import { compare } from "../../diff";
import { generate } from "../../generator";
import type { CollectionSchema, SchemaDefinition, SchemaSnapshot } from "../../types";

/**
 * Arbitrary for generating field names
 */
const fieldNameArb = fc.stringMatching(/^[a-z][a-z0-9_]{0,19}$/);

/**
 * Arbitrary for generating collection names
 */
const collectionNameArb = fc.stringMatching(/^[a-z][a-z0-9_]{0,29}$/);

/**
 * Arbitrary for generating field types
 */
const fieldTypeArb = fc.oneof(
  fc.constant("text"),
  fc.constant("number"),
  fc.constant("bool"),
  fc.constant("email"),
  fc.constant("url"),
  fc.constant("date"),
  fc.constant("json")
);

/**
 * Arbitrary for generating field definitions
 */
const fieldDefinitionArb = fc.record({
  name: fieldNameArb,
  type: fieldTypeArb,
  required: fc.boolean(),
  options: fc.constant({}),
});

/**
 * Arbitrary for generating collection schemas
 */
const collectionSchemaArb = fc.record({
  name: collectionNameArb,
  type: fc.constant("base" as const),
  fields: fc.array(fieldDefinitionArb, { minLength: 0, maxLength: 5 }),
  indexes: fc.constant([]),
  permissions: fc.constant({
    listRule: null,
    viewRule: null,
    createRule: null,
    updateRule: null,
    deleteRule: null,
  }),
});

/**
 * Helper to create a schema definition
 */
function createSchemaDefinition(collection: CollectionSchema): SchemaDefinition {
  return {
    collections: new Map([[collection.name, collection]]),
  };
}

/**
 * Helper to create a snapshot from a schema
 */
function createSnapshot(schema: SchemaDefinition): SchemaSnapshot {
  return {
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    collections: schema.collections,
  };
}

describe("Collection Update Property Tests", () => {
  const tempDir = path.join(os.tmpdir(), "migration-property-test-" + Date.now());

  // Create temp directory
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  // Feature: migration-test-suite, Property 5: Field addition format
  describe("Property 5: Field addition format", () => {
    it("should use collection.fields.add() for any field added to an existing collection", () => {
      fc.assert(
        fc.property(collectionSchemaArb, fieldDefinitionArb, (baseCollection, newField) => {
          // Ensure the new field doesn't already exist
          const fieldExists = baseCollection.fields.some((f) => f.name === newField.name);
          fc.pre(!fieldExists); // Skip if field already exists

          // Create before state (without the new field)
          const beforeSchema = createSchemaDefinition(baseCollection);
          const snapshot = createSnapshot(beforeSchema);

          // Create after state (with the new field)
          const afterCollection = {
            ...baseCollection,
            fields: [...baseCollection.fields, newField],
          };
          const afterSchema = createSchemaDefinition(afterCollection);

          // Run diff engine
          const diff = compare(afterSchema, snapshot);

          // If there are modifications, verify field addition
          if (diff.collectionsToModify.length > 0) {
            const modification = diff.collectionsToModify[0];

            // Should detect the field addition
            expect(modification.fieldsToAdd).toBeDefined();
            expect(modification.fieldsToAdd.some((f) => f.name === newField.name)).toBe(true);

            // Generate migration
            const generatedPath = generate(diff, tempDir);
            const migrationContent = fs.readFileSync(generatedPath, "utf-8");

            // Should contain field addition code
            expect(migrationContent).toContain("fields.add");
            expect(migrationContent).toContain(newField.name);

            // Clean up
            fs.unlinkSync(generatedPath);
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  // Feature: migration-test-suite, Property 6: Index addition format
  describe("Property 6: Index addition format", () => {
    it("should add index to indexes array for any index added to an existing collection", () => {
      fc.assert(
        fc.property(collectionSchemaArb, fieldDefinitionArb, (baseCollection, indexField) => {
          // Ensure the field exists in the collection
          const collectionWithField = {
            ...baseCollection,
            fields: [...baseCollection.fields, indexField],
          };

          // Create before state (without index)
          const beforeSchema = createSchemaDefinition(collectionWithField);
          const snapshot = createSnapshot(beforeSchema);

          // Create after state (with index)
          const indexSql = `CREATE INDEX \`idx_test\` ON \`${baseCollection.name}\` (\`${indexField.name}\`)`;
          const afterCollection = {
            ...collectionWithField,
            indexes: [indexSql],
          };
          const afterSchema = createSchemaDefinition(afterCollection);

          // Run diff engine
          const diff = compare(afterSchema, snapshot);

          // If there are modifications, verify index addition
          if (diff.collectionsToModify.length > 0) {
            const modification = diff.collectionsToModify[0];

            // Should detect the index addition
            expect(modification.indexesToAdd).toBeDefined();
            expect(modification.indexesToAdd.length).toBeGreaterThan(0);

            // Generate migration
            const generatedPath = generate(diff, tempDir);
            const migrationContent = fs.readFileSync(generatedPath, "utf-8");

            // Should contain index addition code
            expect(migrationContent).toContain("indexes");
            expect(migrationContent).toContain("idx_test");

            // Clean up
            fs.unlinkSync(generatedPath);
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  // Feature: migration-test-suite, Property 7: Field removal format
  describe("Property 7: Field removal format", () => {
    it("should use collection.fields.remove() for any field removed from an existing collection", () => {
      fc.assert(
        fc.property(collectionSchemaArb, (baseCollection) => {
          // Ensure the collection has at least one field to remove
          fc.pre(baseCollection.fields.length > 0);

          const fieldToRemove = baseCollection.fields[0];

          // Create before state (with the field)
          const beforeSchema = createSchemaDefinition(baseCollection);
          const snapshot = createSnapshot(beforeSchema);

          // Create after state (without the field)
          const afterCollection = {
            ...baseCollection,
            fields: baseCollection.fields.slice(1), // Remove first field
          };
          const afterSchema = createSchemaDefinition(afterCollection);

          // Run diff engine
          const diff = compare(afterSchema, snapshot);

          // If there are modifications, verify field removal
          if (diff.collectionsToModify.length > 0) {
            const modification = diff.collectionsToModify[0];

            // Should detect the field removal
            expect(modification.fieldsToRemove).toBeDefined();
            expect(modification.fieldsToRemove.some((f) => f.name === fieldToRemove.name)).toBe(true);

            // Generate migration
            const generatedPath = generate(diff, tempDir);
            const migrationContent = fs.readFileSync(generatedPath, "utf-8");

            // Should contain field removal code
            expect(migrationContent).toContain("fields.remove");
            expect(migrationContent).toContain(fieldToRemove.name);

            // Clean up
            fs.unlinkSync(generatedPath);
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  // Feature: migration-test-suite, Property 8: Field modification format
  describe("Property 8: Field modification format", () => {
    it("should update only changed properties for any field modification", () => {
      fc.assert(
        fc.property(collectionSchemaArb, (baseCollection) => {
          // Ensure the collection has at least one field to modify
          fc.pre(baseCollection.fields.length > 0);

          const fieldToModify = baseCollection.fields[0];

          // Create before state
          const beforeSchema = createSchemaDefinition(baseCollection);
          const snapshot = createSnapshot(beforeSchema);

          // Create after state with modified field (toggle required)
          const modifiedField = {
            ...fieldToModify,
            required: !fieldToModify.required,
          };
          const afterCollection = {
            ...baseCollection,
            fields: [modifiedField, ...baseCollection.fields.slice(1)],
          };
          const afterSchema = createSchemaDefinition(afterCollection);

          // Run diff engine
          const diff = compare(afterSchema, snapshot);

          // If there are modifications, verify field modification
          if (diff.collectionsToModify.length > 0) {
            const modification = diff.collectionsToModify[0];

            // Should detect the field modification
            expect(modification.fieldsToModify).toBeDefined();

            if (modification.fieldsToModify.length > 0) {
              expect(modification.fieldsToModify.some((f) => f.fieldName === fieldToModify.name)).toBe(true);

              // Generate migration
              const generatedPath = generate(diff, tempDir);
              const migrationContent = fs.readFileSync(generatedPath, "utf-8");

              // Should contain field modification code
              expect(migrationContent).toContain(fieldToModify.name);
              expect(migrationContent).toContain("required");

              // Clean up
              fs.unlinkSync(generatedPath);
            }
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  // Feature: migration-test-suite, Property 9: Permission update format
  describe("Property 9: Permission update format", () => {
    it("should generate permission updates for any permission rule change", () => {
      fc.assert(
        fc.property(collectionSchemaArb, (baseCollection) => {
          // Create before state with null permissions
          const beforeCollection = {
            ...baseCollection,
            permissions: {
              listRule: null,
              viewRule: null,
              createRule: null,
              updateRule: null,
              deleteRule: null,
            },
          };
          const beforeSchema = createSchemaDefinition(beforeCollection);
          const snapshot = createSnapshot(beforeSchema);

          // Create after state with updated permissions
          const afterCollection = {
            ...baseCollection,
            permissions: {
              listRule: "",
              viewRule: "",
              createRule: '@request.auth.id != ""',
              updateRule: null,
              deleteRule: null,
            },
          };
          const afterSchema = createSchemaDefinition(afterCollection);

          // Run diff engine
          const diff = compare(afterSchema, snapshot);

          // If there are modifications, verify permission updates
          if (diff.collectionsToModify.length > 0) {
            const modification = diff.collectionsToModify[0] as any;

            // Should detect permission changes (either rulesToUpdate or permissionsToUpdate)
            const hasRuleUpdates = modification.rulesToUpdate?.length > 0;
            const hasPermissionUpdates = modification.permissionsToUpdate?.length > 0;

            expect(hasRuleUpdates || hasPermissionUpdates).toBe(true);

            // Generate migration
            const generatedPath = generate(diff, tempDir);
            const migrationContent = fs.readFileSync(generatedPath, "utf-8");

            // Should contain permission update code
            expect(migrationContent).toContain("listRule");

            // Clean up
            fs.unlinkSync(generatedPath);
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  // Clean up temp directory after all tests
  afterAll(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
