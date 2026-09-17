import { ACCENTS, type ColorToken, type Doc, type Fill, type Icon, type Rect, isAccent, isExported, isLevel, uid } from './types';
import { cssVarOf, slugOf } from './colors';
import { fillsOf, maximalRects, mergedRects, outlinePath, toGrid } from './pixels';

export const LEVELS_LIGHT = ['#FFFFFF', '#FBFBFB', '#EFEFEF', '#CFCFCF', '#757575', '#4A4A50', '#1A1A21', '#121215', '#080809'];

/** Fill as written into exported SVG. Library colors carry their light value as a fallback. */
export function exportFill(f: Fill, colors: ColorToken[] = []): string {
  if (isLevel(f) || isAccent(f)) return `var(--${f})`;
  if (f.startsWith('c:')) {
    const c = colors.find((x) => x.id === f.slice(2));
    return c ? `var(${cssVarOf(c)}, ${c.light})` : '#000000';
  }
  return f;
}

/** One union outline path per fill, like Figma's Union. Rects mode keeps one <rect> per rect. */
export function exportIconSvg(icon: Icon, colors: ColorToken[] = [], mode: 'union' | 'rects' = 'union'): string {
  const fillAttr = (f: Fill) => exportFill(f, colors);
  let lines: string[];
  if (mode === 'rects') lines = icon.rects.map((r) => `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="${fillAttr(r.fill)}"/>`);
  else {
    const g = toGrid(icon.rects, icon.w, icon.h);
    lines = fillsOf(icon.rects).map((f) => outlinePath(g, f)).map((d, i) => d ? `<path d="${d}" fill="${fillAttr(fillsOf(icon.rects)[i])}"/>` : '').filter(Boolean);
  }
  return `<svg width="${icon.w}" height="${icon.h}" viewBox="0 0 ${icon.w} ${icon.h}" fill="none" xmlns="http://www.w3.org/2000/svg">\n${lines.join('\n')}\n</svg>\n`;
}

/** Components that Export all writes. */
export function allComponents(doc: Doc): Icon[] {
  return doc.artboards.flatMap((a) => a.icons.filter((ic) => isExported(a, ic)));
}
/** Components skipped by Export all, with the reason. */
export function skippedComponents(doc: Doc): { icon: Icon; reason: string }[] {
  return doc.artboards.flatMap((a) => a.icons.filter((ic) => !isExported(a, ic)).map((ic) => ({ icon: ic, reason: a.export === false ? `artboard "${a.name}" not exported` : 'not included in export' })));
}

// ---- import ----
export function toHex(c: string): string | null {
  const ctx = document.createElement('canvas').getContext('2d')!;
  ctx.fillStyle = '#000'; ctx.fillStyle = c;
  const v = ctx.fillStyle;
  return /^#[0-9a-f]{6}$/i.test(v) ? v.toLowerCase() : null;
}
const lum = (hex: string) => { const n = parseInt(hex.slice(1), 16); return 0.2126 * (n >> 16) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255); };
/** Colors close to a level (light palette), an accent or a library color become that token; anything else stays hex. */
export function levelOrHex(hex: string, colors: ColorToken[] = [], tolerance = 18): Fill {
  const rgb = (h: string) => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  const [r, g, b] = rgb(hex);
  const candidates: [Fill, string][] = [
    ...LEVELS_LIGHT.map((c, i) => [`lv${i}`, c] as [Fill, string]),
    ...ACCENTS.map((a) => [a.token, a.hex] as [Fill, string]),
    ...colors.flatMap((c) => { const h = toHex(c.light); return h ? [[`c:${c.id}`, h] as [Fill, string]] : []; }),
  ];
  let best: Fill = hex, bd = Infinity;
  for (const [token, c] of candidates) { const [cr, cg, cb] = rgb(c); const d = Math.hypot(r - cr, g - cg, b - cb); if (d < bd) { bd = d; best = token; } }
  return bd <= tolerance ? best : hex;
}

export function nearestLevel(hex: string): Fill {
  const l = lum(hex);
  let best = 0, bd = Infinity;
  LEVELS_LIGHT.forEach((c, i) => { const d = Math.abs(lum(c) - l); if (d < bd) { bd = d; best = i; } });
  return `lv${best}`;
}

/** Rasterize an SVG path onto a W×H cell grid and merge filled cells into maximal rects. */
export function rasterize(d: string, rule: string | null, W: number, H: number): Omit<Rect, 'id' | 'fill'>[] {
  const ctx = document.createElement('canvas').getContext('2d')!;
  const p = new Path2D(d);
  const fr: CanvasFillRule = rule === 'evenodd' ? 'evenodd' : 'nonzero';
  const g = Array.from({ length: H }, (_, y) => Array.from({ length: W }, (_, x) => (ctx.isPointInPath(p, x + 0.5, y + 0.5, fr) ? 'x' : null)));
  return maximalRects(g, 'x');
}

export function importSvg(text: string, name: string, colors: ColorToken[] = [], mapToLevels = true): Omit<Icon, 'x' | 'y'> {
  const root = new DOMParser().parseFromString(text, 'image/svg+xml').querySelector('svg');
  if (!root) throw new Error('Not an SVG');
  let w = 7, h = 5;
  const vb = root.getAttribute('viewBox');
  if (vb) { const a = vb.split(/[\s,]+/).map(Number); w = a[2]; h = a[3]; }
  else { w = parseFloat(root.getAttribute('width') || '7'); h = parseFloat(root.getAttribute('height') || '5'); }
  w = Math.max(1, Math.round(w)); h = Math.max(1, Math.round(h));
  const mapFill = (f: string | null): Fill | null => {
    if (!f || f === 'none') return null;
    const m = f.match(/var\(\s*--(lv[0-8]|C[A-Za-z]+)\b/); if (m && (/^lv/.test(m[1]) || ACCENTS.some((a) => a.token === m[1]))) return m[1];
    const pm = f.match(/var\(\s*--pixl-([a-z0-9-]+)\s*(?:,\s*([^)]+))?\)/);
    if (pm) {
      const c = colors.find((x) => slugOf(x.name) === pm[1]);
      if (c) return `c:${c.id}`;
      f = pm[2]?.trim() ?? '';
    }
    const hex = toHex(f); if (!hex) return null;
    return mapToLevels ? levelOrHex(hex, colors) : hex;
  };
  const rects: Rect[] = [];
  for (const el of Array.from(root.querySelectorAll('rect,path'))) {
    if (el.closest('defs,clipPath,mask,symbol')) continue;
    const fill = mapFill(el.getAttribute('fill') ?? '#000');
    if (!fill) continue;
    if (el.tagName === 'rect') {
      rects.push({ id: uid(), x: Math.round(+(el.getAttribute('x') ?? 0)), y: Math.round(+(el.getAttribute('y') ?? 0)), w: Math.max(1, Math.round(+(el.getAttribute('width') ?? 1))), h: Math.max(1, Math.round(+(el.getAttribute('height') ?? 1))), fill });
    } else {
      for (const r of rasterize(el.getAttribute('d') ?? '', el.getAttribute('fill-rule'), w, h)) rects.push({ id: uid(), ...r, fill });
    }
  }
  const icon = { id: uid(), name, w, h, rects };
  return { ...icon, rects: mergedRects({ ...icon, x: 0, y: 0 }, uid) };
}
