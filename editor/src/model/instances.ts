// Instances, like Figma's: an icon that draws a component's pixels, in one of its colour variants, and
// follows every change to it. It has no rects of its own, cannot be edited, and is not exported.
import type { Doc, Icon, Rect, TextNode } from './types';
import { swapRects, uid } from './types';
import { arrangeArtboardItems } from './ops';

export const iconById = (doc: Doc, id: string): Icon | undefined => doc.artboards.flatMap((a) => a.icons).find((i) => i.id === id);
export const masterOf = (doc: Doc, ic: Icon): Icon | undefined => (ic.instance ? iconById(doc, ic.instance.of) : undefined);

/** The rects an icon draws: its own, or for an instance its component's with the variant's swaps applied. */
export function drawnRects(doc: Doc, ic: Icon): Rect[] {
  const m = masterOf(doc, ic);
  if (!ic.instance) return ic.rects;
  if (!m) return [];
  const swaps = m.variants?.find((v) => v.id === ic.instance!.variant)?.swaps ?? {};
  return swapRects(m.rects, swaps);
}

/** Turn an instance into ordinary pixels it owns, keeping how it looks. */
export function detachInstance(doc: Doc, id: string): Doc {
  const d = structuredClone(doc), ic = iconById(d, id);
  if (!ic?.instance) return doc;
  ic.rects = drawnRects(d, ic).map((r) => ({ ...r, id: uid() }));
  delete ic.instance;
  return d;
}

/** Put an instance of each variant beside its component (skipping ones already placed on that artboard),
 *  named "<component> <variant>", with a label where the artboard labels its icons. Returns the new ids. */
export function placeVariants(doc: Doc, iconId: string): { doc: Doc; ids: string[] } {
  const d = structuredClone(doc);
  const a = d.artboards.find((x) => x.icons.some((i) => i.id === iconId));
  const m = a?.icons.find((i) => i.id === iconId);
  if (!a || !m?.variants?.length) return { doc, ids: [] };
  const label = (a.texts ?? []).find((t) => t.x === m.x + 12 && t.y === m.y);
  const ids: string[] = [];
  m.variants.forEach((v, k) => {
    if (a.icons.some((i) => i.instance?.of === m.id && i.instance.variant === v.id)) return;
    const name = `${m.name} ${v.name}`, x = m.x + 1 + k, y = m.y + 1;
    const inst: Icon = { id: uid(), name, x, y, w: m.w, h: m.h, rects: [], instance: { of: m.id, variant: v.id } };
    const at = a.icons.indexOf(m) + 1 + k;
    a.icons.splice(at, 0, inst);
    ids.push(inst.id);
    if (label) { const t: TextNode = { ...label, id: uid(), text: name, x: x + 12, y }; a.texts = [...(a.texts ?? []), t]; }
  });
  return { doc: a.grid?.auto ? arrangeArtboardItems(d, a.id) : d, ids };
}
