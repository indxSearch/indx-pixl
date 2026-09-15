import { useState } from 'react';
import { Button, InputField } from '@indxsearch/systm';
import { useEditor } from '../model/store';
import { type Fill as FillT, type Rect, fillAttr, isLevel } from '../model/types';
import * as ops from '../model/ops';
import { toHex } from '../model/svg';
import { Panel } from './Panel';

export function FillPanel() {
  const { state, sel, edit, ui } = useEditor();
  const rectIds = sel.filter((n) => n.kind === 'rect').map((n) => n.id);
  const active = rectIds.length && sel.every((n) => (n.obj as Rect).fill === (sel[0].obj as Rect).fill) ? (sel[0].obj as Rect).fill : state.ui.fill;
  const apply = (f: FillT) => { ui({ fill: f }); if (rectIds.length) edit((d) => ops.setFill(d, rectIds, f)); };
  const [hex, setHex] = useState(isLevel(state.ui.fill) ? '#ff4238' : state.ui.fill);
  const recent = [...new Set(state.doc.artboards.flatMap((a) => [...a.rects, ...a.icons.flatMap((i) => i.rects)]).map((r) => r.fill).filter((f) => !isLevel(f)))].slice(0, 18);

  return (
    <Panel title="Fill">
      <div className="stack">
        <span className="lbl">Levels <span className="dim">keys 0–8</span></span>
        <div className="swatches">
          {Array.from({ length: 9 }, (_, i) => `lv${i}`).map((f, i) => (
            <button key={f} className={'sw-btn' + (active === f ? ' active' : '')} style={{ background: fillAttr(f) }} title={`var(--${f})`} onClick={() => apply(f)}><span>{i}</span></button>
          ))}
        </div>
        <span className="lbl">Free color</span>
        <div className="free">
          <input type="color" value={toHex(hex) ?? '#000000'} onChange={(e) => { setHex(e.target.value); apply(e.target.value); }} />
          <InputField value={hex} onChange={(e) => setHex(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { const h = toHex(hex); if (h) apply(h); } }} />
          <Button size="micro" variant="secondary" onClick={() => { const h = toHex(hex); if (h) apply(h); }}>Use</Button>
        </div>
        {recent.length > 0 && <div className="recent">{recent.map((c) => <button key={c} className={'sw-btn' + (active === c ? ' active' : '')} style={{ background: c }} title={c} onClick={() => { setHex(c); apply(c); }} />)}</div>}
      </div>
    </Panel>
  );
}
