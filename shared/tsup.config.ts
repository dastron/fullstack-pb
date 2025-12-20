import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/schema.ts',
    'src/schema/user.ts',
    'src/schema/project.ts',
    'src/enums.ts',
    'src/types.ts',
    'src/mutator.ts',
  ],
  format: ['esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  shims: true,
}); 