import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import eslintPluginImport from "eslint-plugin-import";
import eslintConfigPrettier from "eslint-config-prettier";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended, eslintConfigPrettier],
    files: ["src/**/*.{ts,js}"], // Apply to TS and JS files in src
    languageOptions: {
      ecmaVersion: 2022, // Use a recent ECMAScript version suitable for Node.js
      sourceType: "module", // Since package.json specifies "type": "module"
      globals: {
        ...globals.node, // Use Node.js globals
      },
    },
    plugins: {
      import: eslintPluginImport,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "off",
      "import/newline-after-import": "error",
      "import/order": [
        "error",
        {
          groups: ["type", "builtin", "external", "internal", "parent", "sibling", "index", "object"],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
    },
  }
); 