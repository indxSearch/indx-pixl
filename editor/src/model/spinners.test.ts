import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { DOMParser } from 'linkedom';
import { transformSync } from 'esbuild';
import { readSpinners } from '../../server/projectApi';
import { framesOf, planSpinnerSave, spinnersToDoc, ticksOf } from './spinners';
import { toGrid } from './pixels';
import type { Doc } from './types';

// ---- just enough browser for the SVG loader: DOMParser, XMLSerializer, and a canvas that normalises colours
// and hit-tests straight-line paths (pixel frames have no curves) with the nonzero rule, as an SVG fill does.
type Pt = [number, number];
class Path2DShim {
  loops: Pt[][] = [];
  constructor(d: string) {
    let cur: Pt = [0, 0], loop: Pt[] = [];
    const close = () => { if (loop.length > 2) this.loops.push(loop); loop = []; };
    for (const [, cmd, args] of d.matchAll(/([MmLlHhVvZz])([^MmLlHhVvZz]*)/g)) {
      const n = (args.match(/-?\d*\.?\d+(?:e-?\d+)?/gi) ?? []).map(Number);
      const rel = cmd === cmd.toLowerCase();
      switch (cmd.toUpperCase()) {
        case 'M': close(); for (let i = 0; i < n.length; i += 2) { cur = rel ? [cur[0] + n[i], cur[1] + n[i + 1]] : [n[i], n[i + 1]]; loop.push(cur); } break;
        case 'L': for (let i = 0; i < n.length; i += 2) { cur = rel ? [cur[0] + n[i], cur[1] + n[i + 1]] : [n[i], n[i + 1]]; loop.push(cur); } break;
        case 'H': for (const v of n) { cur = [rel ? cur[0] + v : v, cur[1]]; loop.push(cur); } break;
        case 'V': for (const v of n) { cur = [cur[0], rel ? cur[1] + v : v]; loop.push(cur); } break;
        case 'Z': { const start = loop[0]; close(); if (start) cur = start; break; }
      }
    }
    close();
  }
  winding(x: number, y: number) {
    let w = 0;
    for (const loop of this.loops) for (let i = 0; i < loop.length; i++) {
      const [x1, y1] = loop[i], [x2, y2] = loop[(i + 1) % loop.length];
      if (y1 <= y ? y2 > y && (x2 - x1) * (y - y1) - (x - x1) * (y2 - y1) > 0 : y2 <= y && (x2 - x1) * (y - y1) - (x - x1) * (y2 - y1) < 0) w += y1 <= y ? 1 : -1;
    }
    return w;
  }
}
const NAMED: Record<string, string> = { white: '#ffffff', black: '#000000' };
const g = globalThis as Record<string, unknown>;
g.DOMParser = DOMParser;
g.XMLSerializer = class { serializeToString(n: { toString(): string }) { return n.toString(); } };
g.Path2D = Path2DShim;
g.document = {
  createElement: () => ({
    getContext: () => {
      let style = '#000000';
      return {
        get fillStyle() { return style; },
        set fillStyle(v: string) {
          const s = v.trim().toLowerCase(), named = NAMED[s];
          if (named) style = named;
          else if (/^#[0-9a-f]{6}$/.test(s)) style = s;
          else if (/^#[0-9a-f]{3}$/.test(s)) style = '#' + [...s.slice(1)].map((c) => c + c).join('');
        },
        isPointInPath: (p: Path2DShim, x: number, y: number) => p.winding(x, y) !== 0,
      };
    },
  }),
};

const cells = (w: number, h: number, inside: (x: number, y: number) => boolean) =>
  Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => (inside(x, y) ? '#' : '.')).join('')).join('/');

// The real folder, where this machine keeps it (editor.local.json), checked read-only.
const root = path.resolve(__dirname, '..', '..', '..');
const dir = (() => { try { return JSON.parse(fs.readFileSync(path.join(root, 'editor.local.json'), 'utf8')).spinnersDir as string; } catch { return undefined; } })();
const generated = dir && path.join(dir, '..', 'src', 'components', 'Spinner', 'spinners.generated.ts');
const real = dir && generated && fs.existsSync(generated) ? { dir, generated } : null;
const skipReal = real ? false : 'set spinnersDir in editor.local.json to check the real spinners';

test('every spinner plays tick for tick what the generator compiled', { skip: skipReal }, () => {
  const mod = { exports: {} as { spinners: Record<string, { viewBox: string; delay: number; frames: string[] }> } };
  new Function('module', 'exports', transformSync(fs.readFileSync(real!.generated, 'utf8'), { loader: 'ts', format: 'cjs' }).code)(mod, mod.exports);
  const compiled = mod.exports.spinners;
  const { doc } = spinnersToDoc(readSpinners(real!.dir));
  assert.deepEqual(doc.artboards.map((a) => a.name).sort(), Object.keys(compiled).sort(), 'the same spinners');
  for (const a of doc.artboards) {
    const c = compiled[a.name], [, , w, h] = c.viewBox.split(' ').map(Number);
    assert.equal(a.spinner!.delay, c.delay, `${a.name}: delay`);
    const mine = ticksOf(a).map((t) => { const grid = toGrid(t.rects, t.w, t.h); return cells(t.w, t.h, (x, y) => !!grid[y][x]); });
    const theirs = c.frames.map((d) => { const p = new Path2DShim(d); return cells(w, h, (x, y) => p.winding(x + 0.5, y + 0.5) !== 0); });
    assert.deepEqual(mine, theirs, `${a.name}: ticks`);
  }
});

test('loading and saving without an edit writes nothing', { skip: skipReal }, () => {
  const { doc, baseline } = spinnersToDoc(readSpinners(real!.dir));
  const plan = planSpinnerSave(doc, baseline);
  assert.deepEqual([plan.write, plan.remove, plan.problems], [[], [], []]);
});

// ---- edits, on a small made-up folder
const svg = (w: number, h: number, rects: [number, number, number, number][]) =>
  `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none" xmlns="http://www.w3.org/2000/svg">\n${rects.map(([x, y, rw, rh]) => `<rect x="${x}" y="${y}" width="${rw}" height="${rh}" fill="#080809"/>`).join('\n')}\n</svg>\n`;
const dot = (x: number) => svg(7, 5, [[x, 2, 1, 1]]);
const folder = () => spinnersToDoc([
  { name: 'dots', layout: 'keyframes', config: { delay: 250 }, frames: [dot(0), dot(0), dot(0), dot(3), dot(6)].map((s, i) => ({ file: `${i + 1}.svg`, svg: s })) },
  { name: 'bar', layout: 'keyframes', config: null, frames: [dot(1), dot(2)].map((s, i) => ({ file: `${i + 1}.svg`, svg: s })) },
]);
const edited = (doc: Doc, name: string, fn: (a: Doc['artboards'][number]) => void): Doc => {
  const d = structuredClone(doc);
  fn(d.artboards.find((a) => a.name === name)!);
  return d;
};

test('identical frames in a row load as one held frame, and save back as the same files', () => {
  const { doc, baseline } = folder();
  const dots = doc.artboards.find((a) => a.name === 'dots')!;
  assert.deepEqual(framesOf(dots).map((f) => f.hold ?? 1), [3, 1, 1]);
  assert.equal(ticksOf(dots).length, 5);
  // holding the last frame two ticks: only that spinner is written, its untouched files keep their text
  const plan = planSpinnerSave(edited(doc, 'dots', (a) => { framesOf(a)[2].hold = 2; }), baseline);
  assert.deepEqual(plan.write.map((w) => w.name), ['dots']);
  assert.deepEqual(plan.write[0].frames, [dot(0), dot(0), dot(0), dot(3), dot(6), dot(6)]);
  assert.equal(plan.write[0].config, undefined, 'config.json untouched');
});

test('a changed pixel rewrites that frame only, and settings rewrite config.json keeping its other keys', () => {
  const { doc, baseline } = folder();
  const plan = planSpinnerSave(edited(doc, 'bar', (a) => { framesOf(a)[1].rects.push({ id: 'n', x: 0, y: 0, w: 1, h: 1, fill: 'lv8' }); a.spinner = { delay: 100, pingpong: true }; }), baseline);
  assert.equal(plan.write.length, 1);
  assert.equal(plan.write[0].frames[0], dot(1));
  assert.match(plan.write[0].frames[1], /<rect x="0" y="0" width="1" height="1"/);
  assert.deepEqual(plan.write[0].config, { delay: 100, pingpong: true });
  const { doc: d2, baseline: b2 } = spinnersToDoc([{ name: 'x', layout: 'flat', config: { delay: 50, note: 'kept' }, frames: [{ file: '1.svg', svg: dot(0) }] }]);
  assert.deepEqual(planSpinnerSave(edited(d2, 'x', (a) => { a.spinner = { delay: 75, pingpong: false }; }), b2).write[0], { name: 'x', from: 'x', layout: 'flat', frames: [dot(0)], config: { delay: 75, note: 'kept' } });
});

test('rename, delete, a new spinner and invalid names', () => {
  const { doc, baseline } = folder();
  const renamed = edited(doc, 'bar', (a) => { a.name = 'bars'; });
  assert.deepEqual(planSpinnerSave(renamed, baseline).write.map((w) => [w.from, w.name]), [['bar', 'bars']]);
  const deleted = { ...doc, artboards: doc.artboards.filter((a) => a.name !== 'bar') };
  assert.deepEqual(planSpinnerSave(deleted, baseline).remove, ['bar']);
  const bad = edited(doc, 'bar', (a) => { a.name = 'Bar 2'; });
  assert.match(planSpinnerSave(bad, baseline).problems[0], /not a spinner name/);
  const twins = edited(doc, 'bar', (a) => { a.name = 'dots'; });
  assert.match(planSpinnerSave(twins, baseline).problems.join(), /Two spinners are called "dots"/);
  const mixed = edited(doc, 'bar', (a) => { framesOf(a)[0].w = 8; });
  assert.match(planSpinnerSave(mixed, baseline).problems.join(), /frames differ in size/);
});
