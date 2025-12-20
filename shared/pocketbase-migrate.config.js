export default {
  schema: {
    directory: "./src/schema",
    exclude: ["*.test.ts", "*.spec.ts", "base.ts", "index.ts"],
  },
  migrations: {
    directory: "../pocketbase/pb_migrations",
    format: "js",
  },
  diff: {
    warnOnDelete: true,
    requireForceForDestructive: true,
  },
};

