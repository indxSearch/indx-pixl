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
    // An pictogram with the same name as an icon lands in its own folder, beside it, not over it.
    assert.equal((await post({ files: [{ name: 'test icon', svg: '<svg id="i"/>', kind: 'pictograms' }] })).status, 200);
    assert.equal(await fs.readFile(path.join(root, 'raw-pictograms/test icon.svg'), 'utf8'), '<svg id="i"/>');
    assert.equal(await fs.readFile(path.join(root, 'raw-icons/test icon.svg'), 'utf8'), '<svg/>');
    assert.equal((await post({ files: [{ name: 'x', svg: '<svg/>', kind: '../elsewhere' }] })).status, 400);
    const icons = await api(new Request('http://localhost/api/raw-icons'));
    assert.deepEqual(await icons.json(), [{ name: 'test icon', svg: '<svg/>' }]);
  } finally { await fs.rm(root, { recursive: true, force: true }); }
});

test('spinners: the folder must be indx-systm\'s, saves are all-or-nothing, and only managed files are touched', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'pixl-spinners-'));
  try {
    const pkg = path.join(root, 'indx-systm'), dir = path.join(pkg, 'spinners');
    await fs.mkdir(path.join(pkg, 'scripts'), { recursive: true });
    await fs.writeFile(path.join(pkg, 'scripts', 'generate-spinners.mjs'), "console.log('Generated 1 spinner')");
    await fs.mkdir(path.join(dir, 'dots', 'keyframes'), { recursive: true });
    await fs.writeFile(path.join(dir, 'dots', 'keyframes', '1.svg'), '<svg a/>');
    await fs.writeFile(path.join(dir, 'dots', 'keyframes', '2.svg'), '<svg b/>');
    await fs.writeFile(path.join(dir, 'dots', 'config.json'), '{ "delay": 250 }\n');
    const api = projectApi(root, async () => '');
    const call = (url: string, method: string, body?: unknown) => api(new Request('http://localhost' + url, { method, body: body ? JSON.stringify(body) : undefined }));

    assert.equal((await call('/api/spinners', 'GET')).status, 404, 'no folder chosen yet');
    assert.equal((await call('/api/spinners/folder', 'PUT', { dir: root })).status, 400, 'a folder without the generator beside it');
    assert.equal((await call('/api/spinners/folder', 'PUT', { dir })).status, 200);
    const loaded = await (await call('/api/spinners', 'GET')).json();
    assert.deepEqual(loaded.spinners, [{ name: 'dots', layout: 'keyframes', config: { delay: 250 }, frames: [{ file: '1.svg', svg: '<svg a/>' }, { file: '2.svg', svg: '<svg b/>' }] }]);

    // a bad name refuses the whole save: the valid spinner beside it is not written either
    const bad = await call('/api/spinners', 'PUT', { baseVersion: loaded.version, write: [{ name: 'new', from: null, layout: 'keyframes', frames: ['<svg/>'] }, { name: '../out', from: null, layout: 'keyframes', frames: ['<svg/>'] }] });
    assert.equal(bad.status, 400);
    assert.equal(await fs.stat(path.join(dir, 'new')).catch(() => null), null);

    // rename with one frame fewer and new settings; a hand-written file in the folder survives
    await fs.writeFile(path.join(dir, 'dots', 'NOTES.md'), 'mine');
    const saved = await call('/api/spinners', 'PUT', { baseVersion: loaded.version, write: [{ name: 'dot', from: 'dots', layout: 'keyframes', frames: ['<svg a/>'], config: { delay: 100, pingpong: true } }] });
    assert.equal(saved.status, 200);
    assert.deepEqual((await fs.readdir(path.join(dir, 'dot', 'keyframes'))), ['1.svg']);
    assert.equal(await fs.readFile(path.join(dir, 'dot', 'config.json'), 'utf8'), '{ "delay": 100, "pingpong": true }\n');
    assert.equal(await fs.readFile(path.join(dir, 'dot', 'NOTES.md'), 'utf8'), 'mine');

    // a stale version is a conflict; removing leaves only what the editor does not manage
    assert.equal((await call('/api/spinners', 'PUT', { baseVersion: loaded.version, remove: ['dot'] })).status, 409);
    const { version } = await saved.json();
    assert.equal((await call('/api/spinners', 'PUT', { baseVersion: version, remove: ['dot'] })).status, 200);
    assert.deepEqual(await fs.readdir(path.join(dir, 'dot')), ['NOTES.md']);

    const generated = await call('/api/spinners/generate', 'POST');
    assert.equal(generated.status, 200);
    assert.match((await generated.json()).output, /Generated 1 spinner/);
  } finally { await fs.rm(root, { recursive: true, force: true }); }
});
