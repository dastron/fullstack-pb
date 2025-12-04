/**
 * Tests for schema base helpers - withIndexes and withPermissions
 */

import { describe, expect, it } from "vitest";
import { z } from "zod";
import { extractIndexes } from "../../migration/analyzer";
import { withIndexes, withPermissions } from "../base";

describe("withIndexes helper", () => {
  it("should attach indexes to a schema", () => {
    const schema = z.object({
      name: z.string(),
      email: z.string().email(),
    });

    const indexes = [
      "CREATE UNIQUE INDEX idx_users_email ON users (email)",
      "CREATE INDEX idx_users_name ON users (name)",
    ];

    const schemaWithIndexes = withIndexes(schema, indexes);

    // Verify schema still works as a Zod schema
    expect(schemaWithIndexes).toBeDefined();
    expect(schemaWithIndexes.parse({ name: "John", email: "john@example.com" })).toEqual({
      name: "John",
      email: "john@example.com",
    });

    // Verify indexes are stored in metadata
    expect(schemaWithIndexes.description).toBeDefined();
    const metadata = JSON.parse(schemaWithIndexes.description!);
    expect(metadata.indexes).toEqual(indexes);
  });

  it("should extract indexes from schema", () => {
    const schema = z.object({
      title: z.string(),
      status: z.string(),
    });

    const indexes = ["CREATE INDEX idx_projects_status ON projects (status)"];

    const schemaWithIndexes = withIndexes(schema, indexes);

    // Extract indexes using the analyzer function
    const extractedIndexes = extractIndexes(schemaWithIndexes);

    expect(extractedIndexes).toEqual(indexes);
  });

  it("should handle schemas without indexes", () => {
    const schema = z.object({
      title: z.string(),
    });

    // Schema without indexes
    const extractedIndexes = extractIndexes(schema);

    expect(extractedIndexes).toBeUndefined();
  });

  it("should handle multiple index definitions", () => {
    const schema = z.object({
      name: z.string(),
      email: z.string().email(),
      createdAt: z.string(),
      status: z.string(),
    });

    const indexes = [
      "CREATE UNIQUE INDEX idx_users_email ON users (email)",
      "CREATE INDEX idx_users_name ON users (name)",
      "CREATE INDEX idx_users_created ON users (createdAt)",
      "CREATE INDEX idx_users_status ON users (status)",
    ];

    const schemaWithIndexes = withIndexes(schema, indexes);

    // Extract and verify all indexes
    const extractedIndexes = extractIndexes(schemaWithIndexes);

    expect(extractedIndexes).toHaveLength(4);
    expect(extractedIndexes).toEqual(indexes);
  });

  it("should preserve existing metadata when adding indexes", () => {
    const schema = z.object({
      name: z.string(),
      email: z.string().email(),
    });

    // First add permissions
    const permissions = {
      listRule: '@request.auth.id != ""',
      viewRule: '@request.auth.id != ""',
      createRule: '@request.auth.id != ""',
      updateRule: '@request.auth.id != ""',
      deleteRule: '@request.auth.id != ""',
      manageRule: null,
    };

    const schemaWithPermissions = withPermissions(schema, permissions);

    // Then add indexes
    const indexes = ["CREATE UNIQUE INDEX idx_users_email ON users (email)"];
    const schemaWithBoth = withIndexes(schemaWithPermissions, indexes);

    // Verify both permissions and indexes are present
    const metadata = JSON.parse(schemaWithBoth.description!);
    expect(metadata.permissions).toEqual(permissions);
    expect(metadata.indexes).toEqual(indexes);
  });

  it("should handle empty index array", () => {
    const schema = z.object({
      title: z.string(),
    });

    const schemaWithIndexes = withIndexes(schema, []);

    // Extract indexes
    const extractedIndexes = extractIndexes(schemaWithIndexes);

    // Empty array should be preserved
    expect(extractedIndexes).toEqual([]);
  });

  it("should allow chaining with withPermissions", () => {
    const schema = z.object({
      name: z.string(),
      email: z.string().email(),
    });

    const permissions = {
      listRule: '@request.auth.id != ""',
      viewRule: '@request.auth.id != ""',
      createRule: "",
      updateRule: "@request.auth.id = id",
      deleteRule: "@request.auth.id = id",
      manageRule: "@request.auth.id = id",
    };

    const indexes = [
      "CREATE UNIQUE INDEX idx_users_email ON users (email)",
      "CREATE INDEX idx_users_name ON users (name)",
    ];

    // Chain both helpers
    const finalSchema = withIndexes(withPermissions(schema, permissions), indexes);

    // Verify both are present
    const metadata = JSON.parse(finalSchema.description!);
    expect(metadata.permissions).toEqual(permissions);
    expect(metadata.indexes).toEqual(indexes);

    // Verify schema still validates correctly
    expect(finalSchema.parse({ name: "John", email: "john@example.com" })).toEqual({
      name: "John",
      email: "john@example.com",
    });
  });

  it("should handle complex index SQL statements", () => {
    const schema = z.object({
      title: z.string(),
      content: z.string(),
      status: z.string(),
      userId: z.string(),
    });

    const indexes = [
      "CREATE INDEX idx_posts_user_status ON posts (userId, status)",
      "CREATE INDEX idx_posts_status_created ON posts (status, created DESC)",
      'CREATE UNIQUE INDEX idx_posts_title_user ON posts (title, userId) WHERE status = "published"',
    ];

    const schemaWithIndexes = withIndexes(schema, indexes);

    // Extract and verify complex indexes
    const extractedIndexes = extractIndexes(schemaWithIndexes);

    expect(extractedIndexes).toEqual(indexes);
  });

  it("should not interfere with schema validation", () => {
    const schema = z.object({
      name: z.string().min(2),
      email: z.string().email(),
      age: z.number().min(0).max(120),
    });

    const indexes = ["CREATE UNIQUE INDEX idx_users_email ON users (email)"];
    const schemaWithIndexes = withIndexes(schema, indexes);

    // Valid data should pass
    expect(() =>
      schemaWithIndexes.parse({
        name: "John",
        email: "john@example.com",
        age: 30,
      })
    ).not.toThrow();

    // Invalid data should fail
    expect(() =>
      schemaWithIndexes.parse({
        name: "J", // Too short
        email: "invalid-email",
        age: 150, // Too old
      })
    ).toThrow();
  });

  it("should handle schemas with existing non-JSON descriptions", () => {
    const schema = z
      .object({
        title: z.string(),
      })
      .describe("This is a plain text description");

    const indexes = ["CREATE INDEX idx_projects_title ON projects (title)"];
    const schemaWithIndexes = withIndexes(schema, indexes);

    // Should create new metadata, ignoring non-JSON description
    const metadata = JSON.parse(schemaWithIndexes.description!);
    expect(metadata.indexes).toEqual(indexes);
  });

  it("should support updating indexes on an existing schema", () => {
    const schema = z.object({
      name: z.string(),
      email: z.string().email(),
    });

    // Add initial indexes
    const initialIndexes = ["CREATE INDEX idx_users_name ON users (name)"];
    const schemaWithInitialIndexes = withIndexes(schema, initialIndexes);

    // Update with new indexes
    const updatedIndexes = [
      "CREATE INDEX idx_users_name ON users (name)",
      "CREATE UNIQUE INDEX idx_users_email ON users (email)",
    ];
    const schemaWithUpdatedIndexes = withIndexes(schemaWithInitialIndexes, updatedIndexes);

    // Should have the updated indexes
    const extractedIndexes = extractIndexes(schemaWithUpdatedIndexes);
    expect(extractedIndexes).toEqual(updatedIndexes);
  });
});
