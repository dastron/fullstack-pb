#!/usr/bin/env node

/**
 * CLI entry point for the migration tool
 * Schema-driven PocketBase migration generator
 */

import { Command } from "commander";
import { createGenerateCommand } from "./commands/generate";
import { createStatusCommand } from "./commands/status";

// Read package.json for version
const packageJson = {
  name: "@project/shared",
  version: "0.0.0",
  description: "Schema-driven PocketBase migration tool",
};

/**
 * Main CLI program
 */
const program = new Command();

// Configure main program
program
  .name("migrate")
  .description("Schema-driven PocketBase migration tool")
  .version(packageJson.version, "-v, --version", "Output the current version");

// Add commands
program.addCommand(createGenerateCommand());
program.addCommand(createStatusCommand());

// Display help if no command provided
if (process.argv.length === 2) {
  program.help();
}

// Parse command line arguments
program.parse(process.argv);
