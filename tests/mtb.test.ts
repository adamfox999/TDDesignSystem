import { describe, it, expect } from 'vitest';
import { parseMTB } from '../src/lib/mtb';

describe('parseMTB', () => {
  it('parses roles under schemes', () => {
    const data = {
      schemes: {
        light: { roles: { primary: '#123456', 'on-primary': '#fff' } },
        dark: { roles: { primary: '#abcdef' } },
      },
    };
    const flat = parseMTB(data);
    expect(flat.light.primary).toBe('#123456');
    expect(flat.light['on-primary']).toBe('#ffffff');
    expect(flat.dark.primary).toBe('#abcdef');
  });

  it('normalizes hex', () => {
    const data = { schemes: { light: { roles: { primary: '#abc' } } } };
    const flat = parseMTB(data);
    expect(flat.light.primary).toBe('#aabbcc');
  });

  it('throws on invalid', () => {
    expect(() => parseMTB('bad' as any)).toThrow();
  });
});
