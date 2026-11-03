// Builds the plugin into dist/: the icons from ../pixl.json baked into code.js, the panel inlined into ui.html.
// Run: npm run build (pixl.json is the editor's local file, so this builds on a machine that has it.)
import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const at = (...p) => path.join(here, ...p);
const pixlJson = at('..', 'pixl.json');
if (!fs.existsSync(pixlJson)) throw new Error(`No ${pixlJson}: the plugin is built from the editor's working file.`);

// 1. pixl.json -> data, through the editor's own model.
await build({ entryPoints: [at('src/data.ts')], outfile: at('build/data.mjs'), bundle: true, platform: 'node', format: 'esm', logLevel: 'warning' });
const { makeData } = await import(pathToFileURL(at('build/data.mjs')).href + `?t=${Date.now()}`);
const data = makeData(JSON.parse(fs.readFileSync(pixlJson, 'utf8')));

// 2. Check against what Export all last wrote: an icon whose paths differ from raw-icons/ means pixl.json
//    has changes that are not exported yet. Worth knowing, not an error.
const drift = [];
for (const icon of data.icons.filter((i) => i.kind === 'icons')) {
  const file = at('..', 'raw-icons', `${icon.name}.svg`);
  if (!fs.existsSync(file)) { drift.push(`${icon.name} (not in raw-icons)`); continue; }
  const ds = [...fs.readFileSync(file, 'utf8').matchAll(/ d="([^"]+)"/g)].map((m) => m[1]);
  if (ds.join('|') !== icon.layers.map((l) => l.d).join('|')) drift.push(icon.name);
}

// 3. The plugin.
fs.mkdirSync(at('dist'), { recursive: true });
await build({ entryPoints: [at('src/code.ts')], outfile: at('dist/code.js'), bundle: true, target: 'es2017', define: { PIXL_DATA: JSON.stringify(data) }, logLevel: 'warning' });
const ui = await build({ entryPoints: [at('src/ui.ts')], bundle: true, target: 'es2017', write: false, logLevel: 'warning' });
const html = fs.readFileSync(at('src/ui.html'), 'utf8').replace('<!-- ui.js -->', () => `<script>${ui.outputFiles[0].text}</script>`);
fs.writeFileSync(at('dist/ui.html'), html);

const count = (kind) => data.icons.filter((i) => i.kind === kind).length;
const variants = data.icons.reduce((n, i) => n + i.variants.length, 0);
console.log(`${count('icons')} icons, ${count('pictograms')} pictograms, ${variants} variants, ${Object.keys(data.paints).length} colour variables`);
if (drift.length) console.log(`Not yet exported to raw-icons (${drift.length}): ${drift.slice(0, 12).join(', ')}${drift.length > 12 ? ', …' : ''}`);
