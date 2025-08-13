import { kebabize, MODES, ModeSlug, normalizeHex } from './util';

export type SchemeMap = Record<string, string>; // token -> hex string
export type MTBData = {
  // Flexible; we only read colors per scheme
  schemes?: Record<string, any>;
  palettes?: Record<string, any>;
  // Some exports include top-level color roles per scheme under e.g. 'schemes.light.roles'
};

export type Flattened = Record<ModeSlug, SchemeMap>;

export function parseMTB(json: unknown): Flattened {
  if (!json || typeof json !== 'object') throw new Error('Invalid JSON');
  const data = json as MTBData;
  const out: Partial<Flattened> = {};

  // Strategy:
  // 1) Prefer data.schemes[mode] where roles/colors live
  // 2) Fallback: look for keys under data that match modes
  for (const mode of MODES) {
    const scheme = (data as any).schemes?.[mode] ?? (data as any)[mode];
    if (!scheme) continue;

    // Try roles map
    const roles = (scheme.roles ?? scheme.colors ?? scheme) as Record<string, any>;
    const flat: SchemeMap = {};

    for (const [key, value] of Object.entries(roles)) {
      if (!value) continue;
      // Value might be string hex, or object with 'color' or 'value'
      let hex: string | undefined;
      if (typeof value === 'string') hex = value;
      else if (typeof value === 'object') {
        hex = (value as any).hex ?? (value as any).value ?? (value as any).color;
      }
      if (!hex) continue;
      flat[kebabize(key)] = normalizeHex(String(hex));
    }

    out[mode] = flat;
  }

  // If still empty, attempt to scan for any object properties with hex strings and infer
  if (Object.keys(out).length === 0) {
    for (const mode of MODES) {
      const node = (data as any)[mode];
      if (!node || typeof node !== 'object') continue;
      const flat: SchemeMap = {};
      for (const [k, v] of Object.entries(node)) {
        if (typeof v === 'string' && /^#?[0-9a-fA-F]{3,8}$/.test(v)) {
          flat[kebabize(k)] = normalizeHex(v);
        }
      }
      if (Object.keys(flat).length) out[mode] = flat;
    }
  }

  // Final check
  const missing = MODES.filter(m => !out[m]);
  if (missing.length === MODES.length) {
    throw new Error('Could not locate any schemes in JSON. Expected a Material Theme Builder export with schemes.');
  }

  // Fill missing modes with empty maps
  for (const m of MODES) out[m] = out[m] ?? {} as SchemeMap;

  return out as Flattened;
}
