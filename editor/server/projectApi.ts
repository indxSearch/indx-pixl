import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';

export const versionOf = (text: string | null) => text == null ? null : createHash('sha1').update(text).digest('hex').slice(0, 16);
export const readDoc = (root: string) => {
  const file = path.join(root, 'pixl.json');
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
};
export type RunScript = (script: string) => Promise<string>;
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

/** Shared by Vite and the desktop app, including document conflict protection. */
export function projectApi(root: string, run: RunScript, changed: (version: string | null) => void = () => {}) {
  return async (request: Request): Promise<Response> => {
    const url = new URL(request.url).pathname;
    try {
      if (url === '/api/doc' && request.method === 'GET') {
        const text = readDoc(root);
        return text == null ? json(404, { error: 'no document' }) : json(200, { doc: JSON.parse(text), version: versionOf(text) });
      }
      if (url === '/api/doc' && request.method === 'PUT') {
        const { doc, baseVersion, force } = await request.json();
        const current = versionOf(readDoc(root));
        if (!force && current !== baseVersion) return json(409, { error: 'pixl.json changed on disk', version: current });
        const text = JSON.stringify(doc, null, 2) + '\n';
        fs.writeFileSync(path.join(root, 'pixl.json'), text);
        const version = versionOf(text);
        changed(version);
        return json(200, { ok: true, version });
      }
      const raw = path.join(root, 'raw-icons');
      if (url === '/api/raw-icons' && request.method === 'GET') {
        const files = fs.existsSync(raw) ? fs.readdirSync(raw).filter(f => f.endsWith('.svg')).sort() : [];
        return json(200, files.map(f => ({ name: f.replace(/\.svg$/, ''), svg: fs.readFileSync(path.join(raw, f), 'utf8') })));
      }
      if (url === '/api/export' && request.method === 'POST') {
        const { files, convert, build, colorsCss, variants } = await request.json() as { files: { name: string; svg: string; kind?: string }[]; convert?: boolean; build?: boolean; colorsCss?: string; variants?: Record<string, Record<string, string[]>> };
        if (!Array.isArray(files) || files.some(f => typeof f.name !== 'string' || !/^[\p{L}\p{N}][\p{L}\p{N} \-_]*$/u.test(f.name) || typeof f.svg !== 'string' || (f.kind !== undefined && f.kind !== 'icons' && f.kind !== 'pictograms'))) return json(400, { error: 'Invalid icon name, kind or SVG' });
        if (typeof colorsCss === 'string') fs.writeFileSync(path.join(root, 'colors.css'), colorsCss);
        // Icons go to raw-icons/ (the package root), pictograms to raw-pictograms/ (@indxsearch/pixl/pictograms).
        const folderOf = (kind?: string) => (kind === 'pictograms' ? path.join(root, 'raw-pictograms') : raw);
        for (const f of files) { fs.mkdirSync(folderOf(f.kind), { recursive: true }); fs.writeFileSync(path.join(folderOf(f.kind), f.name + '.svg'), f.svg); }
        // Which components have colour variants, for convert-icons.js to give them a `variant` prop.
        if (variants && typeof variants === 'object') for (const kind of ['icons', 'pictograms'] as const) {
          const v = variants[kind] ?? {};
          if (!Object.keys(v).length && !fs.existsSync(path.join(folderOf(kind), 'variants.json'))) continue;
          fs.mkdirSync(folderOf(kind), { recursive: true });
          fs.writeFileSync(path.join(folderOf(kind), 'variants.json'), JSON.stringify(v, null, 2) + '\n');
        }
        const convertOutput = convert ? await run('convert') : '';
        const buildOutput = build ? await run('build') : '';
        return json(200, { ok: true, written: files.map(f => f.name), convertOutput, buildOutput });
      }
      if (url.startsWith('/api/spinners')) return await spinnersApi(root, url, request);
      return json(404, { error: 'not found' });
    } catch (error) {
      return json(500, { error: (error as Error).message });
    }
  };
}

export const devRun = (root: string): RunScript => task => new Promise((resolve, reject) => {
  execFile(task === 'convert' ? 'node' : 'npm', task === 'convert' ? ['convert-icons.js'] : ['run', 'build'], { cwd: root, maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
    const output = stdout + stderr;
    if (error) reject(new Error(output || error.message)); else resolve(output);
  });
});

// ---- spinners ----
// Spinner mode edits indx-systm's spinners/ folder in place: that folder is the source of the Spinner component,
// so nothing about a spinner is kept in pixl.json. Where the folder is differs per machine, so it is a local
// setting (editor.local.json beside pixl.json, untracked).

export const SPINNER_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const settingsFile = (root: string) => path.join(root, 'editor.local.json');
export function readSettings(root: string): { spinnersDir?: string } {
  try { return JSON.parse(fs.readFileSync(settingsFile(root), 'utf8')); } catch { return {}; }
}
/** The folder holds indx-systm's spinners when the generator that compiles them sits beside it. */
const generatorOf = (dir: string) => path.join(dir, '..', 'scripts', 'generate-spinners.mjs');
export const spinnersDirOf = (root: string) => readSettings(root).spinnersDir ?? null;

export type SpinnerLayout = 'keyframes' | 'flat';
export interface SpinnerOnDisk { name: string; layout: SpinnerLayout; config: Record<string, unknown> | null; frames: { file: string; svg: string }[] }
/** One spinner as the editor writes it. `config` undefined leaves config.json as it is, null removes it. */
export interface SpinnerWrite { name: string; from: string | null; layout: SpinnerLayout; frames: string[]; config?: Record<string, unknown> | null }

const framesDir = (dir: string, name: string, layout: SpinnerLayout) => layout === 'flat' ? path.join(dir, name) : path.join(dir, name, 'keyframes');
const svgsIn = (folder: string) => fs.existsSync(folder)
  ? fs.readdirSync(folder).filter((f) => f.endsWith('.svg')).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  : [];

/** Every spinner, read the way generate-spinners.mjs reads it: a keyframes/ subfolder when there is one, frames in natural order. */
export function readSpinners(dir: string): SpinnerOnDisk[] {
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
    .map((e) => e.name).sort()
    .map((name) => {
      const layout: SpinnerLayout = fs.existsSync(path.join(dir, name, 'keyframes')) ? 'keyframes' : 'flat';
      const folder = framesDir(dir, name, layout);
      const configPath = path.join(dir, name, 'config.json');
      let config: Record<string, unknown> | null = null;
      if (fs.existsSync(configPath)) {
        try { config = JSON.parse(fs.readFileSync(configPath, 'utf8')); } catch { throw new Error(`${name}/config.json is not valid JSON`); }
      }
      return { name, layout, config, frames: svgsIn(folder).map((file) => ({ file, svg: fs.readFileSync(path.join(folder, file), 'utf8') })) };
    });
}
export const spinnersVersion = (dir: string) => versionOf(JSON.stringify(readSpinners(dir)));

/** config.json in the style of the hand-written ones: `{ "delay": 250, "pingpong": true }`. */
const configText = (config: Record<string, unknown>) =>
  '{ ' + Object.entries(config).map(([k, v]) => `${JSON.stringify(k)}: ${JSON.stringify(v)}`).join(', ') + ' }\n';

function removeSpinner(dir: string, name: string) {
  // only what the editor manages goes: the frames and config.json. Anything else keeps the folder.
  for (const layout of ['keyframes', 'flat'] as const) {
    const folder = framesDir(dir, name, layout);
    for (const f of svgsIn(folder)) fs.rmSync(path.join(folder, f));
  }
  fs.rmSync(path.join(dir, name, 'config.json'), { force: true });
  for (const folder of [path.join(dir, name, 'keyframes'), path.join(dir, name)])
    if (fs.existsSync(folder) && !fs.readdirSync(folder).length) fs.rmdirSync(folder);
}

function writeSpinner(dir: string, s: SpinnerWrite) {
  const folder = framesDir(dir, s.name, s.layout);
  fs.mkdirSync(folder, { recursive: true });
  const names = new Set(s.frames.map((_, i) => `${i + 1}.svg`));
  for (const f of svgsIn(folder)) if (!names.has(f)) fs.rmSync(path.join(folder, f));
  s.frames.forEach((svg, i) => {
    const file = path.join(folder, `${i + 1}.svg`);
    if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== svg) fs.writeFileSync(file, svg);
  });
  const configPath = path.join(dir, s.name, 'config.json');
  if (s.config === null) fs.rmSync(configPath, { force: true });
  else if (s.config) fs.writeFileSync(configPath, configText(s.config));
}

/** Every problem with a save, found before anything is written: a save lands whole or not at all. */
function spinnerWriteProblems(dir: string, write: SpinnerWrite[], remove: string[]): string[] {
  const problems: string[] = [];
  const removing = new Set(remove), names = write.map((s) => s.name);
  for (const name of remove) if (!SPINNER_NAME.test(name)) problems.push(`Cannot remove "${name}"`);
  for (const s of write) {
    if (typeof s.name !== 'string' || !SPINNER_NAME.test(s.name)) { problems.push(`"${s.name}" is not a spinner name: lowercase letters, digits and single dashes`); continue; }
    if (names.indexOf(s.name) !== names.lastIndexOf(s.name)) problems.push(`Two spinners are called "${s.name}"`);
    if (s.layout !== 'keyframes' && s.layout !== 'flat') problems.push(`${s.name}: unknown layout`);
    if (!Array.isArray(s.frames) || !s.frames.length || s.frames.some((f) => typeof f !== 'string' || !f.trimStart().startsWith('<svg'))) problems.push(`${s.name}: frames must be SVG`);
    if (s.config !== undefined && s.config !== null && (typeof s.config !== 'object' || Array.isArray(s.config))) problems.push(`${s.name}: config must be an object`);
    if (s.from !== null && (typeof s.from !== 'string' || !SPINNER_NAME.test(s.from) || !fs.existsSync(path.join(dir, s.from)))) problems.push(`${s.name}: the spinner it was loaded from is gone`);
    // a name another rename vacates still counts as taken: renames run in no particular order, so chains and swaps go one at a time
    if (s.from !== s.name && fs.existsSync(path.join(dir, s.name)) && !removing.has(s.name)) problems.push(`A spinner called "${s.name}" already exists`);
  }
  return [...new Set(problems)];
}

async function spinnersApi(root: string, url: string, request: Request): Promise<Response> {
  if (url === '/api/spinners/folder' && request.method === 'PUT') {
    const { dir } = await request.json() as { dir?: string };
    if (typeof dir !== 'string' || !dir.trim()) return json(400, { error: 'Give the path of the spinners folder' });
    const home = process.env.HOME ?? '';
    const resolved = path.resolve(dir.trim().replace(/^~(?=$|\/)/, home));
    if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) return json(400, { error: `No folder at ${resolved}` });
    if (!fs.existsSync(generatorOf(resolved))) return json(400, { error: `${resolved} is not indx-systm's spinners folder: scripts/generate-spinners.mjs should sit beside it` });
    fs.writeFileSync(settingsFile(root), JSON.stringify({ ...readSettings(root), spinnersDir: resolved }, null, 2) + '\n');
    return json(200, { dir: resolved });
  }
  const dir = spinnersDirOf(root);
  if (!dir) return json(404, { error: 'no folder' });
  if (!fs.existsSync(dir)) return json(404, { error: `The spinners folder is gone: ${dir}`, dir });
  if (url === '/api/spinners' && request.method === 'GET') {
    const spinners = readSpinners(dir);
    return json(200, { dir, spinners, version: versionOf(JSON.stringify(spinners)) });
  }
  if (url === '/api/spinners/version' && request.method === 'GET') return json(200, { version: spinnersVersion(dir) });
  if (url === '/api/spinners' && request.method === 'PUT') {
    const { write = [], remove = [], baseVersion, force } = await request.json() as { write?: SpinnerWrite[]; remove?: string[]; baseVersion: string | null; force?: boolean };
    if (!Array.isArray(write) || !Array.isArray(remove)) return json(400, { error: 'write and remove must be lists' });
    const current = spinnersVersion(dir);
    if (!force && current !== baseVersion) return json(409, { error: 'The spinners changed on disk', version: current });
    const problems = spinnerWriteProblems(dir, write, remove);
    if (problems.length) return json(400, { error: problems.join('. ') });
    for (const name of remove) removeSpinner(dir, name);
    for (const s of write) if (s.from && s.from !== s.name) fs.renameSync(path.join(dir, s.from), path.join(dir, s.name));
    for (const s of write) writeSpinner(dir, s);
    return json(200, { ok: true, version: spinnersVersion(dir) });
  }
  if (url === '/api/spinners/generate' && request.method === 'POST') {
    const script = generatorOf(dir);
    if (!fs.existsSync(script)) return json(400, { error: `No generator at ${script}` });
    // Run as plain Node: Electron's binary is Node too with this variable set, as for Export all.
    const output = await new Promise<string>((resolve, reject) => execFile(process.execPath, [script], { cwd: path.dirname(path.dirname(script)), env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' }, maxBuffer: 10 * 1024 * 1024 },
      (error, stdout, stderr) => error ? reject(new Error(stdout + stderr || error.message)) : resolve(stdout + stderr)));
    return json(200, { ok: true, output });
  }
  return json(404, { error: 'not found' });
}
