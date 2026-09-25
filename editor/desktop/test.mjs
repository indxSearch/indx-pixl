import { build } from 'esbuild';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'pixl-tests-'));
try {
  const outfile = path.join(temporary, 'tests.cjs');
  await build({ entryPoints: ['server/projectApi.test.ts'], outfile, platform: 'node', bundle: true, format: 'cjs' });
  execFileSync(process.execPath, ['--test', outfile], { stdio: 'inherit' });
} finally { await fs.rm(temporary, { recursive: true, force: true }); }
