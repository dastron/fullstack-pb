/**
 * Tests for snapshot serialization and deserialization with permissions
 */

import * as fs from "fs";
import * as path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  findLatestSnapshot,
  loadSnapshot,
  loadSnapshotIfExists,
  mergeSnapshots,
  saveSnapshot,
  snapshotExists,
} from "../snapshot";
import type { CollectionSchema, SchemaDefinition, SchemaSnapshot } from "../types";

describe("Snapshot System - Permissions Support", () => {
  const testSnapshotPath = path.join(__dirname, ".test-snapshot.json");
  const testConfig = { snapshotPath: testSnapshotPath, workspaceRoot: __dirname };

  // Clean up test snapshot file after each test
  afterEach(() => {
    if (fs.existsSync(testSnapshotPath)) {
      fs.unlinkSync(testSnapshotPath);
    }
  });

  it("should serialize and deserialize permissions correctly", () => {
    const schema: SchemaDefinition = {
      collections: new Map<string, CollectionSchema>([
        [
          "projects",
          {
            name: "projects",
            type: "base",
            fields: [
              { name: "title", type: "text", required: true },
              { name: "User", type: "relation", required: true, relation: { collection: "users" } },
            ],
            permissions: {
              listRule: "",
              viewRule: "",
              createRule: '@request.auth.id != ""',
              updateRule: '@request.auth.id != "" && User = @request.auth.id',
              deleteRule: '@request.auth.id != "" && User = @request.auth.id',
              manageRule: null,
            },
          },
        ],
      ]),
    };

    // Save snapshot
    saveSnapshot(schema, testConfig);

    // Verify file exists
    expect(snapshotExists(testConfig)).toBe(true);

    // Load snapshot
    const loadedSnapshot = loadSnapshot(testConfig);

    // Verify structure
    expect(loadedSnapshot.version).toBe("1.0.0");
    expect(loadedSnapshot.timestamp).toBeDefined();
    expect(loadedSnapshot.collections).toBeInstanceOf(Map);
    expect(loadedSnapshot.collections.size).toBe(1);

    // Verify collection data
    const projectsCollection = loadedSnapshot.collections.get("projects");
    expect(projectsCollection).toBeDefined();
    expect(projectsCollection?.name).toBe("projects");
    expect(projectsCollection?.type).toBe("base");
    expect(projectsCollection?.fields).toHaveLength(2);

    // Verify permissions are preserved
    expect(projectsCollection?.permissions).toBeDefined();
    expect(projectsCollection?.permissions?.listRule).toBe("");
    expect(projectsCollection?.permissions?.viewRule).toBe("");
    expect(projectsCollection?.permissions?.createRule).toBe('@request.auth.id != ""');
    expect(projectsCollection?.permissions?.updateRule).toBe('@request.auth.id != "" && User = @request.auth.id');
    expect(projectsCollection?.permissions?.deleteRule).toBe('@request.auth.id != "" && User = @request.auth.id');
    expect(projectsCollection?.permissions?.manageRule).toBeNull();
  });

  it("should handle collections without permissions", () => {
    const schema: SchemaDefinition = {
      collections: new Map<string, CollectionSchema>([
        [
          "articles",
          {
            name: "articles",
            type: "base",
            fields: [{ name: "title", type: "text", required: true }],
            // No permissions field
          },
        ],
      ]),
    };

    // Save snapshot
    saveSnapshot(schema, testConfig);

    // Load snapshot
    const loadedSnapshot = loadSnapshot(testConfig);

    // Verify collection data
    const articlesCollection = loadedSnapshot.collections.get("articles");
    expect(articlesCollection).toBeDefined();
    expect(articlesCollection?.name).toBe("articles");

    // Permissions should be undefined if not set
    expect(articlesCollection?.permissions).toBeUndefined();
  });

  it("should handle auth collections with manageRule", () => {
    const schema: SchemaDefinition = {
      collections: new Map<string, CollectionSchema>([
        [
          "users",
          {
            name: "users",
            type: "auth",
            fields: [
              { name: "email", type: "email", required: true },
              { name: "password", type: "text", required: true },
              { name: "name", type: "text", required: false },
            ],
            permissions: {
              listRule: '@request.auth.id != ""',
              viewRule: "@request.auth.id = id",
              createRule: "",
              updateRule: "@request.auth.id = id",
              deleteRule: "@request.auth.id = id",
              manageRule: "@request.auth.id = id",
            },
          },
        ],
      ]),
    };

    // Save snapshot
    saveSnapshot(schema, testConfig);

    // Load snapshot
    const loadedSnapshot = loadSnapshot(testConfig);

    // Verify collection data
    const usersCollection = loadedSnapshot.collections.get("users");
    expect(usersCollection).toBeDefined();
    expect(usersCollection?.type).toBe("auth");

    // Verify manageRule is preserved for auth collections
    expect(usersCollection?.permissions).toBeDefined();
    expect(usersCollection?.permissions?.manageRule).toBe("@request.auth.id = id");
  });

  it("should handle null permission rules (locked)", () => {
    const schema: SchemaDefinition = {
      collections: new Map<string, CollectionSchema>([
        [
          "admin_data",
          {
            name: "admin_data",
            type: "base",
            fields: [{ name: "data", type: "json", required: true }],
            permissions: {
              listRule: null,
              viewRule: null,
              createRule: null,
              updateRule: null,
              deleteRule: null,
              manageRule: null,
            },
          },
        ],
      ]),
    };

    // Save snapshot
    saveSnapshot(schema, testConfig);

    // Load snapshot
    const loadedSnapshot = loadSnapshot(testConfig);

    // Verify collection data
    const adminCollection = loadedSnapshot.collections.get("admin_data");
    expect(adminCollection).toBeDefined();

    // Verify null rules are preserved (locked/superuser only)
    expect(adminCollection?.permissions).toBeDefined();
    expect(adminCollection?.permissions?.listRule).toBeNull();
    expect(adminCollection?.permissions?.viewRule).toBeNull();
    expect(adminCollection?.permissions?.createRule).toBeNull();
    expect(adminCollection?.permissions?.updateRule).toBeNull();
    expect(adminCollection?.permissions?.deleteRule).toBeNull();
    expect(adminCollection?.permissions?.manageRule).toBeNull();
  });

  it("should handle empty string permission rules (public)", () => {
    const schema: SchemaDefinition = {
      collections: new Map<string, CollectionSchema>([
        [
          "public_posts",
          {
            name: "public_posts",
            type: "base",
            fields: [{ name: "title", type: "text", required: true }],
            permissions: {
              listRule: "",
              viewRule: "",
              createRule: '@request.auth.id != ""',
              updateRule: '@request.auth.id != ""',
              deleteRule: '@request.auth.id != ""',
              manageRule: null,
            },
          },
        ],
      ]),
    };

    // Save snapshot
    saveSnapshot(schema, testConfig);

    // Load snapshot
    const loadedSnapshot = loadSnapshot(testConfig);

    // Verify collection data
    const postsCollection = loadedSnapshot.collections.get("public_posts");
    expect(postsCollection).toBeDefined();

    // Verify empty string rules are preserved (public access)
    expect(postsCollection?.permissions).toBeDefined();
    expect(postsCollection?.permissions?.listRule).toBe("");
    expect(postsCollection?.permissions?.viewRule).toBe("");
  });

  it("should preserve permissions in JSON format", () => {
    const schema: SchemaDefinition = {
      collections: new Map<string, CollectionSchema>([
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
              manageRule: null,
            },
          },
        ],
      ]),
    };

    // Save snapshot
    saveSnapshot(schema, testConfig);

    // Read raw JSON file
    const rawJson = fs.readFileSync(testSnapshotPath, "utf-8");
    const parsedJson = JSON.parse(rawJson);

    // Verify permissions are in the JSON structure
    expect(parsedJson.collections.projects).toBeDefined();
    expect(parsedJson.collections.projects.permissions).toBeDefined();
    expect(parsedJson.collections.projects.permissions.listRule).toBe('@request.auth.id != ""');
    expect(parsedJson.collections.projects.permissions.manageRule).toBeNull();
  });
});

describe("Snapshot Merging", () => {
  it("should merge base snapshot with custom snapshot", () => {
    const baseSnapshot: SchemaSnapshot = {
      version: "1.0.0",
      timestamp: "2024-01-01T00:00:00.000Z",
      collections: new Map<string, CollectionSchema>([
        [
          "_mfas",
          {
            name: "_mfas",
            type: "base",
            fields: [
              { name: "collectionRef", type: "text", required: true },
              { name: "recordRef", type: "text", required: true },
            ],
          },
        ],
        [
          "users",
          {
            name: "users",
            type: "auth",
            fields: [
              { name: "email", type: "email", required: true },
              { name: "password", type: "text", required: true },
            ],
          },
        ],
      ]),
    };

    const customSnapshot: SchemaSnapshot = {
      version: "1.0.0",
      timestamp: "2024-01-02T00:00:00.000Z",
      collections: new Map<string, CollectionSchema>([
        [
          "projects",
          {
            name: "projects",
            type: "base",
            fields: [{ name: "title", type: "text", required: true }],
          },
        ],
      ]),
    };

    const merged = mergeSnapshots(baseSnapshot, customSnapshot);

    // Should have all collections from both snapshots
    expect(merged.collections.size).toBe(3);
    expect(merged.collections.has("_mfas")).toBe(true);
    expect(merged.collections.has("users")).toBe(true);
    expect(merged.collections.has("projects")).toBe(true);

    // Should use custom snapshot's metadata
    expect(merged.version).toBe(customSnapshot.version);
    expect(merged.timestamp).toBe(customSnapshot.timestamp);
  });

  it("should return base snapshot when custom snapshot is null", () => {
    const baseSnapshot: SchemaSnapshot = {
      version: "1.0.0",
      timestamp: "2024-01-01T00:00:00.000Z",
      collections: new Map<string, CollectionSchema>([
        [
          "_mfas",
          {
            name: "_mfas",
            type: "base",
            fields: [{ name: "collectionRef", type: "text", required: true }],
          },
        ],
      ]),
    };

    const merged = mergeSnapshots(baseSnapshot, null);

    // Should return base snapshot unchanged
    expect(merged).toBe(baseSnapshot);
    expect(merged.collections.size).toBe(1);
    expect(merged.collections.has("_mfas")).toBe(true);
  });

  it("should allow custom snapshot to override base collections", () => {
    const baseSnapshot: SchemaSnapshot = {
      version: "1.0.0",
      timestamp: "2024-01-01T00:00:00.000Z",
      collections: new Map<string, CollectionSchema>([
        [
          "users",
          {
            name: "users",
            type: "auth",
            fields: [{ name: "email", type: "email", required: true }],
          },
        ],
      ]),
    };

    const customSnapshot: SchemaSnapshot = {
      version: "1.0.0",
      timestamp: "2024-01-02T00:00:00.000Z",
      collections: new Map<string, CollectionSchema>([
        [
          "users",
          {
            name: "users",
            type: "auth",
            fields: [
              { name: "email", type: "email", required: true },
              { name: "name", type: "text", required: false },
            ],
          },
        ],
      ]),
    };

    const merged = mergeSnapshots(baseSnapshot, customSnapshot);

    // Should have only one users collection
    expect(merged.collections.size).toBe(1);

    // Should use custom version with extended fields
    const usersCollection = merged.collections.get("users");
    expect(usersCollection?.fields).toHaveLength(2);
    expect(usersCollection?.fields.find((f) => f.name === "name")).toBeDefined();
  });
});

describe("loadSnapshotIfExists with base migration", () => {
  const testSnapshotPath = path.join(__dirname, ".test-snapshot-merge.json");
  const testConfig = { snapshotPath: testSnapshotPath, workspaceRoot: __dirname };
  const baseMigrationPath = path.join(
    __dirname,
    "../../../../pocketbase/pb_migrations/000000000_collections_snapshot.js"
  );

  afterEach(() => {
    if (fs.existsSync(testSnapshotPath)) {
      fs.unlinkSync(testSnapshotPath);
    }
  });

  it("should load base migration when no custom snapshot exists", () => {
    // Ensure no custom snapshot exists
    expect(snapshotExists(testConfig)).toBe(false);

    // Load with base migration path (which no longer exists after removing hardcoded snapshot)
    const snapshot = loadSnapshotIfExists(testConfig, baseMigrationPath);

    // Should return null since no snapshots exist (empty database)
    // This is the new behavior - no hardcoded base snapshot
    expect(snapshot).toBeNull();
  });

  it("should load custom snapshot when it exists (no base migration)", () => {
    // Create a custom snapshot
    const customSchema: SchemaDefinition = {
      collections: new Map<string, CollectionSchema>([
        [
          "projects",
          {
            name: "projects",
            type: "base",
            fields: [{ name: "title", type: "text", required: true }],
          },
        ],
      ]),
    };
    saveSnapshot(customSchema, testConfig);

    // Load with base migration path (which doesn't exist) - should load custom snapshot
    const snapshot = loadSnapshotIfExists(testConfig, baseMigrationPath);

    // Should have loaded custom snapshot
    expect(snapshot).not.toBeNull();

    // Should have custom collection
    expect(snapshot?.collections.has("projects")).toBe(true);

    // Should NOT have system collections (they're not in the custom snapshot)
    expect(snapshot?.collections.has("_mfas")).toBe(false);
    expect(snapshot?.collections.has("users")).toBe(false);
  });

  it("should return null when neither base nor custom snapshot exists", () => {
    // Ensure no custom snapshot exists
    expect(snapshotExists(testConfig)).toBe(false);

    // Load without base migration path
    const snapshot = loadSnapshotIfExists(testConfig);

    // Should return null
    expect(snapshot).toBeNull();
  });

  it("should handle invalid base migration path gracefully", () => {
    const invalidPath = "/nonexistent/path/to/migration.js";

    // Should not throw, just log warning
    const snapshot = loadSnapshotIfExists(testConfig, invalidPath);

    // Should return null since neither base nor custom exists
    expect(snapshot).toBeNull();
  });
});

describe("findLatestSnapshot - Snapshot Generation Tests", () => {
  const testMigrationsDir = path.join(__dirname, ".test-migrations");

  beforeEach(() => {
    // Create test migrations directory
    if (!fs.existsSync(testMigrationsDir)) {
      fs.mkdirSync(testMigrationsDir, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up test migrations directory
    if (fs.existsSync(testMigrationsDir)) {
      const files = fs.readdirSync(testMigrationsDir);
      for (const file of files) {
        fs.unlinkSync(path.join(testMigrationsDir, file));
      }
      fs.rmdirSync(testMigrationsDir);
    }
  });

  it("should return null when migrations directory does not exist", () => {
    const nonExistentDir = path.join(__dirname, ".nonexistent-migrations");
    const result = findLatestSnapshot(nonExistentDir);
    expect(result).toBeNull();
  });

  it("should return null when no snapshot files exist", () => {
    // Create some non-snapshot migration files
    fs.writeFileSync(path.join(testMigrationsDir, "1234567890_create_users.js"), "// migration");
    fs.writeFileSync(path.join(testMigrationsDir, "1234567891_create_projects.js"), "// migration");

    const result = findLatestSnapshot(testMigrationsDir);
    expect(result).toBeNull();
  });

  it("should find snapshot with _collections_snapshot.js pattern", () => {
    // Create a snapshot file
    const snapshotFile = "1234567890_collections_snapshot.js";
    fs.writeFileSync(path.join(testMigrationsDir, snapshotFile), "// snapshot");

    const result = findLatestSnapshot(testMigrationsDir);
    expect(result).toBe(path.join(testMigrationsDir, snapshotFile));
  });

  it("should find snapshot with _snapshot.js pattern", () => {
    // Create a snapshot file with shorter pattern
    const snapshotFile = "1234567890_snapshot.js";
    fs.writeFileSync(path.join(testMigrationsDir, snapshotFile), "// snapshot");

    const result = findLatestSnapshot(testMigrationsDir);
    expect(result).toBe(path.join(testMigrationsDir, snapshotFile));
  });

  it("should return the most recent snapshot when multiple exist", () => {
    // Create multiple snapshot files with different timestamps
    const oldSnapshot = "1234567890_collections_snapshot.js";
    const middleSnapshot = "1234567895_collections_snapshot.js";
    const newestSnapshot = "1234567900_collections_snapshot.js";

    fs.writeFileSync(path.join(testMigrationsDir, oldSnapshot), "// old snapshot");
    fs.writeFileSync(path.join(testMigrationsDir, middleSnapshot), "// middle snapshot");
    fs.writeFileSync(path.join(testMigrationsDir, newestSnapshot), "// newest snapshot");

    const result = findLatestSnapshot(testMigrationsDir);

    // Should return the newest snapshot (highest timestamp)
    expect(result).toBe(path.join(testMigrationsDir, newestSnapshot));
  });

  it("should handle mixed snapshot patterns and return most recent", () => {
    // Create snapshots with different patterns
    const oldCollectionsSnapshot = "1234567890_collections_snapshot.js";
    const newerSnapshot = "1234567895_snapshot.js";
    const newestCollectionsSnapshot = "1234567900_collections_snapshot.js";

    fs.writeFileSync(path.join(testMigrationsDir, oldCollectionsSnapshot), "// old");
    fs.writeFileSync(path.join(testMigrationsDir, newerSnapshot), "// newer");
    fs.writeFileSync(path.join(testMigrationsDir, newestCollectionsSnapshot), "// newest");

    const result = findLatestSnapshot(testMigrationsDir);

    // Should return the newest regardless of pattern
    expect(result).toBe(path.join(testMigrationsDir, newestCollectionsSnapshot));
  });

  it("should ignore non-snapshot migration files", () => {
    // Create regular migrations and one snapshot
    fs.writeFileSync(path.join(testMigrationsDir, "1234567880_create_users.js"), "// migration");
    fs.writeFileSync(path.join(testMigrationsDir, "1234567890_collections_snapshot.js"), "// snapshot");
    fs.writeFileSync(path.join(testMigrationsDir, "1234567895_update_projects.js"), "// migration");

    const result = findLatestSnapshot(testMigrationsDir);

    // Should only find the snapshot file
    expect(result).toBe(path.join(testMigrationsDir, "1234567890_collections_snapshot.js"));
  });

  it("should handle directory with only regular migrations", () => {
    // Create only regular migration files
    fs.writeFileSync(path.join(testMigrationsDir, "1234567890_create_users.js"), "// migration");
    fs.writeFileSync(path.join(testMigrationsDir, "1234567891_create_projects.js"), "// migration");
    fs.writeFileSync(path.join(testMigrationsDir, "1234567892_update_users.js"), "// migration");

    const result = findLatestSnapshot(testMigrationsDir);
    expect(result).toBeNull();
  });
});

describe("Snapshot Loading with Multiple Snapshots", () => {
  const testMigrationsDir = path.join(__dirname, ".test-migrations-loading");
  const testSnapshotPath = path.join(__dirname, ".test-snapshot-loading.json");
  const testConfig = { snapshotPath: testSnapshotPath, workspaceRoot: __dirname };

  beforeEach(() => {
    // Create test migrations directory
    if (!fs.existsSync(testMigrationsDir)) {
      fs.mkdirSync(testMigrationsDir, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up test migrations directory
    if (fs.existsSync(testMigrationsDir)) {
      const files = fs.readdirSync(testMigrationsDir);
      for (const file of files) {
        fs.unlinkSync(path.join(testMigrationsDir, file));
      }
      fs.rmdirSync(testMigrationsDir);
    }

    // Clean up test snapshot
    if (fs.existsSync(testSnapshotPath)) {
      fs.unlinkSync(testSnapshotPath);
    }
  });

  it("should load the most recent snapshot from migrations directory", () => {
    // Create multiple snapshot files
    const oldSnapshotContent = `
      migrate((app) => {
        const snapshot = [
          {
            name: "users",
            type: "auth",
            fields: [
              { name: "email", type: "email", required: true }
            ]
          }
        ];
      });
    `;

    const newestSnapshotContent = `
      migrate((app) => {
        const snapshot = [
          {
            name: "users",
            type: "auth",
            fields: [
              { name: "email", type: "email", required: true }
            ]
          },
          {
            name: "projects",
            type: "base",
            fields: [
              { name: "title", type: "text", required: true }
            ]
          }
        ];
      });
    `;

    fs.writeFileSync(path.join(testMigrationsDir, "1234567890_collections_snapshot.js"), oldSnapshotContent);
    fs.writeFileSync(path.join(testMigrationsDir, "1234567900_collections_snapshot.js"), newestSnapshotContent);

    // Load snapshot using loadSnapshotIfExists with migrations directory
    const snapshot = loadSnapshotIfExists(testConfig, testMigrationsDir);

    // Should have loaded the newest snapshot
    expect(snapshot).not.toBeNull();
    expect(snapshot?.collections.size).toBe(2);
    expect(snapshot?.collections.has("users")).toBe(true);
    expect(snapshot?.collections.has("projects")).toBe(true);
  });

  it("should return null when no snapshots exist in migrations directory", () => {
    // Create only regular migration files
    fs.writeFileSync(path.join(testMigrationsDir, "1234567890_create_users.js"), "// migration");

    const snapshot = loadSnapshotIfExists(testConfig, testMigrationsDir);
    expect(snapshot).toBeNull();
  });

  it("should handle empty migrations directory", () => {
    // Directory exists but is empty
    const snapshot = loadSnapshotIfExists(testConfig, testMigrationsDir);
    expect(snapshot).toBeNull();
  });

  it("should prefer custom snapshot over migrations directory snapshots", () => {
    // Create a snapshot in migrations directory
    const migrationsSnapshotContent = `
      migrate((app) => {
        const snapshot = [
          {
            name: "users",
            type: "auth",
            fields: [
              { name: "email", type: "email", required: true }
            ]
          }
        ];
      });
    `;
    fs.writeFileSync(path.join(testMigrationsDir, "1234567890_collections_snapshot.js"), migrationsSnapshotContent);

    // Create a custom snapshot
    const customSchema: SchemaDefinition = {
      collections: new Map<string, CollectionSchema>([
        [
          "projects",
          {
            name: "projects",
            type: "base",
            fields: [{ name: "title", type: "text", required: true }],
          },
        ],
      ]),
    };
    saveSnapshot(customSchema, testConfig);

    // Load snapshot - should prefer migrations directory snapshot
    const snapshot = loadSnapshotIfExists(testConfig, testMigrationsDir);

    // Should have loaded from migrations directory (users collection)
    expect(snapshot).not.toBeNull();
    expect(snapshot?.collections.has("users")).toBe(true);
  });
});
