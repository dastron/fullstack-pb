import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/schema.ts',
    'src/schema/user.ts',
    'src/schema/project.ts',
    'src/enums.ts',
    'src/types.ts',
    'src/mutator.ts',
    'src/cli/migrate.ts',
    'src/cli/commands/generate.ts',
    'src/cli/commands/status.ts',
    'src/cli/utils/logger.ts',
    'src/cli/utils/config.ts',
    'src/migration/analyzer.ts',
    'src/migration/snapshot.ts',
    'src/migration/diff.ts',
    'src/migration/generator.ts',
    'src/migration/types.ts',
    'src/migration/utils/type-mapper.ts',
    'src/migration/utils/relation-detector.ts',
    'src/migration/utils/pluralize.ts'
  ],
  format: ['esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  shims: true,
}); 