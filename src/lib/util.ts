import slugifyLib from 'slugify';

export const MODES = [
  'light',
  'light-medium-contrast',
  'light-high-contrast',
  'dark',
  'dark-medium-contrast',
  'dark-high-contrast',
] as const;
export type ModeSlug = typeof MODES[number];

export function kebabize(input: string): string {
  return input
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

export function slugify(input: string): string {
  return slugifyLib(input, { lower: true, strict: true });
}

export function normalizeHex(color: string): string {
  let c = color.trim();
  if (!c) return c;
  if (c.startsWith('var(')) return c; // leave references/custom alone
  if (c.startsWith('#')) c = c.slice(1);
  if (c.length === 3) {
    c = c.split('').map(ch => ch + ch).join('');
  }
  if (c.length === 4) {
    // RGBA #RGBA -> #RRGGBBAA
    c = c.split('').map(ch => ch + ch).join('');
  }
  c = c.toLowerCase();
  if (!/^[0-9a-f]{6}([0-9a-f]{2})?$/.test(c)) return color; // return original if not hex
  // If 8 chars, keep alpha; Webflow accepts RGBA hex as per docs
  return `#${c}`;
}

export type Summary = {
  modes: { created: number; existing: number };
  variables: { created: number; updated: number; unchanged: number; skipped: number };
  warnings: string[];
  logs: string[];
};

export function createSummary(): Summary {
  return {
    modes: { created: 0, existing: 0 },
    variables: { created: 0, updated: 0, unchanged: 0, skipped: 0 },
    warnings: [],
    logs: [],
  };
}

export function log(summary: Summary, message: string) {
  summary.logs.push(message);
}

export function warn(summary: Summary, message: string) {
  summary.warnings.push(message);
  summary.logs.push(`WARN: ${message}`);
}
