import { useEffect, useState } from 'react';
import { Button, InputField, ToggleSwitch } from '@indxsearch/systm';
import { Component, Copy, Download } from '@indxsearch/pixl';
import { useEditor } from '../model/store';
import { type Artboard, type Icon, type Node, type Rect, fillAttr, uid } from '../model/types';
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
  const title = one ? ({ artboard: 'Artboard', icon: 'Icon', rect: 'Rect' } as const)[one.kind] : `${sel.length} selected`;

  return (
    <Panel title={title}>
      <div className="stack">
        <div className="crumb">{crumb(sel[0])}{!one ? ` › ${sel.length} items` : ''}</div>
        {one && one.kind !== 'rect' && (
          <div className="field"><span className="lbl">Name</span>
            <InputField value={(one.obj as Icon).name} autoFocus={state.ui.rename === one.id} onFocus={(e) => { if (state.ui.rename === one.id) { e.target.select(); ui({ rename: null }); } }} onChange={(e) => edit((d) => ops.setProps(d, one.id, { name: e.target.value }))} />
          </div>
        )}
        <div className="fields2"><Num label="X" value={same('x')} onChange={(v) => setGeo('x', v)} /><Num label="Y" value={same('y')} onChange={(v) => setGeo('y', v)} /></div>
        <div className="fields2"><Num label="W" value={same('w')} min={1} onChange={(v) => setGeo('w', v)} /><Num label="H" value={same('h')} min={1} onChange={(v) => setGeo('h', v)} /></div>
        {sel.every((n) => n.kind === 'rect') && (() => {
          const f = sel.every((n) => (n.obj as Rect).fill === (sel[0].obj as Rect).fill) ? (sel[0].obj as Rect).fill : null;
          return <div className="field"><span className="lbl">Fill</span><span className="sw lg" style={{ background: f ? fillAttr(f) : 'var(--lv2)' }} /><span className="mono">{f ? (f.startsWith('lv') ? `var(--${f})` : f) : 'mixed'}</span></div>;
        })()}
        {one?.kind === 'artboard' && (
          <>
            <ToggleSwitch label="Include in Export all" checked={(one.obj as Artboard).export !== false} onChange={(v) => edit((d) => ops.setProps(d, one.id, { export: v }))} />
            {(one.obj as Artboard).export === false && <div className="hint">Icons on this artboard are drafts and are skipped by Export all.</div>}
          </>
        )}
        {one?.kind === 'icon' && (
          <>
            <ToggleSwitch label="Draft (skip in Export all)" checked={!!(one.obj as Icon).draft} onChange={(v) => edit((d) => ops.setProps(d, one.id, { draft: v }))} />
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
