// Dev-only file API: lets the editor read/write pixl.json and raw-icons/ in the repo root.
import type { Plugin } from 'vite';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';

const ROOT = path.resolve(__dirname, '..', '..');
const DOC = path.join(ROOT, 'pixl.json');
const RAW = path.join(ROOT, 'raw-icons');
const COLORS_CSS = path.join(ROOT, 'colors.css');
const NAME_RE = /^[\p{L}\p{N}][\p{L}\p{N} \-_]*$/u;

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => (data += c));
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}
/** Content hash of pixl.json, or null when it does not exist. Used as the document version. */
const versionOf = (text: string | null) => (text == null ? null : createHash('sha1').update(text).digest('hex').slice(0, 16));
const readDoc = () => (fs.existsSync(DOC) ? fs.readFileSync(DOC, 'utf8') : null);

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

export function fileApi(): Plugin {
  return {
    name: 'pixl-file-api',
    configureServer(server) {
      // Tell open editors when pixl.json changes on disk (another tab, git pull, checkout).
      let lastVersion = versionOf(readDoc());
      server.watcher.add(DOC);
      const onFile = (file: string) => {
        if (path.resolve(file) !== DOC) return;
        const version = versionOf(readDoc());
        if (version === lastVersion) return;
        lastVersion = version;
        server.ws.send({ type: 'custom', event: 'pixl:doc-changed', data: { version } });
      };
      server.watcher.on('change', onFile);
      server.watcher.on('add', onFile);
      server.watcher.on('unlink', onFile);

      server.middlewares.use(async (req, res, next) => {
        const url = req.url ?? '';
        if (!url.startsWith('/api/')) return next();
        try {
          if (url === '/api/doc' && req.method === 'GET') {
            const text = readDoc();
            if (text == null) return send(res, 404, { error: 'no document' });
            return send(res, 200, { doc: JSON.parse(text), version: versionOf(text) });
          }
          if (url === '/api/doc' && req.method === 'PUT') {
            // Compare-and-set: refuse to overwrite a file that changed since the client loaded it.
            const { doc, baseVersion, force } = JSON.parse(await readBody(req)) as { doc: unknown; baseVersion: string | null; force?: boolean };
            const current = versionOf(readDoc());
            if (!force && current !== baseVersion) return send(res, 409, { error: 'pixl.json changed on disk', version: current });
            const text = JSON.stringify(doc, null, 2) + '\n';
            fs.writeFileSync(DOC, text);
            lastVersion = versionOf(text);
            server.ws.send({ type: 'custom', event: 'pixl:doc-changed', data: { version: lastVersion } }); // other tabs
            return send(res, 200, { ok: true, version: lastVersion });
          }
          if (url === '/api/raw-icons' && req.method === 'GET') {
            const files = fs.existsSync(RAW) ? fs.readdirSync(RAW).filter((f) => f.endsWith('.svg')).sort() : [];
            return send(res, 200, files.map((f) => ({ name: f.replace(/\.svg$/, ''), svg: fs.readFileSync(path.join(RAW, f), 'utf8') })));
          }
          if (url === '/api/export' && req.method === 'POST') {
            const { files, convert, colorsCss } = JSON.parse(await readBody(req)) as { files: { name: string; svg: string }[]; convert?: boolean; colorsCss?: string };
            if (typeof colorsCss === 'string') fs.writeFileSync(COLORS_CSS, colorsCss);
            fs.mkdirSync(RAW, { recursive: true });
            const written: string[] = [];
            for (const f of files) {
              if (!NAME_RE.test(f.name)) return send(res, 400, { error: `bad icon name: ${f.name}` });
              fs.writeFileSync(path.join(RAW, f.name + '.svg'), f.svg);
              written.push(f.name);
            }
            let convertOutput = '';
            if (convert) {
              convertOutput = await new Promise<string>((resolve) =>
                execFile('node', ['convert-icons.js'], { cwd: ROOT }, (err, stdout, stderr) => resolve((stdout || '') + (stderr || '') + (err ? `\n${err.message}` : ''))),
              );
            }
            return send(res, 200, { ok: true, written, convertOutput });
          }
          return send(res, 404, { error: 'not found' });
        } catch (e) {
          return send(res, 500, { error: (e as Error).message });
        }
      });
    },
  };
}
