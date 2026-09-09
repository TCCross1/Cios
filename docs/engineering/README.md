# Engineering Documentation

This directory holds engineering process documentation: repository
conventions, coding standards, release process, and operational runbooks.

## Current conventions (Directive 001)

- Package manager: pnpm (see root `package.json` `packageManager` field).
- Language: TypeScript with strict compiler settings (see `tsconfig.json`).
- Linting: ESLint flat config (`eslint.config.js`).
- Formatting: Prettier (`.prettierrc.json`).
- Tests: Vitest (`vitest.config.ts`), test files live in `/tests`.
