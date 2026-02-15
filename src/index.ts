import {
  type A16nPlugin,
  type EmitResult,
  type EmitOptions,
  type AgentCustomization,
  CustomizationType,
} from '@a16njs/models';
import { discover } from './discover.js';

/**
 * a16n plugin for the legacy .cursorrules format.
 *
 * Discovers .cursorrules files (single plain-text file at project root)
 * and presents them as GlobalPrompt customizations. Does not support
 * emission — .cursorrules is a legacy read-only format.
 */
const plugin: A16nPlugin = {
  id: 'cursorrules',
  name: 'Legacy .cursorrules',
  supports: [CustomizationType.GlobalPrompt],

  discover(root: string) {
    return discover(root);
  },

  async emit(
    models: AgentCustomization[],
    _root: string,
    _options?: EmitOptions,
  ): Promise<EmitResult> {
    return { written: [], warnings: [], unsupported: models };
  },
};

export default plugin;
