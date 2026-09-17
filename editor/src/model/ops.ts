// Pure document operations. Each returns a new Doc (via structuredClone; docs are small).
import { type Artboard, type Box, type Doc, type Fill, type Icon, type Rect, indexDoc } from './types';

const clone = (d: Doc): Doc => structuredClone(d);
const find = (d: Doc, artboardId: string) => d.artboards.find((a) => a.id === artboardId);
const findIcon = (a: Artboard, iconId: string) => a.icons.find((i) => i.id === iconId);

/** Move selected nodes; children of a selected ancestor are skipped so they don't move twice. */
export function moveNodes(doc: Doc, ids: string[], dx: number, dy: number): Doc {
  if (!dx && !dy) return doc;
  const d = clone(doc), set = new Set(ids);
  for (const a of d.artboards) {
    if (set.has(a.id)) { a.x += dx; a.y += dy; continue; }
    for (const r of a.rects) if (set.has(r.id)) { r.x += dx; r.y += dy; }
    for (const ic of a.icons) {
      if (set.has(ic.id)) { ic.x += dx; ic.y += dy; continue; }
      for (const r of ic.rects) if (set.has(r.id)) { r.x += dx; r.y += dy; }
    }
  }
  return d;
}

/** Move top-level icons into another artboard while preserving their world position. */
export function moveIconsToArtboard(doc: Doc, iconIds: string[], targetArtboardId: string): Doc {
  if (!iconIds.length) return doc;
  const source = indexDoc(doc), target = source.get(targetArtboardId);
  if (!target || target.kind !== 'artboard') return doc;
  const set = new Set(iconIds), d = clone(doc), moved: Icon[] = [];
  for (const a of d.artboards) {
    const kept: Icon[] = [];
    for (const ic of a.icons) {
      if (!set.has(ic.id)) { kept.push(ic); continue; }
      const n = source.get(ic.id);
      if (n) moved.push({ ...ic, x: n.ax - target.ax, y: n.ay - target.ay });
      else kept.push(ic);
    }
    a.icons = kept;
  }
  const destination = d.artboards.find((a) => a.id === targetArtboardId);
  if (!destination || !moved.length) return doc;
  destination.icons.push(...moved);
  return d;
}

/** Set local geometry (x,y relative to parent) of one node. */
export function setGeometry(doc: Doc, id: string, box: Partial<Box>): Doc {
  const d = clone(doc);
  const n = indexDoc(d).get(id);
  if (!n) return doc;
  Object.assign(n.obj, box);
  return d;
}

export function setProps(doc: Doc, id: string, patch: Partial<Artboard & Icon & Rect>): Doc {
  const d = clone(doc);
  const n = indexDoc(d).get(id);
  if (!n) return doc;
  Object.assign(n.obj, patch);
  return d;
}

export function setFill(doc: Doc, ids: string[], fill: Fill): Doc {
  const d = clone(doc), idx = indexDoc(d);
  for (const id of ids) { const n = idx.get(id); if (n?.kind === 'rect') (n.obj as Rect).fill = fill; }
  return d;
}

export function deleteNodes(doc: Doc, ids: string[]): Doc {
  const d = clone(doc), set = new Set(ids);
  d.artboards = d.artboards.filter((a) => !set.has(a.id));
  for (const a of d.artboards) {
    a.rects = a.rects.filter((r) => !set.has(r.id));
    a.icons = a.icons.filter((i) => !set.has(i.id));
    for (const ic of a.icons) ic.rects = ic.rects.filter((r) => !set.has(r.id));
  }
  return d;
}

/** Duplicate nodes. `idMap` must be provided by the caller (old id -> new id) so the op stays pure. */
export function duplicateNodes(doc: Doc, ids: string[], idMap: Record<string, string>, offset = 1): Doc {
  const d = clone(doc), set = new Set(ids);
  const nid = (old: string) => idMap[old] ?? old;
  const dupRects = (list: Rect[]) => {
    const out: Rect[] = [];
    for (const r of list) { out.push(r); if (set.has(r.id)) out.push({ ...r, id: nid(r.id), x: r.x + offset, y: r.y + offset }); }
    return out;
  };
  const artboards: Artboard[] = [];
  for (const a of d.artboards) {
    artboards.push(a);
    if (set.has(a.id)) {
      const copy: Artboard = structuredClone(a);
      copy.id = nid(a.id); copy.name = a.name + ' copy'; copy.x = offset ? a.x + a.w + 10 : a.x;
      copy.icons.forEach((i) => { i.id = nid(i.id) + '_' + Math.random().toString(36).slice(2, 6); i.rects.forEach((r) => (r.id = nid(r.id) + '_' + Math.random().toString(36).slice(2, 6))); });
      copy.rects.forEach((r) => (r.id = nid(r.id) + '_' + Math.random().toString(36).slice(2, 6)));
      artboards.push(copy);
      continue;
    }
    a.rects = dupRects(a.rects);
    const icons: Icon[] = [];
    for (const ic of a.icons) {
      icons.push(ic);
      if (set.has(ic.id)) {
        icons.push({ ...structuredClone(ic), id: nid(ic.id), name: ic.name + ' copy', x: offset ? ic.x + ic.w + 3 : ic.x, rects: ic.rects.map((r) => ({ ...r, id: nid(r.id) })) });
      } else ic.rects = dupRects(ic.rects);
    }
    a.icons = icons;
  }
  d.artboards = artboards;
  return d;
}

/** Bring selected to front (dir > 0) or send to back (dir < 0) within each container. */
export function reorder(doc: Doc, ids: string[], dir: 1 | -1): Doc {
  const d = clone(doc), set = new Set(ids);
  const re = <T extends { id: string }>(list: T[]): T[] => {
    const sel = list.filter((x) => set.has(x.id)), rest = list.filter((x) => !set.has(x.id));
    return dir > 0 ? [...rest, ...sel] : [...sel, ...rest];
  };
  d.artboards = re(d.artboards);
  for (const a of d.artboards) { a.rects = re(a.rects); a.icons = re(a.icons); for (const ic of a.icons) ic.rects = re(ic.rects); }
  return d;
}

export function addRect(doc: Doc, artboardId: string, iconId: string | null, rect: Rect): Doc {
  const d = clone(doc), a = find(d, artboardId);
  if (!a) return doc;
  if (iconId) { const ic = findIcon(a, iconId); if (!ic) return doc; ic.rects.push(rect); } else a.rects.push(rect);
  return d;
}
export function addIcon(doc: Doc, artboardId: string, icon: Icon): Doc {
  const d = clone(doc), a = find(d, artboardId);
  if (!a) return doc;
  a.icons.push(icon);
  return d;
}
export function addArtboard(doc: Doc, artboard: Artboard): Doc {
  const d = clone(doc);
  d.artboards.push(artboard);
  return d;
}

/** Wrap loose rects of one artboard into a new icon component. */
export function makeComponent(doc: Doc, artboardId: string, rectIds: string[], iconId: string, name: string): Doc {
  const d = clone(doc), a = find(d, artboardId);
  if (!a) return doc;
  const set = new Set(rectIds);
  const rects = a.rects.filter((r) => set.has(r.id));
  if (!rects.length) return doc;
  const x0 = Math.min(...rects.map((r) => r.x)), y0 = Math.min(...rects.map((r) => r.y));
  const x1 = Math.max(...rects.map((r) => r.x + r.w)), y1 = Math.max(...rects.map((r) => r.y + r.h));
  const w = Math.max(7, x1 - x0), h = Math.max(5, y1 - y0);
  a.rects = a.rects.filter((r) => !set.has(r.id));
  a.icons.push({ id: iconId, name, x: x0, y: y0, w, h, rects: rects.map((r) => ({ ...r, x: r.x - x0, y: r.y - y0 })) });
  return d;
}

/** Detach an icon back into loose rects. */
export function detachComponent(doc: Doc, iconId: string): Doc {
  const d = clone(doc);
  for (const a of d.artboards) {
    const ic = findIcon(a, iconId);
    if (!ic) continue;
    a.icons = a.icons.filter((i) => i.id !== iconId);
    a.rects.push(...ic.rects.map((r) => ({ ...r, x: r.x + ic.x, y: r.y + ic.y })));
    return d;
  }
  return doc;
}

export const nextName = (doc: Doc, base: string) => {
  const names = new Set(doc.artboards.flatMap((a) => [a.name, ...a.icons.map((i) => i.name)]));
  let i = 1;
  while (names.has(`${base} ${i}`)) i++;
  return `${base} ${i}`;
};

/** Fresh ids for duplicating `nodes` (icons carry their rects along). */
export function duplicateIdMap(nodes: { id: string; kind: string; obj: unknown }[], uid: () => string): Record<string, string> {
  const map: Record<string, string> = {};
  for (const n of nodes) {
    map[n.id] = uid();
    if (n.kind === 'icon') for (const r of (n.obj as { rects: { id: string }[] }).rects) map[r.id] = uid();
  }
  return map;
}

import { isSplit, mergedRects, sameRects, splitRects } from './pixels';
import { uid as newId } from './types';
/** Normalize icons to maximal rects per fill (the automated "union"). Returns the same doc if nothing changes. */
export function mergeIcons(doc: Doc, iconIds: string[]): Doc {
  const d = clone(doc);
  let changed = false;
  for (const a of d.artboards) for (const ic of a.icons) {
    if (!iconIds.includes(ic.id)) continue;
    const next = mergedRects(ic, newId);
    if (!sameRects(ic.rects, next)) { ic.rects = next; changed = true; }
  }
  return changed ? d : doc;
}

/**
 * Split icons into 1×1 pixels for editing (the reverse of mergeIcons). Returns the same doc if nothing changes.
 * `idMap` receives, for every original rect id, the ids of the pixels it became.
 */
export function splitIcons(doc: Doc, iconIds: string[], idMap?: Map<string, string[]>): Doc {
  const d = clone(doc);
  let changed = false;
  for (const a of d.artboards) for (const ic of a.icons) {
    if (!iconIds.includes(ic.id) || isSplit(ic)) continue;
    ic.rects = splitRects(ic, newId, idMap);
    changed = true;
  }
  return changed ? d : doc;
}
/** Replace ids in a selection using a split idMap. */
export const remapSel = (sel: string[], idMap: Map<string, string[]>) => [...new Set(sel.flatMap((id) => idMap.get(id) ?? [id]))];

import { DEFAULT_GRID, type IconGrid } from './types';
/**
 * Lay out an artboard's icons on a grid in reading order (top-to-bottom, left-to-right by current position),
 * and fit the artboard around them. Loose rects keep their place.
 */
export function arrangeIcons(doc: Doc, artboardId: string, grid?: Partial<IconGrid>): Doc {
  const d = clone(doc), a = find(d, artboardId);
  if (!a) return doc;
  const g: IconGrid = { ...DEFAULT_GRID, ...a.grid, ...grid };
  g.cols = Math.max(1, Math.round(g.cols)); g.gap = Math.max(0, Math.round(g.gap)); g.pad = Math.max(0, Math.round(g.pad));
  a.grid = g;
  if (!a.icons.length) return d;
  const cw = Math.max(...a.icons.map((i) => i.w)), ch = Math.max(...a.icons.map((i) => i.h));
  const ordered = [...a.icons].sort((p, q) => (Math.abs(p.y - q.y) < ch / 2 ? p.x - q.x : p.y - q.y));
  const pos = new Map(ordered.map((ic, i) => [ic.id, i]));
  for (const ic of a.icons) {
    const i = pos.get(ic.id)!;
    ic.x = g.pad + (i % g.cols) * (cw + g.gap);
    ic.y = g.pad + Math.floor(i / g.cols) * (ch + g.gap);
  }
  const cols = Math.min(g.cols, a.icons.length), rows = Math.ceil(a.icons.length / g.cols);
  a.w = g.pad * 2 + cols * (cw + g.gap) - g.gap;
  a.h = g.pad * 2 + rows * (ch + g.gap) - g.gap;
  for (const r of a.rects) { a.w = Math.max(a.w, r.x + r.w); a.h = Math.max(a.h, r.y + r.h); }
  return d;
}

/**
 * Place parsed icons. Into the focused icon when one icon is pasted there; otherwise onto `artboardId`
 * below its existing content (keeping the pasted layout), or onto a new artboard when none is given.
 * Returns the doc and the ids to select.
 */
export function placePasted(
  doc: Doc,
  parsed: { name: string | null; x: number; y: number; w: number; h: number; rects: Rect[] }[],
  target: { artboardId: string | null; focusIconId: string | null },
  newId: () => string,
): { doc: Doc; sel: string[]; artboardId: string | null; into: 'icon' | 'artboard' | 'new' } {
  const d = clone(doc);
  if (target.focusIconId && parsed.length === 1) {
    for (const a of d.artboards) {
      const ic = a.icons.find((i) => i.id === target.focusIconId);
      if (!ic) continue;
      const rects = parsed[0].rects.filter((r) => r.x < ic.w && r.y < ic.h).map((r) => ({ ...r, id: newId(), w: Math.min(r.w, ic.w - r.x), h: Math.min(r.h, ic.h - r.y) }));
      ic.rects.push(...rects);
      return { doc: d, sel: rects.map((r) => r.id), artboardId: a.id, into: 'icon' };
    }
  }
  const minX = Math.min(...parsed.map((p) => p.x)), minY = Math.min(...parsed.map((p) => p.y));
  let a = target.artboardId ? d.artboards.find((x) => x.id === target.artboardId) : undefined;
  const into = a ? 'artboard' : 'new';
  if (!a) {
    const last = d.artboards[d.artboards.length - 1];
    a = { id: newId(), name: nextName(d, 'Pasted'), x: last ? last.x + last.w + 20 : 0, y: last ? last.y : 0, w: 1, h: 1, icons: [], rects: [] };
    d.artboards.push(a);
  }
  const g = { ...DEFAULT_GRID, ...a.grid };
  const bottom = Math.max(0, ...a.icons.map((i) => i.y + i.h), ...a.rects.map((r) => r.y + r.h));
  const ox = g.pad - minX, oy = (a.icons.length || a.rects.length ? bottom + g.gap : g.pad) - minY;
  const taken = new Set(d.artboards.flatMap((x) => x.icons.map((i) => i.name)));
  const sel: string[] = [];
  for (const p of parsed) {
    let name = p.name ?? nextName(d, 'icon');
    if (taken.has(name)) { let n = 2; while (taken.has(`${name} ${n}`)) n++; name = `${name} ${n}`; }
    taken.add(name);
    const icon: Icon = { id: newId(), name, x: p.x + ox, y: p.y + oy, w: Math.max(1, p.w), h: Math.max(1, p.h), rects: p.rects.map((r) => ({ ...r, id: newId() })) };
    a.icons.push(icon);
    sel.push(icon.id);
    a.w = Math.max(a.w, icon.x + icon.w + g.pad);
    a.h = Math.max(a.h, icon.y + icon.h + g.pad);
  }
  return { doc: d, sel, artboardId: a.id, into };
}

import type { ColorToken } from './types';
const replaceFills = (d: Doc, from: Fill, to: Fill) => {
  for (const a of d.artboards) {
    for (const r of a.rects) if (r.fill === from) r.fill = to;
    for (const ic of a.icons) for (const r of ic.rects) if (r.fill === from) r.fill = to;
  }
};
export function addColor(doc: Doc, color: ColorToken, replaceHex?: string): Doc {
  const d = clone(doc);
  d.colors = [...(d.colors ?? []), color];
  if (replaceHex) replaceFills(d, replaceHex, `c:${color.id}`);
  return d;
}
export function updateColor(doc: Doc, id: string, patch: Partial<Omit<ColorToken, 'id'>>): Doc {
  const d = clone(doc);
  const c = d.colors?.find((x) => x.id === id);
  if (!c) return doc;
  Object.assign(c, patch);
  if ('dark' in patch && patch.dark === undefined) delete c.dark;
  return d;
}
/** Delete a color; pixels using it get `replacement`, or the color's light value as plain hex. */
export function deleteColor(doc: Doc, id: string, replacement: Fill | null): Doc {
  const d = clone(doc);
  const c = d.colors?.find((x) => x.id === id);
  if (!c) return doc;
  d.colors = d.colors!.filter((x) => x.id !== id);
  replaceFills(d, `c:${id}`, replacement ?? c.light);
  return d;
}
export function moveColor(doc: Doc, id: string, dir: -1 | 1): Doc {
  const d = clone(doc), list = d.colors ?? [];
  const i = list.findIndex((c) => c.id === id), j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return doc;
  [list[i], list[j]] = [list[j], list[i]];
  return d;
}
