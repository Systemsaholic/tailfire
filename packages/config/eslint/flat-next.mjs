import { config as baseConfig } from "./flat-base.mjs";
import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

const nextConfig = compat.extends("next/core-web-vitals");

export default [
  {
    ignores: ["**/.next/**", "**/node_modules/**", "**/dist/**", "**/coverage/**", "**/next-env.d.ts"],
  },
  ...baseConfig,
  ...nextConfig,
  {
    rules: {
      "@next/next/no-img-element": "off",
      "@next/next/no-html-link-for-pages": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "no-unused-vars": "off",
    },
  },
];
