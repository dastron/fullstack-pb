/**
 * Integration tests for collection creation scenarios
 *
 * These tests validate that the migration system correctly generates
 * PocketBase migrations for creating new collections with various configurations.
 */

import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { compare } from "../../diff";
import { generate } from "../../generator";
import type { SchemaDefinition } from "../../types";
import {
  CreateCollectionBlankSchema,
  CreateCollectionWithColumnsSchema,
  CreateCollectionWithRestrictedApiRulesSchema,
  CreateCollectionWithUniqueIndexSchema,
  CreateCollectionWithUnrestrictedApiRulesSchema,
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

describe("Collection Creation Integration Tests", () => {
  const fixturesDir = path.join(__dirname, "../fixtures");
  const referenceMigrationsDir = path.join(fixturesDir, "reference-migrations");
  const tempDir = path.join(os.tmpdir(), "migration-test-" + Date.now());

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

  describe("5.1 Collection with all field types", () => {
    it("should generate migration matching reference for collection with all field types", () => {
      // Load reference migration
      const referencePath = path.join(
        referenceMigrationsDir,
        "1764625712_created_create_new_collection_with_columns.js"
      );
      const referenceMigration = parseMigrationFile(referencePath);

      // Create schema definition from fixture
      const currentSchema = createSchemaDefinition(CreateCollectionWithColumnsSchema);

      // Run diff engine with empty snapshot (new collection)
      const diff = compare(currentSchema, null);

      // Verify diff detected the new collection
      expect(diff.collectionsToCreate).toHaveLength(1);
      expect(diff.collectionsToCreate[0].name).toBe(CreateCollectionWithColumnsSchema.name);

      // Run generator to create migration
      const generatedPath = generate(diff, tempDir);
      expect(fs.existsSync(generatedPath)).toBe(true);

      // Parse generated migration
      const generatedMigration = parseMigrationFile(generatedPath);

      // Compare generated vs reference migration
      const comparison = compareMigrations(generatedMigration, referenceMigration);

      // Assert exact match
      if (!comparison.matches) {
        console.log("\nDifferences found:");
        console.log(formatDifferences(comparison.differences));
      }

      expect(comparison.matches).toBe(true);
    });
  });

  describe("5.3 Blank collection", () => {
    it("should generate migration with only base fields for blank collection", () => {
      // Load reference migration
      const referencePath = path.join(referenceMigrationsDir, "1764625735_created_create_new_collection_blank.js");
      const referenceMigration = parseMigrationFile(referencePath);

      // Create schema definition from fixture
      const currentSchema = createSchemaDefinition(CreateCollectionBlankSchema);

      // Run diff engine with empty snapshot (new collection)
      const diff = compare(currentSchema, null);

      // Verify diff detected the new collection
      expect(diff.collectionsToCreate).toHaveLength(1);
      expect(diff.collectionsToCreate[0].name).toBe(CreateCollectionBlankSchema.name);

      // Run generator to create migration
      const generatedPath = generate(diff, tempDir);
      expect(fs.existsSync(generatedPath)).toBe(true);

      // Parse generated migration
      const generatedMigration = parseMigrationFile(generatedPath);

      // Verify base fields (id, created, updated) are present in the generated migration
      const collection = generatedMigration.upFunction.collections[0];
      const fieldNames = collection.fields.map((f: any) => f.name);

      expect(fieldNames).toContain("id");
      expect(fieldNames).toContain("created");
      expect(fieldNames).toContain("updated");

      // Compare generated vs reference migration
      const comparison = compareMigrations(generatedMigration, referenceMigration);

      if (!comparison.matches) {
        console.log("\nDifferences found:");
        console.log(formatDifferences(comparison.differences));
      }

      expect(comparison.matches).toBe(true);
    });
  });

  describe("5.4 Collection with unique index", () => {
    it("should generate migration with CREATE UNIQUE INDEX statement", () => {
      // Load reference migration
      const referencePath = path.join(
        referenceMigrationsDir,
        "1764625772_created_create_new_collection_with_unique_index.js"
      );
      const referenceMigration = parseMigrationFile(referencePath);

      // Create schema definition from fixture
      const currentSchema = createSchemaDefinition(CreateCollectionWithUniqueIndexSchema);

      // Run diff engine with empty snapshot (new collection)
      const diff = compare(currentSchema, null);

      // Verify diff detected the new collection
      expect(diff.collectionsToCreate).toHaveLength(1);
      expect(diff.collectionsToCreate[0].name).toBe(CreateCollectionWithUniqueIndexSchema.name);

      // Run generator to create migration
      const generatedPath = generate(diff, tempDir);
      expect(fs.existsSync(generatedPath)).toBe(true);

      // Parse generated migration
      const generatedMigration = parseMigrationFile(generatedPath);

      // Verify CREATE UNIQUE INDEX statement is present
      const collection = generatedMigration.upFunction.collections[0];
      expect(collection.indexes).toBeDefined();
      expect(collection.indexes.length).toBeGreaterThan(0);
      expect(collection.indexes[0]).toContain("CREATE UNIQUE INDEX");

      // Compare generated vs reference migration
      const comparison = compareMigrations(generatedMigration, referenceMigration);

      if (!comparison.matches) {
        console.log("\nDifferences found:");
        console.log(formatDifferences(comparison.differences));
      }

      expect(comparison.matches).toBe(true);
    });
  });

  describe("5.6 Collection with unrestricted API rules", () => {
    it("should generate migration with empty string rule values", () => {
      // Load reference migration
      const referencePath = path.join(
        referenceMigrationsDir,
        "1764625807_created_create_new_collection_with_unrestricted_api_rules.js"
      );
      const referenceMigration = parseMigrationFile(referencePath);

      // Create schema definition from fixture
      const currentSchema = createSchemaDefinition(CreateCollectionWithUnrestrictedApiRulesSchema);

      // Run diff engine with empty snapshot (new collection)
      const diff = compare(currentSchema, null);

      // Verify diff detected the new collection
      expect(diff.collectionsToCreate).toHaveLength(1);
      expect(diff.collectionsToCreate[0].name).toBe(CreateCollectionWithUnrestrictedApiRulesSchema.name);

      // Run generator to create migration
      const generatedPath = generate(diff, tempDir);
      expect(fs.existsSync(generatedPath)).toBe(true);

      // Parse generated migration
      const generatedMigration = parseMigrationFile(generatedPath);

      // Verify rule values are empty strings
      const collection = generatedMigration.upFunction.collections[0];
      expect(collection.rules.listRule).toBe("");
      expect(collection.rules.viewRule).toBe("");
      expect(collection.rules.createRule).toBe("");
      expect(collection.rules.updateRule).toBe("");
      expect(collection.rules.deleteRule).toBe("");

      // Compare generated vs reference migration
      const comparison = compareMigrations(generatedMigration, referenceMigration);

      if (!comparison.matches) {
        console.log("\nDifferences found:");
        console.log(formatDifferences(comparison.differences));
      }

      expect(comparison.matches).toBe(true);
    });
  });

  describe("5.8 Collection with restricted API rules", () => {
    it("should generate migration with filter expressions preserved exactly", () => {
      // Load reference migration
      const referencePath = path.join(
        referenceMigrationsDir,
        "1764625943_created_create_new_collection_with_restricted_api_rules.js"
      );
      const referenceMigration = parseMigrationFile(referencePath);

      // Create schema definition from fixture
      const currentSchema = createSchemaDefinition(CreateCollectionWithRestrictedApiRulesSchema);

      // Run diff engine with empty snapshot (new collection)
      const diff = compare(currentSchema, null);

      // Verify diff detected the new collection
      expect(diff.collectionsToCreate).toHaveLength(1);
      expect(diff.collectionsToCreate[0].name).toBe(CreateCollectionWithRestrictedApiRulesSchema.name);

      // Run generator to create migration
      const generatedPath = generate(diff, tempDir);
      expect(fs.existsSync(generatedPath)).toBe(true);

      // Parse generated migration
      const generatedMigration = parseMigrationFile(generatedPath);

      // Verify filter expressions are preserved exactly
      const collection = generatedMigration.upFunction.collections[0];
      expect(collection.rules.listRule).toBe("@request.auth.id = user_relationship_column.id");
      expect(collection.rules.viewRule).toBe("@request.auth.id = user_relationship_column.id");
      expect(collection.rules.createRule).toBe("@request.auth.id != ''");
      expect(collection.rules.updateRule).toBe("@request.auth.id = user_relationship_column.id");
      expect(collection.rules.deleteRule).toBe("@request.auth.id = user_relationship_column.id");

      // Compare generated vs reference migration
      const comparison = compareMigrations(generatedMigration, referenceMigration);

      if (!comparison.matches) {
        console.log("\nDifferences found:");
        console.log(formatDifferences(comparison.differences));
      }

      expect(comparison.matches).toBe(true);
    });
  });
});
