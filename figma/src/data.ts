// pixl.json -> what the plugin ships: every component as one union path per fill, and every fill it uses
// as a paint with a Light and a Dark value. Runs at build time in Node, on the editor's own model, so the
// plugin draws exactly what Export all writes.
import { ACCENTS, isAccent, isLevel, kindOf, type Artboard, type ArtboardKind, type ColorToken, type Doc, type Fill, type Icon } from '../../editor/src/model/types';
import { rawOf } from '../../editor/src/model/colors';
import { fillsOf, outlinePath, toGrid } from '../../editor/src/model/pixels';
import { variantIcon } from '../../editor/src/model/svg';

export const LEVELS_LIGHT = ['#FFFFFF', '#FBFBFB', '#EFEFEF', '#CFCFCF', '#757575', '#4A4A50', '#1A1A21', '#121215', '#080809'];
export const LEVELS_DARK = ['#080809', '#121215', '#1A1A21', '#393941', '#565661', '#8F8F97', '#EFEFEF', '#FBFBFB', '#FFFFFF'];

/** A paint's value in one mode: a colour, or another paint it follows (a linked library colour). */
export type PaintValue = { hex: string } | { alias: Fill };
/** One Figma variable: `name` is its path in the "Pixl" collection. */
export interface PaintSpec { name: string; light: PaintValue; dark: PaintValue }
export interface Layer { fill: Fill; d: string }
export interface VariantSpec { id: string; name: string; layers: Layer[] }
export interface IconSpec {
  id: string; kind: ArtboardKind; board: string; name: string; aliases: string[];
  /** The @indxsearch/pixl component, for icons only: pictograms are not published yet. */
  react?: string;
  w: number; h: number; layers: Layer[]; variants: VariantSpec[];
}
export interface PixlData { icons: IconSpec[]; paints: Record<Fill, PaintSpec> }

/** What goes in the library: everything Export all writes, plus the finished pictograms. Pictogram artboards
 *  are switched off for export until @indxsearch/pixl/pictograms ships, but a designer can use them now;
 *  drafts and rejects stay out, as they do in the lab. */
export function inLibrary(a: Artboard, ic: Icon): boolean {
  if (ic.export !== true || ic.instance || /drafts|rejects/i.test(a.name)) return false;
  return a.export !== false || kindOf(a) === 'pictograms';
}

/** The board's own name, without the "pictograms / " its kind already says. */
const boardName = (a: Artboard) => a.name.replace(/^pictograms\s*\/\s*/i, '');
/** The name convert-icons.js gives the React component: first letter up, spaces to underscores. */
const reactName = (name: string) => name.charAt(0).toUpperCase() + name.slice(1).replace(/ /g, '_');

function layersOf(icon: Icon): Layer[] {
  const g = toGrid(icon.rects, icon.w, icon.h);
  return fillsOf(icon.rects).map((fill) => ({ fill, d: outlinePath(g, fill) })).filter((l) => l.d);
}

export function makeData(doc: Doc): PixlData {
  const colors: ColorToken[] = doc.colors ?? [];
  const icons: IconSpec[] = doc.artboards.flatMap((a) => a.icons.filter((ic) => inLibrary(a, ic)).map((ic): IconSpec => {
    const kind = kindOf(a);
    return {
      id: ic.id, kind, board: boardName(a), name: ic.name, aliases: ic.aliases ?? [],
      react: kind === 'icons' ? reactName(ic.name) : undefined,
      w: ic.w, h: ic.h, layers: layersOf(ic),
      variants: (ic.variants ?? []).map((v) => ({ id: v.id, name: v.name, layers: layersOf(variantIcon(ic, v)) })),
    };
  }));

  // Paints: every fill a layer uses, and every library colour those link to.
  const paints: Record<Fill, PaintSpec> = {};
  const value = (raw: string): PaintValue => (raw.startsWith('c:') ? { alias: raw } : { hex: raw });
  const add = (fill: Fill) => {
    if (paints[fill]) return;
    if (isLevel(fill)) {
      const i = Number(fill.slice(2));
      paints[fill] = { name: `levels/${fill}`, light: { hex: LEVELS_LIGHT[i] }, dark: { hex: LEVELS_DARK[i] } };
    } else if (isAccent(fill)) {
      const hex = ACCENTS.find((a) => a.token === fill)!.hex;
      paints[fill] = { name: `accents/${fill}`, light: { hex }, dark: { hex } };
    } else if (fill.startsWith('c:')) {
      const c = colors.find((x) => x.id === fill.slice(2));
      if (!c) throw new Error(`Fill ${fill} names a colour pixl.json does not have`);
      paints[fill] = { name: `colors/${c.name.replace(/[.{}$]/g, '-')}`, light: value(rawOf(c, 'light')), dark: value(rawOf(c, 'dark')) };
      for (const v of [paints[fill].light, paints[fill].dark]) if ('alias' in v) add(v.alias);
    } // a plain hex fill gets no variable; the plugin paints it as it is
  };
  add('lv0'); // the ground of the library page's boards
  for (const ic of icons) for (const l of [...ic.layers, ...ic.variants.flatMap((v) => v.layers)]) add(l.fill);
  return { icons, paints };
}
