# PocketBase Directory

This directory contains the PocketBase instance including the executable, migrations, hooks, and runtime data.

## Directory Structure

```
pocketbase/
├── pocketbase              # PocketBase executable (downloaded during setup)
├── pb_data/                # Runtime data (excluded from git)
│   ├── data.db            # SQLite database (excluded from git)
│   ├── auxiliary.db       # Auxiliary database (excluded from git)
│   └── storage/           # Uploaded files (excluded from git)
├── pb_migrations/          # Migration files (committed to git)
│   ├── [timestamp]_snapshot.js           # Snapshots
│   └── [timestamp]_[description].js      # Regular migrations
└── pb_hooks/               # Custom JavaScript hooks (committed to git)
```

## Version Control

**Committed to Git:**
- `pb_migrations/` - All migration files including snapshots
- `pb_hooks/` - Custom PocketBase hooks
- `pb_data/types.d.ts` - TypeScript type definitions

**Excluded from Git:**
- `pocketbase` - Executable (downloaded during setup)
- `pb_data/*.db*` - Database files
- `pb_data/storage/` - Uploaded files

## Snapshots

Snapshots are special migration files that capture the complete database schema at a point in time. They serve as documentation and reference points for the migration system.

### Automatic Snapshot Generation

When you run `yarn setup` for the first time, the setup script will:
1. Initialize PocketBase and create system collections
2. Check if any snapshots exist in `pb_migrations/`
3. If no snapshots exist, automatically generate an initial snapshot
4. The snapshot includes PocketBase's system collections (`_mfas`, `_otps`, `_externalAuths`, `_authOrigins`, `_superusers`) and the default `users` collection

### How Snapshots Work

- The migration system uses the **most recent snapshot** as the base reference for diff calculations
- If no snapshots exist, the system treats the database as empty and generates a complete initial migration
- Snapshots are committed to version control as they document the schema state
- Multiple snapshots can exist - the system always uses the most recent one

### When Snapshots Are Created

Snapshots are automatically created:
- During initial setup (if none exist)
- When you run `yarn pb:snapshot` manually
- When PocketBase's `migrate collections` command is executed

## Schema-Driven Development

This project uses schema-driven development where:
1. Entity schemas are defined in `shared/src/schema/`
2. Migrations are auto-generated from schemas using `yarn migrate:generate`
3. Migrations are applied to PocketBase using `yarn pb:sync`

**Never:**
- Create PocketBase collections manually via the dashboard
- Edit generated migration files directly
- Delete snapshot files (they serve as schema documentation)

## Common Commands

```bash
# Initial setup (downloads PocketBase, creates directories, generates snapshot)
yarn setup

# Generate migration from Zod schemas
yarn migrate:generate

# Apply pending migrations
yarn pb:sync

# Create a snapshot of current schema
yarn pb:snapshot

# Run PocketBase server
yarn pb

# Start all services (app, functions, PocketBase)
yarn dev
```

## Deployment

When deploying:
- The `pocketbase` executable is downloaded during the build process
- Migrations in `pb_migrations/` are applied on startup
- Runtime data (`pb_data/`) should use persistent volumes
- Environment variables configure superuser credentials
