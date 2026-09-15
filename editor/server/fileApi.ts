// Dev-only file API: lets the editor read/write pixl.json and raw-icons/ in the repo root.
import type { Plugin } from 'vite';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';

const ROOT = path.resolve(__dirname, '..', '..');
const DOC = path.join(ROOT, 'pixl.json');
const RAW = path.join(ROOT, 'raw-icons');
const NAME_RE = /^[\p{L}\p{N}][\p{L}\p{N} \-_]*$/u;

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => (data += c));
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}
function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

export function fileApi(): Plugin {
  return {
    name: 'pixl-file-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ?? '';
        if (!url.startsWith('/api/')) return next();
        try {
          if (url === '/api/doc' && req.method === 'GET') {
            if (!fs.existsSync(DOC)) return send(res, 404, { error: 'no document' });
            res.setHeader('Content-Type', 'application/json');
            return res.end(fs.readFileSync(DOC, 'utf8'));
          }
          if (url === '/api/doc' && req.method === 'PUT') {
            const doc = JSON.parse(await readBody(req));
            fs.writeFileSync(DOC, JSON.stringify(doc, null, 2) + '\n');
            return send(res, 200, { ok: true });
          }
          if (url === '/api/raw-icons' && req.method === 'GET') {
            const files = fs.existsSync(RAW) ? fs.readdirSync(RAW).filter((f) => f.endsWith('.svg')).sort() : [];
            return send(res, 200, files.map((f) => ({ name: f.replace(/\.svg$/, ''), svg: fs.readFileSync(path.join(RAW, f), 'utf8') })));
          }
          if (url === '/api/export' && req.method === 'POST') {
            const { files, convert } = JSON.parse(await readBody(req)) as { files: { name: string; svg: string }[]; convert?: boolean };
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
