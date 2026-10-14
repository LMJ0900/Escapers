import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier/flat";

const eslintConfig = defineConfig([
  ...tseslint.configs.recommended,
  // Turn off ESLint rules that conflict with Prettier. Must stay last.
  prettier,
  globalIgnores(["dist/**", "src/generated/**"]),
]);

export default eslintConfig;
