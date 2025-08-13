import { parseMTB } from './lib/mtb';
import { createSummary, Summary } from './lib/util';
import { syncColors, getOrCreateCollection } from './lib/webflow-sync';

function setEnvNote() {
  const el = document.getElementById('env-note');
  if (!el) return;
  if ((window as any).webflow) {
    el.textContent = 'Designer API connected';
  } else {
    el.textContent = 'Not connected to Webflow Designer — dry-run only';
  }
}

function readJSONInput(): unknown {
  const ta = document.getElementById('jsonInput') as HTMLTextAreaElement | null;
  if (!ta) throw new Error('Missing JSON input area');
  const text = ta.value.trim();
  if (!text) throw new Error('Please paste the theme.full.mtb.json');
  try { return JSON.parse(text); } catch (e) { throw new Error('Invalid JSON'); }
}

function attachFileLoader() {
  const input = document.getElementById('fileInput') as HTMLInputElement | null;
  const ta = document.getElementById('jsonInput') as HTMLTextAreaElement | null;
  if (!input || !ta) return;
  input.addEventListener('change', async () => {
    const file = input.files?.[0];
    if (!file) return;
    const text = await file.text();
    ta.value = text;
  });
}

function attachSampleLoader() {
  const btn = document.getElementById('loadSample');
  const ta = document.getElementById('jsonInput') as HTMLTextAreaElement | null;
  if (!btn || !ta) return;
  btn.addEventListener('click', () => {
    ta.value = JSON.stringify(sampleMTB, null, 2);
  });
}

function writeSummary(summary: Summary) {
  const area = document.getElementById('summary');
  if (!area) return;
  const header = `Modes: +${summary.modes.created} existing:${summary.modes.existing}\n` +
    `Variables: +${summary.variables.created} ~${summary.variables.updated} =${summary.variables.unchanged} skipped:${summary.variables.skipped}`;
  const warnings = summary.warnings.length ? `\n\nWarnings:\n- ${summary.warnings.join('\n- ')}` : '';
  area.textContent = header + '\n\nLog:\n' + summary.logs.join('\n') + warnings;
}

async function run(dryRun: boolean) {
  const summary = createSummary();
  writeSummary(summary);

  const collectionName = (document.getElementById('collectionName') as HTMLInputElement).value || 'Colors';
  const prefix = (document.getElementById('prefix') as HTMLInputElement).value || '';
  const subset = (document.getElementById('subset') as HTMLSelectElement).value as 'all' | 'sys';

  let flattened;
  try {
    const json = readJSONInput();
    flattened = parseMTB(json);
  } catch (e: any) {
    summary.logs.push(`Error: ${e.message ?? String(e)}`);
    writeSummary(summary);
    return;
  }

  if (!(window as any).webflow) {
    summary.logs.push('Designer API unavailable. Showing dry-run diff only.');
    // Simulate diff by printing names
    const names = new Set<string>();
    for (const scheme of Object.values(flattened)) for (const k of Object.keys(scheme)) names.add(k);
    summary.logs.push(`Would process ${names.size} variables across ${Object.keys(flattened).length} modes.`);
    writeSummary(summary);
    return;
  }

  try {
    const collection = await getOrCreateCollection(collectionName);
    await syncColors(collection, flattened as any, { collectionName, prefix, dryRun, subset }, summary);
  } catch (e: any) {
    summary.logs.push(`Error: ${e.message ?? String(e)}`);
  }
  writeSummary(summary);
}

function attachActions() {
  const dry = document.getElementById('btnDryRun');
  const commit = document.getElementById('btnCommit');
  dry?.addEventListener('click', () => run(true));
  commit?.addEventListener('click', () => run(false));
}

setEnvNote();
attachFileLoader();
attachSampleLoader();
attachActions();

// Minimal sample MTB-like data for testing
const sampleMTB = {
  schemes: {
    'light': { roles: { primary: '#6750A4', 'on-primary': '#ffffff', 'surface': '#FFFBFE' } },
    'dark': { roles: { primary: '#D0BCFF', 'on-primary': '#381E72', 'surface': '#1C1B1F' } },
    'light-medium-contrast': { roles: { primary: '#5A4696' } },
    'light-high-contrast': { roles: { primary: '#21005D' } },
    'dark-medium-contrast': { roles: { primary: '#EADDFF' } },
    'dark-high-contrast': { roles: { primary: '#F6EDFF' } }
  }
};
