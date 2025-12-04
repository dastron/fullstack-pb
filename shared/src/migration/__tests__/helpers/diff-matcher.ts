import type { ParsedCollection, ParsedField, ParsedMigration } from "./migration-parser";

/**
 * Result of comparing two migrations
 */
export interface MigrationComparison {
  matches: boolean;
  differences: Difference[];
}

/**
 * Represents a difference between expected and actual values
 */
export interface Difference {
  path: string;
  expected: any;
  actual: any;
  severity: "critical" | "warning" | "info";
  message?: string;
}

/**
 * Compare two parsed migrations and return detailed differences
 */
export function compareMigrations(generated: ParsedMigration, reference: ParsedMigration): MigrationComparison {
  const differences: Difference[] = [];

  // Compare up functions
  const upDiffs = compareFunctionBodies(generated.upFunction, reference.upFunction, "upFunction");
  differences.push(...upDiffs);

  // Compare down functions
  const downDiffs = compareFunctionBodies(generated.downFunction, reference.downFunction, "downFunction");
  differences.push(...downDiffs);

  return {
    matches: differences.length === 0,
    differences,
  };
}

/**
 * Compare function bodies (up or down)
 */
function compareFunctionBodies(
  generated: { collections: ParsedCollection[]; operations: any[] },
  reference: { collections: ParsedCollection[]; operations: any[] },
  basePath: string
): Difference[] {
  const differences: Difference[] = [];

  // Compare collections
  const collectionDiffs = compareCollectionArrays(
    generated.collections,
    reference.collections,
    `${basePath}.collections`
  );
  differences.push(...collectionDiffs);

  // Compare operations count
  if (generated.operations.length !== reference.operations.length) {
    differences.push({
      path: `${basePath}.operations.length`,
      expected: reference.operations.length,
      actual: generated.operations.length,
      severity: "critical",
      message: `Operation count mismatch`,
    });
  }

  // Compare individual operations
  const minOps = Math.min(generated.operations.length, reference.operations.length);
  for (let i = 0; i < minOps; i++) {
    const opDiffs = compareOperations(generated.operations[i], reference.operations[i], `${basePath}.operations[${i}]`);
    differences.push(...opDiffs);
  }

  return differences;
}

/**
 * Compare arrays of collections
 */
function compareCollectionArrays(
  generated: ParsedCollection[],
  reference: ParsedCollection[],
  basePath: string
): Difference[] {
  const differences: Difference[] = [];

  if (generated.length !== reference.length) {
    differences.push({
      path: `${basePath}.length`,
      expected: reference.length,
      actual: generated.length,
      severity: "critical",
      message: `Collection count mismatch`,
    });
  }

  const minLength = Math.min(generated.length, reference.length);
  for (let i = 0; i < minLength; i++) {
    const collectionDiffs = compareCollections(generated[i], reference[i], `${basePath}[${i}]`);
    differences.push(...collectionDiffs);
  }

  return differences;
}

/**
 * Compare two collection definitions
 */
export function compareCollections(
  generated: ParsedCollection,
  reference: ParsedCollection,
  basePath: string = "collection"
): Difference[] {
  const differences: Difference[] = [];

  // Compare basic properties
  if (generated.name !== reference.name) {
    differences.push({
      path: `${basePath}.name`,
      expected: reference.name,
      actual: generated.name,
      severity: "critical",
    });
  }

  if (generated.type !== reference.type) {
    differences.push({
      path: `${basePath}.type`,
      expected: reference.type,
      actual: generated.type,
      severity: "critical",
    });
  }

  if (generated.system !== reference.system) {
    differences.push({
      path: `${basePath}.system`,
      expected: reference.system,
      actual: generated.system,
      severity: "warning",
    });
  }

  // Compare fields
  const fieldDiffs = compareFields(generated.fields, reference.fields, `${basePath}.fields`);
  differences.push(...fieldDiffs);

  // Compare indexes
  const indexDiffs = compareIndexes(generated.indexes, reference.indexes, `${basePath}.indexes`);
  differences.push(...indexDiffs);

  // Compare rules
  const ruleDiffs = compareRules(generated.rules, reference.rules, `${basePath}.rules`);
  differences.push(...ruleDiffs);

  return differences;
}

/**
 * Compare field arrays
 */
export function compareFields(
  generated: ParsedField[],
  reference: ParsedField[],
  basePath: string = "fields"
): Difference[] {
  const differences: Difference[] = [];

  if (generated.length !== reference.length) {
    differences.push({
      path: `${basePath}.length`,
      expected: reference.length,
      actual: generated.length,
      severity: "critical",
      message: `Field count mismatch`,
    });
  }

  // Create maps by field name for easier comparison
  const generatedMap = new Map(generated.map((f) => [f.name, f]));
  const referenceMap = new Map(reference.map((f) => [f.name, f]));

  // Check for missing fields
  for (const [name, refField] of referenceMap) {
    if (!generatedMap.has(name)) {
      differences.push({
        path: `${basePath}.${name}`,
        expected: refField,
        actual: undefined,
        severity: "critical",
        message: `Missing field: ${name}`,
      });
    }
  }

  // Check for extra fields and compare matching fields
  for (const [name, genField] of generatedMap) {
    if (!referenceMap.has(name)) {
      differences.push({
        path: `${basePath}.${name}`,
        expected: undefined,
        actual: genField,
        severity: "critical",
        message: `Extra field: ${name}`,
      });
    } else {
      const refField = referenceMap.get(name)!;
      const fieldDiffs = compareField(genField, refField, `${basePath}.${name}`);
      differences.push(...fieldDiffs);
    }
  }

  return differences;
}

/**
 * Compare individual field definitions
 */
function compareField(generated: ParsedField, reference: ParsedField, basePath: string): Difference[] {
  const differences: Difference[] = [];

  // Compare all properties
  const allKeys = new Set([...Object.keys(generated), ...Object.keys(reference)]);

  for (const key of allKeys) {
    const genValue = (generated as any)[key];
    const refValue = (reference as any)[key];

    if (!deepEqual(genValue, refValue)) {
      differences.push({
        path: `${basePath}.${key}`,
        expected: refValue,
        actual: genValue,
        severity: key === "type" || key === "name" ? "critical" : "warning",
      });
    }
  }

  return differences;
}

/**
 * Compare index arrays
 */
function compareIndexes(generated: string[], reference: string[], basePath: string): Difference[] {
  const differences: Difference[] = [];

  if (generated.length !== reference.length) {
    differences.push({
      path: `${basePath}.length`,
      expected: reference.length,
      actual: generated.length,
      severity: "warning",
    });
  }

  // Normalize and compare indexes
  const normalizedGen = generated.map(normalizeIndexSQL);
  const normalizedRef = reference.map(normalizeIndexSQL);

  for (let i = 0; i < Math.min(generated.length, reference.length); i++) {
    if (normalizedGen[i] !== normalizedRef[i]) {
      differences.push({
        path: `${basePath}[${i}]`,
        expected: reference[i],
        actual: generated[i],
        severity: "warning",
      });
    }
  }

  return differences;
}

/**
 * Compare rule objects
 */
function compareRules(
  generated: Record<string, string | null>,
  reference: Record<string, string | null>,
  basePath: string
): Difference[] {
  const differences: Difference[] = [];

  const allRules = new Set([...Object.keys(generated), ...Object.keys(reference)]);

  for (const rule of allRules) {
    const genValue = generated[rule];
    const refValue = reference[rule];

    if (genValue !== refValue) {
      differences.push({
        path: `${basePath}.${rule}`,
        expected: refValue,
        actual: genValue,
        severity: "critical",
      });
    }
  }

  return differences;
}

/**
 * Compare migration operations
 */
function compareOperations(generated: any, reference: any, basePath: string): Difference[] {
  const differences: Difference[] = [];

  if (generated.type !== reference.type) {
    differences.push({
      path: `${basePath}.type`,
      expected: reference.type,
      actual: generated.type,
      severity: "critical",
    });
  }

  if (generated.collection !== reference.collection) {
    differences.push({
      path: `${basePath}.collection`,
      expected: reference.collection,
      actual: generated.collection,
      severity: "critical",
    });
  }

  // Compare details object
  if (!deepEqual(generated.details, reference.details)) {
    differences.push({
      path: `${basePath}.details`,
      expected: reference.details,
      actual: generated.details,
      severity: "warning",
    });
  }

  return differences;
}

/**
 * Normalize SQL index statements for comparison
 */
function normalizeIndexSQL(sql: string): string {
  return sql
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim()
    .toLowerCase();
}

/**
 * Deep equality check for objects and arrays
 */
function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  if (typeof a === "object" && typeof b === "object") {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
      if (!keysB.includes(key)) return false;
      if (!deepEqual(a[key], b[key])) return false;
    }
    return true;
  }

  return false;
}

/**
 * Format differences for display
 */
export function formatDifferences(differences: Difference[]): string {
  if (differences.length === 0) {
    return "No differences found";
  }

  const lines: string[] = [];
  lines.push(`Found ${differences.length} difference(s):\n`);

  for (const diff of differences) {
    lines.push(`  ${diff.severity.toUpperCase()}: ${diff.path}`);
    if (diff.message) {
      lines.push(`    ${diff.message}`);
    }
    lines.push(`    Expected: ${formatValue(diff.expected)}`);
    lines.push(`    Actual:   ${formatValue(diff.actual)}`);
    lines.push("");
  }

  return lines.join("\n");
}

/**
 * Format a value for display
 */
function formatValue(value: any): string {
  if (value === undefined) return "undefined";
  if (value === null) return "null";
  if (typeof value === "string") return `"${value}"`;
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}
