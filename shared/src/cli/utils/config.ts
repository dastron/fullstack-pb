/**
 * Configuration loader for migration tool
 * Handles loading and merging configuration from various sources
 */

import * as fs from "fs";
import * as path from "path";

/**
 * Migration tool configuration
 */
export interface MigrationConfig {
  schema: {
    directory: string;
    exclude: string[];
  };
  migrations: {
    directory: string;
    format: string;
  };
  snapshot: {
    path: string;
    basePath?: string;
  };
  diff: {
    warnOnDelete: boolean;
    requireForceForDestructive: boolean;
  };
}

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: MigrationConfig = {
  schema: {
    directory: "src/schema",
    exclude: ["base.ts", "index.ts"],
  },
  migrations: {
    directory: "../pocketbase/pb_migrations", // Relative to shared directory, or pocketbase/pb_migrations from root
    format: "timestamp_description",
  },
  snapshot: {
    path: ".migration-snapshot.json",
  },
  diff: {
    warnOnDelete: true,
    requireForceForDestructive: true,
  },
};

/**
 * Loads configuration from file if it exists
 *
 * @param configPath - Path to configuration file
 * @returns Loaded configuration or null if file doesn't exist
 */
async function loadConfigFile(configPath: string): Promise<Partial<MigrationConfig> | null> {
  if (!fs.existsSync(configPath)) {
    return null;
  }

  try {
    // Dynamic import for ESM modules
    const module = await import(configPath);
    return module.default || module;
  } catch (error) {
    console.warn(`Failed to load config file ${configPath}:`, error);
    return null;
  }
}

/**
 * Merges configuration objects with deep merge
 *
 * @param base - Base configuration
 * @param override - Override configuration
 * @returns Merged configuration
 */
function mergeConfig(base: MigrationConfig, override: Partial<MigrationConfig>): MigrationConfig {
  return {
    schema: {
      ...base.schema,
      ...override.schema,
    },
    migrations: {
      ...base.migrations,
      ...override.migrations,
    },
    snapshot: {
      ...base.snapshot,
      ...override.snapshot,
    },
    diff: {
      ...base.diff,
      ...override.diff,
    },
  };
}

/**
 * Loads configuration from environment variables
 *
 * @returns Configuration from environment variables
 */
function loadConfigFromEnv(): Partial<MigrationConfig> {
  const config: Partial<MigrationConfig> = {};

  if (process.env.MIGRATION_SCHEMA_DIR) {
    config.schema = {
      directory: process.env.MIGRATION_SCHEMA_DIR,
      exclude: DEFAULT_CONFIG.schema.exclude,
    };
  }

  if (process.env.MIGRATION_OUTPUT_DIR) {
    config.migrations = {
      directory: process.env.MIGRATION_OUTPUT_DIR,
      format: DEFAULT_CONFIG.migrations.format,
    };
  }

  if (process.env.MIGRATION_SNAPSHOT_PATH) {
    config.snapshot = {
      path: process.env.MIGRATION_SNAPSHOT_PATH,
    };
  }

  return config;
}

/**
 * Loads configuration from CLI arguments
 *
 * @param options - CLI options object
 * @returns Configuration from CLI arguments
 */
export function loadConfigFromArgs(options: any): Partial<MigrationConfig> {
  const config: Partial<MigrationConfig> = {};

  if (options.output) {
    config.migrations = {
      directory: options.output,
      format: DEFAULT_CONFIG.migrations.format,
    };
  }

  if (options.snapshot) {
    config.snapshot = {
      path: options.snapshot,
    };
  }

  return config;
}

/**
 * Validates configuration
 * Ensures all required paths are valid
 *
 * @param config - Configuration to validate
 * @throws Error if configuration is invalid
 */
function validateConfig(config: MigrationConfig): void {
  // Validate schema directory exists
  // Check if we're already in the shared directory
  const cwd = process.cwd();
  const isInShared = cwd.endsWith("/shared") || cwd.endsWith("\\shared");
  const schemaDir = isInShared
    ? path.resolve(cwd, config.schema.directory)
    : path.resolve(cwd, "shared", config.schema.directory);

  if (!fs.existsSync(schemaDir)) {
    throw new Error(`Schema directory not found: ${schemaDir}`);
  }
}

/**
 * Loads and merges configuration from all sources
 * Priority: CLI args > Environment variables > Config file > Defaults
 *
 * @param options - CLI options object
 * @returns Complete merged configuration
 */
export async function loadConfig(options: any = {}): Promise<MigrationConfig> {
  // Start with defaults
  let config: MigrationConfig = { ...DEFAULT_CONFIG };

  // Try to load config file
  const configPath = path.resolve(process.cwd(), "shared", "migrate.config.js");
  const fileConfig = await loadConfigFile(configPath);
  if (fileConfig) {
    config = mergeConfig(config, fileConfig);
  }

  // Merge environment variables
  const envConfig = loadConfigFromEnv();
  if (Object.keys(envConfig).length > 0) {
    config = mergeConfig(config, envConfig);
  }

  // Merge CLI arguments (highest priority)
  const argsConfig = loadConfigFromArgs(options);
  if (Object.keys(argsConfig).length > 0) {
    config = mergeConfig(config, argsConfig);
  }

  // Validate final configuration
  validateConfig(config);

  return config;
}

/**
 * Gets the absolute path to the schema directory
 *
 * @param config - Migration configuration
 * @returns Absolute path to schema directory
 */
export function getSchemaDirectory(config: MigrationConfig): string {
  const cwd = process.cwd();
  const isInShared = cwd.endsWith("/shared") || cwd.endsWith("\\shared");
  return isInShared ? path.resolve(cwd, config.schema.directory) : path.resolve(cwd, "shared", config.schema.directory);
}

/**
 * Gets the absolute path to the migrations directory
 *
 * @param config - Migration configuration
 * @returns Absolute path to migrations directory
 */
export function getMigrationsDirectory(config: MigrationConfig): string {
  const cwd = process.cwd();
  const isInShared = cwd.endsWith("/shared") || cwd.endsWith("\\shared");

  // If we're in the shared directory, resolve relative to shared
  // If we're in the root, resolve relative to root
  if (isInShared) {
    return path.resolve(cwd, config.migrations.directory);
  } else {
    // From root, the path should be pocketbase/pb_migrations
    // The config has ../pocketbase/pb_migrations which is relative to shared
    // So we need to adjust it for root context
    const adjustedPath = config.migrations.directory.replace(/^\.\.\//, "");
    return path.resolve(cwd, adjustedPath);
  }
}

/**
 * Gets the absolute path to the snapshot file
 *
 * @param config - Migration configuration
 * @returns Absolute path to snapshot file
 */
export function getSnapshotPath(config: MigrationConfig): string {
  const cwd = process.cwd();
  const isInShared = cwd.endsWith("/shared") || cwd.endsWith("\\shared");
  return isInShared ? path.resolve(cwd, config.snapshot.path) : path.resolve(cwd, "shared", config.snapshot.path);
}

/**
 * Gets the absolute path to the base migration file
 *
 * @param config - Migration configuration
 * @returns Absolute path to base migration file, or undefined if not configured
 */
export function getBaseMigrationPath(config: MigrationConfig): string | undefined {
  if (!config.snapshot.basePath) {
    return undefined;
  }

  const cwd = process.cwd();
  const isInShared = cwd.endsWith("/shared") || cwd.endsWith("\\shared");

  // If we're in the shared directory, resolve relative to shared
  // If we're in the root, resolve relative to root
  if (isInShared) {
    return path.resolve(cwd, config.snapshot.basePath);
  } else {
    // From root, adjust the path if it starts with ../
    const adjustedPath = config.snapshot.basePath.replace(/^\.\.\//, "");
    return path.resolve(cwd, adjustedPath);
  }
}
