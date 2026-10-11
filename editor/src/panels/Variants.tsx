import { useState } from 'react';
import { Button, InputField, Popover } from '@indxsearch/systm';
import { useEditor } from '../model/store';
import { type Fill, type Icon, uid } from '../model/types';
import * as ops from '../model/ops';
import { FillPicker, labelOf, swatchStyle } from './SelectionColors';

/** One swatch cell: the fill as it is in the base or a variant, and a picker that changes it. */
function Cell({ fill, onPick, dim, allowHide }: { fill: Fill; onPick: (f: Fill) => void; dim?: boolean; allowHide?: boolean }) {
  const { state } = useEditor();
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen} side="left" align="start" aria-label="Change color"
      trigger={<button className={'sw-btn' + (dim ? ' same' : '')} style={swatchStyle(fill, state.doc.colors ?? [])} title={labelOf(fill, state.doc)} />}>
      <FillPicker current={fill} allowHide={allowHide} onPick={(f) => { setOpen(false); onPick(f); }} />
    </Popover>
  );
}

/** Colour variants of an icon, like Figma's: the same drawing with some fills swapped. Rows are the fills the
 *  icon uses, columns are the icon itself and each variant; a faded swatch is a fill the variant leaves alone. */
export function Variants({ icon }: { icon: Icon }) {
  const { state, edit, ui } = useEditor();
  const variants = icon.variants ?? [];
  const counts = new Map<Fill, number>();
  for (const r of icon.rects) counts.set(r.fill, (counts.get(r.fill) ?? 0) + 1);
  const fills = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([f]) => f);
  const preview = state.ui.preview?.icon === icon.id ? state.ui.preview.variant : null;
  const nameProblem = (name: string, id: string) =>
    !/^[\p{L}\p{N}][\p{L}\p{N} \-_]*$/u.test(name) ? 'letters, digits, space, - and _' : variants.some((v) => v.id !== id && v.name === name) ? 'already used' : null;
  const add = () => {
    let n = variants.length + 1, name = `variant ${n}`;
    while (variants.some((v) => v.name === name)) name = `variant ${++n}`;
    const id = uid();
    edit((d) => ops.addVariant(d, icon.id, { id, name, swaps: {} }));
    ui({ preview: { icon: icon.id, variant: id } });
  };
  return (
    <div className="variants stack">
      <div className="variants-head"><span className="lbl">Variants</span><Button size="micro" variant="ghost" onClick={add}>Add variant</Button></div>
      {variants.length === 0 && <div className="hint">Colour versions of this {icon.w > 7 || icon.h > 5 ? 'pictogram' : 'icon'} that share its pixels, like a red and a green heart. A variant can also hide a colour, to draw less than the base. Each exports as “{icon.name} &lt;variant&gt;” and as a variant prop.</div>}
      {variants.map((v) => {
        const problem = nameProblem(v.name, v.id);
        return (
          <div key={v.id} className={'variant-row' + (preview === v.id ? ' previewing' : '')}>
            <Button size="micro" variant={preview === v.id ? 'secondary' : 'ghost'} onClick={() => ui({ preview: preview === v.id ? null : { icon: icon.id, variant: v.id } })}>{preview === v.id ? 'Showing' : 'Show'}</Button>
            <InputField value={v.name} onChange={(e) => edit((d) => ops.updateVariant(d, icon.id, v.id, { name: e.target.value }))} aria-label="Variant name" />
            <Button size="micro" variant="ghost" onClick={() => { if (preview === v.id) ui({ preview: null }); edit((d) => ops.deleteVariant(d, icon.id, v.id)); }} aria-label={`Delete ${v.name}`}>×</Button>
            {problem && <div className="warn">“{v.name}”: {problem}</div>}
          </div>
        );
      })}
      {variants.length > 0 && (
        <div className="variant-grid" style={{ gridTemplateColumns: `minmax(0, 1fr) repeat(${variants.length + 1}, 22px)` }}>
          <span className="dim" />
          <span className="dim col-head" title={icon.name}>base</span>
          {variants.map((v) => <span key={v.id} className={'dim col-head' + (preview === v.id ? ' on' : '')} title={v.name}>{v.name.slice(0, 3)}</span>)}
          {fills.map((f) => (
            <div key={f} className="variant-line">
              <span className="variant-fill" title={labelOf(f, state.doc)}>{labelOf(f, state.doc)}</span>
              <Cell fill={f} onPick={(to) => edit((d) => ops.recolorIcon(d, icon.id, f, to))} />
              {variants.map((v) => <Cell key={v.id} fill={v.swaps[f] ?? f} dim={!(f in v.swaps)} allowHide onPick={(to) => edit((d) => ops.setSwap(d, icon.id, v.id, f, to))} />)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
