/**
 * Integration tests for field type mapping
 * Tests that each PocketBase field type generates correct configuration
 *
 * Requirements: 3.1-3.13
 */

import { describe, expect, it } from "vitest";
import { generateFieldDefinitionObject } from "../../generator";
import type { FieldDefinition } from "../../types";

describe("Field Type Mapping Integration Tests", () => {
  describe("Text Field (3.1)", () => {
    it("should generate text field with basic properties", () => {
      const field: FieldDefinition = {
        name: "title",
        type: "text",
        required: true,
        options: {
          min: 0,
          max: 200,
          pattern: "",
          autogeneratePattern: "",
          primaryKey: false,
        },
      };

      const generated = generateFieldDefinitionObject(field);

      expect(generated).toContain('name: "title"');
      expect(generated).toContain('type: "text"');
      expect(generated).toContain("required: true");
      expect(generated).toContain("min: 0");
      expect(generated).toContain("max: 200");
    });

    it("should generate text field with pattern constraint", () => {
      const field: FieldDefinition = {
        name: "slug",
        type: "text",
        required: true,
        options: {
          min: 0,
          max: 0,
          pattern: "^[a-z0-9-]+$",
          autogeneratePattern: "",
          primaryKey: false,
        },
      };

      const generated = generateFieldDefinitionObject(field);

      expect(generated).toContain('pattern: "^[a-z0-9-]+$"');
    });

    it("should generate text field with autogenerate pattern", () => {
      const field: FieldDefinition = {
        name: "code",
        type: "text",
        required: false,
        options: {
          min: 0,
          max: 0,
          pattern: "",
          autogeneratePattern: "[A-Z0-9]{8}",
          primaryKey: false,
        },
      };

      const generated = generateFieldDefinitionObject(field);

      expect(generated).toContain('autogeneratePattern: "[A-Z0-9]{8}"');
    });
  });

  describe("Number Field (3.2)", () => {
    it("should generate number field with min/max constraints", () => {
      const field: FieldDefinition = {
        name: "age",
        type: "number",
        required: true,
        options: {
          min: 0,
          max: 150,
          onlyInt: true,
        },
      };

      const generated = generateFieldDefinitionObject(field);

      expect(generated).toContain('name: "age"');
      expect(generated).toContain('type: "number"');
      expect(generated).toContain("required: true");
      expect(generated).toContain("min: 0");
      expect(generated).toContain("max: 150");
      expect(generated).toContain("onlyInt: true");
    });

    it("should generate number field with null min/max", () => {
      const field: FieldDefinition = {
        name: "score",
        type: "number",
        required: false,
        options: {
          min: null,
          max: null,
          onlyInt: false,
        },
      };

      const generated = generateFieldDefinitionObject(field);

      expect(generated).toContain("min: null");
      expect(generated).toContain("max: null");
      expect(generated).toContain("onlyInt: false");
    });

    it("should generate number field for decimals", () => {
      const field: FieldDefinition = {
        name: "price",
        type: "number",
        required: true,
        options: {
          min: 0,
          max: null,
          onlyInt: false,
        },
      };

      const generated = generateFieldDefinitionObject(field);

      expect(generated).toContain("onlyInt: false");
    });
  });

  describe("Boolean Field (3.3)", () => {
    it("should generate bool field", () => {
      const field: FieldDefinition = {
        name: "active",
        type: "bool",
        required: false,
      };

      const generated = generateFieldDefinitionObject(field);

      expect(generated).toContain('name: "active"');
      expect(generated).toContain('type: "bool"');
      expect(generated).toContain("required: false");
    });

    it("should generate required bool field", () => {
      const field: FieldDefinition = {
        name: "verified",
        type: "bool",
        required: true,
      };

      const generated = generateFieldDefinitionObject(field);

      expect(generated).toContain("required: true");
    });
  });

  describe("Email Field (3.4)", () => {
    it("should generate email field with basic properties", () => {
      const field: FieldDefinition = {
        name: "email",
        type: "email",
        required: true,
        options: {
          exceptDomains: null,
          onlyDomains: null,
        },
      };

      const generated = generateFieldDefinitionObject(field);

      expect(generated).toContain('name: "email"');
      expect(generated).toContain('type: "email"');
      expect(generated).toContain("required: true");
      expect(generated).toContain("exceptDomains: null");
      expect(generated).toContain("onlyDomains: null");
    });

    it("should generate email field with domain restrictions", () => {
      const field: FieldDefinition = {
        name: "workEmail",
        type: "email",
        required: true,
        options: {
          exceptDomains: null,
          onlyDomains: ["company.com", "company.org"],
        },
      };

      const generated = generateFieldDefinitionObject(field);

      expect(generated).toContain('onlyDomains: ["company.com", "company.org"]');
    });

    it("should generate email field with except domains", () => {
      const field: FieldDefinition = {
        name: "email",
        type: "email",
        required: true,
        options: {
          exceptDomains: ["spam.com", "temp-mail.com"],
          onlyDomains: null,
        },
      };

      const generated = generateFieldDefinitionObject(field);

      expect(generated).toContain('exceptDomains: ["spam.com", "temp-mail.com"]');
    });
  });

  describe("URL Field (3.5)", () => {
    it("should generate url field with basic properties", () => {
      const field: FieldDefinition = {
        name: "website",
        type: "url",
        required: false,
        options: {
          exceptDomains: null,
          onlyDomains: null,
        },
      };

      const generated = generateFieldDefinitionObject(field);

      expect(generated).toContain('name: "website"');
      expect(generated).toContain('type: "url"');
      expect(generated).toContain("required: false");
    });

    it("should generate url field with domain restrictions", () => {
      const field: FieldDefinition = {
        name: "socialProfile",
        type: "url",
        required: false,
        options: {
          exceptDomains: null,
          onlyDomains: ["twitter.com", "linkedin.com", "github.com"],
        },
      };

      const generated = generateFieldDefinitionObject(field);

      expect(generated).toContain('onlyDomains: ["twitter.com", "linkedin.com", "github.com"]');
    });
  });

  describe("Date Field (3.6)", () => {
    it("should generate date field with basic properties", () => {
      const field: FieldDefinition = {
        name: "birthdate",
        type: "date",
        required: false,
        options: {
          min: "",
          max: "",
        },
      };

      const generated = generateFieldDefinitionObject(field);

      expect(generated).toContain('name: "birthdate"');
      expect(generated).toContain('type: "date"');
      expect(generated).toContain("required: false");
    });

    it("should generate date field with min/max constraints", () => {
      const field: FieldDefinition = {
        name: "eventDate",
        type: "date",
        required: true,
        options: {
          min: "2024-01-01 00:00:00.000Z",
          max: "2024-12-31 23:59:59.999Z",
        },
      };

      const generated = generateFieldDefinitionObject(field);

      expect(generated).toContain('min: "2024-01-01 00:00:00.000Z"');
      expect(generated).toContain('max: "2024-12-31 23:59:59.999Z"');
    });
  });

  describe("Select Field (3.7)", () => {
    it("should generate select field with single selection", () => {
      const field: FieldDefinition = {
        name: "status",
        type: "select",
        required: true,
        options: {
          values: ["active", "pending", "completed"],
          maxSelect: 1,
        },
      };

      const generated = generateFieldDefinitionObject(field);

      expect(generated).toContain('name: "status"');
      expect(generated).toContain('type: "select"');
      expect(generated).toContain('values: ["active", "pending", "completed"]');
      expect(generated).toContain("maxSelect: 1");
    });

    it("should generate select field with multiple selection", () => {
      const field: FieldDefinition = {
        name: "tags",
        type: "select",
        required: false,
        options: {
          values: ["urgent", "important", "low-priority", "bug", "feature"],
          maxSelect: 3,
        },
      };

      const generated = generateFieldDefinitionObject(field);

      expect(generated).toContain("maxSelect: 3");
      expect(generated).toContain('values: ["urgent", "important", "low-priority", "bug", "feature"]');
    });
  });

  describe("File Field (3.8)", () => {
    it("should generate file field with basic properties", () => {
      const field: FieldDefinition = {
        name: "avatar",
        type: "file",
        required: false,
        options: {
          maxSelect: 1,
          maxSize: 5242880, // 5MB
          mimeTypes: [],
          thumbs: [],
          protected: false,
        },
      };

      const generated = generateFieldDefinitionObject(field);

      expect(generated).toContain('name: "avatar"');
      expect(generated).toContain('type: "file"');
      expect(generated).toContain("maxSelect: 1");
      expect(generated).toContain("maxSize: 5242880");
      expect(generated).toContain("protected: false");
    });

    it("should generate file field with mime type restrictions", () => {
      const field: FieldDefinition = {
        name: "document",
        type: "file",
        required: true,
        options: {
          maxSelect: 1,
          maxSize: 10485760, // 10MB
          mimeTypes: ["application/pdf", "application/msword"],
          thumbs: [],
          protected: false,
        },
      };

      const generated = generateFieldDefinitionObject(field);

      expect(generated).toContain('mimeTypes: ["application/pdf", "application/msword"]');
    });

    it("should generate file field with thumbnails", () => {
      const field: FieldDefinition = {
        name: "photos",
        type: "file",
        required: false,
        options: {
          maxSelect: 5,
          maxSize: 5242880,
          mimeTypes: ["image/jpeg", "image/png", "image/webp"],
          thumbs: ["100x100", "300x300", "800x600"],
          protected: false,
        },
      };

      const generated = generateFieldDefinitionObject(field);

      expect(generated).toContain("maxSelect: 5");
      expect(generated).toContain('thumbs: ["100x100", "300x300", "800x600"]');
    });

    it("should generate protected file field", () => {
      const field: FieldDefinition = {
        name: "privateDocument",
        type: "file",
        required: false,
        options: {
          maxSelect: 1,
          maxSize: 10485760,
          mimeTypes: [],
          thumbs: [],
          protected: true,
        },
      };

      const generated = generateFieldDefinitionObject(field);

      expect(generated).toContain("protected: true");
    });
  });

  describe("Relation Field (3.9)", () => {
    it("should generate single relation field", () => {
      const field: FieldDefinition = {
        name: "author",
        type: "relation",
        required: true,
        relation: {
          collection: "users",
          cascadeDelete: false,
          maxSelect: 1,
          minSelect: 0,
        },
      };

      const generated = generateFieldDefinitionObject(field);

      expect(generated).toContain('name: "author"');
      expect(generated).toContain('type: "relation"');
      expect(generated).toContain("maxSelect: 1");
      expect(generated).toContain("cascadeDelete: false");
    });

    it("should generate multiple relation field", () => {
      const field: FieldDefinition = {
        name: "collaborators",
        type: "relation",
        required: false,
        relation: {
          collection: "users",
          cascadeDelete: false,
          maxSelect: 10,
          minSelect: 0,
        },
      };

      const generated = generateFieldDefinitionObject(field);

      expect(generated).toContain("maxSelect: 10");
    });

    it("should generate relation field with cascade delete", () => {
      const field: FieldDefinition = {
        name: "owner",
        type: "relation",
        required: true,
        relation: {
          collection: "users",
          cascadeDelete: true,
          maxSelect: 1,
          minSelect: 0,
        },
      };

      const generated = generateFieldDefinitionObject(field);

      expect(generated).toContain("cascadeDelete: true");
    });

    it("should generate relation to Users collection with special ID", () => {
      const field: FieldDefinition = {
        name: "user",
        type: "relation",
        required: true,
        relation: {
          collection: "Users",
          cascadeDelete: false,
          maxSelect: 1,
          minSelect: 0,
        },
      };

      const generated = generateFieldDefinitionObject(field);

      expect(generated).toContain('collectionId: "_pb_users_auth_"');
    });

    it("should generate relation to custom collection", () => {
      const field: FieldDefinition = {
        name: "project",
        type: "relation",
        required: true,
        relation: {
          collection: "projects",
          cascadeDelete: false,
          maxSelect: 1,
          minSelect: 0,
        },
      };

      const generated = generateFieldDefinitionObject(field);

      expect(generated).toContain('collectionId: app.findCollectionByNameOrId("projects").id');
    });
  });

  describe("JSON Field (3.10)", () => {
    it("should generate json field with basic properties", () => {
      const field: FieldDefinition = {
        name: "metadata",
        type: "json",
        required: false,
        options: {
          maxSize: 0,
        },
      };

      const generated = generateFieldDefinitionObject(field);

      expect(generated).toContain('name: "metadata"');
      expect(generated).toContain('type: "json"');
      expect(generated).toContain("required: false");
      expect(generated).toContain("maxSize: 0");
    });

    it("should generate json field with size limit", () => {
      const field: FieldDefinition = {
        name: "config",
        type: "json",
        required: false,
        options: {
          maxSize: 2097152, // 2MB
        },
      };

      const generated = generateFieldDefinitionObject(field);

      expect(generated).toContain("maxSize: 2097152");
    });
  });

  describe("Editor Field (3.11)", () => {
    it("should generate editor field with basic properties", () => {
      const field: FieldDefinition = {
        name: "content",
        type: "editor",
        required: false,
        options: {
          convertURLs: true,
        },
      };

      const generated = generateFieldDefinitionObject(field);

      expect(generated).toContain('name: "content"');
      expect(generated).toContain('type: "editor"');
      expect(generated).toContain("convertURLs: true");
    });

    it("should generate editor field without URL conversion", () => {
      const field: FieldDefinition = {
        name: "rawContent",
        type: "editor",
        required: false,
        options: {
          convertURLs: false,
        },
      };

      const generated = generateFieldDefinitionObject(field);

      expect(generated).toContain("convertURLs: false");
    });
  });

  describe("Autodate Field (3.12)", () => {
    it("should generate autodate field for creation timestamp", () => {
      const field: FieldDefinition = {
        name: "createdAt",
        type: "autodate",
        required: false,
        options: {
          onCreate: true,
          onUpdate: false,
        },
      };

      const generated = generateFieldDefinitionObject(field);

      expect(generated).toContain('name: "createdAt"');
      expect(generated).toContain('type: "autodate"');
      expect(generated).toContain("onCreate: true");
      expect(generated).toContain("onUpdate: false");
    });

    it("should generate autodate field for update timestamp", () => {
      const field: FieldDefinition = {
        name: "updatedAt",
        type: "autodate",
        required: false,
        options: {
          onCreate: false,
          onUpdate: true,
        },
      };

      const generated = generateFieldDefinitionObject(field);

      expect(generated).toContain("onCreate: false");
      expect(generated).toContain("onUpdate: true");
    });

    it("should generate autodate field for both create and update", () => {
      const field: FieldDefinition = {
        name: "lastModified",
        type: "autodate",
        required: false,
        options: {
          onCreate: true,
          onUpdate: true,
        },
      };

      const generated = generateFieldDefinitionObject(field);

      expect(generated).toContain("onCreate: true");
      expect(generated).toContain("onUpdate: true");
    });
  });

  describe("GeoPoint Field (3.13)", () => {
    it("should generate geoPoint field", () => {
      const field: FieldDefinition = {
        name: "location",
        type: "geoPoint",
        required: false,
      };

      const generated = generateFieldDefinitionObject(field);

      expect(generated).toContain('name: "location"');
      expect(generated).toContain('type: "geoPoint"');
      expect(generated).toContain("required: false");
    });

    it("should generate required geoPoint field", () => {
      const field: FieldDefinition = {
        name: "coordinates",
        type: "geoPoint",
        required: true,
      };

      const generated = generateFieldDefinitionObject(field);

      expect(generated).toContain("required: true");
    });
  });

  describe("Field Type Completeness", () => {
    it("should support all PocketBase field types", () => {
      const supportedTypes: Array<FieldDefinition["type"]> = [
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

      // Verify each type can be generated
      supportedTypes.forEach((type) => {
        const field: FieldDefinition = {
          name: "testField",
          type,
          required: false,
        };

        const generated = generateFieldDefinitionObject(field);
        expect(generated).toContain(`type: "${type}"`);
      });
    });
  });
});
