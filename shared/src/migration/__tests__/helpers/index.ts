/**
 * Test helper utilities for migration test suite
 */

export {
  extractOperations,
  parseCollectionDefinition,
  parseMigrationFile,
  type MigrationOperation,
  type ParsedCollection,
  type ParsedField,
  type ParsedMigration,
} from "./migration-parser";

export { CollectionBuilder, SchemaBuilder } from "./schema-builder";

export {
  compareCollections,
  compareFields,
  compareMigrations,
  formatDifferences,
  type Difference,
  type MigrationComparison,
} from "./diff-matcher";
