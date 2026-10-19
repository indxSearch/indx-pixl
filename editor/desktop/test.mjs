import { build } from 'esbuild';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'pixl-tests-'));
try {
  const outfiles = [];
  for (const entry of ['server/projectApi.test.ts', 'src/model/spinners.test.ts']) {
    const outfile = path.join(temporary, path.basename(entry, '.ts') + '.cjs');
    // esbuild and linkedom stay external: the spinner test compiles indx-systm's generated TypeScript at run time
    await build({ entryPoints: [entry], outfile, platform: 'node', bundle: true, format: 'cjs', external: ['esbuild', 'linkedom'], define: { __dirname: JSON.stringify(path.resolve(path.dirname(entry))) } });
    outfiles.push(outfile);
  }
  execFileSync(process.execPath, ['--test', ...outfiles], { stdio: 'inherit', env: { ...process.env, NODE_PATH: path.resolve('node_modules') } });
} finally { await fs.rm(temporary, { recursive: true, force: true }); }
