import { Component, Instance, Plus } from '@indxsearch/pixl';
import { useEditor } from '../model/store';
import { type Artboard, type Icon, type Rect, fillAttr, isExported } from '../model/types';
import * as ops from '../model/ops';
import { uid } from '../model/types';
import { Panel } from './Panel';
import { NameInput } from './NameInput';

export function Layers({ onMenu }: { onMenu: (x: number, y: number, nodeId: string) => void }) {
  const { state, ui, edit } = useEditor();
  const { doc } = state;
  const { sel, focus, expanded, renaming } = state.ui;
  const nameOf = (id: string, name: string) => renaming?.at === 'layers' && renaming.id === id
    ? <NameInput id={id} name={name} />
    : <span className="name" onDoubleClick={(e) => { e.stopPropagation(); ui({ sel: [id], renaming: { id, at: 'layers' } }); }}>{name}</span>;
  const isOpen = (id: string, dflt: boolean) => expanded[id] ?? dflt;
  const toggle = (id: string, dflt: boolean) => ui({ expanded: { ...expanded, [id]: !isOpen(id, dflt) } });
  const ctx = (e: React.MouseEvent, id: string, focusIcon: string | null) => {
    e.preventDefault(); e.stopPropagation();
    if (!sel.includes(id)) ui({ sel: [id], focus: focusIcon });
    onMenu(e.clientX, e.clientY, id);
  };
  const pick = (e: React.MouseEvent, id: string, focusIcon: string | null) => {
    e.stopPropagation();
    if (e.shiftKey) ui({ sel: sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id], focus: focusIcon });
    else ui({ sel: [id], focus: focusIcon });
  };
  const addArtboard = () => {
    const last = doc.artboards[doc.artboards.length - 1];
    const ab: Artboard = { id: uid(), name: ops.nextName(doc, 'Artboard'), x: last ? last.x + last.w + 10 : 0, y: last ? last.y : 0, w: 80, h: 40, icons: [], rects: [] };
    edit((d) => ops.addArtboard(d, ab));
    ui({ sel: [ab.id] });
  };

  const rectRow = (r: Rect, depth: number, iconId: string | null) => (
    <div key={r.id} className={'row' + (sel.includes(r.id) ? ' sel' : '')} style={{ paddingLeft: 10 + depth * 14 }} onClick={(e) => pick(e, r.id, iconId)} onContextMenu={(e) => ctx(e, r.id, iconId)}>
      <span className="sw" style={{ background: fillAttr(r.fill) }} />
      <span>Rect</span>
      <span className="dim">{r.x},{r.y} · {r.w}×{r.h}</span>
    </div>
  );
  const iconRow = (a: Artboard, ic: Icon) => {
    const open = isOpen(ic.id, ic.id === focus);
    const live = isExported(a, ic);
    return (
      <div key={ic.id}>
        <div className={'row' + (sel.includes(ic.id) ? ' sel' : '') + (focus === ic.id ? ' focus' : '') + (live ? '' : ' draft')} style={{ paddingLeft: 24 }} onClick={(e) => pick(e, ic.id, null)} onDoubleClick={() => ui({ focus: ic.id, sel: [] })} onContextMenu={(e) => ctx(e, ic.id, null)}>
          <span className="caret" onClick={(e) => { e.stopPropagation(); toggle(ic.id, ic.id === focus); }}>{open ? '▾' : '▸'}</span>
          {live ? <Component size={12} color="var(--CPureBlue)" /> : <Instance size={12} color="var(--lv4)" />}
          {nameOf(ic.id, ic.name)}
          <span className="dim">{ic.w}×{ic.h}</span>
        </div>
        {open && ic.rects.slice().reverse().map((r) => rectRow(r, 2, ic.id))}
      </div>
    );
  };

  return (
    <Panel title="Layers" grow right={<button className="icon-btn" title="Add artboard" onClick={addArtboard}><Plus size={14} color="currentColor" /></button>}>
      {!doc.artboards.length && <div className="hint">No artboards yet. Press A and drag on the canvas, or click +.</div>}
      {doc.artboards.slice().reverse().map((a) => {
        const open = isOpen(a.id, true);
        return (
          <div key={a.id}>
            <div className={'row ab' + (sel.includes(a.id) ? ' sel' : '') + (a.export === false ? ' draft' : '')} style={{ paddingLeft: 10 }} onClick={(e) => pick(e, a.id, null)} onContextMenu={(e) => ctx(e, a.id, null)}>
              <span className="caret" onClick={(e) => { e.stopPropagation(); toggle(a.id, true); }}>{open ? '▾' : '▸'}</span>
              <span className="frame-glyph" />
              {nameOf(a.id, a.name)}
              {a.export === false && <span className="tag">not exported</span>}
              <span className="dim">{a.icons.length}</span>
            </div>
            {open && (
              <>
                {a.rects.length > 0 && <div className="row dim-row" style={{ paddingLeft: 24 }}>loose rects</div>}
                {a.rects.slice().reverse().map((r) => rectRow(r, 1, null))}
                {a.icons.slice().reverse().map((ic) => iconRow(a, ic))}
              </>
            )}
          </div>
        );
      })}
    </Panel>
  );
}
