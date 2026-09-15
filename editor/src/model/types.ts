export type Fill = string; // 'lv0'..'lv8' or '#rrggbb'

export interface Rect { id: string; x: number; y: number; w: number; h: number; fill: Fill }
export interface Icon { id: string; name: string; x: number; y: number; w: number; h: number; rects: Rect[]; draft?: boolean }
export interface Artboard { id: string; name: string; x: number; y: number; w: number; h: number; icons: Icon[]; rects: Rect[]; export?: boolean }

/** Is this icon part of Export all? Draft icons and icons on non-exported artboards are skipped. */
export const isExported = (a: Artboard, ic: Icon) => a.export !== false && !ic.draft;
export interface Doc { version: 1; artboards: Artboard[] }

export type Kind = 'artboard' | 'icon' | 'rect';
export interface Box { x: number; y: number; w: number; h: number }

/** A resolved node: what it is, where it lives, and its absolute world position. */
export interface Node {
  kind: Kind;
  id: string;
  artboardId: string;
  iconId: string | null; // set for rects inside an icon
  obj: Artboard | Icon | Rect;
  ax: number; // absolute world x
  ay: number;
  w: number;
  h: number;
}

export const uid = () => Math.random().toString(36).slice(2, 10);
export const isLevel = (f: Fill) => /^lv[0-8]$/.test(f);
export const fillAttr = (f: Fill) => (isLevel(f) ? `var(--${f})` : f);
export const emptyDoc = (): Doc => ({ version: 1, artboards: [] });

export function indexDoc(doc: Doc): Map<string, Node> {
  const m = new Map<string, Node>();
  for (const a of doc.artboards) {
    m.set(a.id, { kind: 'artboard', id: a.id, artboardId: a.id, iconId: null, obj: a, ax: a.x, ay: a.y, w: a.w, h: a.h });
    for (const r of a.rects) m.set(r.id, { kind: 'rect', id: r.id, artboardId: a.id, iconId: null, obj: r, ax: a.x + r.x, ay: a.y + r.y, w: r.w, h: r.h });
    for (const ic of a.icons) {
      m.set(ic.id, { kind: 'icon', id: ic.id, artboardId: a.id, iconId: null, obj: ic, ax: a.x + ic.x, ay: a.y + ic.y, w: ic.w, h: ic.h });
      for (const r of ic.rects) m.set(r.id, { kind: 'rect', id: r.id, artboardId: a.id, iconId: ic.id, obj: r, ax: a.x + ic.x + r.x, ay: a.y + ic.y + r.y, w: r.w, h: r.h });
    }
  }
  return m;
}

export function bboxOf(nodes: Node[]): Box | null {
  if (!nodes.length) return null;
  const x0 = Math.min(...nodes.map((n) => n.ax)), y0 = Math.min(...nodes.map((n) => n.ay));
  const x1 = Math.max(...nodes.map((n) => n.ax + n.w)), y1 = Math.max(...nodes.map((n) => n.ay + n.h));
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}
export const intersects = (a: Box, b: Box) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
