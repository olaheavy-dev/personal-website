import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    // Defaults from eslint-config-next
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Tool output
    ".artifacts/**",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
    // Agent worktrees: full copies of the repository made by Claude Code
    ".claude/worktrees/**",
  ]),
]);

export default eslintConfig;
