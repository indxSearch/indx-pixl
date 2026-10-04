import { useMemo, useState } from 'react';
import { Button, InputField, Popover } from '@indxsearch/systm';
import { useEditor } from '../model/store';
import { ACCENTS, type ColorToken, type Doc, type Fill as FillT, type Node, fillAttr, isLevel, uid } from '../model/types';
import * as ops from '../model/ops';
import { colorIdOf, colorRef, findColor } from '../model/colors';
import { toHex } from '../model/svg';
import { Panel } from './Panel';

const LEVELS = Array.from({ length: 9 }, (_, i) => `lv${i}`);

/** Rects and texts a selection covers: an artboard covers everything on it, an icon its pixels. With nothing
 *  selected, the icon being edited. */
function idsInScope(sel: Node[], focusIcon: Node | undefined, doc: Doc): string[] {
  const nodes = sel.length ? sel : focusIcon ? [focusIcon] : [];
  const ids: string[] = [];
  for (const n of nodes) {
    if (n.kind === 'rect' || n.kind === 'text') ids.push(n.id);
    else if (n.kind === 'icon') ids.push(...(doc.artboards.find((a) => a.id === n.artboardId)?.icons.find((i) => i.id === n.id)?.rects.map((r) => r.id) ?? []));
    else if (n.kind === 'artboard') {
      const a = doc.artboards.find((x) => x.id === n.id);
      if (a) ids.push(...a.rects.map((r) => r.id), ...(a.texts ?? []).map((t) => t.id), ...a.icons.flatMap((i) => i.rects.map((r) => r.id)));
    }
  }
  return [...new Set(ids)];
}

/** A swatch's background: library colors that differ per mode show both halves, like the Fill panel. */
export function swatchStyle(f: FillT, colors: ColorToken[]) {
  const c = colors.find((x) => x.id === colorIdOf(f));
  return c?.dark && c.dark !== c.light ? { background: `linear-gradient(135deg, ${c.light} 50%, ${c.dark} 50%)` } : { background: fillAttr(f) };
}

export function labelOf(f: FillT, doc: Doc): string {
  if (isLevel(f)) return `Level ${f.slice(2)}`;
  if (f.startsWith('c:')) return findColor(doc, colorIdOf(f))?.name ?? 'Missing color';
  return f.toUpperCase();
}

/** Every swatch the document offers, plus a hex field: what a selection color can be changed to. */
export function FillPicker({ current, onPick }: { current: FillT; onPick: (f: FillT) => void }) {
  const { state } = useEditor();
  const colors = state.doc.colors ?? [];
  const [hex, setHex] = useState(current.startsWith('#') ? current : '');
  const sw = (f: FillT, title: string) => (
    <button key={f} className={'sw-btn' + (f === current ? ' active' : '')} style={swatchStyle(f, colors)} title={title} onClick={() => onPick(f)} />
  );
  return (
    <div className="fill-picker stack">
      <span className="lbl">Levels</span>
      <div className="swatches">{LEVELS.map((f) => sw(f, `Level ${f.slice(2)}`))}</div>
      <span className="lbl">Accents</span>
      <div className="accents">{ACCENTS.map((a) => sw(a.token, a.token))}</div>
      {colors.length > 0 && <><span className="lbl">Colors</span><div className="accents">{colors.map((c) => sw(colorRef(c.id), c.name))}</div></>}
      <div className="free">
        <input type="color" value={toHex(hex) ?? '#000000'} onChange={(e) => setHex(e.target.value)} aria-label="Free color" />
        <InputField value={hex} placeholder="#rrggbb" onChange={(e) => setHex(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { const h = toHex(hex); if (h) onPick(h); } }} />
        <Button size="micro" variant="secondary" onClick={() => { const h = toHex(hex); if (h) onPick(h); }}>Use</Button>
      </div>
    </div>
  );
}

function ColorRow({ fill, ids }: { fill: FillT; ids: string[] }) {
  const { state, edit, ui } = useEditor();
  const [open, setOpen] = useState(false);
  const colors = state.doc.colors ?? [];
  const isHex = fill.startsWith('#');
  const replace = (to: FillT) => { setOpen(false); ui({ highlight: [] }); if (to !== fill) edit((d) => ops.setFill(d, ids, to)); };
  const save = () => {
    let n = colors.length + 1, name = `Color ${n}`;
    while (colors.some((c) => c.name === name)) name = `Color ${++n}`;
    const c: ColorToken = { id: uid(), name, light: fill };
    ui({ highlight: [] });
    edit((d) => ops.setFill(ops.addColor(d, c), ids, colorRef(c.id)));
  };
  return (
    <div className="sel-color" onMouseEnter={() => ui({ highlight: ids })} onMouseLeave={() => ui({ highlight: [] })}>
      <Popover open={open} onOpenChange={setOpen} side="left" align="start" aria-label="Change color"
        trigger={<button className="sw-btn" style={swatchStyle(fill, colors)} title="Change this color in the selection" />}>
        <FillPicker current={fill} onPick={replace} />
      </Popover>
      <Button size="micro" variant="ghost" className="sel-color-name" onClick={() => ui({ sel: ids, highlight: [] })}>{labelOf(fill, state.doc)}</Button>
      <span className="dim">{ids.length}</span>
      {isHex && <Button size="micro" variant="ghost" onClick={save}>Save</Button>}
    </div>
  );
}

/** Figma's "Selection colors": each color in use in the selection, how much, and a swatch that replaces it. */
export function SelectionColors() {
  const { state, sel, index } = useEditor();
  const focusIcon = state.ui.focus ? index.get(state.ui.focus) : undefined;
  const groups = useMemo(() => {
    const ids = idsInScope(sel, focusIcon, state.doc);
    const by = new Map<FillT, string[]>();
    for (const id of ids) {
      const n = index.get(id);
      const f = n && (n.kind === 'rect' || n.kind === 'text') ? (n.obj as { fill: FillT }).fill : null;
      if (f) by.set(f, [...(by.get(f) ?? []), id]);
    }
    return [...by.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [sel, focusIcon, state.doc, index]);
  if (!groups.length) return null;
  return (
    <Panel title="Selection colors" right={<span className="dim">{groups.length}</span>}>
      <div className="sel-colors">{groups.map(([f, ids]) => <ColorRow key={f} fill={f} ids={ids} />)}</div>
      <div className="hint">Click a swatch to change that color everywhere in the selection. Hover to see where it is, click the name to select those pixels.</div>
    </Panel>
  );
}
