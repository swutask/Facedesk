import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      "plugin:react/recommended", // Added React plugin's recommended rules
      "plugin:@typescript-eslint/recommended" // Added TypeScript plugin's recommended rules
    ],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        project: "./tsconfig.json", // Point to your TypeScript config
      }
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],

      "no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
      "@typescript-eslint/no-unused-vars": [
        "warn", 
        { "argsIgnorePattern": "^_", "ignoreRestSiblings": true }  // Ignore rest siblings
      ],
      "react/prop-types": "off",  // Disable prop-types warning for TypeScript
      "react/react-in-jsx-scope": "off", // Disable React import warning (for React 17+)
      "@typescript-eslint/no-explicit-any": "warn", // Warn if 'any' type is used
      "@typescript-eslint/explicit-module-boundary-types": "warn" // Warn for missing return types
    },
  }
);
