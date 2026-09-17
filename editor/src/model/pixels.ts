// Pixel-grid utilities: rects -> cell grid -> maximal rects / outline paths (the "union").
import type { Fill, Icon, Rect } from './types';

export type Grid = (Fill | null)[][]; // [y][x]

/** Paint rects onto a W×H grid in order (later rects win), clipping to bounds. */
export function toGrid(rects: Rect[], W: number, H: number): Grid {
  const g: Grid = Array.from({ length: H }, () => Array(W).fill(null));
  for (const r of rects) {
    for (let y = Math.max(0, r.y); y < Math.min(H, r.y + r.h); y++)
      for (let x = Math.max(0, r.x); x < Math.min(W, r.x + r.w); x++) g[y][x] = r.fill;
  }
  return g;
}

/** Fills in first-painted order. */
export function fillsOf(rects: Rect[]): Fill[] {
  return [...new Set(rects.map((r) => r.fill))];
}

/** Greedy maximal rectangles for the cells equal to `fill`. */
export function maximalRects(g: Grid, fill: Fill): Omit<Rect, 'id' | 'fill'>[] {
  const H = g.length, W = H ? g[0].length : 0;
  const used = g.map((row) => row.map(() => false));
  const on = (x: number, y: number) => g[y][x] === fill && !used[y][x];
  const out: Omit<Rect, 'id' | 'fill'>[] = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!on(x, y)) continue;
    let w = 1; while (x + w < W && on(x + w, y)) w++;
    let h = 1; while (y + h < H && Array.from({ length: w }, (_, i) => on(x + i, y + h)).every(Boolean)) h++;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) used[y + j][x + i] = true;
    out.push({ x, y, w, h });
  }
  return out;
}

/**
 * Outline path (SVG `d`) of all cells equal to `fill`: one closed subpath per boundary loop.
 * Outer loops run clockwise, holes counter-clockwise, so the nonzero rule fills correctly.
 */
export function outlinePath(g: Grid, fill: Fill): string {
  const H = g.length, W = H ? g[0].length : 0;
  const is = (x: number, y: number) => x >= 0 && y >= 0 && x < W && y < H && g[y][x] === fill;
  type Pt = [number, number];
  const key = (p: Pt) => p[0] + ',' + p[1];
  const edges = new Map<string, Pt[]>(); // start -> ends (directed)
  const add = (a: Pt, b: Pt) => { const k = key(a); (edges.get(k) ?? edges.set(k, []).get(k)!).push(b); };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!is(x, y)) continue;
    if (!is(x, y - 1)) add([x, y], [x + 1, y]);         // top, left→right
    if (!is(x + 1, y)) add([x + 1, y], [x + 1, y + 1]); // right, top→bottom
    if (!is(x, y + 1)) add([x + 1, y + 1], [x, y + 1]); // bottom, right→left
    if (!is(x - 1, y)) add([x, y + 1], [x, y]);         // left, bottom→top
  }
  const loops: Pt[][] = [];
  const take = (from: Pt, prev: Pt | null): Pt | null => {
    const list = edges.get(key(from));
    if (!list?.length) return null;
    let i = 0;
    if (list.length > 1 && prev) {
      // at a checkerboard vertex prefer turning left, joining diagonal cells into one loop (Figma style)
      const dx = from[0] - prev[0], dy = from[1] - prev[1];
      const left: Pt = [from[0] + dy, from[1] - dx];
      const j = list.findIndex((p) => p[0] === left[0] && p[1] === left[1]);
      if (j >= 0) i = j;
    }
    const [next] = list.splice(i, 1);
    if (!list.length) edges.delete(key(from));
    return next;
  };
  while (edges.size) {
    const startKey = edges.keys().next().value as string;
    const start = startKey.split(',').map(Number) as Pt;
    const loop: Pt[] = [start];
    let prev: Pt | null = null, cur = start;
    for (;;) {
      const next = take(cur, prev);
      if (!next) break;
      prev = cur; cur = next;
      if (cur[0] === start[0] && cur[1] === start[1]) break;
      loop.push(cur);
    }
    loops.push(loop);
  }
  // emit with collinear points merged
  return loops.map((loop) => {
    let d = `M${loop[0][0]} ${loop[0][1]}`;
    for (let i = 1; i <= loop.length; i++) {
      const p = loop[i % loop.length], q = loop[(i + 1) % loop.length], a = loop[i - 1];
      if (i < loop.length && ((p[0] === a[0] && p[0] === q[0]) || (p[1] === a[1] && p[1] === q[1]))) continue; // collinear
      if (i === loop.length) break;
      d += p[0] === a[0] ? `V${p[1]}` : `H${p[0]}`;
    }
    return d + 'Z';
  }).join('');
}

/** Normalize an icon's rects: paint to grid, then re-emit maximal rects per fill. */
export function mergedRects(icon: Icon, uid: () => string): Rect[] {
  const g = toGrid(icon.rects, icon.w, icon.h);
  const out: Rect[] = [];
  for (const f of fillsOf(icon.rects)) for (const r of maximalRects(g, f)) out.push({ id: uid(), ...r, fill: f });
  return out;
}

/** True if two rect lists paint the same picture and are both already maximal (ignores ids). */
export function sameRects(a: Rect[], b: Rect[]): boolean {
  const k = (rs: Rect[]) => rs.map((r) => `${r.x},${r.y},${r.w},${r.h},${r.fill}`).sort().join('|');
  return k(a) === k(b);
}

/**
 * Split an icon's rects into one 1×1 rect per visible pixel, for editing. A rect that was already 1×1 keeps its id.
 * `idMap` receives, for every original rect id, the ids of the pixels it now shows as.
 */
export function splitRects(icon: Icon, uid: () => string, idMap?: Map<string, string[]>): Rect[] {
  const H = icon.h, W = icon.w;
  const owner: (Rect | null)[][] = Array.from({ length: H }, () => Array(W).fill(null));
  for (const r of icon.rects) {
    for (let y = Math.max(0, r.y); y < Math.min(H, r.y + r.h); y++)
      for (let x = Math.max(0, r.x); x < Math.min(W, r.x + r.w); x++) owner[y][x] = r;
  }
  const out: Rect[] = [];
  for (const f of fillsOf(icon.rects)) for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const r = owner[y][x];
    if (!r || r.fill !== f) continue;
    const id = r.w === 1 && r.h === 1 ? r.id : uid();
    out.push({ id, x, y, w: 1, h: 1, fill: f });
    if (idMap) (idMap.get(r.id) ?? idMap.set(r.id, []).get(r.id)!).push(id);
  }
  return out;
}

/** True if every rect is a 1×1 pixel inside the icon and no two share a cell. */
export function isSplit(icon: Icon): boolean {
  const seen = new Set<string>();
  for (const r of icon.rects) {
    if (r.w !== 1 || r.h !== 1 || r.x < 0 || r.y < 0 || r.x >= icon.w || r.y >= icon.h) return false;
    const k = r.x + ',' + r.y;
    if (seen.has(k)) return false;
    seen.add(k);
  }
  return true;
}
