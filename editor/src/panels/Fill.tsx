import { useEffect, useState } from 'react';
import { Button, InputField, Select, ToggleSwitch } from '@indxsearch/systm';
import { Plus } from '@indxsearch/pixl';
import { useEditor } from '../model/store';
import { ACCENTS, type ColorToken, type Fill as FillT, type Rect, fillAttr, isToken, uid } from '../model/types';
import * as ops from '../model/ops';
import { toHex } from '../model/svg';
import { colorRef, cssVarOf, nameProblem, usageOf } from '../model/colors';
import { Panel } from './Panel';

const LEVELS = Array.from({ length: 9 }, (_, i) => `lv${i}`);

export function FillPanel() {
  const { state, sel, edit, ui } = useEditor();
  const colors = state.doc.colors ?? [];
  const rectIds = sel.filter((n) => n.kind === 'rect').map((n) => n.id);
  const active = rectIds.length && sel.every((n) => (n.obj as Rect).fill === (sel[0].obj as Rect).fill) ? (sel[0].obj as Rect).fill : state.ui.fill;
  const apply = (f: FillT) => { ui({ fill: f }); if (rectIds.length) edit((d) => ops.setFill(d, rectIds, f)); };
  const [hex, setHex] = useState(isToken(state.ui.fill) ? '#ff4238' : state.ui.fill);
  const [editing, setEditing] = useState<string | null>(null);
  const recent = [...new Set(state.doc.artboards.flatMap((a) => [...a.rects, ...a.icons.flatMap((i) => i.rects)]).map((r) => r.fill).filter((f) => !isToken(f)))].slice(0, 18);

  // close the editor if its color disappears (undo, delete)
  useEffect(() => { if (editing && !colors.some((c) => c.id === editing)) setEditing(null); }, [editing, colors]);

  const addColor = (value: string, replaceHex?: string) => {
    const h = toHex(value) ?? '#ffc107';
    const n = colors.length + 1;
    let name = `Color ${n}`, i = n;
    while (colors.some((c) => c.name === name)) name = `Color ${++i}`;
    const c: ColorToken = { id: uid(), name, light: h };
    edit((d) => ops.addColor(d, c, replaceHex));
    ui({ fill: colorRef(c.id) });
    setEditing(c.id);
  };

  const swatch = (f: FillT, title: string, label?: string, extra?: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button key={f} className={'sw-btn' + (active === f ? ' active' : '')} style={{ background: fillAttr(f) }} title={title} onClick={() => apply(f)} {...extra}>{label && <span>{label}</span>}</button>
  );

  return (
    <Panel title="Fill">
      <div className="stack">
        <span className="lbl">Levels <span className="dim">keys 0–8</span></span>
        <div className="swatches">{LEVELS.map((f, i) => swatch(f, `var(--${f})`, String(i)))}</div>

        <span className="lbl">Accents <span className="dim">systm</span></span>
        <div className="accents">{ACCENTS.map((a) => swatch(a.token, `var(--${a.token})`))}</div>

        <span className="lbl">Colors <span className="dim">double-click to edit</span></span>
        <div className="accents">
          {colors.map((c) => swatch(colorRef(c.id), `${c.name} · ${cssVarOf(c)}${c.dark ? ' · light/dark' : ''}`, undefined, {
            onDoubleClick: () => setEditing(c.id),
            onContextMenu: (e) => { e.preventDefault(); setEditing(c.id); },
            className: 'sw-btn' + (active === colorRef(c.id) ? ' active' : '') + (c.dark && c.dark !== c.light ? ' split' : ''),
            style: { background: c.dark && c.dark !== c.light ? `linear-gradient(135deg, ${c.light} 50%, ${c.dark} 50%)` : fillAttr(colorRef(c.id)) },
          }))}
          <button className="sw-btn add" title="New color" onClick={() => addColor(hex)}><Plus size={14} color="currentColor" /></button>
        </div>
        {editing && <ColorEditor key={editing} id={editing} onClose={() => setEditing(null)} />}

        <span className="lbl">Free color</span>
        <div className="free">
          <input type="color" value={toHex(hex) ?? '#000000'} onChange={(e) => { setHex(e.target.value); apply(e.target.value); }} />
          <InputField value={hex} onChange={(e) => setHex(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { const h = toHex(hex); if (h) apply(h); } }} />
          <Button size="micro" variant="secondary" onClick={() => { const h = toHex(hex); if (h) apply(h); }}>Use</Button>
        </div>
        {recent.length > 0 && (
          <>
            <div className="recent">{recent.map((c) => <button key={c} className={'sw-btn' + (active === c ? ' active' : '')} style={{ background: c }} title={`${c} · double-click to save as color`} onClick={() => { setHex(c); apply(c); }} onDoubleClick={() => addColor(c, c)} />)}</div>
            <div className="hint">Double-click a recent color to save it as a library color. Pixels using it switch over.</div>
          </>
        )}
      </div>
    </Panel>
  );
}

function ColorEditor({ id, onClose }: { id: string; onClose: () => void }) {
  const { state, edit, ui } = useEditor();
  const c = state.doc.colors?.find((x) => x.id === id);
  const [name, setName] = useState(c?.name ?? '');
  const [light, setLight] = useState(c?.light ?? '');
  const [dark, setDark] = useState(c?.dark ?? c?.light ?? '');
  const [deleting, setDeleting] = useState(false);
  const [replaceWith, setReplaceWith] = useState('hex');
  if (!c) return null;

  const used = usageOf(state.doc, colorRef(c.id));
  const problem = nameProblem(state.doc, { ...c, name });
  const hasDark = c.dark !== undefined;
  const commitName = () => { if (name !== c.name && !nameProblem(state.doc, { ...c, name })) edit((d) => ops.updateColor(d, c.id, { name })); else setName(c.name); };
  const commitLight = (v: string) => { const h = toHex(v); if (h) { setLight(h); if (!hasDark) setDark(h); edit((d) => ops.updateColor(d, c.id, { light: h })); } };
  const commitDark = (v: string) => { const h = toHex(v); if (h) { setDark(h); edit((d) => ops.updateColor(d, c.id, { dark: h })); } };

  const replaceOptions = [
    { label: `Plain hex ${c.light}`, value: 'hex' },
    ...LEVELS.map((f) => ({ label: `Level ${f.slice(2)}`, value: f })),
    ...ACCENTS.map((a) => ({ label: a.token, value: a.token })),
    ...(state.doc.colors ?? []).filter((o) => o.id !== c.id).map((o) => ({ label: o.name, value: colorRef(o.id) })),
  ];

  return (
    <div className="color-editor">
      <div className="field"><span className="lbl">Name</span>
        <InputField value={name} autoFocus onChange={(e) => setName(e.target.value)} onBlur={commitName} onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }} />
      </div>
      {problem ? <div className="warn">{problem}</div> : <div className="hint mono-hint">{cssVarOf({ ...c, name })}</div>}
      <div className="field"><span className="lbl">Light</span>
        <input type="color" value={toHex(light) ?? '#000000'} onChange={(e) => commitLight(e.target.value)} />
        <InputField value={light} onChange={(e) => setLight(e.target.value)} onBlur={(e) => commitLight(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') commitLight(light); }} />
      </div>
      <ToggleSwitch label="Different in dark mode" checked={hasDark} onChange={(v) => { if (v) setDark(c.light); edit((d) => ops.updateColor(d, c.id, { dark: v ? c.light : undefined })); }} />
      {hasDark && (
        <div className="field"><span className="lbl">Dark</span>
          <input type="color" value={toHex(dark) ?? '#000000'} onChange={(e) => commitDark(e.target.value)} />
          <InputField value={dark} onChange={(e) => setDark(e.target.value)} onBlur={(e) => commitDark(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') commitDark(dark); }} />
        </div>
      )}
      <div className="hint">{used ? `Used by ${used} rect${used === 1 ? '' : 's'}.` : 'Not used yet.'}{hasDark ? ' Toggle Dark in the toolbar to preview.' : ''}</div>

      {deleting ? (
        <div className="stack">
          {used > 0 && (
            <div className="field"><span className="lbl">Then</span>
              <Select size="micro" value={replaceWith} onValueChange={setReplaceWith} options={replaceOptions} aria-label="Replace deleted color with" />
            </div>
          )}
          <div className="btn-row">
            <Button size="micro" variant="ghost" onClick={() => setDeleting(false)}>Cancel</Button>
            <Button size="micro" variant="primary" onClick={() => { edit((d) => ops.deleteColor(d, c.id, replaceWith === 'hex' ? null : replaceWith)); if (state.ui.fill === colorRef(c.id)) ui({ fill: 'lv8' }); onClose(); }}>Delete color</Button>
          </div>
        </div>
      ) : (
        <div className="btn-row">
          <Button size="micro" variant="ghost" onClick={() => edit((d) => ops.moveColor(d, c.id, -1))} aria-label="Move left">←</Button>
          <Button size="micro" variant="ghost" onClick={() => edit((d) => ops.moveColor(d, c.id, 1))} aria-label="Move right">→</Button>
          <span className="spacer" />
          <Button size="micro" variant="ghost" onClick={() => setDeleting(true)}>Delete</Button>
          <Button size="micro" variant="secondary" onClick={onClose}>Done</Button>
        </div>
      )}
    </div>
  );
}
