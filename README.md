# Material Colors → Webflow Variables (Designer Extension)

Sync Material Theme Builder color tokens into Webflow Variables in a dedicated collection with six modes.

## Features

- Creates or reuses a Variable Collection named `Colors` (configurable)
- Ensures six Variable Modes exist:
  - light, light-medium-contrast, light-high-contrast
  - dark, dark-medium-contrast, dark-high-contrast
- Upserts color Variables for each token (kebab-case without scheme in name)
- Sets per-mode values from the corresponding scheme
- Idempotent: re-run updates values, no duplicates
- Dry-run vs Commit, plus concise summary log
- Simple UI: paste `theme.full.mtb.json` or load a file, optional prefix & subset filter

## Getting started

1. Install deps

```powershell
npm install
```

2. Local dev (two options)

Option A — Vite only (what we used so far)
```powershell
npm run dev
```

Option B — Webflow CLI (serves the built dist in a Designer-aware server)
```powershell
npm install -g @webflow/webflow-cli
npm run dev:cli
```

3. In Webflow Designer, load this extension

- Open Webflow Designer > Apps & Integrations > Extensions (beta)
- Development (Vite): use the manifest `webflow-extension/manifest.json` which points to `http://localhost:5173/index.html`.
- Development (CLI): after `npm run dev:cli`, the CLI prints a local URL to use in the Extensions loader.
- Production: use `webflow-extension/manifest.prod.json` which points to your hosted URI: `https://689c825d4083007cf88d9d1d.webflow-ext.com`.

4. Paste your full Material Theme Builder JSON (theme.full.mtb.json)

- Optionally choose a prefix (e.g. `md-`) and subset filter (e.g. only sys colors)
- Click Dry run to preview changes, or Commit to apply

## Mapping rules

- Collection: default `Colors` (configurable)
- Variable names: kebab-case token names, e.g. `primary`, `on-primary`, `surface-variant`
- Type: Color
- Modes: one per scheme name listed above, values as normalized hex (#RRGGBB or #RRGGBBAA)
- Missing token in a scheme → skipped with warning

## Implementation notes

- Designer API used: collections, variables, variable modes
- Mode slugs are normalized via `slugify` and matched against the six fixed slugs
- Hex normalization supports 3/6/8-digit forms; custom values or var() references are left as-is
- Collection reuse: tries by name, cached id, scans all collections (if names can be read)

## Tests

Run parser unit tests:

```powershell
npm run test
```

## Troubleshooting

- If the header shows "Not connected to Webflow Designer", you can still dry-run. Commit requires opening inside Webflow Designer.
- Ensure your JSON is the full export including all schemes. If schemes aren’t found, the parser will error.
- Some Designer API methods vary; the extension includes fallbacks and caching to find the collection.

## Security

- No secrets stored. OAuth handled by Webflow Designer Extensions runtime.
- Your provided Client ID is only for registration with Webflow; the extension itself doesn’t require you to paste secrets in this repo.

## License

MIT
