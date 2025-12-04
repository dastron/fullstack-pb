import type { CollectionSchema, FieldDefinition, PocketBaseFieldType, SchemaDefinition } from "../../types";

/**
 * Builder for creating test schema definitions with a fluent API
 */
export class SchemaBuilder {
  private collections: Map<string, CollectionSchema> = new Map();

  /**
   * Add a collection to the schema
   */
  addCollection(name: string, type: "base" | "auth" = "base"): CollectionBuilder {
    const builder = new CollectionBuilder(name, type);
    return builder.onBuild((schema) => {
      this.collections.set(name, schema);
    });
  }

  /**
   * Build the final schema definition
   */
  build(): SchemaDefinition {
    return {
      collections: this.collections,
    };
  }
}

/**
 * Builder for creating individual collection schemas
 */
export class CollectionBuilder {
  private schema: CollectionSchema;
  private buildCallback?: (schema: CollectionSchema) => void;

  constructor(name: string, type: "base" | "auth" = "base") {
    this.schema = {
      name,
      type,
      fields: [],
      indexes: [],
      permissions: {},
    };
  }

  /**
   * Set callback to be called when build() is invoked
   */
  onBuild(callback: (schema: CollectionSchema) => void): this {
    this.buildCallback = callback;
    return this;
  }

  /**
   * Add a generic field
   */
  addField(name: string, type: PocketBaseFieldType, options?: Partial<FieldDefinition>): this {
    const field: FieldDefinition = {
      name,
      type,
      required: options?.required ?? false,
      unique: options?.unique,
      options: options?.options,
      relation: options?.relation,
    };
    this.schema.fields.push(field);
    return this;
  }

  /**
   * Add a text field
   */
  addTextField(
    name: string,
    options?: {
      required?: boolean;
      min?: number;
      max?: number;
      pattern?: string;
      autogeneratePattern?: string;
      primaryKey?: boolean;
    }
  ): this {
    return this.addField(name, "text", {
      required: options?.required,
      options: {
        min: options?.min ?? 0,
        max: options?.max ?? 0,
        pattern: options?.pattern ?? "",
        autogeneratePattern: options?.autogeneratePattern ?? "",
        primaryKey: options?.primaryKey ?? false,
      },
    });
  }

  /**
   * Add a number field
   */
  addNumberField(
    name: string,
    options?: {
      required?: boolean;
      min?: number | null;
      max?: number | null;
      onlyInt?: boolean;
    }
  ): this {
    return this.addField(name, "number", {
      required: options?.required,
      options: {
        min: options?.min ?? null,
        max: options?.max ?? null,
        onlyInt: options?.onlyInt ?? false,
      },
    });
  }

  /**
   * Add a boolean field
   */
  addBoolField(name: string, options?: { required?: boolean }): this {
    return this.addField(name, "bool", {
      required: options?.required,
    });
  }

  /**
   * Add an email field
   */
  addEmailField(
    name: string,
    options?: {
      required?: boolean;
      exceptDomains?: string[] | null;
      onlyDomains?: string[] | null;
    }
  ): this {
    return this.addField(name, "email", {
      required: options?.required,
      options: {
        exceptDomains: options?.exceptDomains ?? null,
        onlyDomains: options?.onlyDomains ?? null,
      },
    });
  }

  /**
   * Add a URL field
   */
  addUrlField(
    name: string,
    options?: {
      required?: boolean;
      exceptDomains?: string[] | null;
      onlyDomains?: string[] | null;
    }
  ): this {
    return this.addField(name, "url", {
      required: options?.required,
      options: {
        exceptDomains: options?.exceptDomains ?? null,
        onlyDomains: options?.onlyDomains ?? null,
      },
    });
  }

  /**
   * Add a date field
   */
  addDateField(
    name: string,
    options?: {
      required?: boolean;
      min?: string;
      max?: string;
    }
  ): this {
    return this.addField(name, "date", {
      required: options?.required,
      options: {
        min: options?.min ?? "",
        max: options?.max ?? "",
      },
    });
  }

  /**
   * Add a select field
   */
  addSelectField(
    name: string,
    values: string[],
    options?: {
      required?: boolean;
      maxSelect?: number;
    }
  ): this {
    return this.addField(name, "select", {
      required: options?.required,
      options: {
        values,
        maxSelect: options?.maxSelect ?? 1,
      },
    });
  }

  /**
   * Add a file field
   */
  addFileField(
    name: string,
    options?: {
      required?: boolean;
      maxSelect?: number;
      maxSize?: number;
      mimeTypes?: string[];
      thumbs?: string[];
      protected?: boolean;
    }
  ): this {
    return this.addField(name, "file", {
      required: options?.required,
      options: {
        maxSelect: options?.maxSelect ?? 1,
        maxSize: options?.maxSize ?? 0,
        mimeTypes: options?.mimeTypes ?? [],
        thumbs: options?.thumbs ?? [],
        protected: options?.protected ?? false,
      },
    });
  }

  /**
   * Add a relation field
   */
  addRelationField(
    name: string,
    collection: string,
    options?: {
      required?: boolean;
      cascadeDelete?: boolean;
      maxSelect?: number;
      minSelect?: number;
    }
  ): this {
    return this.addField(name, "relation", {
      required: options?.required,
      relation: {
        collection,
        cascadeDelete: options?.cascadeDelete ?? false,
        maxSelect: options?.maxSelect ?? 1,
        minSelect: options?.minSelect ?? 0,
      },
    });
  }

  /**
   * Add a JSON field
   */
  addJsonField(
    name: string,
    options?: {
      required?: boolean;
      maxSize?: number;
    }
  ): this {
    return this.addField(name, "json", {
      required: options?.required,
      options: {
        maxSize: options?.maxSize ?? 0,
      },
    });
  }

  /**
   * Add an index to the collection
   */
  addIndex(sql: string): this {
    if (!this.schema.indexes) {
      this.schema.indexes = [];
    }
    this.schema.indexes.push(sql);
    return this;
  }

  /**
   * Set permissions for the collection
   */
  setPermissions(permissions: Partial<CollectionSchema["permissions"]>): this {
    this.schema.permissions = {
      ...this.schema.permissions,
      ...permissions,
    };
    return this;
  }

  /**
   * Set a specific rule
   */
  setRule(
    rule: "listRule" | "viewRule" | "createRule" | "updateRule" | "deleteRule" | "manageRule",
    value: string | null
  ): this {
    if (!this.schema.permissions) {
      this.schema.permissions = {};
    }
    this.schema.permissions[rule] = value;
    return this;
  }

  /**
   * Build the collection schema
   */
  build(): CollectionSchema {
    if (this.buildCallback) {
      this.buildCallback(this.schema);
    }
    return this.schema;
  }
}
