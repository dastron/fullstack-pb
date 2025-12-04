/**
 * Integration tests for permission handling scenarios
 *
 * These tests validate that the migration system correctly generates
 * PocketBase migrations for collections with various permission configurations.
 */

import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { compare } from "../../diff";
import { generate } from "../../generator";
import type { SchemaDefinition } from "../../types";
import {
  CreateAuthCollectionWithManageRuleSchema,
  CreateCollectionWithNullPermissionsSchema,
} from "../fixtures/schemas";
import { compareMigrations, formatDifferences, parseMigrationFile } from "../helpers";

/**
 * Helper function to create a schema definition from a collection schema
 */
function createSchemaDefinition(collectionSchema: any): SchemaDefinition {
  return {
    collections: new Map([[collectionSchema.name, collectionSchema]]),
  };
}

describe("Permission Handling Integration Tests", () => {
  const fixturesDir = path.join(__dirname, "../fixtures");
  const referenceMigrationsDir = path.join(fixturesDir, "reference-migrations");
  const tempDir = path.join(os.tmpdir(), "migration-test-permissions-" + Date.now());

  // Create temp directory for generated migrations
  beforeAll(() => {
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
  });

  // Clean up temp directory after tests
  afterAll(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe("8.1 Null permissions", () => {
    it("should generate migration with null permission values preserved", () => {
      // Create schema definition from fixture
      const currentSchema = createSchemaDefinition(CreateCollectionWithNullPermissionsSchema);

      // Run diff engine with empty snapshot (new collection)
      const diff = compare(currentSchema, null);

      // Verify diff detected the new collection
      expect(diff.collectionsToCreate).toHaveLength(1);
      expect(diff.collectionsToCreate[0].name).toBe(CreateCollectionWithNullPermissionsSchema.name);

      // Run generator to create migration
      const generatedPath = generate(diff, tempDir);
      expect(fs.existsSync(generatedPath)).toBe(true);

      // Parse generated migration
      const generatedMigration = parseMigrationFile(generatedPath);

      // Verify null values are preserved in migration
      const collection = generatedMigration.upFunction.collections[0];
      expect(collection.rules.listRule).toBe(null);
      expect(collection.rules.viewRule).toBe(null);
      expect(collection.rules.createRule).toBe(null);
      expect(collection.rules.updateRule).toBe(null);
      expect(collection.rules.deleteRule).toBe(null);

      // Verify collection name and type
      expect(collection.name).toBe(CreateCollectionWithNullPermissionsSchema.name);
      expect(collection.type).toBe("base");

      // Verify custom fields are present (base fields are added automatically by PocketBase)
      const fieldNames = collection.fields.map((f: any) => f.name);
      expect(fieldNames).toContain("title");
      expect(fieldNames).toContain("description");
    });
  });

  describe("8.3 Auth collection permissions", () => {
    it("should generate migration with all six rules including manageRule", () => {
      // Create schema definition from fixture
      const currentSchema = createSchemaDefinition(CreateAuthCollectionWithManageRuleSchema);

      // Run diff engine with empty snapshot (new collection)
      const diff = compare(currentSchema, null);

      // Verify diff detected the new collection
      expect(diff.collectionsToCreate).toHaveLength(1);
      expect(diff.collectionsToCreate[0].name).toBe(CreateAuthCollectionWithManageRuleSchema.name);
      expect(diff.collectionsToCreate[0].type).toBe("auth");

      // Run generator to create migration
      const generatedPath = generate(diff, tempDir);
      expect(fs.existsSync(generatedPath)).toBe(true);

      // Parse generated migration
      const generatedMigration = parseMigrationFile(generatedPath);

      // Verify all six rules are present
      const collection = generatedMigration.upFunction.collections[0];
      expect(collection.rules).toHaveProperty("listRule");
      expect(collection.rules).toHaveProperty("viewRule");
      expect(collection.rules).toHaveProperty("createRule");
      expect(collection.rules).toHaveProperty("updateRule");
      expect(collection.rules).toHaveProperty("deleteRule");
      expect(collection.rules).toHaveProperty("manageRule");

      // Verify all rules have correct values
      expect(collection.rules.listRule).toBe("id = @request.auth.id");
      expect(collection.rules.viewRule).toBe("id = @request.auth.id");
      expect(collection.rules.createRule).toBe("");
      expect(collection.rules.updateRule).toBe("id = @request.auth.id");
      expect(collection.rules.deleteRule).toBe("id = @request.auth.id");
      expect(collection.rules.manageRule).toBe("id = @request.auth.id");

      // Verify collection type is auth
      expect(collection.type).toBe("auth");
      expect(collection.name).toBe(CreateAuthCollectionWithManageRuleSchema.name);

      // Verify custom fields are present (auth system fields are added automatically by PocketBase)
      const fieldNames = collection.fields.map((f: any) => f.name);
      expect(fieldNames).toContain("name");
    });
  });
});
