import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

/**
 * ESLint config for @tailfire/ui-public
 *
 * This package must remain UI-only. Importing auth, API, or data
 * dependencies would break the package boundary and make reuse painful.
 */
export default [
  {
    ignores: ["node_modules/**", "dist/**"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ...config.languageOptions,
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
    },
  })),
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      // Block imports that would break the UI-only boundary
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/lib/mock-auth*", "**/lib/api*", "**/lib/session*"],
              message: "ui-public must not import auth/api/session modules. Keep it UI-only.",
            },
            {
              group: ["**/data/*", "@/data/*"],
              message: "ui-public must not import data modules. Data should come from app props.",
            },
            {
              group: ["**/context/*", "@/context/*"],
              message: "ui-public must not import context modules. Context should be provided by apps.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["tailwind.preset.ts"],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
  },
];
