// Spinner mode: indx-systm's spinners/ folder opened as a document. Each spinner is an artboard whose icons are its
// frames, played in reading order. On disk a spinner is what generate-spinners.mjs compiles: <name>/keyframes/1.svg…
// and an optional config.json { delay, pingpong }. Every frame there lasts one tick, so a frame held for three
// ticks is three identical files; here it is one frame with `hold: 3`.
import { type Artboard, type Doc, type Icon, type Rect, type SpinnerSettings, emptyDoc, uid } from './types';
import { importSvg } from './svg';
import { maximalRects, toGrid } from './pixels';
import { arrangeArtboardItems, iconsInReadingOrder } from './ops';
import * as api from '../api';

/** generate-spinners.mjs's own default, used when a spinner has no config.json. */
export const DEFAULT_DELAY = 100;
/** The Spinner component draws every pixel in its `color`, so frames are kept in one level. */
export const FRAME_FILL = 'lv8';
export const SPINNER_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PAD = 2, GAP = 2, ROW_GAP = 8;

export const settingsOf = (a: Artboard): SpinnerSettings => ({ delay: a.spinner?.delay ?? DEFAULT_DELAY, pingpong: a.spinner?.pingpong ?? false });
export const holdOf = (ic: Icon) => Math.max(1, Math.round(ic.hold ?? 1));
export const framesOf = (a: Artboard) => iconsInReadingOrder(a);
/** One loop tick by tick, as the generator and the Spinner component play it: each frame `hold` times, then
 *  ping-pong runs back over the inner ticks (1,2,3,4 → 1,2,3,4,3,2), so the ends play once. */
export function ticksOf(a: Artboard): Icon[] {
  const ticks = framesOf(a).flatMap((f) => Array<Icon>(holdOf(f)).fill(f));
  return settingsOf(a).pingpong && ticks.length > 2 ? [...ticks, ...ticks.slice(1, -1).reverse()] : ticks;
}
/** A new spinner: one empty 7×5 frame on an artboard that keeps its frames in a row. */
export function newSpinner(doc: Doc, at: { x: number; y: number }): Artboard {
  let n = 1;
  while (doc.artboards.some((a) => a.name === `spinner-${n}`)) n++;
  const frame: Icon = { id: uid(), name: '1', x: PAD, y: PAD, w: 7, h: 5, rects: [] };
  return { id: uid(), name: `spinner-${n}`, x: Math.round(at.x), y: Math.round(at.y), w: 7 + PAD * 2, h: 5 + PAD * 2, icons: [frame], rects: [], grid: { cols: 1, gap: GAP, pad: PAD, auto: true, row: true }, spinner: { delay: DEFAULT_DELAY, pingpong: false } };
}

/** The pixels a frame shows, whatever their fills. Two frames with the same signature write the same file. */
const signature = (ic: { w: number; h: number; rects: Rect[] }) =>
  `${ic.w}x${ic.h}:` + toGrid(ic.rects, ic.w, ic.h).map((row) => row.map((c) => (c ? 1 : 0)).join('')).join('/');

/** A frame as an SVG the generator reads: the fewest rects, in the dark level the hand-exported frames use. */
export function frameSvg(ic: { w: number; h: number; rects: Rect[] }): string {
  const g = toGrid(ic.rects.map((r) => ({ ...r, fill: 'x' })), ic.w, ic.h);
  const rects = maximalRects(g, 'x').map((r) => `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="#080809"/>\n`);
  return `<svg width="${ic.w}" height="${ic.h}" viewBox="0 0 ${ic.w} ${ic.h}" fill="none" xmlns="http://www.w3.org/2000/svg">\n${rects.join('')}</svg>\n`;
}

/** A rect's transform folded into its position and size, as generate-spinners.mjs folds it: Figma writes flips
 *  as matrix(1 0 0 -1 tx ty) and bars as quarter turns. Null for a transform that is not axis-aligned, which the
 *  generator skips too. */
function bakeTransform(el: Element): { x: number; y: number; w: number; h: number } | null {
  const num = (k: string) => parseFloat(el.getAttribute(k) ?? '0') || 0;
  let [x, y, w, h] = [num('x'), num('y'), num('width'), num('height')];
  const t = el.getAttribute('transform') ?? '';
  const mat = t.match(/matrix\(([-\d. ,e]+)\)/);
  if (mat) {
    const [a, b, c, d, e, f] = mat[1].split(/[ ,]+/).map(parseFloat);
    if (!((b === 0 && c === 0) || (a === 0 && d === 0))) return null;
    const px = (u: number, v: number) => a * u + c * v + e, py = (u: number, v: number) => b * u + d * v + f;
    const [x1, y1, x2, y2] = [px(x, y), py(x, y), px(x + w, y + h), py(x + w, y + h)];
    return { x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1), h: Math.abs(y2 - y1) };
  }
  const rot = t.match(/rotate\((-?\d+(?:\.\d+)?)(?:[ ,]+(-?\d+(?:\.\d+)?)[ ,]+(-?\d+(?:\.\d+)?))?\)/);
  if (rot) {
    const angle = ((parseFloat(rot[1]) % 360) + 360) % 360, ca = rot[2] !== undefined ? parseFloat(rot[2]) : 0, cb = rot[3] !== undefined ? parseFloat(rot[3]) : 0;
    if (angle === 90) [x, y, w, h] = [ca - (y - cb) - h, cb + (x - ca), h, w];
    else if (angle === 180) [x, y] = [2 * ca - x - w, 2 * cb - y - h];
    else if (angle === 270) [x, y, w, h] = [ca + (y - cb), cb - (x - ca) - w, h, w];
    else if (angle !== 0) return null;
    return { x, y, w, h };
  }
  return t.trim() ? null : { x, y, w, h };
}

/** A frame read as the generator reads it: white shapes are Figma export artefacts, not pixels, and rect
 *  transforms are folded in. */
function readFrame(svg: string): Pick<Icon, 'w' | 'h' | 'rects'> {
  const dom = new DOMParser().parseFromString(svg, 'image/svg+xml');
  for (const el of Array.from(dom.querySelectorAll('rect[fill],path[fill]')))
    if (/^(?:white|#fff(?:fff)?)$/i.test(el.getAttribute('fill')!.trim())) el.remove();
  for (const el of Array.from(dom.querySelectorAll('rect[transform]'))) {
    const box = bakeTransform(el);
    if (!box) { el.remove(); continue; }
    el.removeAttribute('transform');
    el.setAttribute('x', String(box.x)); el.setAttribute('y', String(box.y));
    el.setAttribute('width', String(box.w)); el.setAttribute('height', String(box.h));
  }
  const ic = importSvg(new XMLSerializer().serializeToString(dom), '', [], false);
  return { w: ic.w, h: ic.h, rects: ic.rects.map((r) => ({ ...r, fill: FRAME_FILL })) };
}

/** What a spinner was when last loaded or saved, by artboard id: renames, removals and untouched files follow from it. */
interface Baseline { name: string; layout: api.SpinnerLayout; config: Record<string, unknown> | null; settings: SpinnerSettings; files: { sig: string; svg: string }[] }

export function spinnersToDoc(spinners: api.SpinnerOnDisk[]): { doc: Doc; baseline: Map<string, Baseline> } {
  let doc = emptyDoc();
  const baseline = new Map<string, Baseline>();
  let y = 0;
  for (const s of spinners) {
    // the generator draws every frame in one viewBox, the last frame's: a narrower frame is that size with empty cells
    const read = s.frames.map((f) => readFrame(f.svg)), last = read[read.length - 1];
    const files = read.map((fr, i) => {
      const sized = last ? { ...fr, w: last.w, h: last.h } : fr;
      return { fr: sized, sig: signature(sized), svg: s.frames[i].svg };
    });
    // identical files in a row are one frame held for that many ticks
    const icons: Icon[] = [];
    for (const f of files) {
      const last = icons[icons.length - 1];
      if (last && signature(last) === f.sig) { last.hold = holdOf(last) + 1; continue; }
      icons.push({ ...f.fr, id: uid(), name: String(icons.length + 1), x: icons.length * 100, y: 0 });
    }
    const c = s.config ?? {};
    const settings: SpinnerSettings = { delay: typeof c.delay === 'number' && c.delay > 0 ? c.delay : DEFAULT_DELAY, pingpong: c.pingpong === true };
    const id = uid();
    doc = { ...doc, artboards: [...doc.artboards, { id, name: s.name, x: 0, y, w: 7 + PAD * 2, h: 5 + PAD * 2, icons, rects: [], grid: { cols: 1, gap: GAP, pad: PAD, auto: true, row: true }, spinner: settings }] };
    doc = arrangeArtboardItems(doc, id);
    y += doc.artboards[doc.artboards.length - 1].h + ROW_GAP;
    baseline.set(id, { name: s.name, layout: s.layout, config: s.config, settings, files: files.map(({ sig, svg }) => ({ sig, svg })) });
  }
  return { doc, baseline };
}

/** config.json with the editor's two settings in it, keeping any other keys the file had. */
function configWith(base: Record<string, unknown>, st: SpinnerSettings): Record<string, unknown> {
  const c: Record<string, unknown> = { ...base, delay: st.delay };
  if (st.pingpong) c.pingpong = true; else delete c.pingpong;
  return c;
}

/** What a save writes: only the spinners that changed, and in those, the original text of every file whose
 *  pixels did not change, so a save touches no more of indx-systm than the edit did. */
export function planSpinnerSave(doc: Doc, baseline: Map<string, Baseline>) {
  const write: api.SpinnerWrite[] = [], problems: string[] = [], next = new Map(baseline);
  const named = doc.artboards.filter((a) => a.icons.length).map((a) => a.name);
  for (const a of doc.artboards) {
    const base = baseline.get(a.id);
    const frames = framesOf(a);
    if (!frames.length) continue; // not a spinner yet, or one being redrawn: what is on disk stays
    if (!SPINNER_NAME.test(a.name)) problems.push(`"${a.name}" is not a spinner name: lowercase letters, digits and single dashes`);
    else if (named.indexOf(a.name) !== named.lastIndexOf(a.name)) problems.push(`Two spinners are called "${a.name}"`);
    const sizes = [...new Set(frames.map((f) => `${f.w}×${f.h}`))];
    if (sizes.length > 1) problems.push(`${a.name}: frames differ in size (${sizes.join(', ')})`);
    const ticks = frames.flatMap((f) => Array<Icon>(holdOf(f)).fill(f));
    const sigs = ticks.map(signature);
    const svgs = ticks.map((t, i) => (base?.files[i]?.sig === sigs[i] ? base.files[i].svg : frameSvg(t)));
    const st = settingsOf(a);
    const config = !base ? (st.delay !== DEFAULT_DELAY || st.pingpong ? configWith({}, st) : null)
      : st.delay !== base.settings.delay || st.pingpong !== base.settings.pingpong ? configWith(base.config ?? {}, st) : undefined;
    const changed = !base || base.name !== a.name || config !== undefined || sigs.length !== base.files.length || sigs.some((s, i) => s !== base.files[i].sig);
    if (!changed) continue;
    const layout = base?.layout ?? 'keyframes';
    write.push({ name: a.name, from: base?.name ?? null, layout, frames: svgs, config });
    next.set(a.id, { name: a.name, layout, config: config === undefined ? base!.config : config, settings: st, files: sigs.map((sig, i) => ({ sig, svg: svgs[i] })) });
  }
  const present = new Set(doc.artboards.map((a) => a.id));
  const remove = [...baseline].filter(([id]) => !present.has(id)).map(([id, b]) => { next.delete(id); return b.name; });
  return { write, remove, problems, next };
}

/** The spinners folder as a document source. `onFolder` hears where it is, or that it has not been set. */
export function spinnerSource(onFolder: (f: { folder: string | null; error?: string }) => void): api.DocSource {
  let baseline = new Map<string, Baseline>();
  return {
    label: 'spinners/',
    event: 'pixl:spinners-changed',
    async load() {
      const r = await api.loadSpinners();
      onFolder({ folder: r.folder, error: r.error });
      if (!r.version) return { doc: null, version: null };
      const loaded = spinnersToDoc(r.spinners);
      baseline = loaded.baseline;
      return { doc: loaded.doc, version: r.version };
    },
    async save(doc, baseVersion, opts) {
      const plan = planSpinnerSave(doc, baseline);
      if (plan.problems.length) throw new Error(plan.problems.join('. '));
      // moving artboards or frames around without changing the order writes nothing
      if (!plan.write.length && !plan.remove.length && baseVersion) return baseVersion;
      const version = await api.saveSpinners(plan.write, plan.remove, baseVersion, opts);
      baseline = plan.next;
      return version;
    },
    version: api.spinnersVersion,
  };
}
