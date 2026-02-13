import { describe, it, expect } from 'vitest';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { CustomizationType, CURRENT_IR_VERSION, createId } from '@a16njs/models';
import { discover } from '../src/discover.js';

const fixturesDir = resolve(import.meta.dirname, 'fixtures');

describe('discover', () => {
  it('discovers .cursorrules and returns GlobalPrompt', async () => {
    const root = resolve(fixturesDir, 'with-cursorrules');
    const result = await discover(root);

    expect(result.items).toHaveLength(1);
    expect(result.items[0].type).toBe(CustomizationType.GlobalPrompt);
  });

  it('returns empty results when no .cursorrules exists', async () => {
    const root = resolve(fixturesDir, 'no-cursorrules');
    const result = await discover(root);

    expect(result.items).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  it('handles empty .cursorrules file', async () => {
    const root = resolve(fixturesDir, 'empty-cursorrules');
    const result = await discover(root);

    expect(result.items).toHaveLength(1);
    expect(result.items[0].content).toBe('');
  });

  it('reads correct file content', async () => {
    const root = resolve(fixturesDir, 'with-cursorrules');
    const expectedContent = readFileSync(
      resolve(root, '.cursorrules'),
      'utf-8',
    );

    const result = await discover(root);

    expect(result.items[0].content).toBe(expectedContent);
  });

  it('sets correct metadata (id, type, version, sourcePath)', async () => {
    const root = resolve(fixturesDir, 'with-cursorrules');
    const result = await discover(root);
    const item = result.items[0];
    const expectedSourcePath = resolve(root, '.cursorrules');

    expect(item.id).toBe(
      createId(CustomizationType.GlobalPrompt, expectedSourcePath),
    );
    expect(item.type).toBe(CustomizationType.GlobalPrompt);
    expect(item.version).toBe(CURRENT_IR_VERSION);
    expect(item.sourcePath).toBe(expectedSourcePath);
  });
});
