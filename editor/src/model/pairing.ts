// Icons and pictograms share a motif by sharing a name: "search" the icon and "search" the pictogram are one
// motif in two forms. Some motifs are icons only (controls, directions), some pictograms only (an owl).
import { type Doc, type Icon, kindOf } from './types';

export type Pairing = 'shared' | 'icon only' | 'pictogram only';

/** Names per kind, leaving out instances: they draw another pictogram and are not motifs of their own. */
function namesByKind(doc: Doc) {
  const icons = new Map<string, Icon>(), pictos = new Map<string, Icon>();
  for (const a of doc.artboards) for (const ic of a.icons) {
    if (ic.instance) continue;
    const m = kindOf(a) === 'pictograms' ? pictos : icons;
    if (!m.has(ic.name)) m.set(ic.name, ic);
  }
  return { icons, pictos };
}

/** What a motif is, and its twin in the other set if it has one. */
export function pairingOf(doc: Doc, ic: Icon, isPictogram: boolean): { pairing: Pairing; twin?: Icon } {
  const { icons, pictos } = namesByKind(doc);
  const twin = (isPictogram ? icons : pictos).get(ic.name);
  return { pairing: twin ? 'shared' : isPictogram ? 'pictogram only' : 'icon only', twin };
}

/** Every motif with its pairing, for the layer filters. */
export function allPairings(doc: Doc): { ic: Icon; artboard: string; artboardId: string; pairing: Pairing }[] {
  const { icons, pictos } = namesByKind(doc);
  return doc.artboards.flatMap((a) => a.icons.filter((ic) => !ic.instance).map((ic) => {
    const pic = kindOf(a) === 'pictograms';
    const shared = (pic ? icons : pictos).has(ic.name);
    return { ic, artboard: a.name, artboardId: a.id, pairing: (shared ? 'shared' : pic ? 'pictogram only' : 'icon only') as Pairing };
  }));
}
