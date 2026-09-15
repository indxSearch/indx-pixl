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

import { mergedRects, sameRects } from './pixels';
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
