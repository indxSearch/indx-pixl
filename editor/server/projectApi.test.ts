import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { projectApi } from './projectApi';

test('document saves detect external edits and allow explicit conflict resolution', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'pixl-api-'));
  try {
    const api = projectApi(root, async () => '');
    const request = (method: string, body?: unknown) => api(new Request('http://localhost/api/doc', { method, body: body ? JSON.stringify(body) : undefined }));
    assert.equal((await request('GET')).status, 404);
    const saved = await request('PUT', { doc: { artboards: [] }, baseVersion: null });
    assert.equal(saved.status, 200);
    const { version } = await saved.json();
    await fs.writeFile(path.join(root, 'pixl.json'), '{"artboards":[{"name":"external"}]}');
    assert.equal((await request('PUT', { doc: {}, baseVersion: version })).status, 409);
    assert.equal((await (await request('GET')).json()).doc.artboards[0].name, 'external');
    assert.equal((await request('PUT', { doc: { artboards: [] }, baseVersion: version, force: true })).status, 200);
  } finally { await fs.rm(root, { recursive: true, force: true }); }
});

test('export validates all names before writing and runs conversion before build', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'pixl-export-'));
  try {
    const calls: string[] = [];
    const api = projectApi(root, async task => { calls.push(task); return task + ' complete'; });
    const post = (body: unknown) => api(new Request('http://localhost/api/export', { method: 'POST', body: JSON.stringify(body) }));
    assert.equal((await post({ files: [{ name: 'okay', svg: '<svg/>' }, { name: '../escape', svg: '<svg/>' }], colorsCss: 'test' })).status, 400);
    assert.deepEqual(await fs.readdir(root), []);
    const result = await post({ files: [{ name: 'test icon', svg: '<svg/>' }], colorsCss: ':root{}', convert: true, build: true });
    assert.equal(result.status, 200);
    assert.deepEqual(calls, ['convert', 'build']);
    assert.equal(await fs.readFile(path.join(root, 'raw-icons/test icon.svg'), 'utf8'), '<svg/>');
    const icons = await api(new Request('http://localhost/api/raw-icons'));
    assert.deepEqual(await icons.json(), [{ name: 'test icon', svg: '<svg/>' }]);
  } finally { await fs.rm(root, { recursive: true, force: true }); }
});
