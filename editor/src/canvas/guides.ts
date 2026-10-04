// Smart guides and Alt-measuring, like Figma's: snapping a dragged box to the edges and centres of others,
// and the gaps between two boxes.
import type { Box } from '../model/types';
import type { Handle } from './geometry';

export interface Guide { axis: 'x' | 'y'; at: number; from: number; to: number }
export interface Measure { x1: number; y1: number; x2: number; y2: number; value: number }

const xs = (b: Box) => [b.x, b.x + b.w / 2, b.x + b.w];
const ys = (b: Box) => [b.y, b.y + b.h / 2, b.y + b.h];

/** Which edges move: all three for a move, only the dragged side for a resize. 0 = start, 1 = centre, 2 = end. */
export function movingEdges(h: Handle | null): { x: number[]; y: number[] } {
  if (!h) return { x: [0, 1, 2], y: [0, 1, 2] };
  return { x: h.includes('w') ? [0] : h.includes('e') ? [2] : [], y: h.includes('n') ? [0] : h.includes('s') ? [2] : [] };
}

/** The shift (dx, dy) that snaps `b` onto the nearest target edge within `thr`, per axis, and the guides
 *  to draw for every edge that lines up once it has. */
export function snap(b: Box, targets: Box[], thr: number, moving: { x: number[]; y: number[] }): { dx: number; dy: number; guides: Guide[] } {
  const best = (mine: number[], theirs: (t: Box) => number[]) => {
    let d = 0, dist = thr + 1;
    for (const t of targets) for (const tv of theirs(t)) for (const mv of mine) { const diff = tv - mv; if (Math.abs(diff) < dist) { dist = Math.abs(diff); d = diff; } }
    return dist <= thr ? Math.round(d) : 0;
  };
  const dx = moving.x.length ? best(moving.x.map((i) => xs(b)[i]), xs) : 0;
  const dy = moving.y.length ? best(moving.y.map((i) => ys(b)[i]), ys) : 0;
  const s = { ...b, x: b.x + dx, y: b.y + dy };
  const guides: Guide[] = [];
  for (const t of targets) {
    for (const tv of xs(t)) if (xs(s).some((v) => Math.abs(v - tv) < 0.5)) guides.push({ axis: 'x', at: tv, from: Math.min(s.y, t.y), to: Math.max(s.y + s.h, t.y + t.h) });
    for (const tv of ys(t)) if (ys(s).some((v) => Math.abs(v - tv) < 0.5)) guides.push({ axis: 'y', at: tv, from: Math.min(s.x, t.x), to: Math.max(s.x + s.w, t.x + t.w) });
  }
  return { dx, dy, guides };
}

/** Gaps between `a` (the selection) and `b` (what the pointer is over). Inside `b`, the distance to each of its edges. */
export function measure(a: Box, b: Box): Measure[] {
  const out: Measure[] = [];
  const add = (x1: number, y1: number, x2: number, y2: number) => { const value = Math.abs(x2 - x1) + Math.abs(y2 - y1); if (value > 0) out.push({ x1, y1, x2, y2, value }); };
  const cx = a.x + a.w / 2, cy = a.y + a.h / 2;
  const inside = a.x >= b.x && a.y >= b.y && a.x + a.w <= b.x + b.w && a.y + a.h <= b.y + b.h;
  if (inside) {
    add(b.x, cy, a.x, cy); add(a.x + a.w, cy, b.x + b.w, cy);
    add(cx, b.y, cx, a.y); add(cx, a.y + a.h, cx, b.y + b.h);
    return out;
  }
  const overlapY = Math.max(a.y, b.y) < Math.min(a.y + a.h, b.y + b.h), overlapX = Math.max(a.x, b.x) < Math.min(a.x + a.w, b.x + b.w);
  const midY = overlapY ? (Math.max(a.y, b.y) + Math.min(a.y + a.h, b.y + b.h)) / 2 : cy;
  const midX = overlapX ? (Math.max(a.x, b.x) + Math.min(a.x + a.w, b.x + b.w)) / 2 : cx;
  if (a.x + a.w <= b.x) add(a.x + a.w, midY, b.x, midY);
  else if (b.x + b.w <= a.x) add(b.x + b.w, midY, a.x, midY);
  if (a.y + a.h <= b.y) add(midX, a.y + a.h, midX, b.y);
  else if (b.y + b.h <= a.y) add(midX, b.y + b.h, midX, a.y);
  return out;
}
