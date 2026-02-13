import { resolve } from 'node:path';
import { readFile } from 'node:fs/promises';
import {
  type DiscoveryResult,
  type GlobalPrompt,
  CustomizationType,
  CURRENT_IR_VERSION,
  createId,
} from '@a16njs/models';

const CURSORRULES_FILENAME = '.cursorrules';

/**
 * Discover legacy .cursorrules file in the given project root.
 *
 * Looks for a `.cursorrules` file at the root of the project directory.
 * If found, parses it as a GlobalPrompt customization. The entire file
 * content becomes the prompt content.
 *
 * @param root - The root directory of the project to search
 * @returns A DiscoveryResult containing any found GlobalPrompt items
 */
export async function discover(root: string): Promise<DiscoveryResult> {
  const filePath = resolve(root, CURSORRULES_FILENAME);

  let content: string;
  try {
    content = await readFile(filePath, 'utf-8');
  } catch {
    return { items: [], warnings: [] };
  }

  const item: GlobalPrompt = {
    id: createId(CustomizationType.GlobalPrompt, filePath),
    type: CustomizationType.GlobalPrompt,
    version: CURRENT_IR_VERSION,
    sourcePath: filePath,
    content,
    metadata: {},
  };

  return { items: [item], warnings: [] };
}
