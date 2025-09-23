// Root ESLint configuration that provides global ignores only
// Each workspace has its own ESLint config that handles workspace-specific rules

export default [
  // Global ignores applied to all workspaces
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**", 
      "**/pb_data/**",
      "**/pocket_base/**",
      "**/tmp/**",
      "**/*.js.map",
      "**/*.d.ts.map",
      "**/pb_hooks/**",
      "**/pb_migrations/**"
    ]
  }
];
