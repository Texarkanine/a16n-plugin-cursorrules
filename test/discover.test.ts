import { describe, it, expect } from 'vitest';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { CustomizationType, CURRENT_IR_VERSION, createId } from '@a16njs/models';
import { discover } from '../src/discover.js';

const fixturesDir = resolve(import.meta.dirname, 'fixtures');

describe('discover', () => {
  // --- Existing behavior (root .cursorrules, no extension) ---

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

  // --- Root-level files have no relativeDir ---

  it('does not set relativeDir for root-level .cursorrules', async () => {
    const root = resolve(fixturesDir, 'with-cursorrules');
    const result = await discover(root);

    expect(result.items[0].relativeDir).toBeUndefined();
  });

  // --- Extension variants ---

  it('discovers .cursorrules.md variant', async () => {
    const root = resolve(fixturesDir, 'with-cursorrules-md');
    const result = await discover(root);

    expect(result.items).toHaveLength(1);
    expect(result.items[0].type).toBe(CustomizationType.GlobalPrompt);
    expect(result.items[0].content).toBe(
      readFileSync(resolve(root, '.cursorrules.md'), 'utf-8'),
    );
    expect(result.items[0].sourcePath).toBe(
      resolve(root, '.cursorrules.md'),
    );
    expect(result.items[0].relativeDir).toBeUndefined();
  });

  it('discovers .cursorrules.txt variant', async () => {
    const root = resolve(fixturesDir, 'with-cursorrules-txt');
    const result = await discover(root);

    expect(result.items).toHaveLength(1);
    expect(result.items[0].type).toBe(CustomizationType.GlobalPrompt);
    expect(result.items[0].content).toBe(
      readFileSync(resolve(root, '.cursorrules.txt'), 'utf-8'),
    );
    expect(result.items[0].sourcePath).toBe(
      resolve(root, '.cursorrules.txt'),
    );
    expect(result.items[0].relativeDir).toBeUndefined();
  });

  // --- Subdirectory discovery ---

  it('discovers .cursorrules files in subdirectories', async () => {
    const root = resolve(fixturesDir, 'nested-cursorrules');
    const result = await discover(root);

    expect(result.items).toHaveLength(2);
    expect(result.items.every((i) => i.type === CustomizationType.GlobalPrompt)).toBe(true);
  });

  it('sets relativeDir for subdirectory .cursorrules files', async () => {
    const root = resolve(fixturesDir, 'nested-cursorrules');
    const result = await discover(root);

    const rootItem = result.items.find(
      (i) => i.sourcePath === resolve(root, '.cursorrules'),
    );
    const nestedItem = result.items.find(
      (i) => i.sourcePath === resolve(root, 'packages/api/.cursorrules.md'),
    );

    expect(rootItem).toBeDefined();
    expect(rootItem!.relativeDir).toBeUndefined();

    expect(nestedItem).toBeDefined();
    expect(nestedItem!.relativeDir).toBe('packages/api');
  });

  // --- .cursorrules as directory (should not match) ---

  it('does not discover files inside a .cursorrules directory', async () => {
    const root = resolve(fixturesDir, 'cursorrules-is-dir');
    const result = await discover(root);

    expect(result.items).toHaveLength(0);
  });

  // --- Non-matching extensions ---

  it('ignores files with non-matching extensions', async () => {
    // The no-cursorrules fixture has no matching files
    const root = resolve(fixturesDir, 'no-cursorrules');
    const result = await discover(root);

    expect(result.items).toHaveLength(0);
  });
});
