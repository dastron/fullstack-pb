/**
 * Logging utilities for CLI output
 * Provides colored console output and formatting helpers
 */

import chalk from "chalk";
import ora, { Ora } from "ora";
import type { FieldChange, SchemaDiff } from "../../migration/types";

/**
 * Creates a spinner for long-running operations
 *
 * @param text - Initial spinner text
 * @returns Ora spinner instance
 */
export function createSpinner(text: string): Ora {
  return ora(text);
}

/**
 * Logs a success message in green
 *
 * @param message - Message to log
 */
export function logSuccess(message: string): void {
  console.log(chalk.green("✓"), message);
}

/**
 * Logs an error message in red
 *
 * @param message - Message to log
 */
export function logError(message: string): void {
  console.error(chalk.red("✗"), message);
}

/**
 * Logs a warning message in yellow
 *
 * @param message - Message to log
 */
export function logWarning(message: string): void {
  console.warn(chalk.yellow("⚠"), message);
}

/**
 * Logs an info message in blue
 *
 * @param message - Message to log
 */
export function logInfo(message: string): void {
  console.log(chalk.blue("ℹ"), message);
}

/**
 * Logs a section header
 *
 * @param title - Section title
 */
export function logSection(title: string): void {
  console.log();
  console.log(chalk.bold.cyan(title));
  console.log(chalk.cyan("─".repeat(title.length)));
}

/**
 * Formats a field change for display
 *
 * @param change - Field change object
 * @returns Formatted string
 */
function formatFieldChange(change: FieldChange): string {
  const oldValue = change.oldValue === null ? "null" : JSON.stringify(change.oldValue);
  const newValue = change.newValue === null ? "null" : JSON.stringify(change.newValue);

  return `${change.property}: ${chalk.red(oldValue)} → ${chalk.green(newValue)}`;
}

/**
 * Formats a change summary for display
 * Creates a formatted, colored summary of detected changes
 *
 * @param diff - Schema diff containing all changes
 * @returns Formatted summary string
 */
export function formatChangeSummary(diff: SchemaDiff): string {
  const lines: string[] = [];

  // Count total changes
  const totalCollectionsToCreate = diff.collectionsToCreate.length;
  const totalCollectionsToDelete = diff.collectionsToDelete.length;
  const totalCollectionsToModify = diff.collectionsToModify.length;

  const totalChanges = totalCollectionsToCreate + totalCollectionsToDelete + totalCollectionsToModify;

  if (totalChanges === 0) {
    return chalk.gray("No changes detected");
  }

  lines.push(chalk.bold(`Found ${totalChanges} collection change(s):`));
  lines.push("");

  // New collections
  if (totalCollectionsToCreate > 0) {
    lines.push(chalk.green.bold(`✓ ${totalCollectionsToCreate} collection(s) to create:`));
    for (const collection of diff.collectionsToCreate) {
      lines.push(chalk.green(`  + ${collection.name} (${collection.type})`));
      lines.push(chalk.gray(`    ${collection.fields.length} field(s)`));
    }
    lines.push("");
  }

  // Deleted collections
  if (totalCollectionsToDelete > 0) {
    lines.push(chalk.red.bold(`✗ ${totalCollectionsToDelete} collection(s) to delete:`));
    for (const collection of diff.collectionsToDelete) {
      lines.push(chalk.red(`  - ${collection.name}`));
    }
    lines.push("");
  }

  // Modified collections
  if (totalCollectionsToModify > 0) {
    lines.push(chalk.yellow.bold(`⚡ ${totalCollectionsToModify} collection(s) to modify:`));

    for (const modification of diff.collectionsToModify) {
      lines.push(chalk.yellow(`  ~ ${modification.collection}`));

      // Fields to add
      if (modification.fieldsToAdd.length > 0) {
        lines.push(chalk.green(`    + ${modification.fieldsToAdd.length} field(s) to add:`));
        for (const field of modification.fieldsToAdd) {
          lines.push(chalk.green(`      + ${field.name} (${field.type})`));
        }
      }

      // Fields to remove
      if (modification.fieldsToRemove.length > 0) {
        lines.push(chalk.red(`    - ${modification.fieldsToRemove.length} field(s) to remove:`));
        for (const field of modification.fieldsToRemove) {
          lines.push(chalk.red(`      - ${field.name}`));
        }
      }

      // Fields to modify
      if (modification.fieldsToModify.length > 0) {
        lines.push(chalk.yellow(`    ~ ${modification.fieldsToModify.length} field(s) to modify:`));
        for (const fieldMod of modification.fieldsToModify) {
          lines.push(chalk.yellow(`      ~ ${fieldMod.fieldName}`));
          for (const change of fieldMod.changes) {
            lines.push(chalk.gray(`        ${formatFieldChange(change)}`));
          }
        }
      }

      // Indexes
      if (modification.indexesToAdd.length > 0) {
        lines.push(chalk.green(`    + ${modification.indexesToAdd.length} index(es) to add`));
      }

      if (modification.indexesToRemove.length > 0) {
        lines.push(chalk.red(`    - ${modification.indexesToRemove.length} index(es) to remove`));
      }

      // Rules
      if (modification.rulesToUpdate.length > 0) {
        lines.push(chalk.yellow(`    ~ ${modification.rulesToUpdate.length} rule(s) to update`));
      }

      lines.push("");
    }
  }

  return lines.join("\n");
}

/**
 * Displays a progress indicator for a long operation
 *
 * @param message - Progress message
 * @param operation - Async operation to perform
 * @returns Result of the operation
 */
export async function withProgress<T>(message: string, operation: () => Promise<T>): Promise<T> {
  const spinner = createSpinner(message).start();

  try {
    const result = await operation();
    spinner.succeed();
    return result;
  } catch (error) {
    spinner.fail();
    throw error;
  }
}
