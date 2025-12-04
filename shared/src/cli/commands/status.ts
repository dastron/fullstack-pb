/**
 * Status command implementation
 * Shows current migration status without generating files
 */

import { Command } from "commander";
import { parseSchemaFiles } from "../../migration/analyzer";
import { categorizeChangesBySeverity, compare } from "../../migration/diff";
import { loadSnapshotIfExists } from "../../migration/snapshot";
import { getMigrationsDirectory, getSchemaDirectory, loadConfig } from "../utils/config";
import { formatChangeSummary, logError, logInfo, logSection, logSuccess, withProgress } from "../utils/logger";

/**
 * Checks if there are any changes in the diff
 *
 * @param diff - Schema diff to check
 * @returns True if there are changes
 */
function hasChanges(diff: any): boolean {
  return (
    diff.collectionsToCreate.length > 0 || diff.collectionsToDelete.length > 0 || diff.collectionsToModify.length > 0
  );
}

/**
 * Displays destructive changes summary
 *
 * @param diff - Schema diff containing changes
 */
function displayDestructiveChangesSummary(diff: any): void {
  const { destructive, nonDestructive } = categorizeChangesBySeverity(diff);

  if (destructive.length > 0) {
    logSection("⚠️  Destructive Changes");
    console.log();
    for (const change of destructive) {
      console.log(`  ${change}`);
    }
    console.log();
  }

  if (nonDestructive.length > 0) {
    logSection("✓ Non-Destructive Changes");
    console.log();
    for (const change of nonDestructive) {
      console.log(`  ${change}`);
    }
    console.log();
  }
}

/**
 * Executes the status command
 *
 * @param options - Command options
 */
export async function executeStatus(options: any): Promise<void> {
  try {
    // Load configuration
    const config = await loadConfig(options);

    // Get paths
    const schemaDir = getSchemaDirectory(config);
    const migrationsDir = getMigrationsDirectory(config);

    logSection("🔍 Checking Migration Status");

    // Parse schema files
    const currentSchema = await withProgress("Parsing Zod schemas...", () => parseSchemaFiles(schemaDir));

    logSuccess(`Found ${currentSchema.collections.size} collection(s) in schema`);

    // Load previous snapshot (uses most recent snapshot from migrations directory)
    logInfo("Loading previous snapshot...");
    const previousSnapshot = loadSnapshotIfExists(
      {
        snapshotPath: config.snapshot.path,
        workspaceRoot: process.cwd(),
      },
      migrationsDir // Pass migrations directory to find latest snapshot
    );

    if (!previousSnapshot) {
      logInfo("No previous snapshot found");
      console.log();
      logInfo("This appears to be a first-time setup.");
      logInfo('Run "migrate:generate" to create the initial migration.');
      return;
    }

    logSuccess(`Loaded snapshot with ${previousSnapshot.collections.size} collection(s)`);

    // Compare schemas
    logSection("📊 Schema Comparison");
    const diff = compare(currentSchema, previousSnapshot);

    // Check if there are any changes
    if (!hasChanges(diff)) {
      console.log();
      logSuccess("✓ Schema is in sync with snapshot");
      logInfo("No pending changes detected");
      return;
    }

    // Display change summary
    console.log();
    console.log(formatChangeSummary(diff));

    // Display categorized changes
    displayDestructiveChangesSummary(diff);

    // Display next steps
    logSection("📝 Next Steps");
    console.log();
    console.log("  To generate a migration for these changes, run:");
    console.log("     yarn migrate:generate");
    console.log();

    const { destructive } = categorizeChangesBySeverity(diff);
    if (destructive.length > 0) {
      console.log("  Note: Destructive changes detected. Use --force flag when generating:");
      console.log("     yarn migrate:generate --force");
      console.log();
    }
  } catch (error) {
    logError(`Failed to check status: ${error}`);
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

/**
 * Creates the status command
 *
 * @returns Commander command instance
 */
export function createStatusCommand(): Command {
  return new Command("status")
    .description("Show current migration status without generating files")
    .option("-s, --snapshot <path>", "Path to snapshot file")
    .action(executeStatus);
}
