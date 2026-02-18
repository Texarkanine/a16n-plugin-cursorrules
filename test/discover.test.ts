import { describe, it, expect, afterAll } from 'vitest';
import { resolve } from 'node:path';
import { readFileSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { CustomizationType, CURRENT_IR_VERSION, createId, LocalWorkspace } from '@a16njs/models';
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
    const root = resolve(fixturesDir, 'with-non-matching-ext');
    const result = await discover(root);

    expect(result.items).toHaveLength(0);
  });

  // --- Skipped directories ---

  describe('directory skipping', () => {
    const tmpRoot = mkdtempSync(resolve(tmpdir(), 'discover-skip-'));

    // Create a root .cursorrules
    writeFileSync(resolve(tmpRoot, '.cursorrules'), 'root content');
    // Create .cursorrules inside node_modules (should be skipped)
    mkdirSync(resolve(tmpRoot, 'node_modules', 'some-pkg'), { recursive: true });
    writeFileSync(resolve(tmpRoot, 'node_modules', 'some-pkg', '.cursorrules'), 'skip me');
    // Create .cursorrules inside .git (should be skipped)
    mkdirSync(resolve(tmpRoot, '.git', 'objects'), { recursive: true });
    writeFileSync(resolve(tmpRoot, '.git', 'objects', '.cursorrules'), 'skip me too');

    afterAll(() => {
      rmSync(tmpRoot, { recursive: true, force: true });
    });

    it('skips node_modules, .git, and other non-project directories', async () => {
      const result = await discover(tmpRoot);

      // Should only find the root .cursorrules, not the ones in node_modules or .git
      expect(result.items).toHaveLength(1);
      expect(result.items[0].sourcePath).toBe(resolve(tmpRoot, '.cursorrules'));
    });
  });

  // --- Workspace parameter support ---

  it('accepts a Workspace instance', async () => {
    const root = resolve(fixturesDir, 'with-cursorrules');
    const workspace = new LocalWorkspace('test', root);
    const result = await discover(workspace);

    expect(result.items).toHaveLength(1);
    expect(result.items[0].type).toBe(CustomizationType.GlobalPrompt);
  });

  it('works with Workspace for nested discovery', async () => {
    const root = resolve(fixturesDir, 'nested-cursorrules');
    const workspace = new LocalWorkspace('test-nested', root);
    const result = await discover(workspace);

    expect(result.items).toHaveLength(2);
    expect(result.items.every((i) => i.type === CustomizationType.GlobalPrompt)).toBe(true);
  });
});
