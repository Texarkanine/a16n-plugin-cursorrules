import { describe, it, expect } from 'vitest';
import { CustomizationType, type AgentCustomization, CURRENT_IR_VERSION } from '@a16njs/models';
import plugin from '../src/index.js';

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
});
