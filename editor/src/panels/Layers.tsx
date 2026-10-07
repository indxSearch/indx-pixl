import { useEffect, useMemo, useState } from 'react';
import { SearchField } from '@indxsearch/systm';
import { Component, Instance, Plus } from '@indxsearch/pixl';
import { useEditor } from '../model/store';
import { type Artboard, type Icon, type Rect, type TextNode, fillAttr, isExported } from '../model/types';
import * as ops from '../model/ops';
import { uid } from '../model/types';
import { Panel } from './Panel';
import { NameInput } from './NameInput';
import { type FindHit, findLayers } from '../model/find';
import { type Pairing, allPairings } from '../model/pairing';
import { Button } from '@indxsearch/systm';

export function Layers({ onMenu, onReveal }: { onMenu: (x: number, y: number, nodeId: string) => void; onReveal: (id: string) => void }) {
  const { state, ui, edit } = useEditor();
  // layer search: ⌘F focuses it, typing turns the tree into a ranked list, Enter or a click reveals the hit
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  // SearchField does not forward a ref, so the field is found by id
  const field = { get current() { return document.getElementById('layer-find') as HTMLInputElement | null; } };
  const [filter, setFilter] = useState<Pairing | null>(null);
  // a pairing filter narrows to motifs of that kind, alone or together with the typed name
  const hits = useMemo(() => {
    if (!filter) return query.trim() ? findLayers(state.doc, query) : [];
    const keep = new Map(allPairings(state.doc).filter((p) => p.pairing === filter).map((p) => [p.ic.id, p]));
    if (query.trim()) return findLayers(state.doc, query).filter((h) => keep.has(h.id));
    return [...keep.values()].map((p): FindHit => ({ id: p.ic.id, kind: 'icon', name: p.ic.name, where: p.artboard, artboardId: p.artboardId, score: 0, marks: [] }))
      .sort((a, b) => a.where.localeCompare(b.where) || a.name.localeCompare(b.name));
  }, [state.doc, query, filter]);
  useEffect(() => setActive(0), [query, filter]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f') { e.preventDefault(); field.current?.focus(); field.current?.select(); } };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, []);
  const reveal = (h: FindHit | undefined) => { if (h) onReveal(h.id); };
  const onFieldKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(hits.length - 1, i + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(0, i - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); reveal(hits[active]); }
    else if (e.key === 'Escape') { e.preventDefault(); setQuery(''); setFilter(null); field.current?.blur(); }
    e.stopPropagation(); // keep editor shortcuts (A, R, digits) out of the field
  };
  const marked = (h: FindHit) => {
    const set = new Set(h.marks);
    return [...h.name].map((ch, i) => (set.has(i) ? <b key={i}>{ch}</b> : <span key={i}>{ch}</span>));
  };
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
  const textRow = (t: TextNode) => (
    <div key={t.id} className={'row' + (sel.includes(t.id) ? ' sel' : '')} style={{ paddingLeft: 24 }} onClick={(e) => pick(e, t.id, null)} onContextMenu={(e) => ctx(e, t.id, null)}>
      <span className="text-glyph">T</span><span className="name">{t.text || 'Text'}</span><span className="dim">{t.x},{t.y}</span>
    </div>
  );
  const iconRow = (a: Artboard, ic: Icon) => {
    const open = isOpen(ic.id, ic.id === focus);
    const live = isExported(a, ic);
    return (
      <div key={ic.id}>
        <div className={'row' + (sel.includes(ic.id) ? ' sel' : '') + (focus === ic.id ? ' focus' : '') + (live ? '' : ' draft')} style={{ paddingLeft: 24 }} onClick={(e) => pick(e, ic.id, null)} onDoubleClick={() => ui({ focus: ic.id, sel: [] })} onContextMenu={(e) => ctx(e, ic.id, null)}>
          <span className="caret" onClick={(e) => { e.stopPropagation(); toggle(ic.id, ic.id === focus); }}>{open ? '▾' : '▸'}</span>
          {ic.instance ? <Instance size={12} color="var(--sel)" /> : <Component size={12} color={live ? 'var(--sel)' : 'var(--lv4)'} />}
          {nameOf(ic.id, ic.name)}
          <span className="dim">{ic.w}×{ic.h}</span>
        </div>
        {open && !ic.instance && ic.rects.slice().reverse().map((r) => rectRow(r, 2, ic.id))}
      </div>
    );
  };

  return (
    <Panel title="Layers" grow right={<button className="icon-btn" title="Add artboard" onClick={addArtboard}><Plus size={14} color="currentColor" /></button>}>
      <div className="layer-search">
        <SearchField id="layer-find" inputSize="micro" placeholder="Find layers  ⌘F" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={onFieldKey} aria-label="Find layers" />
        <div className="pair-filters">
          {(['shared', 'icon only', 'pictogram only'] as Pairing[]).map((f) => (
            <Button key={f} size="micro" variant={filter === f ? 'secondary' : 'ghost'} onClick={() => setFilter(filter === f ? null : f)}>{f}</Button>
          ))}
        </div>
      </div>
      {query.trim() || filter ? (
        <div className="find-results">
          {filter && <div className="hint">{hits.length} {filter === 'shared' ? 'motifs in both sets' : filter === 'icon only' ? 'icons without a pictogram' : 'pictograms without an icon'}{query.trim() ? ' matching' : ''}</div>}
          {!hits.length && <div className="hint">Nothing called that.</div>}
          {hits.map((h, i) => (
            <div key={h.id} className={'row find-hit' + (i === active ? ' active' : '') + (sel.includes(h.id) ? ' sel' : '')} style={{ paddingLeft: 10 }}
              onMouseEnter={() => setActive(i)} onClick={() => reveal(h)} onContextMenu={(e) => ctx(e, h.id, null)}>
              {h.kind === 'artboard' ? <span className="frame-glyph" /> : h.kind === 'text' ? <span className="text-glyph">T</span> : <Instance size={12} color="var(--lv4)" />}
              <span className="name">{marked(h)}</span>
              {h.where && <span className="dim">{h.where}</span>}
            </div>
          ))}
        </div>
      ) : <>
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
                {(a.texts ?? []).slice().reverse().map(textRow)}
                {a.icons.slice().reverse().map((ic) => iconRow(a, ic))}
              </>
            )}
          </div>
        );
      })}
      </>}
    </Panel>
  );
}
