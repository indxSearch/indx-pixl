import type { Plugin } from 'vite';
import path from 'node:path';
import { devRun, projectApi, readDoc, spinnersDirOf, spinnersVersion, versionOf } from './projectApi';

const ROOT = path.resolve(__dirname, '..', '..');
const DOC = path.join(ROOT, 'pixl.json');

export function fileApi(): Plugin {
  return {
    name: 'pixl-file-api',
    configureServer(server) {
      let lastVersion = versionOf(readDoc(ROOT));
      const changed = (version: string | null) => {
        lastVersion = version;
        server.ws.send({ type: 'custom', event: 'pixl:doc-changed', data: { version } });
      };
      server.watcher.add(DOC);
      const onFile = (file: string) => {
        if (path.resolve(file) !== DOC) return;
        const version = versionOf(readDoc(ROOT));
        if (version !== lastVersion) changed(version);
      };
      server.watcher.on('change', onFile).on('add', onFile).on('unlink', onFile);
      // spinner mode edits indx-systm's spinners/ folder, wherever this machine keeps it
      let spinnersDir = spinnersDirOf(ROOT), lastSpinners: string | null = null;
      const watchSpinners = () => {
        spinnersDir = spinnersDirOf(ROOT);
        if (!spinnersDir) return;
        server.watcher.add(spinnersDir);
        try { lastSpinners = spinnersVersion(spinnersDir); } catch { lastSpinners = null; }
      };
      watchSpinners();
      const onSpinnerFile = (file: string) => {
        if (!spinnersDir || !path.resolve(file).startsWith(spinnersDir + path.sep)) return;
        let version: string | null = null;
        try { version = spinnersVersion(spinnersDir); } catch { /* mid-write; the next event settles it */ }
        if (version === lastSpinners) return;
        lastSpinners = version;
        server.ws.send({ type: 'custom', event: 'pixl:spinners-changed', data: { version } });
      };
      server.watcher.on('change', onSpinnerFile).on('add', onSpinnerFile).on('unlink', onSpinnerFile).on('unlinkDir', onSpinnerFile);
      const handle = projectApi(ROOT, devRun(ROOT), changed);
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next();
        try {
          const chunks: Buffer[] = [];
          for await (const chunk of req) chunks.push(Buffer.from(chunk));
          const response = await handle(new Request('http://localhost' + req.url, {
            method: req.method,
            body: req.method === 'GET' || req.method === 'HEAD' ? undefined : Buffer.concat(chunks),
          }));
          res.statusCode = response.status;
          response.headers.forEach((value, key) => res.setHeader(key, value));
          res.end(await response.text());
          if (req.url.startsWith('/api/spinners') && req.method === 'PUT' && response.ok) watchSpinners();
        } catch (error) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: (error as Error).message }));
        }
      });
    },
  };
}
