import { MODES, ModeSlug, normalizeHex, slugify, Summary, log, warn } from './util';
import { getWebflow } from './wf';

export type SyncOptions = {
  collectionName: string;
  prefix?: string;
  dryRun: boolean;
  subset?: 'all' | 'sys';
};

export type ModeMap = Record<ModeSlug, VariableMode>;

export async function getOrCreateCollection(name: string): Promise<VariableCollection> {
  const wf = getWebflow();
  if (!wf) throw new Error('Webflow Designer API not available. Open this in Webflow Designer.');

  // 1) Try official byName if available
  if (wf.getVariableCollectionByName) {
    const byName = await wf.getVariableCollectionByName(name);
    if (byName) return byName;
  }

  // 2) Try cached id from previous runs
  const cacheKey = `wf-collection-id:${name}`;
  const cachedId = localStorage.getItem(cacheKey);
  if (cachedId && wf.getVariableCollectionById) {
    const byId = await wf.getVariableCollectionById(cachedId);
    if (byId) return byId;
  }

  // 3) Scan all and compare names when possible
  try {
  const all = await wf.getAllVariableCollections();
    for (const col of all) {
      if (typeof col.getName === 'function') {
        try {
          const n = await col.getName!();
          if (n?.trim?.() === name) {
            localStorage.setItem(cacheKey, col.id);
            return col;
          }
        } catch {}
      }
    }
  } catch {}

  // 4) Create
  const created = await wf.createVariableCollection(name);
  try { localStorage.setItem(cacheKey, created.id); } catch {}
  return created;
}

export async function ensureModes(collection: VariableCollection, summary: Summary): Promise<ModeMap> {
  const modes = await collection.getAllVariableModes();
  const map: Partial<ModeMap> = {};
  for (const mode of modes) {
    const slug = slugify(mode.slug ?? mode.name);
    if (MODES.includes(slug as ModeSlug)) {
      map[slug as ModeSlug] = mode;
      summary.modes.existing++;
    }
  }
  // Create missing
  for (const m of MODES) {
    if (!map[m]) {
      const created = await collection.createVariableMode(m);
      map[m] = created;
      summary.modes.created++;
    }
  }
  return map as ModeMap;
}

async function getOrCreateColorVariable(collection: VariableCollection, name: string, initialValue: string, dryRun: boolean): Promise<{ variable: Variable | null; created: boolean }>{
  const existing = await collection.getVariableByName(name);
  if (existing) return { variable: existing, created: false };
  if (dryRun) return { variable: null, created: true };
  const created = await collection.createColorVariable(name, normalizeHex(initialValue));
  return { variable: created, created: true };
}

export async function syncColors(
  collection: VariableCollection,
  flattened: Record<ModeSlug, Record<string, string>>,
  options: SyncOptions,
  summary: Summary
) {
  const modeMap = await ensureModes(collection, summary);

  // Build union of variable names across all modes
  const varNames = new Set<string>();
  for (const m of MODES) {
    for (const key of Object.keys(flattened[m] ?? {})) {
      if (options.subset === 'sys' && !key.startsWith('on-') && !key.includes('surface') && !key.includes('primary') && !key.includes('secondary') && !key.includes('tertiary') && !key.includes('error') && !key.includes('outline') && !key.includes('inverse') && !key.includes('shadow') && !key.includes('scrim')) {
        continue;
      }
      varNames.add(key);
    }
  }

  for (const baseName of Array.from(varNames).sort()) {
    const name = `${options.prefix ?? ''}${baseName}`;
    const seedValue = Object.values(flattened).map(m => m[baseName]).find(Boolean) ?? '#000000';

    const { variable, created } = await getOrCreateColorVariable(collection, name, seedValue, options.dryRun);
    if (created) {
      if (options.dryRun) {
        log(summary, `+ create variable ${name}`);
        summary.variables.created++;
      } else {
        log(summary, `+ created variable ${name}`);
        summary.variables.created++;
      }
    }

    if (!variable && options.dryRun) {
      // Will be created in commit; still compute per-mode diffs
      for (const m of MODES) {
        const hex = flattened[m][baseName];
        if (!hex) {
          warn(summary, `Missing ${baseName} in mode ${m}; skipped`);
          summary.variables.skipped++;
          continue;
        }
        log(summary, `~ set ${name} [${m}] = ${normalizeHex(hex)} (pending create)`);
      }
      continue;
    }

    if (!variable) continue; // should not happen

    // Update per mode
    for (const m of MODES) {
      const hex = flattened[m][baseName];
      if (!hex) {
        warn(summary, `Missing ${baseName} in mode ${m}; skipped`);
        summary.variables.skipped++;
        continue;
      }
      const target = normalizeHex(hex);
      const current = await variable.get({ mode: modeMap[m] });
      const currentStr = typeof current === 'string' ? current : (current as any)?.value ?? String(current);
      if (currentStr?.toLowerCase?.() === target.toLowerCase()) {
        summary.variables.unchanged++;
        continue;
      }
      if (options.dryRun) {
        log(summary, `~ update ${name} [${m}]: ${currentStr ?? '(unset)'} -> ${target}`);
        summary.variables.updated++;
      } else {
        await variable.set(target, { mode: modeMap[m] });
        log(summary, `✓ set ${name} [${m}] = ${target}`);
        summary.variables.updated++;
      }
    }
  }
}
