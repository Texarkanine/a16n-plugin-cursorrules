import { describe, it, expect } from 'vitest';
import { resolve } from 'node:path';
import { CustomizationType, type AgentCustomization, CURRENT_IR_VERSION, LocalWorkspace } from '@a16njs/models';
import plugin from '../src/index.js';

const fixturesDir = resolve(import.meta.dirname, 'fixtures');

describe('plugin', () => {
  it('has correct id, name, supports', () => {
    expect(plugin.id).toBe('cursorrules');
    expect(plugin.name).toBe('Legacy .cursorrules');
    expect(plugin.supports).toEqual([CustomizationType.GlobalPrompt]);
  });

  it('exports as default export', () => {
    expect(plugin).toBeDefined();
    expect(typeof plugin.discover).toBe('function');
    expect(typeof plugin.emit).toBe('function');
  });

  it('emit returns all items as unsupported', async () => {
    const items: AgentCustomization[] = [
      {
        id: 'test-1',
        type: CustomizationType.GlobalPrompt,
        version: CURRENT_IR_VERSION,
        content: 'test prompt',
        metadata: {},
      },
      {
        id: 'test-2',
        type: CustomizationType.GlobalPrompt,
        version: CURRENT_IR_VERSION,
        content: 'another prompt',
        metadata: {},
      },
    ];

    const result = await plugin.emit(items, '/tmp');

    expect(result.unsupported).toEqual(items);
    expect(result.unsupported).toHaveLength(2);
  });

  it('emit returns empty written array', async () => {
    const items: AgentCustomization[] = [
      {
        id: 'test-1',
        type: CustomizationType.GlobalPrompt,
        version: CURRENT_IR_VERSION,
        content: 'test prompt',
        metadata: {},
      },
    ];

    const result = await plugin.emit(items, '/tmp');

    expect(result.written).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  // --- Workspace parameter support ---

  it('discover accepts Workspace parameter', async () => {
    const root = resolve(fixturesDir, 'with-cursorrules');
    const workspace = new LocalWorkspace('test', root);
    const result = await plugin.discover(workspace);

    expect(result.items).toHaveLength(1);
    expect(result.items[0].type).toBe(CustomizationType.GlobalPrompt);
  });

  it('emit accepts Workspace parameter', async () => {
    const items: AgentCustomization[] = [
      {
        id: 'test-1',
        type: CustomizationType.GlobalPrompt,
        version: CURRENT_IR_VERSION,
        content: 'test prompt',
        metadata: {},
      },
    ];
    const workspace = new LocalWorkspace('test', '/tmp');
    const result = await plugin.emit(items, workspace);

    expect(result.unsupported).toEqual(items);
    expect(result.written).toEqual([]);
  });
});
