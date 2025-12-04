import { parse } from "@babel/parser";
import * as fs from "fs";

/**
 * Represents a parsed PocketBase migration file
 */
export interface ParsedMigration {
  upFunction: {
    collections: ParsedCollection[];
    operations: MigrationOperation[];
  };
  downFunction: {
    collections: ParsedCollection[];
    operations: MigrationOperation[];
  };
}

/**
 * Represents a parsed collection definition
 */
export interface ParsedCollection {
  name: string;
  type: "base" | "auth";
  id?: string;
  fields: ParsedField[];
  indexes: string[];
  rules: Record<string, string | null>;
  system?: boolean;
}

/**
 * Represents a parsed field definition
 */
export interface ParsedField {
  id: string;
  name: string;
  type: string;
  required: boolean;
  system: boolean;
  [key: string]: any; // Additional field-specific properties
}

/**
 * Represents a migration operation
 */
export interface MigrationOperation {
  type:
    | "create"
    | "update"
    | "delete"
    | "addField"
    | "removeField"
    | "modifyField"
    | "addIndex"
    | "removeIndex"
    | "updateRule";
  collection: string;
  details: any;
}

/**
 * Parse a PocketBase migration file and extract structured data
 */
export function parseMigrationFile(filePath: string): ParsedMigration {
  const content = fs.readFileSync(filePath, "utf-8");
  const ast = parse(content, {
    sourceType: "module",
    plugins: ["typescript"],
  });

  const result: ParsedMigration = {
    upFunction: {
      collections: [],
      operations: [],
    },
    downFunction: {
      collections: [],
      operations: [],
    },
  };

  // Find the migrate() call
  for (const node of ast.program.body) {
    if (
      node.type === "ExpressionStatement" &&
      node.expression.type === "CallExpression" &&
      node.expression.callee.type === "Identifier" &&
      node.expression.callee.name === "migrate"
    ) {
      const args = node.expression.arguments;
      if (args.length >= 2) {
        // Parse up function (first argument)
        if (args[0].type === "ArrowFunctionExpression") {
          const upBody = args[0].body;
          const upCode =
            upBody.type === "BlockStatement"
              ? content.slice(upBody.start!, upBody.end!)
              : content.slice(args[0].start!, args[0].end!);
          result.upFunction = parseFunctionBody(upCode);
        }

        // Parse down function (second argument)
        if (args[1].type === "ArrowFunctionExpression") {
          const downBody = args[1].body;
          const downCode =
            downBody.type === "BlockStatement"
              ? content.slice(downBody.start!, downBody.end!)
              : content.slice(args[1].start!, args[1].end!);
          result.downFunction = parseFunctionBody(downCode);
        }
      }
    }
  }

  return result;
}

/**
 * Parse a function body to extract collections and operations
 */
function parseFunctionBody(code: string): {
  collections: ParsedCollection[];
  operations: MigrationOperation[];
} {
  const collections: ParsedCollection[] = [];
  const operations: MigrationOperation[] = [];

  // Extract collection definitions
  const collectionMatches = code.matchAll(/new Collection\s*\(\s*(\{[\s\S]*?\})\s*\)/g);
  for (const match of collectionMatches) {
    try {
      const collectionDef = parseCollectionDefinition(match[1]);
      collections.push(collectionDef);
      operations.push({
        type: "create",
        collection: collectionDef.name,
        details: collectionDef,
      });
    } catch (e) {
      // Skip malformed collection definitions
    }
  }

  // Extract operations
  const extractedOps = extractOperations(code);
  operations.push(...extractedOps);

  return { collections, operations };
}

/**
 * Parse a collection definition object from JavaScript code
 */
export function parseCollectionDefinition(code: string): ParsedCollection {
  // Clean up the code to make it valid JSON
  let jsonStr = code
    .replace(/'/g, '"') // Replace single quotes with double quotes
    .replace(/,(\s*[}\]])/g, "$1") // Remove trailing commas
    .replace(/(\w+):/g, '"$1":'); // Quote unquoted keys

  try {
    const obj = JSON.parse(jsonStr);

    return {
      name: obj.name || "",
      type: obj.type || "base",
      id: obj.id,
      fields: obj.fields || [],
      indexes: obj.indexes || [],
      rules: {
        listRule: obj.listRule !== undefined ? obj.listRule : null,
        viewRule: obj.viewRule !== undefined ? obj.viewRule : null,
        createRule: obj.createRule !== undefined ? obj.createRule : null,
        updateRule: obj.updateRule !== undefined ? obj.updateRule : null,
        deleteRule: obj.deleteRule !== undefined ? obj.deleteRule : null,
        ...(obj.manageRule !== undefined && { manageRule: obj.manageRule }),
      },
      system: obj.system || false,
    };
  } catch (e) {
    throw new Error(`Failed to parse collection definition: ${e}`);
  }
}

/**
 * Extract migration operations from function body code
 */
export function extractOperations(code: string): MigrationOperation[] {
  const operations: MigrationOperation[] = [];

  // Extract collection identifier
  const collectionMatch = code.match(/findCollectionByNameOrId\s*\(\s*["']([^"']+)["']\s*\)/);
  const collectionId = collectionMatch ? collectionMatch[1] : "unknown";

  // Match addAt operations
  const addAtMatches = code.matchAll(
    /collection\.fields\.addAt\s*\(\s*(\d+)\s*,\s*new Field\s*\(\s*(\{[\s\S]*?\})\s*\)\s*\)/g
  );
  for (const match of addAtMatches) {
    try {
      const position = parseInt(match[1], 10);
      const fieldDef = parseFieldDefinition(match[2]);
      operations.push({
        type: "addField",
        collection: collectionId,
        details: { position, field: fieldDef },
      });
    } catch (e) {
      // Skip malformed field definitions
    }
  }

  // Match removeById operations
  const removeMatches = code.matchAll(/collection\.fields\.removeById\s*\(\s*["']([^"']+)["']\s*\)/g);
  for (const match of removeMatches) {
    operations.push({
      type: "removeField",
      collection: collectionId,
      details: { fieldId: match[1] },
    });
  }

  // Match delete collection operations
  if (code.includes("app.delete(collection)")) {
    operations.push({
      type: "delete",
      collection: collectionId,
      details: {},
    });
  }

  // Match unmarshal operations (for rule updates)
  const unmarshalMatches = code.matchAll(/collection\.(\w+)\s*=\s*unmarshal\s*\(\s*["']([^"']*)["']\s*\)/g);
  for (const match of unmarshalMatches) {
    operations.push({
      type: "updateRule",
      collection: collectionId,
      details: { rule: match[1], value: match[2] },
    });
  }

  return operations;
}

/**
 * Parse a field definition object from JavaScript code
 */
function parseFieldDefinition(code: string): ParsedField {
  // Clean up the code to make it valid JSON
  let jsonStr = code
    .replace(/'/g, '"')
    .replace(/,(\s*[}\]])/g, "$1")
    .replace(/(\w+):/g, '"$1":');

  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    throw new Error(`Failed to parse field definition: ${e}`);
  }
}
