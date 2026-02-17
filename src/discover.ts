import { resolve, relative, dirname, sep, posix } from 'node:path';
import { readFile, readdir } from 'node:fs/promises';
import {
  type DiscoveryResult,
  type GlobalPrompt,
  type Workspace,
  CustomizationType,
  CURRENT_IR_VERSION,
  createId,
  resolveRoot,
} from '@a16njs/models';

/**
 * Pattern matching legacy .cursorrules filenames.
 * Matches: .cursorrules, .cursorrules.md, .cursorrules.txt
 */
const CURSORRULES_PATTERN = /^\.cursorrules(\.(md|txt))?$/;

/**
 * Directories to skip during recursive traversal.
 * These are well-known non-project directories that can contain
 * huge numbers of files and would never contain user-authored .cursorrules.
 */
const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  '.hg',
  '.svn',
  'dist',
  'build',
  '.next',
  '.turbo',
]);

/**
 * Recursively discover legacy .cursorrules files in the given project root.
 *
 * Searches the entire directory tree for files whose basename matches
 * `.cursorrules`, `.cursorrules.md`, or `.cursorrules.txt`. Each match
 * becomes a GlobalPrompt customization with `relativeDir` preserving
 * the file's directory location relative to the project root.
 *
 * @param rootOrWorkspace - The root directory path or Workspace to search
 * @returns A DiscoveryResult containing any found GlobalPrompt items
 */
export async function discover(rootOrWorkspace: string | Workspace): Promise<DiscoveryResult> {
  const root = resolveRoot(rootOrWorkspace);
  const items: GlobalPrompt[] = [];

  await traverse(root, root);

  return { items, warnings: [] };

  async function traverse(currentDir: string, projectRoot: string): Promise<void> {
    let entries;
    try {
      entries = await readdir(currentDir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const entryPath = resolve(currentDir, entry.name);

      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) {
          continue;
        }
        await traverse(entryPath, projectRoot);
        continue;
      }

      if (!entry.isFile() || !CURSORRULES_PATTERN.test(entry.name)) {
        continue;
      }

      let content: string;
      try {
        content = await readFile(entryPath, 'utf-8');
      } catch {
        continue;
      }

      const relDir = relative(projectRoot, dirname(entryPath));
      const relativeDir = relDir === ''
        ? undefined
        : relDir.split(sep).join(posix.sep);

      items.push({
        id: createId(CustomizationType.GlobalPrompt, entryPath),
        type: CustomizationType.GlobalPrompt,
        version: CURRENT_IR_VERSION,
        sourcePath: entryPath,
        relativeDir,
        content,
        metadata: {},
      });
    }
  }
}
