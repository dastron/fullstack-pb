/**
 * Tests for diff engine permission comparison and system collection filtering
 */

import { describe, expect, it } from "vitest";
import { aggregateChanges, comparePermissions, filterSystemCollections, isSystemCollection } from "../diff";
import type { CollectionSchema, SchemaDefinition } from "../types";

describe("comparePermissions", () => {
  it("should detect no changes when permissions are identical", () => {
    const currentPermissions: CollectionSchema["permissions"] = {
      listRule: '@request.auth.id != ""',
      viewRule: '@request.auth.id != ""',
      createRule: '@request.auth.id != ""',
      updateRule: '@request.auth.id != ""',
      deleteRule: '@request.auth.id != ""',
    };

    const previousPermissions: CollectionSchema["permissions"] = {
      listRule: '@request.auth.id != ""',
      viewRule: '@request.auth.id != ""',
      createRule: '@request.auth.id != ""',
      updateRule: '@request.auth.id != ""',
      deleteRule: '@request.auth.id != ""',
    };

    const changes = comparePermissions(currentPermissions, previousPermissions);

    expect(changes).toHaveLength(0);
  });

  it("should detect changes when a single permission rule changes", () => {
    const currentPermissions: CollectionSchema["permissions"] = {
      listRule: "",
      viewRule: '@request.auth.id != ""',
      createRule: '@request.auth.id != ""',
      updateRule: '@request.auth.id != ""',
      deleteRule: '@request.auth.id != ""',
    };

    const previousPermissions: CollectionSchema["permissions"] = {
      listRule: '@request.auth.id != ""',
      viewRule: '@request.auth.id != ""',
      createRule: '@request.auth.id != ""',
      updateRule: '@request.auth.id != ""',
      deleteRule: '@request.auth.id != ""',
    };

    const changes = comparePermissions(currentPermissions, previousPermissions);

    expect(changes).toHaveLength(1);
    expect(changes[0]).toEqual({
      ruleType: "listRule",
      oldValue: '@request.auth.id != ""',
      newValue: "",
    });
  });

  it("should detect multiple permission changes", () => {
    const currentPermissions: CollectionSchema["permissions"] = {
      listRule: "",
      viewRule: "",
      createRule: '@request.auth.id != ""',
      updateRule: '@request.auth.id != "" && User = @request.auth.id',
      deleteRule: '@request.auth.id != "" && User = @request.auth.id',
    };

    const previousPermissions: CollectionSchema["permissions"] = {
      listRule: '@request.auth.id != ""',
      viewRule: '@request.auth.id != ""',
      createRule: '@request.auth.id != ""',
      updateRule: '@request.auth.id != ""',
      deleteRule: '@request.auth.id != ""',
    };

    const changes = comparePermissions(currentPermissions, previousPermissions);

    expect(changes).toHaveLength(4);
    expect(changes).toContainEqual({
      ruleType: "listRule",
      oldValue: '@request.auth.id != ""',
      newValue: "",
    });
    expect(changes).toContainEqual({
      ruleType: "viewRule",
      oldValue: '@request.auth.id != ""',
      newValue: "",
    });
    expect(changes).toContainEqual({
      ruleType: "updateRule",
      oldValue: '@request.auth.id != ""',
      newValue: '@request.auth.id != "" && User = @request.auth.id',
    });
    expect(changes).toContainEqual({
      ruleType: "deleteRule",
      oldValue: '@request.auth.id != ""',
      newValue: '@request.auth.id != "" && User = @request.auth.id',
    });
  });

  it("should handle null permissions (locked rules)", () => {
    const currentPermissions: CollectionSchema["permissions"] = {
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
    };

    const previousPermissions: CollectionSchema["permissions"] = {
      listRule: '@request.auth.id != ""',
      viewRule: '@request.auth.id != ""',
      createRule: '@request.auth.id != ""',
      updateRule: '@request.auth.id != ""',
      deleteRule: '@request.auth.id != ""',
    };

    const changes = comparePermissions(currentPermissions, previousPermissions);

    expect(changes).toHaveLength(5);
    changes.forEach((change) => {
      expect(change.oldValue).toBe('@request.auth.id != ""');
      expect(change.newValue).toBe(null);
    });
  });

  it("should handle undefined permissions as null", () => {
    const currentPermissions: CollectionSchema["permissions"] = {
      listRule: '@request.auth.id != ""',
    };

    const previousPermissions: CollectionSchema["permissions"] = undefined;

    const changes = comparePermissions(currentPermissions, previousPermissions);

    expect(changes).toHaveLength(1);
    expect(changes[0]).toEqual({
      ruleType: "listRule",
      oldValue: null,
      newValue: '@request.auth.id != ""',
    });
  });

  it("should detect manageRule changes for auth collections", () => {
    const currentPermissions: CollectionSchema["permissions"] = {
      listRule: '@request.auth.id != ""',
      viewRule: '@request.auth.id != ""',
      createRule: '@request.auth.id != ""',
      updateRule: '@request.auth.id != ""',
      deleteRule: '@request.auth.id != ""',
      manageRule: '@request.auth.role = "admin"',
    };

    const previousPermissions: CollectionSchema["permissions"] = {
      listRule: '@request.auth.id != ""',
      viewRule: '@request.auth.id != ""',
      createRule: '@request.auth.id != ""',
      updateRule: '@request.auth.id != ""',
      deleteRule: '@request.auth.id != ""',
      manageRule: null,
    };

    const changes = comparePermissions(currentPermissions, previousPermissions);

    expect(changes).toHaveLength(1);
    expect(changes[0]).toEqual({
      ruleType: "manageRule",
      oldValue: null,
      newValue: '@request.auth.role = "admin"',
    });
  });

  it("should handle empty string (public) permissions", () => {
    const currentPermissions: CollectionSchema["permissions"] = {
      listRule: "",
      viewRule: "",
      createRule: '@request.auth.id != ""',
      updateRule: '@request.auth.id != ""',
      deleteRule: '@request.auth.id != ""',
    };

    const previousPermissions: CollectionSchema["permissions"] = {
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
    };

    const changes = comparePermissions(currentPermissions, previousPermissions);

    expect(changes).toHaveLength(5);
    expect(changes.filter((c) => c.newValue === "")).toHaveLength(2);
    expect(changes.filter((c) => c.newValue === '@request.auth.id != ""')).toHaveLength(3);
  });

  it("should handle both permissions being undefined", () => {
    const currentPermissions: CollectionSchema["permissions"] = undefined;
    const previousPermissions: CollectionSchema["permissions"] = undefined;

    const changes = comparePermissions(currentPermissions, previousPermissions);

    expect(changes).toHaveLength(0);
  });
});

describe("isSystemCollection", () => {
  it("should return true for _mfas", () => {
    expect(isSystemCollection("_mfas")).toBe(true);
  });

  it("should return true for _otps", () => {
    expect(isSystemCollection("_otps")).toBe(true);
  });

  it("should return true for _externalAuths", () => {
    expect(isSystemCollection("_externalAuths")).toBe(true);
  });

  it("should return true for _authOrigins", () => {
    expect(isSystemCollection("_authOrigins")).toBe(true);
  });

  it("should return true for _superusers", () => {
    expect(isSystemCollection("_superusers")).toBe(true);
  });

  it("should return false for users collection", () => {
    expect(isSystemCollection("users")).toBe(false);
  });

  it("should return false for custom collections", () => {
    expect(isSystemCollection("posts")).toBe(false);
    expect(isSystemCollection("comments")).toBe(false);
    expect(isSystemCollection("projects")).toBe(false);
  });

  it("should return false for collections with underscore prefix that are not system collections", () => {
    expect(isSystemCollection("_custom")).toBe(false);
  });
});

describe("filterSystemCollections", () => {
  it("should remove system collections from schema", () => {
    const schema: SchemaDefinition = {
      collections: new Map([
        ["_mfas", { name: "_mfas", type: "base", fields: [] }],
        ["_otps", { name: "_otps", type: "base", fields: [] }],
        ["users", { name: "users", type: "auth", fields: [] }],
        ["posts", { name: "posts", type: "base", fields: [] }],
      ]),
    };

    const filtered = filterSystemCollections(schema);

    expect(filtered.collections.size).toBe(2);
    expect(filtered.collections.has("users")).toBe(true);
    expect(filtered.collections.has("posts")).toBe(true);
    expect(filtered.collections.has("_mfas")).toBe(false);
    expect(filtered.collections.has("_otps")).toBe(false);
  });

  it("should preserve all collections when no system collections present", () => {
    const schema: SchemaDefinition = {
      collections: new Map([
        ["users", { name: "users", type: "auth", fields: [] }],
        ["posts", { name: "posts", type: "base", fields: [] }],
        ["comments", { name: "comments", type: "base", fields: [] }],
      ]),
    };

    const filtered = filterSystemCollections(schema);

    expect(filtered.collections.size).toBe(3);
    expect(filtered.collections.has("users")).toBe(true);
    expect(filtered.collections.has("posts")).toBe(true);
    expect(filtered.collections.has("comments")).toBe(true);
  });

  it("should return empty schema when only system collections present", () => {
    const schema: SchemaDefinition = {
      collections: new Map([
        ["_mfas", { name: "_mfas", type: "base", fields: [] }],
        ["_otps", { name: "_otps", type: "base", fields: [] }],
        ["_externalAuths", { name: "_externalAuths", type: "base", fields: [] }],
      ]),
    };

    const filtered = filterSystemCollections(schema);

    expect(filtered.collections.size).toBe(0);
  });

  it("should handle empty schema", () => {
    const schema: SchemaDefinition = {
      collections: new Map(),
    };

    const filtered = filterSystemCollections(schema);

    expect(filtered.collections.size).toBe(0);
  });
});

describe("aggregateChanges with system collection filtering", () => {
  it("should filter system collections from collectionsToCreate", () => {
    const currentSchema: SchemaDefinition = {
      collections: new Map([
        ["_mfas", { name: "_mfas", type: "base", fields: [] }],
        ["_otps", { name: "_otps", type: "base", fields: [] }],
        ["users", { name: "users", type: "auth", fields: [] }],
        ["posts", { name: "posts", type: "base", fields: [] }],
      ]),
    };

    const diff = aggregateChanges(currentSchema, null);

    expect(diff.collectionsToCreate).toHaveLength(2);
    expect(diff.collectionsToCreate.map((c: CollectionSchema) => c.name)).toEqual(["users", "posts"]);
    expect(diff.collectionsToCreate.map((c: CollectionSchema) => c.name)).not.toContain("_mfas");
    expect(diff.collectionsToCreate.map((c: CollectionSchema) => c.name)).not.toContain("_otps");
  });

  it("should filter system collections from collectionsToDelete", () => {
    const currentSchema: SchemaDefinition = {
      collections: new Map([["users", { name: "users", type: "auth" as const, fields: [] }]]),
    };

    const previousSnapshot = {
      version: "1.0.0",
      timestamp: "2024-01-01",
      collections: new Map<string, CollectionSchema>([
        ["_mfas", { name: "_mfas", type: "base" as const, fields: [] }],
        ["_otps", { name: "_otps", type: "base" as const, fields: [] }],
        ["users", { name: "users", type: "auth" as const, fields: [] }],
        ["posts", { name: "posts", type: "base" as const, fields: [] }],
      ]),
    };

    const diff = aggregateChanges(currentSchema, previousSnapshot);

    expect(diff.collectionsToDelete).toHaveLength(1);
    expect(diff.collectionsToDelete.map((c: CollectionSchema) => c.name)).toEqual(["posts"]);
    expect(diff.collectionsToDelete.map((c: CollectionSchema) => c.name)).not.toContain("_mfas");
    expect(diff.collectionsToDelete.map((c: CollectionSchema) => c.name)).not.toContain("_otps");
  });

  it("should allow modifications to users collection (non-system)", () => {
    const currentSchema: SchemaDefinition = {
      collections: new Map([
        [
          "users",
          {
            name: "users",
            type: "auth" as const,
            fields: [{ name: "customField", type: "text" as const, required: false }],
          },
        ],
      ]),
    };

    const previousSnapshot = {
      version: "1.0.0",
      timestamp: "2024-01-01",
      collections: new Map<string, CollectionSchema>([["users", { name: "users", type: "auth" as const, fields: [] }]]),
    };

    const diff = aggregateChanges(currentSchema, previousSnapshot);

    expect(diff.collectionsToModify).toHaveLength(1);
    expect(diff.collectionsToModify[0].collection).toBe("users");
    expect(diff.collectionsToModify[0].fieldsToAdd).toHaveLength(1);
    expect(diff.collectionsToModify[0].fieldsToAdd[0].name).toBe("customField");
  });

  it("should filter system fields from users collection fieldsToAdd", () => {
    const currentSchema: SchemaDefinition = {
      collections: new Map([
        [
          "users",
          {
            name: "users",
            type: "auth" as const,
            fields: [
              { name: "id", type: "text" as const, required: true },
              { name: "email", type: "email" as const, required: true },
              { name: "password", type: "text" as const, required: true },
              { name: "tokenKey", type: "text" as const, required: true },
              { name: "emailVisibility", type: "bool" as const, required: false },
              { name: "verified", type: "bool" as const, required: false },
              { name: "created", type: "date" as const, required: false },
              { name: "updated", type: "date" as const, required: false },
              { name: "customField", type: "text" as const, required: false },
              { name: "anotherCustomField", type: "number" as const, required: false },
            ],
          },
        ],
      ]),
    };

    const previousSnapshot = {
      version: "1.0.0",
      timestamp: "2024-01-01",
      collections: new Map<string, CollectionSchema>([["users", { name: "users", type: "auth" as const, fields: [] }]]),
    };

    const diff = aggregateChanges(currentSchema, previousSnapshot);

    expect(diff.collectionsToModify).toHaveLength(1);
    expect(diff.collectionsToModify[0].collection).toBe("users");

    // Should only include custom fields, not system fields
    expect(diff.collectionsToModify[0].fieldsToAdd).toHaveLength(2);
    expect(diff.collectionsToModify[0].fieldsToAdd.map((f) => f.name)).toEqual(["customField", "anotherCustomField"]);

    // Verify system fields are not included
    const fieldNames = diff.collectionsToModify[0].fieldsToAdd.map((f) => f.name);
    expect(fieldNames).not.toContain("id");
    expect(fieldNames).not.toContain("email");
    expect(fieldNames).not.toContain("password");
    expect(fieldNames).not.toContain("tokenKey");
    expect(fieldNames).not.toContain("emailVisibility");
    expect(fieldNames).not.toContain("verified");
    expect(fieldNames).not.toContain("created");
    expect(fieldNames).not.toContain("updated");
  });

  it("should not filter system fields from non-users collections", () => {
    const currentSchema: SchemaDefinition = {
      collections: new Map([
        [
          "posts",
          {
            name: "posts",
            type: "base" as const,
            fields: [
              { name: "id", type: "text" as const, required: true },
              { name: "email", type: "email" as const, required: false },
              { name: "created", type: "date" as const, required: false },
            ],
          },
        ],
      ]),
    };

    const previousSnapshot = {
      version: "1.0.0",
      timestamp: "2024-01-01",
      collections: new Map<string, CollectionSchema>([["posts", { name: "posts", type: "base" as const, fields: [] }]]),
    };

    const diff = aggregateChanges(currentSchema, previousSnapshot);

    expect(diff.collectionsToModify).toHaveLength(1);
    expect(diff.collectionsToModify[0].collection).toBe("posts");

    // Should include all fields for non-users collections
    expect(diff.collectionsToModify[0].fieldsToAdd).toHaveLength(3);
    expect(diff.collectionsToModify[0].fieldsToAdd.map((f) => f.name)).toEqual(["id", "email", "created"]);
  });
});
