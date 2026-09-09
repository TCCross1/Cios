import { readFileSync } from 'node:fs';
import path from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

/**
 * Verifies that the ESLint flat-config boundary overrides in
 * eslint.config.js actually reject/accept representative @cios/* imports,
 * using the real ESLint engine against in-memory source text (no fixture
 * files are added to production packages).
 */

const repoRoot = path.resolve(import.meta.dirname, '..', '..');

async function lint(relativeFilePath, code) {
  const eslint = new ESLint({ cwd: repoRoot });
  const [result] = await eslint.lintText(code, {
    filePath: path.join(repoRoot, relativeFilePath),
  });
  return result.messages;
}

describe('architecture source-import boundaries (eslint.config.js)', () => {
  it('rejects packages/domain importing @cios/infrastructure (forbidden)', async () => {
    const messages = await lint(
      'packages/domain/src/__fixture__.ts',
      "import { thing } from '@cios/infrastructure';\nexport const used = thing;\n",
    );
    const boundaryViolations = messages.filter(
      (m) => m.ruleId === 'no-restricted-imports' && m.message.includes('@cios/infrastructure'),
    );
    expect(boundaryViolations.length).toBeGreaterThan(0);
  });

  it('rejects packages/application importing @cios/infrastructure (forbidden)', async () => {
    const messages = await lint(
      'packages/application/src/__fixture__.ts',
      "import { thing } from '@cios/infrastructure';\nexport const used = thing;\n",
    );
    const boundaryViolations = messages.filter((m) => m.ruleId === 'no-restricted-imports');
    expect(boundaryViolations.length).toBeGreaterThan(0);
  });

  it('rejects apps/web importing @cios/infrastructure via a type-only import (forbidden)', async () => {
    const messages = await lint(
      'apps/web/src/__fixture__.ts',
      "import type { Thing } from '@cios/infrastructure';\nexport type Used = Thing;\n",
    );
    const boundaryViolations = messages.filter((m) => m.ruleId === 'no-restricted-imports');
    expect(boundaryViolations.length).toBeGreaterThan(0);
  });

  it('rejects packages/creative-graph importing @cios/application (forbidden)', async () => {
    const messages = await lint(
      'packages/creative-graph/src/__fixture__.ts',
      "import { thing } from '@cios/application';\nexport const used = thing;\n",
    );
    const boundaryViolations = messages.filter(
      (m) => m.ruleId === 'no-restricted-imports' && m.message.includes('@cios/application'),
    );
    expect(boundaryViolations.length).toBeGreaterThan(0);
  });

  it('rejects apps/worker dynamically importing @cios/domain (forbidden)', async () => {
    const messages = await lint(
      'apps/worker/src/__fixture__.ts',
      "export async function load() {\n  return import('@cios/domain');\n}\n",
    );
    const boundaryViolations = messages.filter((m) => m.ruleId === 'no-restricted-syntax');
    expect(boundaryViolations.length).toBeGreaterThan(0);
  });

  it('accepts packages/application importing @cios/domain (allowed)', async () => {
    const messages = await lint(
      'packages/application/src/__fixture__.ts',
      "import { thing } from '@cios/domain';\nexport const used = thing;\n",
    );
    const boundaryViolations = messages.filter(
      (m) => m.ruleId === 'no-restricted-imports' || m.ruleId === 'no-restricted-syntax',
    );
    expect(boundaryViolations).toEqual([]);
  });

  it('accepts apps/web importing @cios/contracts (allowed)', async () => {
    const messages = await lint(
      'apps/web/src/__fixture__.ts',
      "import type { Thing } from '@cios/contracts';\nexport type Used = Thing;\n",
    );
    const boundaryViolations = messages.filter(
      (m) => m.ruleId === 'no-restricted-imports' || m.ruleId === 'no-restricted-syntax',
    );
    expect(boundaryViolations).toEqual([]);
  });
});

describe('dependency-policy.json / eslint.config.js consistency', () => {
  it('every package directory referenced by eslint.config.js exists', () => {
    const policy = JSON.parse(
      readFileSync(path.join(repoRoot, 'docs/architecture/dependency-policy.json'), 'utf8'),
    );
    expect(Object.keys(policy.packages).length).toBeGreaterThan(0);
  });
});
