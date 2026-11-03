// Builds the lab: icons.js from pixl.json, then src/ into lab.js and lab.css. React and the systm
// come from the lab's own node_modules (npm install here first); three.js stays on the CDN, in
// index.html's import map.
// Run: node lab/build.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
const here = path.dirname(fileURLToPath(import.meta.url));

await import('./build-icons.mjs');

// FunktionalGrotesk, the brand font: paid, never committed (this repo is public). Copied from the
// private indx-fonts package beside this repo into the git-ignored lab/fonts/; where it is missing
// the lab falls back to Geist, as a self-hosted install does.
const brandFonts = path.join(here, '..', '..', 'indx-fonts', 'dist', 'assets', 'fonts');
if (fs.existsSync(brandFonts)) {
  fs.mkdirSync(path.join(here, 'fonts'), { recursive: true });
  const files = fs.readdirSync(brandFonts).filter(f => /^FunktionalGrotesk-.*\.woff2$/.test(f));
  for (const f of files) fs.copyFileSync(path.join(brandFonts, f), path.join(here, 'fonts', f));
  console.log(files.length, 'FunktionalGrotesk files');
} else console.log('No indx-fonts beside this repo: the lab uses Geist');
await build({
  entryPoints: [path.join(here, 'src', 'main.jsx')],
  outfile: path.join(here, 'lab.js'),
  bundle: true, format: 'esm', target: 'es2022', minify: true, jsx: 'automatic',
  external: ['three', 'three/addons/*'],
  define: { 'process.env.NODE_ENV': '"production"' },
  logLevel: 'warning',
});
for (const f of ['lab.js', 'lab.css']) console.log(f, Math.round(fs.statSync(path.join(here, f)).size / 1024), 'KB');
