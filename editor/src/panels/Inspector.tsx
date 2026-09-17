import { useEffect, useState } from 'react';
import { Button, InputField, ToggleSwitch } from '@indxsearch/systm';
import { Component, Copy, Download } from '@indxsearch/pixl';
import { useEditor } from '../model/store';
import { type Artboard, DEFAULT_GRID, type Icon, type Node, type Rect, type TextNode, fillAttr, uid } from '../model/types';
import * as ops from '../model/ops';
import { Panel } from './Panel';

const Num = ({ label, value, onChange, min }: { label: string; value: number | ''; onChange: (v: number) => void; min?: number }) => (
  <div className="field">
    <span className="lbl">{label}</span>
    <InputField type="number" value={value} min={min} onChange={(e) => { const v = +e.target.value; if (Number.isFinite(v)) onChange(v | 0); }} />
  </div>
);

export function Inspector({ onCopySvg, onExportIcon, onMakeComponent }: { onCopySvg: (ic: Icon) => void; onExportIcon: (ic: Icon) => void; onMakeComponent: (name: string) => void }) {
  const { state, sel, edit, index, ui } = useEditor();
  const same = (key: 'x' | 'y' | 'w' | 'h') => (sel.every((n) => (n.obj as Rect)[key] === (sel[0].obj as Rect)[key]) ? (sel[0].obj as Rect)[key] : '');
  const setGeo = (key: 'x' | 'y' | 'w' | 'h', v: number) => {
    const val = key === 'w' || key === 'h' ? Math.max(1, v) : v;
    const ids = sel.map((n) => n.id);
    edit((d) => ids.reduce((acc, id) => ops.setGeometry(acc, id, { [key]: val }), d));
  };
  const looseOnly = sel.length > 0 && sel.every((n) => n.kind === 'rect' && !n.iconId) && new Set(sel.map((n) => n.artboardId)).size === 1;
  const [compName, setCompName] = useState('');
  useEffect(() => { if (looseOnly) setCompName(ops.nextName(state.doc, 'icon')); }, [looseOnly, state.doc]);

  if (!sel.length) return <Panel title="Selection"><div className="hint">{state.ui.focus ? `Editing ${(index.get(state.ui.focus)?.obj as Icon | undefined)?.name ?? ''}. Draw with R, Esc to leave.` : 'Nothing selected'}</div></Panel>;

  const crumb = (n: Node) => {
    const a = index.get(n.artboardId)?.obj as Artboard | undefined;
    const ic = n.iconId ? (index.get(n.iconId)?.obj as Icon) : null;
    return [a?.name, ic?.name].filter(Boolean).join(' › ');
  };
  const one = sel.length === 1 ? sel[0] : null;
  const title = one ? ({ artboard: 'Artboard', icon: 'Icon', rect: 'Rect', text: 'Text' } as const)[one.kind] : `${sel.length} selected`;

  return (
    <Panel title={title}>
      <div className="stack">
        <div className="crumb">{crumb(sel[0])}{!one ? ` › ${sel.length} items` : ''}</div>
        {one?.kind === 'text' && (() => {
          const t = one.obj as TextNode;
          return <>
            <div className="field"><span className="lbl">Text</span><InputField value={t.text} onChange={(e) => { const text = e.target.value; edit((d) => ops.setProps(d, one.id, { text, w: Math.max(1, text.length * t.size) })); }} /></div>
            <Num label="Font" value={t.size} min={1} onChange={(size) => edit((d) => ops.setProps(d, one.id, { size, w: Math.max(1, t.text.length * size) }))} />
          </>;
        })()}
        <div className="fields2"><Num label="X" value={same('x')} onChange={(v) => setGeo('x', v)} /><Num label="Y" value={same('y')} onChange={(v) => setGeo('y', v)} /></div>
        <div className="fields2"><Num label="W" value={same('w')} min={1} onChange={(v) => setGeo('w', v)} /><Num label="H" value={same('h')} min={1} onChange={(v) => setGeo('h', v)} /></div>
        {sel.every((n) => n.kind === 'rect' || n.kind === 'text') && (() => {
          const f = sel.every((n) => (n.obj as Rect | TextNode).fill === (sel[0].obj as Rect | TextNode).fill) ? (sel[0].obj as Rect | TextNode).fill : null;
          return <div className="field"><span className="lbl">Fill</span><span className="sw lg" style={{ background: f ? fillAttr(f) : 'var(--lv2)' }} /><span className="mono">{f ? (f.startsWith('c:') ? (state.doc.colors?.find((c) => c.id === f.slice(2))?.name ?? 'missing color') : fillAttr(f)) : 'mixed'}</span></div>;
        })()}
        {one?.kind === 'artboard' && (
          <>
            <ToggleSwitch label="Include in Export all" checked={(one.obj as Artboard).export !== false} onChange={(v) => edit((d) => ops.setProps(d, one.id, { export: v }))} />
            {(one.obj as Artboard).export === false && <div className="hint">Icons on this artboard are skipped by Export all, even if included individually.</div>}
            <div className="rule" />
            <span className="lbl">Icon grid</span>
            {(() => {
              const g = { ...DEFAULT_GRID, ...(one.obj as Artboard).grid };
              const set = (patch: Partial<typeof g>) => edit((d) => ops.arrangeIcons(d, one.id, patch));
              return (
                <>
                  <div className="fields2">
                    <Num label="Cols" value={g.cols} min={1} onChange={(v) => set({ cols: v })} />
                    <Num label="Gap" value={g.gap} min={0} onChange={(v) => set({ gap: v })} />
                  </div>
                  <div className="fields2"><Num label="Pad" value={g.pad} min={0} onChange={(v) => set({ pad: v })} /></div>
                  <Button size="micro" variant="secondary" onClick={() => set({})}>Arrange icons</Button>
                  <div className="hint">Lays icons out in reading order and fits the artboard. Values are in icon pixels.</div>
                </>
              );
            })()}
          </>
        )}
        {one?.kind === 'icon' && (
          <>
            <ToggleSwitch label="Include in export" checked={(one.obj as Icon).export === true} onChange={(v) => edit((d) => ops.setProps(d, one.id, { export: v }))} />
            <div className="field"><span className="lbl">File</span><span className="mono dim">raw-icons/{(one.obj as Icon).name}.svg</span></div>
            <div className="btn-row">
              <Button size="micro" variant="secondary" iconLeft={<Copy />} onClick={() => onCopySvg(one.obj as Icon)}>Copy SVG</Button>
              <Button size="micro" variant="secondary" iconLeft={<Download />} onClick={() => onExportIcon(one.obj as Icon)}>Export</Button>
            </div>
            <Button size="micro" variant="ghost" onClick={() => { edit((d) => ops.detachComponent(d, one.id)); ui({ sel: [] }); }}>Detach component</Button>
          </>
        )}
        {looseOnly && (
          <>
            <div className="rule" />
            <div className="field"><span className="lbl">Name</span><InputField value={compName} onChange={(e) => setCompName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') onMakeComponent(compName); }} /></div>
            <Button size="micro" variant="primary" iconLeft={<Component />} onClick={() => onMakeComponent(compName)}>Make component</Button>
            <div className="hint">Wraps the rects in an icon frame (min 7×5). Only components are exported to raw-icons/.</div>
          </>
        )}
      </div>
    </Panel>
  );
}

export const newId = uid;
