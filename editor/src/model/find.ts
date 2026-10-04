// Layer search, like Figma's: rank names by how well they match what was typed. Small enough to run on
// every keystroke over a few hundred names, so no index is needed.
import type { Doc } from './types';

export type FindKind = 'artboard' | 'icon' | 'text';
export interface FindHit { id: string; kind: FindKind; name: string; where: string; artboardId: string; score: number; marks: number[] }

/** Score one name against the query. Each typed word must be a whole word of the name, or the start or the
 *  end of one ("light" finds "light bulb" and "lighthouse"; "house" finds "lighthouse"; "ghth" finds nothing).
 *  Whole words rank above starts, starts above ends. `marks` are the matched character positions. */
export function scoreName(name: string, query: string): { score: number; marks: number[] } | null {
  const n = name.toLowerCase(), terms = query.toLowerCase().split(/[\s/]+/).filter(Boolean);
  if (!terms.length) return null;
  const words = [...n.matchAll(/[^\s\-_/.]+/g)].map((m) => ({ text: m[0], at: m.index! }));
  let score = n === terms.join(' ') ? 1000 : 0;
  const marks: number[] = [];
  for (const t of terms) {
    let best: { s: number; at: number } | null = null;
    for (const w of words) {
      const s = w.text === t ? 300 : w.text.startsWith(t) ? 200 : w.text.endsWith(t) ? 100 : 0;
      const at = s === 100 ? w.at + w.text.length - t.length : w.at;
      if (s && (!best || s > best.s)) best = { s, at };
    }
    if (!best) return null;
    score += best.s;
    for (let i = 0; i < t.length; i++) marks.push(best.at + i);
  }
  return { score: score - n.length * 0.5, marks };
}

const KIND_RANK: Record<FindKind, number> = { artboard: 2, icon: 1, text: 0 };

/** Artboards, icons and text labels whose names match, best first; artboards win ties. */
export function findLayers(doc: Doc, query: string, limit = 200): FindHit[] {
  const hits: FindHit[] = [];
  const add = (id: string, kind: FindKind, name: string, where: string, artboardId: string) => {
    const s = scoreName(name, query);
    if (s) hits.push({ id, kind, name, where, artboardId, score: s.score, marks: s.marks });
  };
  for (const a of doc.artboards) {
    add(a.id, 'artboard', a.name, '', a.id);
    for (const ic of a.icons) add(ic.id, 'icon', ic.name, a.name, a.id);
    // a label that only names an icon beside it would show every icon twice
    const iconNames = new Set(a.icons.map((ic) => ic.name));
    for (const t of a.texts ?? []) if (!iconNames.has(t.text)) add(t.id, 'text', t.text, a.name, a.id);
  }
  return hits.sort((x, y) => y.score - x.score || KIND_RANK[y.kind] - KIND_RANK[x.kind] || x.name.localeCompare(y.name)).slice(0, limit);
}
