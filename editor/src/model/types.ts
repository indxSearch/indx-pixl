export type Fill = string; // 'lv0'..'lv8' or '#rrggbb'

export interface Rect { id: string; x: number; y: number; w: number; h: number; fill: Fill }
export interface Icon { id: string; name: string; x: number; y: number; w: number; h: number; rects: Rect[]; draft?: boolean }
export interface Artboard { id: string; name: string; x: number; y: number; w: number; h: number; icons: Icon[]; rects: Rect[]; export?: boolean; grid?: IconGrid }

/** Layout used by Arrange icons: columns, spacing between icons, and padding to the artboard edge (icon pixels). */
export interface IconGrid { cols: number; gap: number; pad: number }
export const DEFAULT_GRID: IconGrid = { cols: 10, gap: 7, pad: 7 };

/** Is this icon part of Export all? Draft icons and icons on non-exported artboards are skipped. */
export const isExported = (a: Artboard, ic: Icon) => a.export !== false && !ic.draft;
/** A named document color. `dark` is optional; without it the color is the same in both modes. */
export interface ColorToken { id: string; name: string; light: string; dark?: string }
export interface Doc { version: 1; artboards: Artboard[]; colors?: ColorToken[] }

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

/** systm accent colors (same in light and dark). Values from @indxsearch/systm 2.10 for matching pasted hex. */
export const ACCENTS = [
  { token: 'CSignal', hex: '#ff4238' },
  { token: 'CTeal', hex: '#72f5c6' },
  { token: 'CPureBlue', hex: '#0000ff' },
  { token: 'CLightBlue', hex: '#6b9eff' },
  { token: 'CWarning', hex: '#ffc107' },
] as const;
export const isAccent = (f: Fill) => ACCENTS.some((a) => a.token === f);
/** A design-system token (level or accent) rather than a free hex color. */
export const isToken = (f: Fill) => isLevel(f) || isAccent(f) || f.startsWith('c:');
/** Fill as CSS for rendering inside the editor. Library colors use per-id variables injected by the app. */
export const fillAttr = (f: Fill) => (f.startsWith('c:') ? `var(--pixlc-${f.slice(2)})` : isLevel(f) || isAccent(f) ? `var(--${f})` : f);
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
