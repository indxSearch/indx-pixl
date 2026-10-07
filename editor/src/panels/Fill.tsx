import { useEffect, useState } from 'react';
import { Button, InputField, Popover, Select } from '@indxsearch/systm';
import { Plus } from '@indxsearch/pixl';
import { useEditor } from '../model/store';
import { ACCENTS, type ColorToken, type Fill as FillT, type Rect, type TextNode, fillAttr, isToken, uid } from '../model/types';
import * as ops from '../model/ops';
import { toHex } from '../model/svg';
import { colorIdOf, colorRef, cssVarOf, differsByMode, findColor, idsUsing, isLink, linkSummary, linkedFrom, linksTo, nameProblem, rawOf, resolveColor, usageOf } from '../model/colors';
import { Panel } from './Panel';
import { TidyColors } from './TidyColors';

const LEVELS = Array.from({ length: 9 }, (_, i) => `lv${i}`);

/** `dark` is the mode the editor shows: the canvas paints library colors in it, and the color editor edits it. */
export function FillPanel({ dark }: { dark: boolean }) {
  const { state, sel, edit, ui } = useEditor();
  const colors = state.doc.colors ?? [];
  const colorIds = sel.filter((n) => n.kind === 'rect' || n.kind === 'text').map((n) => n.id);
  const active = colorIds.length && sel.every((n) => (n.obj as Rect | TextNode).fill === (sel[0].obj as Rect | TextNode).fill) ? (sel[0].obj as Rect | TextNode).fill : state.ui.fill;
  const apply = (f: FillT) => { ui({ fill: f }); if (colorIds.length) edit((d) => ops.setFill(d, colorIds, f)); };
  const [hex, setHex] = useState(isToken(state.ui.fill) ? '#ff4238' : state.ui.fill);
  const [editing, setEditing] = useState<string | null>(null);
  const [tidying, setTidying] = useState(false);
  // drag to sort the library: the dragged color's id, and the index it would be dropped before
  const [dragging, setDragging] = useState<string | null>(null);
  const [dropAt, setDropAt] = useState<number | null>(null);
  const endDrag = () => { setDragging(null); setDropAt(null); };
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

        <div className="lbl-row"><span className="lbl">Colors <span className="dim">double-click to edit · drag to sort</span></span><Button size="micro" variant="ghost" onClick={() => setTidying(true)}>Tidy…</Button></div>
        <TidyColors open={tidying} onOpenChange={setTidying} />
        <div className="accents" onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropAt(null); }}>
          {colors.map((c, i) => swatch(colorRef(c.id), [c.name, linkSummary(colors, c) || (differsByMode(colors, c) ? 'light/dark' : ''), linkedFrom(colors, c.id).length ? `linked from ${linkedFrom(colors, c.id).length}` : ''].filter(Boolean).join(' · '), undefined, {
            onDoubleClick: () => setEditing(c.id),
            onContextMenu: (e) => { e.preventDefault(); setEditing(c.id); },
            draggable: true,
            onDragStart: (e) => { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', c.id); setDragging(c.id); },
            // the left half of a swatch drops before it, the right half after it
            onDragOver: (e) => { if (!dragging) return; e.preventDefault(); const r = e.currentTarget.getBoundingClientRect(); setDropAt(e.clientX < r.left + r.width / 2 ? i : i + 1); },
            onDrop: (e) => { e.preventDefault(); if (dragging && dropAt !== null) edit((d) => ops.moveColorTo(d, dragging, dropAt)); endDrag(); },
            onDragEnd: endDrag,
            className: 'sw-btn' + (active === colorRef(c.id) ? ' active' : '') + (differsByMode(colors, c) ? ' split' : '') + (isLink(c.light) || isLink(c.dark) ? ' linked' : '')
              + (dragging === c.id ? ' dragging' : '') + (dragging && dropAt === i ? ' drop-before' : '') + (dragging && dropAt === i + 1 && i === colors.length - 1 ? ' drop-after' : ''),
            style: { background: differsByMode(colors, c) ? `linear-gradient(135deg, ${resolveColor(colors, c, 'light')} 50%, ${resolveColor(colors, c, 'dark')} 50%)` : fillAttr(colorRef(c.id)) },
          }))}
          <button className="sw-btn add" title="New color" onClick={() => addColor(hex)}><Plus size={14} color="currentColor" /></button>
        </div>
        {editing && <ColorEditor key={editing + (dark ? ':dark' : ':light')} id={editing} dark={dark} onClose={() => setEditing(null)} />}

        <UsedBy fill={active} />

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

/** Find and replace: selects every pixel using the active fill, across all artboards. Clicking another
 *  swatch then recolors the whole selection, since a swatch click applies to the selected rects. */
function UsedBy({ fill }: { fill: FillT }) {
  const { state, ui } = useEditor();
  const ids = idsUsing(state.doc, fill);
  const name = findColor(state.doc, colorIdOf(fill))?.name ?? fill;
  const selected = ids.length > 0 && ids.length === state.ui.sel.length && ids.every((id) => state.ui.sel.includes(id));
  return (
    <div className="used-by">
      <span className="hint">{ids.length ? `${ids.length} pixel${ids.length === 1 ? '' : 's'} use ${name}` : `Nothing uses ${name}`}</span>
      {ids.length > 0 && !selected && <Button size="micro" variant="ghost" onClick={() => ui({ sel: ids, focus: null })}>Select all</Button>}
      {selected && <span className="hint">Selected. Click a swatch to replace.</span>}
    </div>
  );
}

/** Pick a color to link to, seeing each one as it looks in the mode being linked. */
function LinkPicker({ mode, current, options, onPick }: { mode: 'light' | 'dark'; current: string | null; options: ColorToken[]; onPick: (v: string | null) => void }) {
  const { state } = useEditor();
  const colors = state.doc.colors ?? [];
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const shown = options.filter((o) => o.name.toLowerCase().includes(q.trim().toLowerCase()));
  const target = current ? colors.find((o) => colorRef(o.id) === current) : undefined;
  const pick = (v: string | null) => { setOpen(false); setQ(''); onPick(v); };
  return (
    <Popover open={open} onOpenChange={setOpen} side="left" align="start" aria-label={`Link the ${mode} value`}
      trigger={<Button size="micro" variant="secondary">{target ? <><span className="sw" style={{ background: resolveColor(colors, target, mode) }} />{target.name}</> : 'Choose a color…'}</Button>}>
      <div className="link-picker stack">
        <InputField value={q} placeholder="Filter colors" autoFocus onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && shown[0]) pick(colorRef(shown[0].id)); }} />
        <div className="link-list">
          {current && <button className="link-row" onClick={() => pick(null)}><span className="sw" /><span>Own value (unlink)</span></button>}
          {shown.map((o) => (
            <button key={o.id} className={'link-row' + (colorRef(o.id) === current ? ' on' : '')} onClick={() => pick(colorRef(o.id))} title={`${o.name} in ${mode} mode: ${resolveColor(colors, o, mode)}`}>
              <span className="sw" style={{ background: resolveColor(colors, o, mode) }} />
              <span className="name">{o.name}</span>
              <span className="dim mono">{resolveColor(colors, o, mode).toUpperCase()}</span>
            </button>
          ))}
          {!shown.length && <div className="hint">No color called that.</div>}
        </div>
      </div>
    </Popover>
  );
}

/** Edits a library color for the mode the editor is in: in dark mode the top field is the dark value,
 *  in light mode the light value, so toggling Dark in the toolbar flips the artboard and this field
 *  together. The other mode's value sits underneath. A color with no dark value is the same in both
 *  modes until one is set, so editing it in dark mode is what makes it differ. */
function ColorEditor({ id, dark: inDark, onClose }: { id: string; dark: boolean; onClose: () => void }) {
  const { state, edit, ui } = useEditor();
  const c = state.doc.colors?.find((x) => x.id === id);
  const [name, setName] = useState(c?.name ?? '');
  const colors = state.doc.colors ?? [];
  // the text fields hold hex; a linked value shows the linked color instead
  const [light, setLight] = useState(c && !isLink(c.light) ? c.light : '');
  const [dark, setDark] = useState(c && !isLink(rawOf(c, 'dark')) ? rawOf(c, 'dark') : '');
  const [deleting, setDeleting] = useState(false);
  const [replaceWith, setReplaceWith] = useState('hex');
  if (!c) return null;

  const used = usageOf(state.doc, colorRef(c.id));
  const problem = nameProblem(state.doc, { ...c, name });
  const hasDark = c.dark !== undefined && c.dark !== c.light;
  const commitName = () => { if (name !== c.name && !nameProblem(state.doc, { ...c, name })) edit((d) => ops.updateColor(d, c.id, { name })); else setName(c.name); };
  // A value is a hex or a link (`c:<id>`). Light: while there is no dark value, dark follows it.
  const commitLight = (v: string) => { const h = isLink(v) ? v : toHex(v); if (h) { if (!isLink(h)) { setLight(h); if (!hasDark) setDark(h); } edit((d) => ops.updateColor(d, c.id, { light: h })); } };
  // Dark: setting it to the light value again makes the color the same in both modes.
  const commitDark = (v: string) => { const h = isLink(v) ? v : toHex(v); if (h) { if (!isLink(h)) setDark(h); edit((d) => ops.updateColor(d, c.id, { dark: h === c.light ? undefined : h })); } };
  // a color may link to any other, except one that already links back to it
  const loop = linksTo(colors, c.id);
  const linkable = colors.filter((o) => !loop.has(o.id));
  const row = (mode: 'light' | 'dark', current: boolean) => {
    const raw = rawOf(c, mode), linked = isLink(raw), target = linked ? findColor(state.doc, raw.slice(2)) : undefined;
    const value = mode === 'light' ? light : dark, set = mode === 'light' ? setLight : setDark, commit = mode === 'light' ? commitLight : commitDark;
    const unlink = () => commit(resolveColor(colors, c, mode));
    return (
      <div className={'stack color-mode' + (current ? '' : ' other-mode')}>
        <div className="field"><span className="lbl">{mode === 'light' ? 'Light' : 'Dark'}</span>
          {linked ? (
            <>
              <span className="sw lg" style={{ background: resolveColor(colors, c, mode) }} />
              <span className="mono link-name" title="Follows this color">→ {target?.name ?? 'missing color'}</span>
              <Button size="micro" variant="ghost" onClick={unlink}>Unlink</Button>
            </>
          ) : (
            <>
              <input type="color" value={toHex(value) ?? '#000000'} onChange={(e) => commit(e.target.value)} aria-label={`${mode} value`} />
              <InputField value={value} onChange={(e) => set(e.target.value)} onBlur={(e) => commit(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') commit(value); }} />
            </>
          )}
        </div>
        <div className="field"><span className="lbl">Link</span>
          <LinkPicker mode={mode} current={linked ? raw : null} options={linkable} onPick={(v) => (v ? commit(v) : linked && unlink())} />
        </div>
      </div>
    );
  };
  const here: 'light' | 'dark' = inDark ? 'dark' : 'light', there: 'light' | 'dark' = inDark ? 'light' : 'dark';

  const replaceOptions = [
    { label: `Plain hex ${resolveColor(colors, c, 'light')}`, value: 'hex' },
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
      {row(here, true)}
      {row(there, false)}
      {!hasDark && <div className="hint">Same in both modes. Change it while the editor is in {there} mode, or edit {there} above, to make it differ.</div>}
      {hasDark && <Button size="micro" variant="ghost" onClick={() => { const v = rawOf(c, here); if (!isLink(v)) { setLight(v); setDark(v); } edit((d) => ops.updateColor(d, c.id, { light: v, dark: undefined })); }}>Use the {here} value in both modes</Button>}
      <div className="hint">Link a mode to another color to take its value there, like a palette tone: “error background” as red 50 in light and red 900 in dark.</div>
      {(() => {
        const from = linkedFrom(colors, c.id);
        if (!from.length) return null;
        return (
          <div className="linked-from">
            <span className="lbl">Linked from</span>
            <div className="linked-from-list">
              {from.map((o) => (
                <button key={o.id} className="link-row" onClick={() => ui({ fill: colorRef(o.id) })} title={`${o.name}: ${linkSummary(colors, o)}`}>
                  <span className="sw" style={{ background: resolveColor(colors, o, inDark ? 'dark' : 'light') }} />
                  <span className="name">{o.name}</span>
                  <span className="dim">{[o.light === `c:${c.id}` ? 'light' : '', o.dark === `c:${c.id}` || (o.dark === undefined && o.light === `c:${c.id}`) ? 'dark' : ''].filter(Boolean).join(' + ')}</span>
                </button>
              ))}
            </div>
            <div className="hint">Changing this color changes {from.length === 1 ? 'this one' : `these ${from.length}`} too, in the modes shown.</div>
          </div>
        );
      })()}
      <div className="hint">{used ? `Used by ${used} rect${used === 1 ? '' : 's'}.` : 'Not used yet.'} Toggle Dark in the toolbar to see and edit the other mode.</div>

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
