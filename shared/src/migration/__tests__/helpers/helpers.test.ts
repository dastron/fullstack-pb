import * as path from "path";
import { describe, expect, it } from "vitest";
import { compareCollections, compareFields } from "./diff-matcher";
import { parseCollectionDefinition, parseMigrationFile } from "./migration-parser";
import { SchemaBuilder } from "./schema-builder";

describe("Test Helpers", () => {
  describe("Migration Parser", () => {
    it("should parse a simple collection definition", () => {
      const collectionCode = `{
        "name": "test_collection",
        "type": "base",
        "fields": [],
        "indexes": [],
        "listRule": null,
        "viewRule": null,
        "createRule": null,
        "updateRule": null,
        "deleteRule": null
      }`;

      const result = parseCollectionDefinition(collectionCode);

      expect(result.name).toBe("test_collection");
      expect(result.type).toBe("base");
      expect(result.fields).toEqual([]);
      expect(result.indexes).toEqual([]);
    });

    it("should parse a migration file with collection creation", () => {
      const migrationPath = path.join(
        process.cwd(),
        "../pocketbase/pb_migrations/1764625735_created_create_new_collection_blank.js"
      );

      const result = parseMigrationFile(migrationPath);

      expect(result.upFunction.collections.length).toBeGreaterThan(0);
      expect(result.upFunction.operations.length).toBeGreaterThan(0);
      expect(result.downFunction.operations.length).toBeGreaterThan(0);
    });
  });

  describe("Schema Builder", () => {
    it("should build a simple schema with one collection", () => {
      const builder = new SchemaBuilder();
      builder
        .addCollection("users", "base")
        .addTextField("name", { required: true })
        .addEmailField("email", { required: true })
        .setPermissions({
          listRule: "",
          viewRule: "",
          createRule: '@request.auth.id != ""',
        })
        .build();

      const result = builder.build();

      expect(result.collections.size).toBe(1);
      expect(result.collections.has("users")).toBe(true);

      const usersCollection = result.collections.get("users")!;
      expect(usersCollection.name).toBe("users");
      expect(usersCollection.type).toBe("base");
      expect(usersCollection.fields.length).toBe(2);
      expect(usersCollection.fields[0].name).toBe("name");
      expect(usersCollection.fields[0].type).toBe("text");
      expect(usersCollection.fields[1].name).toBe("email");
      expect(usersCollection.fields[1].type).toBe("email");
    });

    it("should support fluent API for multiple field types", () => {
      const builder = new SchemaBuilder();
      builder
        .addCollection("posts", "base")
        .addTextField("title", { required: true, max: 200 })
        .addNumberField("views", { min: 0 })
        .addBoolField("published")
        .addRelationField("author", "users", { cascadeDelete: true })
        .addSelectField("status", ["draft", "published"], { maxSelect: 1 })
        .addIndex("CREATE INDEX idx_posts_status ON posts (status)")
        .build();

      const result = builder.build();
      const postsCollection = result.collections.get("posts")!;

      expect(postsCollection.fields.length).toBe(5);
      expect(postsCollection.fields[0].type).toBe("text");
      expect(postsCollection.fields[1].type).toBe("number");
      expect(postsCollection.fields[2].type).toBe("bool");
      expect(postsCollection.fields[3].type).toBe("relation");
      expect(postsCollection.fields[4].type).toBe("select");
      expect(postsCollection.indexes?.length).toBe(1);
    });
  });

  describe("Diff Matcher", () => {
    it("should detect no differences for identical collections", () => {
      const collection1 = {
        name: "test",
        type: "base" as const,
        fields: [
          {
            id: "field1",
            name: "title",
            type: "text",
            required: true,
            system: false,
          },
        ],
        indexes: [],
        rules: {
          listRule: "",
          viewRule: "",
          createRule: null,
          updateRule: null,
          deleteRule: null,
        },
      };

      const collection2 = { ...collection1 };

      const differences = compareCollections(collection1, collection2);

      expect(differences.length).toBe(0);
    });

    it("should detect field differences", () => {
      const fields1 = [
        {
          id: "field1",
          name: "title",
          type: "text",
          required: true,
          system: false,
        },
      ];

      const fields2 = [
        {
          id: "field1",
          name: "title",
          type: "text",
          required: false, // Different
          system: false,
        },
      ];

      const differences = compareFields(fields1, fields2);

      expect(differences.length).toBeGreaterThan(0);
      expect(differences[0].path).toContain("required");
    });

    it("should detect extra fields", () => {
      const fields1 = [
        {
          id: "field1",
          name: "title",
          type: "text",
          required: true,
          system: false,
        },
        {
          id: "field2",
          name: "description",
          type: "text",
          required: false,
          system: false,
        },
      ];

      const fields2 = [
        {
          id: "field1",
          name: "title",
          type: "text",
          required: true,
          system: false,
        },
      ];

      const differences = compareFields(fields1, fields2);

      expect(differences.length).toBeGreaterThan(0);
      const extraField = differences.find((d) => d.message?.includes("Extra"));
      expect(extraField).toBeDefined();
    });
  });
});
