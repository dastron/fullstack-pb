/**
 * Integration tests for diff engine with permissions
 */

import { describe, expect, it } from "vitest";
import { aggregateChanges } from "../diff";
import type { SchemaDefinition, SchemaSnapshot } from "../types";

describe("Diff Engine - Permission Integration", () => {
  it("should detect permission changes in collection modifications", () => {
    const currentSchema: SchemaDefinition = {
      collections: new Map([
        [
          "projects",
          {
            name: "projects",
            type: "base",
            fields: [{ name: "title", type: "text", required: true }],
            permissions: {
              listRule: "",
              viewRule: "",
              createRule: '@request.auth.id != ""',
              updateRule: '@request.auth.id != "" && User = @request.auth.id',
              deleteRule: '@request.auth.id != "" && User = @request.auth.id',
            },
          },
        ],
      ]),
    };

    const previousSnapshot: SchemaSnapshot = {
      version: "1.0.0",
      timestamp: "2025-01-01T00:00:00.000Z",
      collections: new Map([
        [
          "projects",
          {
            name: "projects",
            type: "base",
            fields: [{ name: "title", type: "text", required: true }],
            permissions: {
              listRule: '@request.auth.id != ""',
              viewRule: '@request.auth.id != ""',
              createRule: '@request.auth.id != ""',
              updateRule: '@request.auth.id != ""',
              deleteRule: '@request.auth.id != ""',
            },
          },
        ],
      ]),
    };

    const diff = aggregateChanges(currentSchema, previousSnapshot);

    expect(diff.collectionsToCreate).toHaveLength(0);
    expect(diff.collectionsToDelete).toHaveLength(0);
    expect(diff.collectionsToModify).toHaveLength(1);

    const modification = diff.collectionsToModify[0];
    expect(modification.collection).toBe("projects");
    expect(modification.permissionsToUpdate).toHaveLength(4);

    // Verify specific permission changes
    expect(modification.permissionsToUpdate).toContainEqual({
      ruleType: "listRule",
      oldValue: '@request.auth.id != ""',
      newValue: "",
    });
    expect(modification.permissionsToUpdate).toContainEqual({
      ruleType: "viewRule",
      oldValue: '@request.auth.id != ""',
      newValue: "",
    });
    expect(modification.permissionsToUpdate).toContainEqual({
      ruleType: "updateRule",
      oldValue: '@request.auth.id != ""',
      newValue: '@request.auth.id != "" && User = @request.auth.id',
    });
    expect(modification.permissionsToUpdate).toContainEqual({
      ruleType: "deleteRule",
      oldValue: '@request.auth.id != ""',
      newValue: '@request.auth.id != "" && User = @request.auth.id',
    });
  });

  it("should not include collection in modifications if only permissions are unchanged", () => {
    const currentSchema: SchemaDefinition = {
      collections: new Map([
        [
          "projects",
          {
            name: "projects",
            type: "base",
            fields: [{ name: "title", type: "text", required: true }],
            permissions: {
              listRule: '@request.auth.id != ""',
              viewRule: '@request.auth.id != ""',
              createRule: '@request.auth.id != ""',
              updateRule: '@request.auth.id != ""',
              deleteRule: '@request.auth.id != ""',
            },
          },
        ],
      ]),
    };

    const previousSnapshot: SchemaSnapshot = {
      version: "1.0.0",
      timestamp: "2025-01-01T00:00:00.000Z",
      collections: new Map([
        [
          "projects",
          {
            name: "projects",
            type: "base",
            fields: [{ name: "title", type: "text", required: true }],
            permissions: {
              listRule: '@request.auth.id != ""',
              viewRule: '@request.auth.id != ""',
              createRule: '@request.auth.id != ""',
              updateRule: '@request.auth.id != ""',
              deleteRule: '@request.auth.id != ""',
            },
          },
        ],
      ]),
    };

    const diff = aggregateChanges(currentSchema, previousSnapshot);

    expect(diff.collectionsToCreate).toHaveLength(0);
    expect(diff.collectionsToDelete).toHaveLength(0);
    expect(diff.collectionsToModify).toHaveLength(0);
  });

  it("should handle new collections with permissions", () => {
    const currentSchema: SchemaDefinition = {
      collections: new Map([
        [
          "projects",
          {
            name: "projects",
            type: "base",
            fields: [{ name: "title", type: "text", required: true }],
            permissions: {
              listRule: "",
              viewRule: "",
              createRule: '@request.auth.id != ""',
              updateRule: '@request.auth.id != ""',
              deleteRule: '@request.auth.id != ""',
            },
          },
        ],
      ]),
    };

    const previousSnapshot: SchemaSnapshot = {
      version: "1.0.0",
      timestamp: "2025-01-01T00:00:00.000Z",
      collections: new Map(),
    };

    const diff = aggregateChanges(currentSchema, previousSnapshot);

    expect(diff.collectionsToCreate).toHaveLength(1);
    expect(diff.collectionsToDelete).toHaveLength(0);
    expect(diff.collectionsToModify).toHaveLength(0);

    const newCollection = diff.collectionsToCreate[0];
    expect(newCollection.name).toBe("projects");
    expect(newCollection.permissions).toBeDefined();
    expect(newCollection.permissions?.listRule).toBe("");
    expect(newCollection.permissions?.createRule).toBe('@request.auth.id != ""');
  });

  it("should handle auth collections with manageRule permissions", () => {
    const currentSchema: SchemaDefinition = {
      collections: new Map([
        [
          "users",
          {
            name: "users",
            type: "auth",
            fields: [
              { name: "email", type: "email", required: true },
              { name: "password", type: "text", required: true },
            ],
            permissions: {
              listRule: '@request.auth.id != ""',
              viewRule: "@request.auth.id = id",
              createRule: "",
              updateRule: "@request.auth.id = id",
              deleteRule: "@request.auth.id = id",
              manageRule: '@request.auth.role = "admin"',
            },
          },
        ],
      ]),
    };

    const previousSnapshot: SchemaSnapshot = {
      version: "1.0.0",
      timestamp: "2025-01-01T00:00:00.000Z",
      collections: new Map([
        [
          "users",
          {
            name: "users",
            type: "auth",
            fields: [
              { name: "email", type: "email", required: true },
              { name: "password", type: "text", required: true },
            ],
            permissions: {
              listRule: '@request.auth.id != ""',
              viewRule: "@request.auth.id = id",
              createRule: "",
              updateRule: "@request.auth.id = id",
              deleteRule: "@request.auth.id = id",
              manageRule: null,
            },
          },
        ],
      ]),
    };

    const diff = aggregateChanges(currentSchema, previousSnapshot);

    expect(diff.collectionsToModify).toHaveLength(1);

    const modification = diff.collectionsToModify[0];
    expect(modification.collection).toBe("users");
    expect(modification.permissionsToUpdate).toHaveLength(1);
    expect(modification.permissionsToUpdate[0]).toEqual({
      ruleType: "manageRule",
      oldValue: null,
      newValue: '@request.auth.role = "admin"',
    });
  });
});
