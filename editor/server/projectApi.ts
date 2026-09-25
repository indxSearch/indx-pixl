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
        const { files, convert, build, colorsCss } = await request.json() as { files: { name: string; svg: string }[]; convert?: boolean; build?: boolean; colorsCss?: string };
        if (!Array.isArray(files) || files.some(f => typeof f.name !== 'string' || !/^[\p{L}\p{N}][\p{L}\p{N} \-_]*$/u.test(f.name) || typeof f.svg !== 'string')) return json(400, { error: 'Invalid icon name or SVG' });
        if (typeof colorsCss === 'string') fs.writeFileSync(path.join(root, 'colors.css'), colorsCss);
        fs.mkdirSync(raw, { recursive: true });
        for (const f of files) fs.writeFileSync(path.join(raw, f.name + '.svg'), f.svg);
        const convertOutput = convert ? await run('convert') : '';
        const buildOutput = build ? await run('build') : '';
        return json(200, { ok: true, written: files.map(f => f.name), convertOutput, buildOutput });
      }
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
