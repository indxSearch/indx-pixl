import { build } from 'esbuild';
import { packager } from '@electron/packager';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const editor = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const root = path.dirname(editor);
const staging = path.join(editor, 'desktop-dist');
await fs.mkdir(staging, { recursive: true });
await build({ entryPoints: [path.join(editor, 'desktop/main.ts')], outfile: path.join(staging, 'main.cjs'), bundle: true, platform: 'node', format: 'cjs', external: ['electron'] });
await fs.cp(path.join(editor, 'dist'), path.join(staging, 'web'), { recursive: true });
await fs.writeFile(path.join(staging, 'package.json'), JSON.stringify({ name: 'indx-pixl-desktop', productName: 'Indx Pixl', version: '1.0.0', main: 'main.cjs' }));
const [output] = await packager({ dir: staging, out: path.join(editor, 'desktop-build'), name: 'Indx Pixl', icon: path.join(editor, 'desktop/assets/icon.icns'), platform: 'darwin', arch: process.arch, overwrite: true, asar: true, appBundleId: 'co.indx.pixl', appCategoryType: 'public.app-category.graphics-design', electronVersion: JSON.parse(await fs.readFile(path.join(editor, 'node_modules/electron/package.json'), 'utf8')).version });
const destination = path.join(root, 'Indx Pixl.app');
await fs.rm(destination, { recursive: true, force: true });
await fs.rename(path.join(output, 'Indx Pixl.app'), destination);
console.log(`Built ${destination}`);
