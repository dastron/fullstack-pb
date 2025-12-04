# Migration Configuration Reference

This document describes all configuration options available for the schema-driven migration system.

## Configuration File

The migration system can be configured using a `migrate.config.js` file in the `shared/` directory.

### Default Configuration

If no configuration file is present, the system uses these defaults:

```javascript
// shared/migrate.config.js (default values)
export default {
  schema: {
    directory: 'src/schema',
    exclude: ['base.ts', 'index.ts'],
  },
  migrations: {
    directory: '../../pb/pb_migrations',
    format: 'timestamp_description',
  },
  snapshot: {
    path: '.migration-snapshot.json',
    basePath: '../pb/pb_migrations/000000000_collections_snapshot.js',
  },
  diff: {
    warnOnDelete: true,
    requireForceForDestructive: true,
  },
};
```

## Configuration Options

### schema

Configuration for schema file discovery and parsing.

#### schema.directory

**Type:** `string`  
**Default:** `'src/schema'`  
**Description:** Directory containing Zod schema files (relative to shared/)

**Example:**
```javascript
{
  schema: {
    directory: 'src/models', // Look in src/models instead
  }
}
```

#### schema.exclude

**Type:** `string[]`  
**Default:** `['base.ts', 'index.ts']`  
**Description:** Files to exclude from schema parsing

**Example:**
```javascript
{
  schema: {
    exclude: [
      'base.ts',
      'index.ts',
      'helpers.ts',
      'types.ts',
      'utils.ts',
    ],
  }
}
```

**Common exclusions:**
- `base.ts` - Base schema definitions
- `index.ts` - Export file
- `helpers.ts` - Helper functions
- `types.ts` - Type definitions
- `*.test.ts` - Test files

### migrations

Configuration for migration file generation.

#### migrations.directory

**Type:** `string`  
**Default:** `'../../pb/pb_migrations'`  
**Description:** Directory where migration files are written (relative to shared/)

**Example:**
```javascript
{
  migrations: {
    directory: '../../database/migrations',
  }
}
```

**Common paths:**
- `'../../pb/pb_migrations'` - PocketBase migrations location
- `'./migrations'` - Local to shared directory

#### migrations.format

**Type:** `string`  
**Default:** `'timestamp_description'`  
**Description:** Format for migration filenames

**Example:**
```javascript
{
  migrations: {
    format: 'timestamp_description', // 1234567890_create_users.js
  }
}
```

**Supported formats:**
- `'timestamp_description'` - `[timestamp]_[description].js` (recommended)
- `'timestamp'` - `[timestamp].js` (minimal)

### snapshot

Configuration for schema snapshot management.

#### snapshot.path

**Type:** `string`  
**Default:** `'.migration-snapshot.json'`  
**Description:** Path to snapshot file (relative to shared/)

**Example:**
```javascript
{
  snapshot: {
    path: '.schema-snapshot.json',
  }
}
```

**Common paths:**
- `'.migration-snapshot.json'` - Default location
- `'.schema-snapshot.json'` - Alternative name
- `'snapshots/current.json'` - In subdirectory

**Important:** The snapshot file should be committed to version control!

#### snapshot.basePath

**Type:** `string` (optional)  
**Default:** `'../pb/pb_migrations/000000000_collections_snapshot.js'`  
**Description:** Path to PocketBase base migration file containing system collections (relative to shared/)

**Example:**
```javascript
{
  snapshot: {
    path: '.migration-snapshot.json',
    basePath: '../pb/pb_migrations/000000000_collections_snapshot.js',
  }
}
```

**Common paths:**
- `'../pb/pb_migrations/000000000_collections_snapshot.js'` - Default PocketBase base migration
- `'../database/base_schema.js'` - Custom base schema location
- `undefined` - Disable base schema loading

**Purpose:**
The base migration file contains PocketBase's system collections (`_mfas`, `_otps`, `_externalAuths`, `_authOrigins`, `_superusers`) and the default `users` collection. The migration system uses this as the starting point for schema comparisons, ensuring that:
- System collections are not recreated in migrations
- First-time setup works correctly
- Diffs are calculated against PocketBase's actual initial state

**Automatic Creation:**
If the base snapshot file doesn't exist, it will be automatically created during `yarn setup` by running PocketBase and capturing its initial schema. This ensures the migration system always has the correct base schema for your PocketBase version.

**Manual Regeneration:**
To manually regenerate the base snapshot (useful after PocketBase upgrades):
```bash
yarn pb:base-snapshot
```

**Important:** This file should match your PocketBase version's default schema!

### diff

Configuration for schema comparison and change detection.

#### diff.warnOnDelete

**Type:** `boolean`  
**Default:** `true`  
**Description:** Show warnings for destructive operations (field/collection deletion)

**Example:**
```javascript
{
  diff: {
    warnOnDelete: true, // Show warnings
  }
}
```

**When enabled:**
- Displays warning messages for deletions
- Lists affected collections and fields
- Recommends backup before applying

**When disabled:**
- Silently includes deletions in migration
- No warnings displayed
- Use with caution!

#### diff.requireForceForDestructive

**Type:** `boolean`  
**Default:** `true`  
**Description:** Require `--force` flag for destructive changes

**Example:**
```javascript
{
  diff: {
    requireForceForDestructive: true,
  }
}
```

**When enabled:**
- Destructive changes require `--force` flag
- Prevents accidental data loss
- Recommended for production

**When disabled:**
- Destructive changes applied without confirmation
- Use only in development

**Destructive changes include:**
- Deleting collections
- Deleting fields
- Changing field types (may cause data loss)
- Reducing field size constraints

## CLI Options

CLI options override configuration file settings.

### Global Options

```bash
yarn migrate:generate [options]
```

#### --output, -o

**Type:** `string`  
**Description:** Override migrations output directory

**Example:**
```bash
yarn migrate:generate --output ./custom/migrations
```

#### --snapshot, -s

**Type:** `string`  
**Description:** Override snapshot file path

**Example:**
```bash
yarn migrate:generate --snapshot ./custom-snapshot.json
```

#### --force, -f

**Type:** `boolean`  
**Description:** Skip confirmation for destructive changes

**Example:**
```bash
yarn migrate:generate --force
```

**Use cases:**
- Automated CI/CD pipelines
- Development environments
- When you're certain about changes

**Warning:** Use with caution in production!

#### --help, -h

**Type:** `boolean`  
**Description:** Display help information

**Example:**
```bash
yarn migrate:generate --help
```

## Environment Variables

Environment variables can be used for dynamic configuration.

### Supported Variables

```bash
# Override migration directory
MIGRATION_DIR=../../custom/migrations

# Override snapshot path
SNAPSHOT_PATH=./.custom-snapshot.json

# Disable destructive change warnings
WARN_ON_DELETE=false

# Skip force requirement
REQUIRE_FORCE=false
```

### Usage in Configuration

```javascript
// shared/migrate.config.js
export default {
  migrations: {
    directory: process.env.MIGRATION_DIR || '../../pb/pb_migrations',
  },
  snapshot: {
    path: process.env.SNAPSHOT_PATH || '.migration-snapshot.json',
  },
  diff: {
    warnOnDelete: process.env.WARN_ON_DELETE !== 'false',
    requireForceForDestructive: process.env.REQUIRE_FORCE !== 'false',
  },
};
```

## Complete Configuration Example

Here's a complete configuration file with all options:

```javascript
// shared/migrate.config.js
export default {
  // Schema discovery
  schema: {
    directory: 'src/schema',
    exclude: [
      'base.ts',
      'index.ts',
      'helpers.ts',
      'types.ts',
      '*.test.ts',
    ],
  },

  // Migration generation
  migrations: {
    directory: process.env.MIGRATION_DIR || '../../pb/pb_migrations',
    format: 'timestamp_description',
  },

  // Snapshot management
  snapshot: {
    path: process.env.SNAPSHOT_PATH || '.migration-snapshot.json',
    basePath: '../pb/pb_migrations/000000000_collections_snapshot.js',
  },

  // Diff behavior
  diff: {
    warnOnDelete: process.env.NODE_ENV === 'production',
    requireForceForDestructive: process.env.NODE_ENV === 'production',
  },
};
```

## Configuration by Environment

### Development Environment

Relaxed settings for rapid iteration:

```javascript
// shared/migrate.config.js
const isDevelopment = process.env.NODE_ENV === 'development';

export default {
  schema: {
    directory: 'src/schema',
    exclude: ['base.ts', 'index.ts'],
  },
  migrations: {
    directory: '../../pb/pb_migrations',
  },
  snapshot: {
    path: '.migration-snapshot.json',
    basePath: '../pb/pb_migrations/000000000_collections_snapshot.js',
  },
  diff: {
    warnOnDelete: !isDevelopment,
    requireForceForDestructive: !isDevelopment,
  },
};
```

### Production Environment

Strict settings for safety:

```javascript
// shared/migrate.config.js
const isProduction = process.env.NODE_ENV === 'production';

export default {
  schema: {
    directory: 'src/schema',
    exclude: ['base.ts', 'index.ts', '*.test.ts'],
  },
  migrations: {
    directory: '../../pb/pb_migrations',
  },
  snapshot: {
    path: '.migration-snapshot.json',
    basePath: '../pb/pb_migrations/000000000_collections_snapshot.js',
  },
  diff: {
    warnOnDelete: true,
    requireForceForDestructive: isProduction,
  },
};
```

### CI/CD Environment

Automated settings for pipelines:

```javascript
// shared/migrate.config.js
const isCI = process.env.CI === 'true';

export default {
  schema: {
    directory: 'src/schema',
    exclude: ['base.ts', 'index.ts'],
  },
  migrations: {
    directory: '../../pb/pb_migrations',
  },
  snapshot: {
    path: '.migration-snapshot.json',
    basePath: '../pb/pb_migrations/000000000_collections_snapshot.js',
  },
  diff: {
    warnOnDelete: true,
    requireForceForDestructive: !isCI, // Allow force in CI
  },
};
```

## Package.json Scripts

Configure npm/yarn scripts for common operations:

```json
{
  "scripts": {
    "migrate:generate": "node dist/cli/migrate.js generate",
    "migrate:generate:force": "node dist/cli/migrate.js generate --force",
    "migrate:status": "node dist/cli/migrate.js status",
    "migrate:dev": "NODE_ENV=development node dist/cli/migrate.js generate",
    "migrate:prod": "NODE_ENV=production node dist/cli/migrate.js generate"
  }
}
```

### Root Package.json

Add workspace scripts to root:

```json
{
  "scripts": {
    "migrate:generate": "yarn workspace @project/shared migrate:generate",
    "migrate:status": "yarn workspace @project/shared migrate:status",
    "migrate:force": "yarn workspace @project/shared migrate:generate:force"
  }
}
```

## Best Practices

### 1. Version Control

✅ **DO:**
- Commit configuration file
- Commit snapshot file
- Commit migration files
- Use consistent paths across team

❌ **DON'T:**
- Ignore snapshot file
- Use absolute paths
- Change configuration frequently
- Use different configs per developer

### 2. Environment-Specific Settings

✅ **DO:**
- Use environment variables for paths
- Adjust safety settings by environment
- Document environment requirements
- Test configuration changes

❌ **DON'T:**
- Hardcode environment-specific values
- Disable safety features globally
- Use production config in development
- Skip configuration validation

### 3. Team Collaboration

✅ **DO:**
- Document custom configuration
- Share configuration decisions
- Use consistent exclude patterns
- Review configuration changes

❌ **DON'T:**
- Change configuration without notice
- Use personal preferences in shared config
- Override team standards
- Skip configuration documentation

### 4. Safety

✅ **DO:**
- Enable warnings in production
- Require force for destructive changes
- Test configuration in development
- Backup before configuration changes

❌ **DON'T:**
- Disable all safety features
- Skip destructive change warnings
- Use force flag by default
- Ignore configuration errors

## Troubleshooting

### Configuration Not Loading

**Symptoms:**
- Default values used instead of custom config
- Configuration changes not applied

**Solutions:**
1. Check file name: `migrate.config.js`
2. Check file location: `shared/migrate.config.js`
3. Check export syntax: `export default { ... }`
4. Check for syntax errors in config file

### Invalid Configuration

**Symptoms:**
- Error messages about configuration
- Migration generation fails

**Solutions:**
1. Validate configuration structure
2. Check data types (string, boolean, array)
3. Verify paths are relative to shared/
4. Check for typos in option names

### Path Resolution Issues

**Symptoms:**
- Cannot find schema directory
- Cannot write migration files
- Snapshot file not found

**Solutions:**
1. Use relative paths from shared/
2. Check directory exists
3. Verify permissions
4. Use forward slashes (/) not backslashes (\)

### Environment Variable Not Working

**Symptoms:**
- Environment variable ignored
- Default value used instead

**Solutions:**
1. Check variable name matches config
2. Verify variable is set before running command
3. Check for typos in variable name
4. Use proper syntax: `process.env.VAR_NAME`

## See Also

- [Migration Guide](./MIGRATION_GUIDE.md) - Complete migration documentation
- [Type Mapping Reference](./TYPE_MAPPING.md) - Type conversion rules
- [Naming Conventions](./NAMING_CONVENTIONS.md) - Naming guidelines
