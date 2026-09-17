// Parse SVG text (e.g. Figma's "Copy as SVG" of a frame) into pixel icons.
// Runs in the browser: the SVG is mounted off-screen so transforms and bounding boxes can be measured.
import { type Box, type ColorToken, type Fill, type Rect, uid } from './types';
import { type Grid, maximalRects } from './pixels';
import { levelOrHex, toHex } from './svg';

export interface ParsedIcon { name: string | null; x: number; y: number; w: number; h: number; rects: Rect[] }
export interface ParseResult {
  icons: ParsedIcon[];
  /** How icons were found: clipped/named frames, the whole SVG as one icon, or grouping nearby pixels. */
  mode: 'frames' | 'groups' | 'single' | 'clusters';
  skipped: number; // shapes ignored (gradients, images, fully transparent)
}

const SHAPES = 'path,rect,circle,ellipse,polygon,polyline';
const NON_RENDERED = 'defs,clipPath,mask,pattern,symbol,marker';
const MAX_CELLS = 4_000_000;

export const looksLikeSvg = (text: string) => /^\s*(<\?xml[^>]*>\s*)?(<!--[\s\S]*?-->\s*|<!DOCTYPE[^>]*>\s*)*<svg[\s>]/i.test(text);

/** Remove anything that could run code or load resources before the SVG touches the live DOM. */
function sanitize(root: Element) {
  root.querySelectorAll('script,foreignObject,image,use,style,iframe,a').forEach((el) => el.remove());
  for (const el of [root, ...Array.from(root.querySelectorAll('*'))]) {
    for (const attr of Array.from(el.attributes)) {
      if (/^on/i.test(attr.name) || /^(href|xlink:href)$/i.test(attr.name)) el.removeAttribute(attr.name);
    }
  }
}

function shapePath(el: SVGGraphicsElement): Path2D | null {
  const n = (a: string) => parseFloat(el.getAttribute(a) ?? '0') || 0;
  const p = new Path2D();
  switch (el.tagName.toLowerCase()) {
    case 'path': return new Path2D(el.getAttribute('d') ?? '');
    case 'rect': p.rect(n('x'), n('y'), n('width'), n('height')); return p;
    case 'circle': p.arc(n('cx'), n('cy'), n('r'), 0, Math.PI * 2); return p;
    case 'ellipse': p.ellipse(n('cx'), n('cy'), n('rx'), n('ry'), 0, 0, Math.PI * 2); return p;
    case 'polygon': case 'polyline': {
      const pts = (el.getAttribute('points') ?? '').trim().split(/[\s,]+/).map(Number);
      for (let i = 0; i + 1 < pts.length; i += 2) (i ? p.lineTo(pts[i], pts[i + 1]) : p.moveTo(pts[i], pts[i + 1]));
      p.closePath(); return p;
    }
  }
  return null;
}

const boxOfMatrix = (m: DOMMatrix, b: { x: number; y: number; width: number; height: number }): Box => {
  const pts = [[b.x, b.y], [b.x + b.width, b.y], [b.x, b.y + b.height], [b.x + b.width, b.y + b.height]].map(([x, y]) => new DOMPoint(x, y).matrixTransform(m));
  const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
  return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
};
const roundBox = (b: Box): Box => ({ x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.x + b.w) - Math.round(b.x), h: Math.round(b.y + b.h) - Math.round(b.y) });
const contains = (a: Box, b: Box) => a.x <= b.x && a.y <= b.y && a.x + a.w >= b.x + b.w && a.y + a.h >= b.y + b.h;
const sameBox = (a: Box, b: Box) => Math.abs(a.x - b.x) < 0.01 && Math.abs(a.y - b.y) < 0.01 && Math.abs(a.w - b.w) < 0.01 && Math.abs(a.h - b.h) < 0.01;

/** Figma writes layer names as ids when enabled; clip ids are generated and not names. */
function nameOf(el: Element | null): string | null {
  const id = el?.getAttribute('id') ?? el?.getAttribute('data-name') ?? el?.getAttribute('aria-label');
  if (!id || /^clip\d/i.test(id) || /^(paint|filter|mask|pattern)\d/i.test(id)) return null;
  return (id.includes(' ') ? id : id.replace(/_/g, ' ')).trim() || null;
}

export function parseSvg(text: string, colors: ColorToken[] = [], mapColors = true): ParseResult {
  const parsed = new DOMParser().parseFromString(text, 'image/svg+xml');
  const src = parsed.querySelector('svg');
  if (!src || parsed.querySelector('parsererror')) throw new Error('Clipboard does not contain valid SVG');
  sanitize(src);

  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-100000px;top:0;opacity:0;pointer-events:none;'; // not visibility:hidden, which would inherit into the shapes
  const root = document.importNode(src, true) as unknown as SVGSVGElement;
  host.appendChild(root);
  document.body.appendChild(host);
  try {
    // getScreenCTM returns an SVGMatrix in some browsers; convert to DOMMatrix before composing
    const screen = (el: SVGGraphicsElement) => { const m = el.getScreenCTM(); return m ? DOMMatrix.fromMatrix(m) : new DOMMatrix(); };
    if (!root.getScreenCTM()) throw new Error('Could not measure SVG');
    const rootInv = screen(root).inverse();
    const ctmOf = (el: SVGGraphicsElement) => rootInv.multiply(screen(el));
    const vb = root.viewBox.baseVal;
    const rootBox: Box = vb && vb.width ? { x: vb.x, y: vb.y, w: vb.width, h: vb.height } : { x: 0, y: 0, w: parseFloat(root.getAttribute('width') ?? '0'), h: parseFloat(root.getAttribute('height') ?? '0') };

    // ---- shapes, in paint order ----
    const ctx = document.createElement('canvas').getContext('2d')!;
    let skipped = 0;
    type Shape = { el: SVGGraphicsElement; path: Path2D; m: DOMMatrix; box: Box; fill: Fill; rule: CanvasFillRule; clip: Element | null };
    const shapes: Shape[] = [];
    for (const el of Array.from(root.querySelectorAll<SVGGraphicsElement>(SHAPES))) {
      if (el.closest(NON_RENDERED)) continue;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      const hex = cs.fill && cs.fill !== 'none' ? toHex(cs.fill) : null;
      const alpha = (parseFloat(cs.fillOpacity) || 0) * (parseFloat(cs.opacity) || 0);
      if (!hex || alpha < 0.01) { if (cs.fill !== 'none') skipped++; continue; }
      const path = shapePath(el);
      if (!path) { skipped++; continue; }
      const m = ctmOf(el);
      shapes.push({ el, path, m, box: boxOfMatrix(m, el.getBBox()), fill: mapColors ? levelOrHex(hex, colors) : hex, rule: cs.fillRule === 'evenodd' ? 'evenodd' : 'nonzero', clip: el.parentElement?.closest('[clip-path]') ?? null });
    }

    const paint = (frame: Box, list: Shape[]): Grid => {
      const g: Grid = Array.from({ length: frame.h }, () => Array(frame.w).fill(null));
      for (const s of list) {
        ctx.setTransform(s.m.a, s.m.b, s.m.c, s.m.d, s.m.e, s.m.f);
        const x0 = Math.max(0, Math.floor(s.box.x - frame.x)), x1 = Math.min(frame.w, Math.ceil(s.box.x + s.box.w - frame.x));
        const y0 = Math.max(0, Math.floor(s.box.y - frame.y)), y1 = Math.min(frame.h, Math.ceil(s.box.y + s.box.h - frame.y));
        for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++)
          if (ctx.isPointInPath(s.path, frame.x + x + 0.5, frame.y + y + 0.5, s.rule)) g[y][x] = s.fill;
      }
      ctx.resetTransform();
      return g;
    };
    const toRects = (g: Grid): Rect[] => {
      const fills: Fill[] = [];
      for (const row of g) for (const f of row) if (f && !fills.includes(f)) fills.push(f);
      return fills.flatMap((f) => maximalRects(g, f).map((r) => ({ id: uid(), ...r, fill: f })));
    };

    // ---- 1. frames: groups clipped to a rectangle ----
    type Frame = { box: Box; group: Element };
    let frames: Frame[] = [];
    for (const group of Array.from(root.querySelectorAll<SVGGraphicsElement>('[clip-path]'))) {
      if (group.closest(NON_RENDERED)) continue;
      const ref = (group.getAttribute('clip-path') ?? '').match(/url\(\s*['"]?#([^'")]+)/)?.[1];
      const clip = ref ? root.querySelector(`clipPath[id="${CSS.escape(ref)}"]`) : null;
      const r = clip?.querySelector('rect');
      if (!r) continue;
      const ownM = (r as SVGGraphicsElement & { transform: SVGAnimatedTransformList }).transform?.baseVal.consolidate()?.matrix;
      const own = ownM ? DOMMatrix.fromMatrix(ownM) : new DOMMatrix();
      const n = (a: string) => parseFloat(r.getAttribute(a) ?? '0') || 0;
      const box = roundBox(boxOfMatrix(ctmOf(group).multiply(own), { x: n('x'), y: n('y'), width: n('width'), height: n('height') }));
      if (box.w >= 1 && box.h >= 1) frames.push({ box, group });
    }
    // keep innermost frames only (an outer container frame is not an icon)
    frames = frames.filter((f) => !frames.some((o) => o !== f && contains(f.box, o.box) && !sameBox(f.box, o.box)));
    if (frames.length === 1 && (frames[0].box.w > 32 || frames[0].box.h > 32)) frames = [];

    const isBackground = (s: Shape, box: Box, list: Shape[]) => s.el.tagName.toLowerCase() === 'rect' && list[0] === s && sameBox(roundBox(s.box), box);

    if (frames.length) {
      const icons = frames.map((f) => {
        // shapes clipped by this frame, or unclipped shapes that overlap it
        let list = shapes.filter((s) => (s.clip ? f.group === s.clip || f.group.contains(s.clip) : true) && s.box.x < f.box.x + f.box.w && s.box.x + s.box.w > f.box.x && s.box.y < f.box.y + f.box.h && s.box.y + s.box.h > f.box.y);
        if (list.length && isBackground(list[0], f.box, list)) list = list.slice(1);
        return { name: nameOf(f.group), ...f.box, rects: toRects(paint(f.box, list)) };
      });
      return { icons, mode: 'frames', skipped };
    }

    // ---- 2. named groups: Figma's regular Copy often keeps frame/component groups
    // but does not add clip paths. Prefer the innermost named groups so an artboard
    // wrapper does not swallow all of its child components.
    type NamedGroup = { box: Box; group: SVGGElement; name: string };
    let groups: NamedGroup[] = [];
    for (const group of Array.from(root.querySelectorAll<SVGGElement>('g[id],g[data-name],g[aria-label]'))) {
      if (!nameOf(group) || group.closest(NON_RENDERED) || !group.querySelector(SHAPES)) continue;
      try {
        const box = roundBox(boxOfMatrix(ctmOf(group), group.getBBox()));
        if (box.w >= 1 && box.h >= 1) groups.push({ box, group, name: nameOf(group)! });
      } catch { /* malformed or non-measurable SVG groups are ignored */ }
    }
    groups = groups.filter((g) => !groups.some((o) => o !== g && g.group.contains(o.group) && !sameBox(g.box, o.box)));
    groups.sort((a, b) => a.box.y - b.box.y || a.box.x - b.box.x);
    // A single named wrapper is the artboard itself, not an icon.
    if (groups.length === 1 && (groups[0].box.w > 32 || groups[0].box.h > 32)) groups = [];

    const groupIcons = (items: NamedGroup[]) => items.map((f) => {
      let list = shapes.filter((s) => f.group.contains(s.el) && s.box.x < f.box.x + f.box.w && s.box.x + s.box.w > f.box.x && s.box.y < f.box.y + f.box.h && s.box.y + s.box.h > f.box.y);
      if (list.length && isBackground(list[0], f.box, list)) list = list.slice(1);
      return { name: f.name, ...f.box, rects: toRects(paint(f.box, list)) };
    });
    if (groups.length) return { icons: groupIcons(groups), mode: 'groups', skipped };

    let all = shapes;
    const rb = roundBox(rootBox);
    if (all.length && isBackground(all[0], rb, all)) all = all.slice(1);

    // ---- 3. a small SVG is one icon ----
    if (rb.w <= 16 && rb.h <= 16) {
      return { icons: [{ name: nameOf(root.querySelector('g[id]')), ...rb, rects: toRects(paint(rb, all)) }], mode: 'single', skipped };
    }

    // ---- 4. group nearby pixels (approximate) ----
    if (rb.w * rb.h > MAX_CELLS) throw new Error('SVG is too large to import');
    const g = paint(rb, all);
    const seen = g.map((row) => row.map(() => false));
    const clusters: { x0: number; y0: number; x1: number; y1: number }[] = [];
    for (let y = 0; y < rb.h; y++) for (let x = 0; x < rb.w; x++) {
      if (!g[y][x] || seen[y][x]) continue;
      const stack = [[x, y]]; seen[y][x] = true;
      let x0 = x, y0 = y, x1 = x, y1 = y;
      while (stack.length) {
        const [cx, cy] = stack.pop()!;
        x0 = Math.min(x0, cx); y0 = Math.min(y0, cy); x1 = Math.max(x1, cx); y1 = Math.max(y1, cy);
        for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
          const nx = cx + dx, ny = cy + dy;
          if (nx >= 0 && ny >= 0 && nx < rb.w && ny < rb.h && g[ny][nx] && !seen[ny][nx]) { seen[ny][nx] = true; stack.push([nx, ny]); }
        }
      }
      clusters.push({ x0, y0, x1, y1 });
    }
    // parts of one icon can be further apart than the neighbour distance: merge clusters that still fit in 7×5
    for (let merged = true; merged;) {
      merged = false;
      outer: for (let i = 0; i < clusters.length; i++) for (let j = i + 1; j < clusters.length; j++) {
        const a = clusters[i], c = clusters[j];
        const u = { x0: Math.min(a.x0, c.x0), y0: Math.min(a.y0, c.y0), x1: Math.max(a.x1, c.x1), y1: Math.max(a.y1, c.y1) };
        if (u.x1 - u.x0 + 1 <= 7 && u.y1 - u.y0 + 1 <= 5) { clusters[i] = u; clusters.splice(j, 1); merged = true; break outer; }
      }
    }
    const icons: ParsedIcon[] = clusters.map(({ x0, y0, x1, y1 }) => {
      const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
      const box: Box = { x: rb.x + x0 - Math.floor((Math.max(7, bw) - bw) / 2), y: rb.y + y0 - Math.floor((Math.max(5, bh) - bh) / 2), w: Math.max(7, bw), h: Math.max(5, bh) };
      const sub: Grid = Array.from({ length: box.h }, (_, j) => Array.from({ length: box.w }, (_, i) => g[box.y - rb.y + j]?.[box.x - rb.x + i] ?? null));
      return { name: null, ...box, rects: toRects(sub) };
    }).sort((p, q) => p.y - q.y || p.x - q.x);
    return { icons, mode: 'clusters', skipped };
  } finally {
    host.remove();
  }
}
