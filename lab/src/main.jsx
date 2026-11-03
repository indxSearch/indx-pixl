// The lab's page: systm tabs at the top, one parameter set per tab in the panel on the left, the
// tab's canvases on the right. The drawing is engine.js; this file holds state and wiring only.
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Alert, AlertDescription, AlertTitle, Button, Combobox, InputField, SegmentedControl, Select, Slider, Tabs, Textarea, ToggleSwitch } from '@indxsearch/systm';
import '@indxsearch/systm/styles.css';
import './lab.css';
import * as E from './engine.js';
// For poking at the renderers from the browser console.
window.PIXL_ENGINE = E;

// ── Parameter sets, one per tab, kept in this browser ───────────────────────────────
const DEFAULTS = {
  banners: {
    style: 'metaball', theme: 'light', layout: 'row', icons: ['search', 'question', 'observr'],
    tone: 'lv3', gridMode: 'over', reach: 0.45, corner: 0, micro: 12, bevel: 3, ditherMeta: false,
    depth: 1, turn: -28, tilt: 22, rounded: true, gap: 0.06, safe: true,
  },
  voxl: {
    icon: 'indx', mat: 'voxl', res: 1, depth: 1, gap: 0.04, relief: 0, rounded: true, inside: true,
    turn: -14, tilt: 12, ortho: true, fill: 0.6, aspect: 0.75, ground: 'black',
    colour: '#FFC21A', colourName: 'Signal yellow',
    genModel: '', genInputs: 'both', genSize: '2K', genCount: 1, genLayout: true,
    glassPalette: 'classic', detail: 'technical', grain: 0.06,
    look: '3d', lookInk: 'theme', patScale: 4, patFront: 'checker', patTop: 'solid', patSide: 'spaced4',
    asciiCols: 120, asciiSet: 'indx', asciiEdges: true,
  },
  type: {
    frame: 'block', size: 'board', theme: 'black', colour: '#FF4238', colourName: 'Signal',
    query: 'serch', upper: true, cellLines: false, icons: 0.03, redact: 0.06, weight: 500, seed: 0,
    hitFrom: 'theme', nearColour: '', mixed: false, head: 'headline',
    layout: 'grid', panels: 7, emptyPanels: 0.2, strips: 0.4, fills: 0.14, tableScale: 1.4, frameWords: false,
    chrome: 'none', background: 'none', motif: '', motifStyle: 'dots', motifSize: 0.6, motifAt: 'center', motifColour: 'ink', hitStyle: 'word',
    iconSet: 'main', air: 0.12, length: 30, leading: 0, breaks: 'none',
    // The hero until copy.json has loaded; the Copy group then offers the whole list.
    copy: 'hero', headline: 'Search. Ask. Observe.',
    text: 'Search. Ask. Observe. Pattern-recognition search that finds what keyword search misses, answers questions from your own content, and tells you what to tune.',
  },
  posters: {
    design: 'index', size: 'posterA', palette: 'terminal', colour: '#FFFFFF', colourName: 'White', pad: 1, cell: 70, spark: 0.03, seed: 0,
  },
  pack: {
    layout: 'post', callouts: true, labels: true, mark: true, markCorner: 'tr', safe: true,
    treatments: { search: 'glass', ask: 'glass', observe: 'glass' },
    picks: {},
    texts: {
      search: ['Every record in memory', 'Typo tolerant'],
      ask: ['Answers from your own data', 'Sources shown'],
      observe: ['Learns from what people search', 'Proposes, you decide'],
    },
    parts: { search: 'IDX-101', ask: 'IDX-102', observe: 'IDX-103' },
  },
  field: {
    size: 'board', mode: 'knockout', cell: 61, icon: 0.5, scale: 2, pos: 'auto', pool: 'all',
    spark: 0.035, style: 'flat', reach: 0.45, corner: 0, theme: 'dark', seed: 0,
    palette: 'terminal', cellGrid: true, cellDots: true, cellPad: 2, fillAll: true, edges: 'even',
    colour: '#FFC21A', colourName: 'Signal yellow',
  },
};
const TABS = [{ value: 'banners', label: 'Banners' }, { value: 'voxl', label: 'Voxl' }, { value: 'field', label: 'Icon field' }, { value: 'pack', label: 'Pack' }, { value: 'posters', label: 'Posters' }, { value: 'type', label: 'Type' }];

const saved = (key, fallback) => { try { return JSON.parse(localStorage.getItem('pixl-lab-' + key)) ?? fallback; } catch { return fallback; } };
const save = (key, value) => { try { localStorage.setItem('pixl-lab-' + key, JSON.stringify(value)); } catch { /* private window: this visit only */ } };

function useParams(tab) {
  // A tab whose defaults changed in a way the saved settings would hide gets a new key (Type: uppercase, 3 Nov 2026).
  const key = { type: 'type-v4' }[tab] ?? tab;
  const [p, setP] = useState(() => ({ ...DEFAULTS[tab], ...saved(key, {}) }));
  useEffect(() => save(key, p), [key, p]);
  const set = useCallback(patch => setP(old => ({ ...old, ...patch })), []);
  const reset = useCallback(() => setP(DEFAULTS[tab]), [tab]);
  return [p, set, reset];
}

// Redraw after the browser has painted the control that changed, one frame per burst of changes.
function useDraw(draw, deps) {
  useLayoutEffect(() => {
    const id = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(id);
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
}

const blit = (target, src) => {
  if (!target) return;
  target.width = src.width; target.height = src.height;
  target.getContext('2d').drawImage(src, 0, 0);
};
const opts = pairs => pairs.map(([value, label]) => ({ value: String(value), label }));
// An icon's pixels as a small SVG, for the pickers.
function PixlThumb({ name, size = 14 }) {
  const ic = E.ICONS[name];
  return (
    <svg width={size} height={size * ic.h / ic.w} viewBox={`0 0 ${ic.w} ${ic.h}`} aria-hidden="true" style={{ display: 'block', flex: 'none' }}>
      {ic.rows.flatMap((row, y) => [...row].map((c, x) => c === '.' ? null : <rect key={`${x},${y}`} x={x} y={y} width="1" height="1" fill="currentColor" />))}
    </svg>
  );
}
const iconOptions = E.ICON_NAMES.map(n => ({ value: n, label: n, icon: <PixlThumb name={n} /> }));
// Search by name first, then by board ("arrows", "vehicles"), every word of the query matching.
const searchIcons = q => {
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const hits = iconOptions.filter(o => words.every(w => o.value.toLowerCase().includes(w) || E.ICONS[o.value].board.toLowerCase().includes(w)));
  return hits.sort((a, b) => (b.value.toLowerCase().startsWith(words[0]) - a.value.toLowerCase().startsWith(words[0])) || a.value.localeCompare(b.value));
};
// The 402 icons are too many to scroll: a Combobox, typed into.
function IconChoice({ label, value, onChange }) {
  return (
    <div className="field"><span>{label}</span>
      <Combobox size="micro" value={value} options={iconOptions} search={searchIcons} onValueChange={onChange} aria-label={label} searchPlaceholder="Icon or board" />
    </div>
  );
}

// ── Panel controls ──────────────────────────────────────────────────────────────────
function Group({ title, children }) {
  return <section className="group"><h2>{title}</h2>{children}</section>;
}
function Choice({ label, value, options, onChange }) {
  return (
    <div className="field"><span>{label}</span>
      <Select size="micro" value={String(value)} options={options} onValueChange={onChange} aria-label={label} />
    </div>
  );
}
function Range({ label, value, min, max, step, onChange, format = v => v }) {
  return (
    <div className="field range"><span>{label}<em>{format(value)}</em></span>
      <Slider min={min} max={max} step={step} value={value} onChange={v => onChange(+v)} aria-label={label} />
    </div>
  );
}
const Switch = ({ label, checked, onChange }) => <ToggleSwitch label={label} checked={checked} onChange={onChange} />;
const pct = v => `${Math.round(v * 100)}%`;
const LOOKS = [{ value: '3d', label: '3D' }, { value: 'pattern', label: 'Patterns' }, { value: 'ascii', label: 'ASCII' }];
const deg = v => `${v}°`;

// The systm's accents, then the candidates for new colours: the moodboard's, plus any added here.
// Anders's swatches (3 Nov 2026): bright, mid, background.
const TERMINAL_GREEN = [['Terminal green', '#5DD1A4'], ['Terminal green, mid', '#3D6C58'], ['Terminal green, background', '#0D1C1A']];
const AMBER = [['Amber', '#C84916'], ['Amber, mid', '#644439'], ['Amber, background', '#221713']];
const SYSTM_COLOURS = [['Signal', '#FF4238'], ['Light blue', '#6B9EFF'], ['Teal', '#72F5C6'], ['Warning', '#FFC107'], ['Pure blue', '#0000FF']];
const MOODBOARD_CANDIDATES = [['Signal yellow', '#FFC21A'], ['Hot orange', '#FF5A1F'], ['Lime', '#C6FF3D'], ['Paper', '#EDEDE8'], ['PCB green', '#17301F']];
const HEX = /^#[0-9a-f]{6}$/i;

function Palette({ p, set, candidates, setCandidates }) {
  const [draft, setDraft] = useState(p.colour);
  useEffect(() => setDraft(p.colour), [p.colour]);
  const pick = (name, hex) => set({ colourName: name, colour: hex.toUpperCase() });
  const isCandidate = candidates.some(([, hex]) => hex.toUpperCase() === p.colour);
  const row = list => (
    <div className="swatches">
      {list.map(([name, hex]) => (
        <Button key={hex} size="micro" variant={hex.toUpperCase() === p.colour ? 'secondary' : 'ghost'} aria-pressed={hex.toUpperCase() === p.colour}
          aria-label={`${name} ${hex}`} title={`${name} ${hex}`} onClick={() => pick(name, hex)}
          iconLeft={<span className="swatch" style={{ background: hex }} />} />
      ))}
    </div>
  );
  return (
    <Group title="Colour">
      <p className="note">The systm's accents, the candidates, then terminal green and amber.</p>
      {row(SYSTM_COLOURS)}
      {row(candidates)}
      {row(TERMINAL_GREEN)}
      {row(AMBER)}
      <InputField label="Try a colour (hex)" value={draft} isValid={HEX.test(draft)} onChange={e => {
        setDraft(e.target.value);
        if (HEX.test(e.target.value)) pick('Custom', e.target.value);
      }} />
      <div className="buttons">
        {isCandidate
          ? <Button size="micro" variant="secondary" onClick={() => setCandidates(candidates.filter(([, hex]) => hex.toUpperCase() !== p.colour))}>Remove candidate</Button>
          : <Button size="micro" variant="secondary" onClick={() => {
              const name = p.colourName === 'Custom' ? `Candidate ${candidates.length + 1}` : p.colourName;
              setCandidates([...candidates, [name, p.colour]]); set({ colourName: name });
            }}>Add as candidate</Button>}
      </div>
      <p className="note">{p.colourName} · {p.colour}</p>
    </Group>
  );
}

// ── Exports: shown as images to save, since the viewer's frame blocks downloads ────────
function useExports() {
  const [items, setItems] = useState([]);
  const add = useCallback((canvas, name) => canvas.toBlob(b => {
    setItems(list => [{ url: URL.createObjectURL(b), name, size: `${canvas.width} × ${canvas.height}`, kind: 'image' }, ...list]);
  }, 'image/png'), []);
  const addVideo = useCallback((url, name) => setItems(list => [{ url, name, kind: 'video' }, ...list]), []);
  return { items, add, addVideo };
}
function Exports({ items }) {
  const ref = useRef(null);
  useEffect(() => { if (items.length) ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, [items.length]);
  if (!items.length) return null;
  return (
    <section ref={ref}>
      <h2>Exported</h2>
      <p className="note">Right-click an image and choose Save Image As (long-press on a phone). The page cannot start a download itself.</p>
      <div className="exports">
        {items.map(it => (
          <figure key={it.url}>
            {it.kind === 'video' ? <video src={it.url} controls loop muted /> : <img src={it.url} alt={it.name} />}
            <figcaption>{it.name}{it.size ? ` · ${it.size}` : ''}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

// ── Banners ─────────────────────────────────────────────────────────────────────────
function BannersPanel({ p, set }) {
  const styleOn = s => p.style === s ? '' : 'dim';
  return <>
    <Group title="Style">
      <Choice label="Style" value={p.style} options={opts([['flat', 'Flat'], ['metaball', 'Metaball'], ['dither', 'Dither'], ['3d', '3D']])} onChange={v => set({ style: v })} />
    </Group>
    <Group title="Slogan">
      {['Search', 'Ask', 'Observe'].map((w, i) => (
        <IconChoice key={w} label={w} value={p.icons[i]} onChange={v => set({ icons: p.icons.map((n, j) => j === i ? v : n) })} />
      ))}
    </Group>
    <Group title="Ground">
      <Choice label="Theme" value={p.theme} options={opts([['dark', 'Dark'], ['light', 'Light']])} onChange={v => set({ theme: v })} />
      <Choice label="Second tone" value={p.tone} options={opts([['lv3', 'Grey (lv3)'], ['info', 'Info blue'], ['teal', 'Teal'], ['signal', 'Signal'], ['lv1', 'Ground']])} onChange={v => set({ tone: v })} />
      <Choice label="Grid" value={p.gridMode} options={opts([['over', 'Over the pixels'], ['behind', 'Fine, behind'], ['none', 'None']])} onChange={v => set({ gridMode: v })} />
    </Group>
    <div className={p.style === 'metaball' || (p.style === 'dither' && p.ditherMeta) ? '' : 'dim'}>
      <Group title="Metaball">
        <Range label="Reach" value={p.reach} min={0} max={1.5} step={0.05} onChange={v => set({ reach: v })} />
        <Range label="Corners" value={p.corner} min={0} max={0.5} step={0.01} onChange={v => set({ corner: v })} />
      </Group>
    </div>
    <div className={styleOn('dither')}>
      <Group title="Dither">
        <Range label="Cells per pixel" value={p.micro} min={6} max={24} step={2} onChange={v => set({ micro: v })} />
        <Range label="Bevel" value={p.bevel} min={1} max={12} step={1} onChange={v => set({ bevel: v })} />
        <Switch label="Shape from metaball" checked={p.ditherMeta} onChange={v => set({ ditherMeta: v })} />
      </Group>
    </div>
    <div className={styleOn('3d')}>
      <Group title="3D">
        <Range label="Depth" value={p.depth} min={0.2} max={3} step={0.1} onChange={v => set({ depth: v })} />
        <Range label="Turn" value={p.turn} min={-60} max={60} step={1} format={deg} onChange={v => set({ turn: v })} />
        <Range label="Tilt" value={p.tilt} min={-45} max={45} step={1} format={deg} onChange={v => set({ tilt: v })} />
        <Range label="Gap" value={p.gap} min={0} max={0.3} step={0.01} onChange={v => set({ gap: v })} />
        <Switch label="Rounded" checked={p.rounded} onChange={v => set({ rounded: v })} />
      </Group>
    </div>
    <Group title="Banner">
      <Choice label="Layout" value={p.layout} options={opts([['row', 'Row'], ['slogan', 'Slogan'], ['hero', 'Hero']])} onChange={v => set({ layout: v })} />
      <Switch label="Safe areas" checked={p.safe} onChange={v => set({ safe: v })} />
    </Group>
    <p className="note">Exports are 2x. The type is FunktionalGrotesk, Geist where its files are missing.</p>
  </>;
}

function Banner({ kind, p, safeBox, exports, title, note }) {
  const ref = useRef(null);
  useDraw(() => blit(ref.current, E.drawBanner(kind, 2, p)), [kind, p]);
  const { W } = E.BANNERS[kind];
  return (
    <section>
      <h2>{title}</h2>
      <p className="note">{note}</p>
      <div className="frame" style={{ maxWidth: W }}>
        <canvas ref={ref} />
        {p.safe && <div className="safe" style={safeBox} />}
      </div>
      <div className="buttons"><Button size="micro" variant="secondary" onClick={() => exports.add(E.drawBanner(kind, 2, p), `linkedin-${kind}-${p.style}-${p.theme}-${p.layout}.png`)}>Export PNG</Button></div>
    </section>
  );
}

function BannersMain({ p, set, exports }) {
  const sheet = useRef(null), morphCanvas = useRef(null), all = useRef(null), morph = useRef(null);
  const [playing, setPlaying] = useState(true), [recording, setRecording] = useState(false);
  const slot = useRef(0);
  useDraw(() => {
    const el = sheet.current; el.replaceChildren();
    for (const { canvas } of E.drawSheet(p)) el.appendChild(canvas);
  }, [p]);
  useEffect(() => { morph.current = E.createMorph(morphCanvas.current); return () => morph.current.stop(); }, []);
  useEffect(() => { morph.current.setParams(p); }, [p]);
  // The whole set in small, drawn a few at a time so the page stays responsive. The slogan only
  // changes which icons the banners use, not how the set looks, so it does not redraw this.
  const { icons, ...look } = p;
  const lookKey = JSON.stringify(look);
  useEffect(() => {
    const el = all.current; el.replaceChildren();
    const names = E.ICON_NAMES.filter(n => E.ICONS[n].w === 7 && E.ICONS[n].h === 5);
    let i = 0, timer = 0;
    const step = () => {
      for (let k = 0; k < 12 && i < names.length; k++, i++) {
        const name = names[i];
        const fig = document.createElement('figure');
        fig.appendChild(E.drawThumb(name, p));
        const cap = document.createElement('figcaption'); cap.textContent = name; fig.appendChild(cap);
        fig.onclick = () => { const s = slot.current; slot.current = (s + 1) % 3; set({ icons: pRef.current.icons.map((n, j) => j === s ? name : n) }); };
        el.appendChild(fig);
      }
      if (i < names.length) timer = setTimeout(step, 0);
    };
    step();
    return () => clearTimeout(timer);
  }, [lookKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const pRef = useRef(p); pRef.current = p;
  return <>
    <Banner kind="profile" p={p} exports={exports} title="LinkedIn profile background, 1584 × 396"
      note="The profile photo covers the lower left on desktop and the middle on mobile: the dashed areas are kept clear."
      safeBox={{ left: '2.5%', top: '38%', width: '27%', height: '62%' }} />
    <Banner kind="company" p={p} exports={exports} title="LinkedIn company page cover, 1128 × 191"
      note="The page logo sits over the lower left." safeBox={{ left: '2%', top: '45%', width: '16%', height: '55%' }} />
    <section>
      <h2>The three, large</h2>
      <div className="sheet" ref={sheet} />
      <div className="buttons"><Button size="micro" variant="secondary" onClick={() => E.drawSheet(p).forEach(({ name, canvas }) => exports.add(canvas, `pixl-${name}-${p.style}-${p.theme}.png`))}>Export the three as PNGs</Button></div>
    </section>
    <section>
      <h2>Morph: Search, Ask, Observe</h2>
      <p className="note">Each pixel travels to a pixel of the next icon; where they pass close the reach joins them and stretches them apart again. For posts: record one loop as a video.</p>
      <div className="frame" style={{ maxWidth: 1200 }}><canvas ref={morphCanvas} width={1200} height={675} /></div>
      <div className="buttons">
        <Button size="micro" variant="secondary" onClick={() => setPlaying(morph.current.toggle())}>{playing ? 'Pause' : 'Play'}</Button>
        <Button size="micro" variant="secondary" loading={recording} onClick={async () => {
          setRecording(true);
          const r = await morph.current.record();
          setRecording(false);
          if (r) exports.addVideo(r.url, `morph-${p.icons.join('-')}.${r.type.includes('mp4') ? 'mp4' : 'webm'} · right-click, Save Video As`);
        }}>Record one loop</Button>
      </div>
    </section>
    <section>
      <h2>Every icon in this style</h2>
      <p className="note">Click one to put it in the next slot of the slogan.</p>
      <div className="all" ref={all} />
    </section>
  </>;
}

// ── Voxl ────────────────────────────────────────────────────────────────────────────
// One theme for the whole Voxl tab: the background, the glass palette and, for patterns and ASCII
// set to the theme's ink, their colour. Until 3 Nov 2026 these were three controls in three places,
// and a green chosen for glass stayed on when the glass was gone.
const THEMES = [{ value: 'black', label: 'Black' }, { value: 'terminal', label: 'Terminal green' }, { value: 'amber', label: 'Amber' }];
const themeOf = p => p.glassPalette === 'terminal' || p.glassPalette === 'amber' ? p.glassPalette : 'black';

function VoxlPanel({ p, set, candidates, setCandidates, gen }) {
  return <>
    <Group title="Theme">
      <SegmentedControl size="micro" stretch items={THEMES} value={themeOf(p)} aria-label="Theme"
        onChange={v => set({ glassPalette: v === 'black' ? 'classic' : v, ground: p.ground === 'none' ? 'none' : 'palette' })} />
    </Group>
    <Group title="Object">
      <IconChoice label="Icon" value={p.icon} onChange={v => set({ icon: v })} />
      <SegmentedControl size="micro" stretch items={LOOKS} value={p.look ?? '3d'} onChange={v => set({ look: v })} aria-label="Look" />
      <Choice label="Material" value={p.mat} options={opts([['voxl', 'Voxl, matte'], ['glass', 'Glass'], ['anodized', 'Anodized'], ['aluminium', 'Aluminium'], ['chrome', 'Chrome']])} onChange={v => set({ mat: v })} />
      {p.mat === 'glass' && <>
        <Switch label="Internals" checked={p.inside} onChange={v => set({ inside: v })} />
        {p.inside && <SegmentedControl size="micro" stretch items={[{ value: 'simple', label: 'Simple' }, { value: 'technical', label: 'Technical' }]} value={p.detail ?? 'simple'} onChange={v => set({ detail: v })} aria-label="Internals detail" />}
      </>}
    </Group>
    {p.look === 'pattern' && (
      <Group title="systm patterns">
        {[['patFront', 'Front faces'], ['patTop', 'Top faces'], ['patSide', 'Side faces']].map(([key, label]) => (
          <Choice key={key} label={label} value={p[key]} options={Object.entries(E.SYSTM_PATTERNS).map(([value, x]) => ({ value, label: x.label }))} onChange={v => set({ [key]: v })} />
        ))}
        <Range label="Pattern pixel" value={p.patScale} min={1} max={12} step={1} format={v => `${v} px`} onChange={v => set({ patScale: v })} />
        <Choice label="Ink" value={p.lookInk} options={opts([['theme', "The theme's colour"], ['white', 'White'], ['colour', 'The colour below']])} onChange={v => set({ lookInk: v })} />
      </Group>
    )}
    {p.look === 'ascii' && (
      <Group title="ASCII">
        <Choice label="Characters" value={p.asciiSet} options={Object.entries(E.ASCII_SETS).map(([value, x]) => ({ value, label: x.label }))} onChange={v => set({ asciiSet: v })} />
        <Range label="Columns" value={p.asciiCols} min={30} max={200} step={2} onChange={v => set({ asciiCols: v })} />
        <Switch label="Edges where faces meet" checked={p.asciiEdges} onChange={v => set({ asciiEdges: v })} />
        <Choice label="Ink" value={p.lookInk} options={opts([['theme', "The theme's colour"], ['white', 'White'], ['colour', 'The colour below']])} onChange={v => set({ lookInk: v })} />
      </Group>
    )}
    <Palette p={p} set={set} candidates={candidates} setCandidates={setCandidates} />
    <Group title="Cubes">
      <Choice label="Cubes per pixel" value={p.res} options={opts([[1, '1'], [2, '2'], [3, '3'], [4, '4']])} onChange={v => set({ res: +v })} />
      <Range label="Depth, in pixels" value={p.depth} min={0.5} max={4} step={0.5} onChange={v => set({ depth: v })} />
      <Range label="Gap" value={p.gap} min={0} max={0.2} step={0.01} onChange={v => set({ gap: v })} />
      <Range label="Relief" value={p.relief} min={0} max={0.6} step={0.05} onChange={v => set({ relief: v })} />
      <Switch label="Rounded" checked={p.rounded} onChange={v => set({ rounded: v })} />
    </Group>
    <Group title="Camera">
      <Range label="Turn" value={p.turn} min={-60} max={60} step={1} format={deg} onChange={v => set({ turn: v })} />
      <Range label="Tilt" value={p.tilt} min={-40} max={40} step={1} format={deg} onChange={v => set({ tilt: v })} />
      <Switch label="Orthographic" checked={p.ortho} onChange={v => set({ ortho: v })} />
    </Group>
    <Group title="Frame">
      <Choice label="Shape" value={p.aspect} options={opts([[0.75, '3:4'], [1.3333, '4:3'], [1, '1:1'], [1.7778, '16:9']])} onChange={v => set({ aspect: +v })} />
      <Range label="Fill" value={p.fill} min={0.3} max={0.85} step={0.05} format={pct} onChange={v => set({ fill: v })} />
      <Choice label="Background" value={p.ground === 'black' ? 'palette' : p.ground} options={opts([['palette', "The theme's"], ['lv0', 'The dark ladder lv0'], ['none', 'Transparent']])} onChange={v => set({ ground: v })} />
      <Choice label="Export size" value={p.exportSize ?? 2048} options={opts([[2048, '2048 px'], [4096, '4096 px']])} onChange={v => set({ exportSize: +v })} />
      {(p.look ?? '3d') === '3d' && <Range label="Grain" value={p.grain ?? 0} min={0} max={0.3} step={0.01} format={pct} onChange={v => set({ grain: v })} />}
    </Group>
    {gen?.hasKey && (
      <Group title={`Generation, ${gen.provider}`}>
        <Choice label="Model" value={p.genModel || gen.defaultModel} options={gen.models.length ? gen.models.map(m => ({ value: m.id, label: m.label })) : [{ value: gen.defaultModel, label: gen.defaultModel }]} onChange={v => set({ genModel: v })} />
        <Choice label="Send" value={p.genInputs} options={opts([['both', 'Render and silhouette'], ['render', 'The render'], ['silhouette', 'The silhouette']])} onChange={v => set({ genInputs: v })} />
        <Choice label="Size" value={p.genSize} options={opts([['1K', '1K'], ['2K', '2K'], ['4K', '4K']])} onChange={v => set({ genSize: v })} />
        <Switch label="Add the cube layout" checked={p.genLayout !== false} onChange={v => set({ genLayout: v })} />
        <Choice label="Images" value={p.genCount} options={opts([[1, '1'], [2, '2'], [3, '3'], [4, '4']])} onChange={v => set({ genCount: +v })} />
      </Group>
    )}
  </>;
}

// An image file as base64 JPEG, its long side at most 1536 px: enough for a model to read the
// material, and a fraction of the upload.
function imageData(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, 1536 / Math.max(img.width, img.height));
      const cv = E.canvasOf(img.width * k, img.height * k);
      cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
      URL.revokeObjectURL(img.src);
      resolve({ mime: 'image/jpeg', data: cv.toDataURL('image/jpeg', 0.92).split(',')[1], url: cv.toDataURL('image/jpeg', 0.8) });
    };
    img.onerror = () => reject(new Error('That file is not an image the browser can read.'));
    img.src = URL.createObjectURL(file);
  });
}

function ReversePrompt({ usePrompt, history, refresh }) {
  const input = useRef(null);
  const [image, setImage] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const take = async file => {
    if (!file) return;
    setError(null); setResult(null);
    try { setImage({ ...(await imageData(file)), name: file.name || 'pasted' }); } catch (e) { setError(e.message); }
  };
  // A pasted image anywhere on the Voxl tab lands here.
  useEffect(() => {
    const onPaste = e => { const f = [...(e.clipboardData?.files ?? [])].find(x => x.type.startsWith('image/')); if (f) { e.preventDefault(); take(f); } };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, []);
  const run = async () => {
    setBusy(true); setError(null);
    try {
      const r = await fetch('/api/reverse', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ image: { mime: image.mime, data: image.data }, name: image.name }) });
      const meta = await r.json();
      if (!r.ok) throw new Error(meta.error ?? `HTTP ${r.status}`);
      setResult(meta); refresh();
    } catch (e) { setError(e.message); }
    setBusy(false);
  };
  return (
    <section>
      <h2>Reverse prompt</h2>
      <p className="note">Choose or paste an image whose look you want. A Gemini 3 Pro text model writes a transform prompt for its material, light and background, never its shape, with the cube rules built in. "Use as prompt" puts it in the prompt box above.</p>
      <div className="buttons">
        <input ref={input} type="file" accept="image/*" hidden onChange={e => { take(e.target.files?.[0]); e.target.value = ''; }} />
        <Button size="micro" variant="secondary" onClick={() => input.current.click()}>Choose image</Button>
        {image && <Button size="micro" variant="primary" loading={busy} onClick={run}>Reverse prompt</Button>}
        {busy && <span className="note">Reading the image…</span>}
      </div>
      {image && <img className="reference" src={image.url} alt={`Reference: ${image.name}`} />}
      {error && <Alert variant="destructive"><AlertTitle>Reverse prompt failed</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
      {result && (
        <div className="reverse-result">
          <pre className="prompt">{result.prompt}</pre>
          <div className="buttons">
            <Button size="micro" variant="primary" onClick={() => usePrompt(result.prompt)}>Use as prompt</Button>
            <span className="note">{result.model}</span>
          </div>
        </div>
      )}
      {history.length > 0 && (
        <div className="reverse-history">
          <h2>Earlier reverse prompts</h2>
          {history.map(h => (
            <div key={h.id} className="reverse-row">
              <img src={h.inputs[0]} alt={`Reference: ${h.name}`} />
              <span className="note">{h.name} · {new Date(h.created).toLocaleString()}</span>
              <Button size="micro" variant="secondary" onClick={() => usePrompt(h.prompt)}>Use as prompt</Button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// Sent with every render (unless the prompt is our own, which says it already): the render is the
// answer, not a hint. Without it the model rearranged the cubes for a glass prompt four times out of
// four; with it and a glass render as input, it kept them all in place.
const RENDER_LEAD = 'The attached render already shows the object as it should be built, each cube in its final place. Make it photoreal in the material described below. Keep every cube exactly where it is, at the size it is; add nothing, remove nothing, move nothing.\n\n';
// What a saved prompt carries besides its text: the comp it was proven with, never the icon, so it
// works on any icon.
const RECIPE_KEYS = ['mat', 'inside', 'res', 'depth', 'gap', 'relief', 'rounded', 'turn', 'tilt', 'ortho', 'fill', 'aspect', 'ground', 'colour', 'colourName', 'genInputs', 'genLayout', 'genSize'];

function SavedPrompts({ prompt, p, set, setEdited }) {
  const [list, setList] = useState([]);
  const [pick, setPick] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState('');
  const load = useCallback(() => fetch('/api/prompts').then(r => r.json()).then(setList).catch(() => {}), []);
  useEffect(() => { load(); }, [load]);
  const chosen = list.find(x => x.slug === pick) ?? list[0];
  const save = async () => {
    const settings = Object.fromEntries(RECIPE_KEYS.map(k => [k, p[k]]));
    const r = await fetch('/api/prompts', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name, prompt, settings }) });
    const entry = await r.json();
    if (r.ok) { setStatus(`Saved as ${entry.name}.`); setName(''); setPick(entry.slug); load(); } else setStatus(entry.error);
    setTimeout(() => setStatus(''), 3000);
  };
  return (
    <div className="saved-prompts">
      <h2>Saved prompts</h2>
      {list.length > 0 && (
        <div className="buttons">
          <Select size="micro" value={chosen.slug} options={list.map(x => ({ value: x.slug, label: x.name }))} onValueChange={setPick} aria-label="Saved prompt" />
          <Button size="micro" variant="secondary" onClick={() => { setEdited(chosen.prompt); set(chosen.settings ?? {}); }}>Use with its settings</Button>
          <Button size="micro" variant="ghost" onClick={() => setEdited(chosen.prompt)}>Use the text only</Button>
        </div>
      )}
      {chosen?.note && <p className="note">{chosen.note}</p>}
      <div className="buttons">
        <InputField placeholder="Name" aria-label="Name for the saved prompt" value={name} onChange={e => setName(e.target.value)} />
        <Button size="micro" variant="secondary" disabled={!name.trim()} onClick={save}>Save this prompt</Button>
        <span className="note">{status}</span>
      </div>
    </div>
  );
}

// The preview's long side: the frame shows at up to 760 css px, 1520 device pixels on a Retina screen.
const PREVIEW = 1600;

// The frame shapes as the image models name them.
const ASPECT_NAME = { 0.75: '3:4', 1.3333: '4:3', 1: '1:1', 1.7778: '16:9' };
const base64Of = canvas => canvas.toDataURL('image/png').split(',')[1];

function VoxlMain({ p, set, exports, gen, generations, refreshGenerations }) {
  const ref = useRef(null);
  const [status, setStatus] = useState('');
  const auto = useMemo(() => E.voxlPrompt(p), [p]);
  // The prompt follows the settings until it is edited by hand; Reset goes back to following.
  const [edited, setEdited] = useState(null);
  const prompt = edited ?? auto;
  const [sending, setSending] = useState(false);
  const images = generations.filter(g => g.kind !== 'reverse' && !g.settings?.mockup);
  const [error, setError] = useState(null);
  useDraw(() => blit(ref.current, E.drawVoxl(p, PREVIEW)), [p]);
  const copy = async () => {
    try { await navigator.clipboard.writeText(prompt); setStatus('Copied.'); }
    catch { setStatus('The clipboard is blocked here: select the prompt and press Cmd+C.'); }
    setTimeout(() => setStatus(''), 2500);
  };
  const sendToGeneration = async () => {
    setSending(true); setError(null);
    try {
      const images = [];
      if (p.genInputs !== 'silhouette') images.push({ name: 'render', data: base64Of(E.drawVoxl(p, 2048)) });
      if (p.genInputs !== 'render') images.push({ name: 'silhouette', data: base64Of(E.drawSilhouette(p, 2048)) });
      blit(ref.current, E.drawVoxl(p, PREVIEW)); // the export left the renderer at export size
      // The prompt names image 1 and image 2; with one image sent, say which it is.
      // With only the flat silhouette sent, the model is told what it is looking at, whatever the
      // prompt: our own opening is replaced, any other prompt (a pasted one) gets the line before it.
      const flat = `The attached image is the exact silhouette of a pixel icon, white on black. Build it as a 3D object of cubes, one per pixel${p.res > 1 ? `, each pixel a ${p.res}×${p.res} block` : ''}, ${p.depth === 1 ? 'one cube' : `${p.depth} cubes`} deep, seen ${p.ortho && Math.abs(p.turn) < 3 && Math.abs(p.tilt) < 3 ? 'from the front' : 'from slightly above and to the side'}. The white areas become the cubes; the black stays empty.\n\n`;
      const text = p.genInputs === 'silhouette'
        ? (/^Image 1 is the composition:/.test(prompt) ? prompt.replace(/^Image 1 is the composition:.*?\n\n/s, flat) : flat + prompt)
        : p.genInputs === 'render' ? prompt.replace(/ Image 2 is the flat pixel icon[^.]*\./, '') : prompt;
      const led = p.genInputs !== 'silhouette' && !/^Image 1 is the composition:/.test(text) ? RENDER_LEAD + text : text;
      // The cube count and grid in words, after the prompt, whatever form the prompt is in.
      const full = p.genLayout !== false ? `${led.trimEnd()}\n\n${E.voxlLayout(p)}` : led;
      const r = await fetch('/api/generate', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prompt: full, images, model: p.genModel || gen.defaultModel, aspectRatio: ASPECT_NAME[p.aspect], imageSize: p.genSize, count: p.genCount, settings: p }),
      });
      const meta = await r.json();
      if (!r.ok) setError(meta.errors?.join('; ') || meta.error || `HTTP ${r.status}`);
      else if (meta.errors?.length) setError(`${meta.outputs.length} of ${p.genCount} came back: ${meta.errors.join('; ')}`);
      refreshGenerations();
    } catch (e) { setError(e.message); }
    setSending(false);
  };
  return <>
    <section>
      <h2>Voxl: the icon made solid</h2>
      <p className="note">Every pixel a block of cubes, on black. The render fixes shape, camera and colour; Nano Banana adds the texture. Send it from here, or attach the exports and the prompt by hand.</p>
      <div className="frame" style={{ maxWidth: 760 }}><canvas ref={ref} /></div>
      <div className="buttons">
        {gen?.hasKey && <Button size="micro" variant="primary" loading={sending} onClick={sendToGeneration}>Send to generation</Button>}
        <Button size="micro" variant={gen?.hasKey ? 'secondary' : 'primary'} onClick={() => { exports.add(E.drawVoxl(p, p.exportSize ?? 2048), `voxl-${p.icon}-${p.look === 'ascii' ? 'ascii' : p.look === 'pattern' ? 'pattern' : p.mat}-${p.colour.slice(1)}.png`); blit(ref.current, E.drawVoxl(p, PREVIEW)); }}>Export render</Button>
        <Button size="micro" variant="secondary" onClick={() => exports.add(E.drawSilhouette(p, 2048), `silhouette-${p.icon}.png`)}>Export silhouette</Button>
        <Button size="micro" variant="secondary" onClick={copy}>Copy prompt</Button>
        {p.look === 'ascii' && <Button size="micro" variant="secondary" onClick={async () => {
          try { await navigator.clipboard.writeText(E.voxlAsciiText(p)); setStatus('ASCII copied.'); } catch { setStatus('The clipboard is blocked here.'); }
          setTimeout(() => setStatus(''), 2500);
        }}>Copy as text</Button>}
        <span className="note">{sending ? `Generating ${p.genCount > 1 ? `${p.genCount} images` : ''}: this takes a while…` : status}</span>
      </div>
      {gen === null && <p className="note">Generation runs in the lab on your machine: <code>node lab/server.mjs</code>, then open http://127.0.0.1:5190/.</p>}
      {gen && !gen.hasKey && <Alert variant="info"><AlertTitle>Generation is off</AlertTitle><AlertDescription>Set OPENROUTER_API_KEY or GEMINI_API_KEY (or put one as KEY=... in lab/.env.local) and restart <code>node lab/server.mjs</code>.</AlertDescription></Alert>}
      {gen?.error && <Alert variant="warning"><AlertDescription>{gen.error}</AlertDescription></Alert>}
      {error && <Alert variant="destructive"><AlertTitle>Generation failed</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
      <div className="prompt-edit">
        <Textarea label={edited == null ? 'Prompt, from the settings' : 'Prompt, edited by hand'} rows={12} value={prompt} onChange={e => setEdited(e.target.value)} />
        {edited != null && <div className="buttons"><Button size="micro" variant="ghost" onClick={() => setEdited(null)}>Reset prompt to the settings</Button></div>}
      </div>
      {gen?.hasKey && <SavedPrompts prompt={prompt} p={p} set={set} setEdited={setEdited} />}
    </section>
    {gen?.hasKey && <ReversePrompt history={generations.filter(g => g.kind === 'reverse')} refresh={refreshGenerations}
      usePrompt={text => { setEdited(text); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />}
    {gen && images.length > 0 && (
      <section>
        <h2>Generations</h2>
        <p className="note">Kept in <code>lab/generations/</code> with their inputs, prompt and settings. "Use these settings" puts the comp back as it was.</p>
        <div className="generations">
          {images.map(g => (
            <figure key={g.id}>
              <div className="outputs">
                {g.outputs.map(o => <a key={o} href={o} target="_blank" rel="noreferrer"><img src={o} alt={`Generated ${g.settings?.icon ?? ''} in ${g.settings?.mat ?? ''}`} /></a>)}
                {!g.outputs.length && <p className="note">{g.errors?.join('; ') || 'No image came back.'}</p>}
              </div>
              <figcaption>
                <span>{g.settings?.icon} · {g.settings?.mat} · {g.settings?.colourName} · {g.model}{g.imageSize ? ` · ${g.imageSize}` : ''}</span>
                <span className="inputs">{g.inputs.map(i => <img key={i} src={i} alt="" />)}</span>
                <span className="buttons">
                  {g.settings && <Button size="micro" variant="secondary" onClick={() => { const { genModel, genInputs, genSize, genCount, ...look } = g.settings; set(look); setEdited(g.prompt === E.voxlPrompt({ ...p, ...look }) ? null : g.prompt); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Use these settings</Button>}
                  <time className="note" dateTime={g.created}>{new Date(g.created).toLocaleString()}</time>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>
    )}
  </>;
}

// ── Icon field ──────────────────────────────────────────────────────────────────────
function FieldPanel({ p, set, candidates, setCandidates }) {
  return <>
    <Group title="Field">
      <Choice label="Size" value={p.size} options={Object.entries(E.FIELD_SIZES).map(([value, v]) => ({ value, label: v[2] }))} onChange={v => set({ size: v })} />
      <Choice label="Mode" value={p.mode} options={opts([['knockout', 'Knockout'], ['inverse', 'Inverse'], ['accent', 'Mark in colour']])} onChange={v => set({ mode: v })} />
      <Range label="Cell" value={p.cell} min={20} max={110} step={1} format={v => `${v} px`} onChange={v => set({ cell: v })} />
      <Choice label="Theme" value={p.palette ?? 'ladder'} options={Object.entries(E.FIELD_PALETTES).map(([value, x]) => ({ value, label: x.label }))} onChange={v => set({ palette: v })} />
      {(p.palette ?? 'ladder') === 'ladder' && <Choice label="Ground" value={p.theme} options={opts([['dark', 'Dark'], ['light', 'Light']])} onChange={v => set({ theme: v })} />}
    </Group>
    <Group title="Grid">
      <Switch label="Lines along every cell edge" checked={p.cellGrid ?? false} onChange={v => set({ cellGrid: v })} />
      <Switch label="Dots at the icon pixel's pitch" checked={p.cellDots ?? false} onChange={v => set({ cellDots: v })} />
      {(p.cellGrid || p.cellDots) && <>
        <Range label="Padding, in icon pixels" value={p.cellPad ?? 2} min={0} max={5} step={1} onChange={v => set({ cellPad: v })} />
        <Switch label="Every cell gets an icon" checked={p.fillAll ?? true} onChange={v => set({ fillAll: v })} />
        <Choice label="Edges" value={p.edges === 'fill' ? 'fill' : 'even'} options={opts([['even', 'Even margin all round'], ['fill', 'Fill the frame (cut cells)']])} onChange={v => set({ edges: v })} />
        <p className="note">On the grid a cell is the 7 × 5 icon plus the padding round it, so it is wider than tall, and the icons sit on the dots. Every icon appears once, so with "every cell gets an icon" the cells grow from the Cell size until there are no more cells than icons.</p>
      </>}
    </Group>
    <Group title="Mark">
      <Choice label="Cells per mark pixel" value={p.scale} options={opts([[1, '1'], [2, '2'], [3, '3'], [4, '4']])} onChange={v => set({ scale: +v })} />
      <Choice label="Mark at" value={p.pos ?? 'auto'} options={opts([['auto', 'Auto (right on LinkedIn)'], ['centre', 'Centre'], ['left', 'Left third'], ['right', 'Right third']])} onChange={v => set({ pos: v })} />
    </Group>
    <Palette p={p} set={set} candidates={candidates} setCandidates={setCandidates} />
    <Group title="Icons">
      <Choice label="From" value={p.pool} options={[{ value: 'all', label: `Every icon (${E.poolSize('all')})` }, { value: 'main', label: `Main (${E.poolSize('main')})` }]} onChange={v => set({ pool: v })} />
      {!(p.cellGrid || p.cellDots) && <Range label="Size in cell" value={p.icon} min={0.25} max={0.9} step={0.01} format={pct} onChange={v => set({ icon: v })} />}
      <Range label="Sparks" value={p.spark} min={0} max={0.12} step={0.005} format={pct} onChange={v => set({ spark: v })} />
      <Choice label="Style" value={p.style} options={opts([['flat', 'Flat'], ['metaball', 'Metaball']])} onChange={v => set({ style: v })} />
      {p.style === 'metaball' && <>
        <Range label="Reach" value={p.reach} min={0} max={1.5} step={0.05} onChange={v => set({ reach: v })} />
        <Range label="Corners" value={p.corner} min={0} max={0.5} step={0.01} onChange={v => set({ corner: v })} />
      </>}
    </Group>
  </>;
}

// Where LinkedIn covers a banner, as on the Banners tab: shown over the preview, never exported.
function SafeArea({ size }) {
  const b = E.BANNERS[size]?.safe;
  return b ? <div className="safe" style={{ left: `${b.x * 100}%`, top: `${b.y * 100}%`, width: `${b.w * 100}%`, height: `${b.h * 100}%` }} /> : null;
}

function FieldStatus({ info }) {
  if (!info) return null;
  const parts = [`${info.shown} icons of ${info.pool}`];
  if (info.empty) parts.push(`${info.empty} cells left empty, not enough icons: larger cells fit them all`);
  if (info.fitted) parts.push(`cells ${Math.round(info.cell)} px wide, ${info.scale} row${info.scale > 1 ? 's' : ''} a mark pixel`);
  if (info.pad < info.padAsked) parts.push(`padding ${info.pad}, as ${info.padAsked} could not centre the mark on whole cells here`);
  return <span className="note">{parts.join('; ')}</span>;
}

function FieldMain({ p, set, exports }) {
  const ref = useRef(null), profile = useRef(null), company = useRef(null);
  const [info, setInfo] = useState(null);
  const linkedIn = p.size === 'profile' || p.size === 'company';
  useDraw(() => {
    const r = E.drawField(p, 2); blit(ref.current, r.canvas); setInfo(r);
    // The LinkedIn banners alongside, the mark at the right third, clear of the profile photo and the
    // page logo, whatever size is being edited; every cell filled, so the only holes are the mark's.
    if (!linkedIn) for (const [size, el] of [['profile', profile], ['company', company]]) blit(el.current, E.drawField({ ...p, size, pos: 'right', fillAll: true }, 2).canvas);
  }, [p]);
  return <>
    <section>
      <h2>Icon field, logo knockout</h2>
      <p className="note">A field of icons where the Indx mark is what's missing. In the inverse, the mark is the only thing in colour. Every icon appears once.</p>
      <div className="frame" style={{ maxWidth: E.FIELD_SIZES[p.size][0] }}><canvas ref={ref} />{linkedIn && <SafeArea size={p.size} />}</div>
      <div className="buttons">
        <Button size="micro" variant="secondary" onClick={() => set({ seed: p.seed + 1 })}>Shuffle</Button>
        <Button size="micro" variant="primary" onClick={() => exports.add(E.drawField(p, 2).canvas, `icon-field-${p.size}-${p.mode}-${p.colour.slice(1)}.png`)}>Export PNG</Button>
        <FieldStatus info={info} />
      </div>
    </section>
    {!linkedIn && (
      <section>
        <h2>On LinkedIn</h2>
        <p className="note">The same field on the two banners, the mark at the right third, clear of the profile photo and the page logo. The dashed outline is what LinkedIn covers; it is not exported.</p>
        {[['profile', profile, 'LinkedIn profile, 1584 × 396'], ['company', company, 'LinkedIn company, 1128 × 191']].map(([size, el, label]) => (
          <div key={size} style={{ marginTop: 12 }}>
            <div className="frame" style={{ maxWidth: E.FIELD_SIZES[size][0] }}><canvas ref={el} /><SafeArea size={size} /></div>
            <div className="buttons">
              <Button size="micro" variant="secondary" onClick={() => exports.add(E.drawField({ ...p, size, pos: 'right', fillAll: true }, 2).canvas, `icon-field-${size}-${p.mode}.png`)}>Export {label}</Button>
            </div>
          </div>
        ))}
      </section>
    )}
  </>;
}

// ── Pack ────────────────────────────────────────────────────────────────────────────
// Search. Ask. Observe.: a generation per word, the type and the callouts drawn over it in code, never
// generated (image models misspell). Only works in the local lab, where the generations are.
const imageCache = new Map();
const loadImage = url => {
  if (!imageCache.has(url)) imageCache.set(url, new Promise((resolve, reject) => { const im = new Image(); im.onload = () => resolve(im); im.onerror = reject; im.src = url; }));
  return imageCache.get(url);
};
// The generations a word can use: the new treatments only, never the yellow sketches.
const candidatesFor = (generations, icon) => generations
  .filter(g => g.kind !== 'reverse' && g.settings?.icon === icon && g.settings?.mat === 'glass')
  .flatMap(g => g.outputs.map(url => ({ id: `${g.id}|${url}`, url, V: g.settings })));

const TREATMENTS = [{ value: 'glass', label: 'Glass' }, { value: 'pattern', label: 'Patterns' }, { value: 'ascii', label: 'ASCII' }, { value: 'type', label: 'Type' }];
const allSame = t => t && t.search === t.ask && t.ask === t.observe ? t.search : null;

function PackPanel({ p, set }) {
  const text = (key, i, v) => set({ texts: { ...p.texts, [key]: p.texts[key].map((t, j) => j === i ? v : t) } });
  return <>
    <Group title="Layout">
      <Choice label="Format" value={p.layout} options={Object.entries(E.PACK_LAYOUTS).map(([value, l]) => ({ value, label: l.label }))} onChange={v => set({ layout: v })} />
      <Switch label="Callouts" checked={p.callouts} onChange={v => set({ callouts: v })} />
      <Switch label="Part labels" checked={p.labels} onChange={v => set({ labels: v })} />
      <Switch label="Indx mark" checked={p.mark} onChange={v => set({ mark: v })} />
      {E.BANNERS[p.layout] && <Switch label="Safe areas" checked={p.safe ?? true} onChange={v => set({ safe: v })} />}
      {p.mark && <Choice label="Mark at" value={p.markCorner} options={opts([['tr', 'Top right'], ['br', 'Bottom right']])} onChange={v => set({ markCorner: v })} />}
    </Group>
    <Group title="Treatment">
      <p className="note">Glass is a chosen generation; patterns and ASCII are drawn here, with the Voxl tab's look settings.</p>
      <SegmentedControl size="micro" stretch items={TREATMENTS} value={allSame(p.treatments) ?? ''} onChange={v => set({ treatments: { search: v, ask: v, observe: v } })} aria-label="Treatment for all three" />
    </Group>
    {E.PACK_WORDS.map(w => (
      <Group key={w.key} title={w.word}>
        <SegmentedControl size="micro" stretch items={TREATMENTS} value={(p.treatments ?? {})[w.key] ?? 'glass'} onChange={v => set({ treatments: { ...p.treatments, [w.key]: v } })} aria-label={`Treatment for ${w.word}`} />
        <InputField label="Part label" value={p.parts[w.key]} onChange={e => set({ parts: { ...p.parts, [w.key]: e.target.value } })} />
        <InputField label="Callout 1 (the red LED, or the leftmost cube)" value={p.texts[w.key][0]} onChange={e => text(w.key, 0, e.target.value)} />
        <InputField label="Callout 2 (the lime part, or the rightmost cube)" value={p.texts[w.key][1]} onChange={e => text(w.key, 1, e.target.value)} />
      </Group>
    ))}
    <p className="note">Type is FunktionalGrotesk, labels Geist Mono. The callout dots sit on the red LED and the lime part, found in each image by their colour (the comp's camera where a colour is missing). Labels go beside, above or below the object, never over it.</p>
  </>;
}

// A code-drawn treatment of one word: its icon in the Voxl tab's look, square, filling the frame as
// the glass generations do.
const drawnFor = (vx, icon, look, typeP, word) => {
  const V = { ...vx, icon, look, aspect: 1, fill: 0.7, mat: 'voxl' };
  // Type: an Index frame of the Type tab's text, the word as the query. No cubes, so no callouts.
  if (look === 'type') return { img: E.drawIndexed({ ...typeP, frame: 'index', query: word, box: [1600, 1600], bare: true }, 1).canvas, V: null };
  return { img: E.drawLook(V, 1600), V };
};

function PackMain({ p, set, exports, gen, generations, vx, typeP }) {
  const refs = useRef({});
  const [items, setItems] = useState({});
  const layout = E.PACK_LAYOUTS[p.layout];
  const choices = useMemo(() => Object.fromEntries(E.PACK_WORDS.map(w => [w.key, candidatesFor(generations, w.icon)])), [generations]);
  const picked = key => choices[key].find(c => c.id === p.picks[key]) ?? choices[key][0];
  const treatment = key => (p.treatments ?? {})[key] ?? 'glass';
  const lookKey = JSON.stringify([vx.look, vx.patFront, vx.patTop, vx.patSide, vx.patScale, vx.asciiSet, vx.asciiCols, vx.asciiEdges, vx.lookInk, vx.colour, vx.turn, vx.tilt, vx.gap, vx.depth, vx.rounded, vx.ortho]);
  const pickKey = E.PACK_WORDS.map(w => `${treatment(w.key)}:${picked(w.key)?.id}`).join('/') + lookKey + JSON.stringify(typeP);
  useEffect(() => {
    let live = true;
    Promise.all(E.PACK_WORDS.map(async w => {
      const t = treatment(w.key);
      if (t !== 'glass') return [w.key, drawnFor(vx, w.icon, t, typeP, w.key)];
      const c = picked(w.key);
      return [w.key, c ? { img: await loadImage(c.url), V: c.V } : null];
    })).then(list => { if (live) setItems(Object.fromEntries(list)); }).catch(() => {});
    return () => { live = false; };
  }, [pickKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const canvases = layout.each ? E.PACK_WORDS.map(w => w.key) : ['all'];
  useDraw(() => {
    for (const key of canvases) blit(refs.current[key], E.drawPack(p, items, 1, key === 'all' ? undefined : key));
  }, [p, items]);
  const exportAll = () => {
    for (const key of canvases) exports.add(E.drawPack(p, items, 2, key === 'all' ? undefined : key), `indx-${p.layout}-${key}.png`);
  };
  return <>
    <section>
      <h2>Search. Ask. Observe.</h2>
      <p className="note">The glass words take a generation: click one to use it, the first is the default. Patterns and ASCII are drawn from the Voxl tab's look settings.</p>
      {!gen && <p className="note">Glass needs the generations, which live in the lab on your machine (<code>node lab/server.mjs</code>); patterns and ASCII work anywhere.</p>}
      {gen && E.PACK_WORDS.filter(w => treatment(w.key) === 'glass').map(w => (
        <div key={w.key} className="pick-row">
          <span className="note">{w.word}</span>
          <div className="picks">
            {choices[w.key].length === 0 && <span className="note">No glass generation of {w.icon} yet: make some in the Voxl tab.</span>}
            {choices[w.key].map(c => (
              <Button key={c.id} size="micro" variant={picked(w.key)?.id === c.id ? 'secondary' : 'ghost'} className="pick" aria-pressed={picked(w.key)?.id === c.id}
                aria-label={`Use this ${w.icon} image`} onClick={() => set({ picks: { ...p.picks, [w.key]: c.id } })}
                iconLeft={<img className="pick-img" src={c.url} alt="" />} />
            ))}
          </div>
        </div>
      ))}
    </section>
    <section>
      <h2>{layout.title}</h2>
      <div className={layout.each ? 'pack-each' : ''}>
        {canvases.map(key => (
          <div key={key} className="frame" style={{ maxWidth: layout.each ? undefined : layout.W }}>
            <canvas ref={el => { refs.current[key] = el; }} />
            {/* Where LinkedIn puts the profile photo or the page logo, as on the Banners tab: shown, never exported. */}
            {E.BANNERS[p.layout] && (p.safe ?? true) && (() => { const b = E.BANNERS[p.layout].safe; return <div className="safe" style={{ left: `${b.x * 100}%`, top: `${b.y * 100}%`, width: `${b.w * 100}%`, height: `${b.h * 100}%` }} />; })()}
          </div>
        ))}
      </div>
      <div className="buttons"><Button size="micro" variant="primary" onClick={exportAll}>Export {canvases.length > 1 ? `the ${canvases.length} PNGs` : 'PNG'} at 2x</Button></div>
    </section>
  </>;
}

// ── Type: indexed text ──────────────────────────────────────────────────────────────
function TypePanel({ p, set, candidates, setCandidates }) {
  return <>
    <Group title="Frame">
      <SegmentedControl size="micro" stretch items={Object.entries(E.TYPE_FRAMES).map(([value, f]) => ({ value, label: f.label }))} value={p.frame} onChange={v => set({ frame: v })} aria-label="Frame" />
      <Choice label="Size" value={p.size} options={Object.entries(E.TYPE_SIZES).map(([value, v]) => ({ value, label: v[2] }))} onChange={v => set({ size: v })} />
      <Choice label="Theme" value={p.theme} options={Object.entries(E.TYPE_THEMES).map(([value, x]) => ({ value, label: x.label }))} onChange={v => set({ theme: v })} />
    </Group>
    <Group title="Layout">
      <SegmentedControl size="micro" stretch items={Object.entries(E.TYPE_LAYOUTS).map(([value, label]) => ({ value, label }))} value={p.layout ?? 'grid'} onChange={v => set({ layout: v })} aria-label="Layout" />
      {(p.layout ?? 'grid') === 'grid' && <Switch label="A frame round every word" checked={!!p.frameWords} onChange={v => set({ frameWords: v })} />}
      {p.layout === 'panels' && <>
        <Range label="Panels" value={p.panels ?? 7} min={1} max={24} step={1} format={v => `${v}`} onChange={v => set({ panels: v })} />
        <Range label="Left as colour only" value={p.emptyPanels ?? 0.2} min={0} max={0.7} step={0.05} format={pct} onChange={v => set({ emptyPanels: v })} />
        <Range label="Lines on strips" value={p.strips ?? 0.4} min={0} max={1} step={0.05} format={pct} onChange={v => set({ strips: v })} />
        <Switch label="A frame round every word" checked={!!p.frameWords} onChange={v => set({ frameWords: v })} />
      </>}
      {p.layout === 'table' && <>
        <Range label="Cells filled" value={p.fills ?? 0.14} min={0} max={0.6} step={0.01} format={pct} onChange={v => set({ fills: v })} />
        <Range label="Type size" value={p.tableScale ?? 1.4} min={1} max={4} step={0.1} format={v => `${v.toFixed(1)}×`} onChange={v => set({ tableScale: v })} />
      </>}
      <p className="note">Panels and Table after the reference: the page cut into colours, each holding a few sentences; or one word to a ruled cell. Shuffle cuts again.</p>
    </Group>
    <Group title="Framing">
      <Choice label="Framing" value={p.chrome ?? 'none'} options={Object.entries(E.TYPE_CHROMES).map(([value, label]) => ({ value, label }))} onChange={v => set({ chrome: v })} />
      <Choice label="Empty cells" value={p.background ?? 'none'} options={Object.entries(E.TYPE_BACKGROUNDS).map(([value, label]) => ({ value, label }))} onChange={v => set({ background: v })} />
      <Switch label="Motif: an icon the text flows round" checked={!!p.motif} onChange={v => set({ motif: v ? 'search' : '' })} />
      {p.motif && <>
        <IconChoice label="Icon" value={p.motif} onChange={v => set({ motif: v })} />
        <Choice label="Drawn as" value={p.motifStyle ?? 'dots'} options={Object.entries(E.TYPE_MOTIF_STYLES).map(([value, label]) => ({ value, label }))} onChange={v => set({ motifStyle: v })} />
        <Choice label="In" value={p.motifColour ?? 'ink'} options={opts([['ink', 'The ink'], ['accent', 'The hit colour']])} onChange={v => set({ motifColour: v })} />
        <Choice label="Placed" value={p.motifAt ?? 'center'} options={opts([['left', 'Left'], ['center', 'Centre'], ['right', 'Right']])} onChange={v => set({ motifAt: v })} />
        <Range label="Size, of the height" value={p.motifSize ?? 0.6} min={0.2} max={1} step={0.05} format={pct} onChange={v => set({ motifSize: v })} />
      </>}
    </Group>
    <TypeCopy p={p} set={set} />
    <Group title="Text">
      <Choice label="Head line" value={p.head ?? 'query'} options={opts([['headline', 'The headline'], ['query', 'The query, as typed'], ['none', 'Nothing']])} onChange={v => set({ head: v })} />
      <InputField label="Headline" value={p.headline ?? ''} onChange={e => set({ headline: e.target.value })} />
      <InputField label="Query: its trigrams find the hits" value={p.query} onChange={e => set({ query: e.target.value })} />
      <Textarea label="Text" rows={6} value={p.text} onChange={e => set({ text: e.target.value, copy: 'own' })} />
      <Switch label="Uppercase" checked={p.upper} onChange={v => set({ upper: v })} />
      <Choice label="Weight" value={p.weight} options={opts([[350, 'Book'], [400, 'Regular'], [500, 'Medium'], [700, 'Bold']])} onChange={v => set({ weight: +v })} />
      <Switch label="A line between letters" checked={p.cellLines} onChange={v => set({ cellLines: v })} />
    </Group>
    <Group title="Spacing">
      <Range label="Block length (words)" value={p.length === 0 ? 200 : (p.length ?? 30)} min={8} max={200} step={1} format={v => v >= 200 ? 'all' : `${v}`} onChange={v => set({ length: v >= 200 ? 0 : v })} />
      <Range label="Gaps: wide spaces and empty lines" value={p.air ?? 0.12} min={0} max={0.6} step={0.01} format={pct} onChange={v => set({ air: v })} />
      <Range label="Line spacing" value={p.leading ?? 0} min={0} max={1.5} step={0.05} format={pct} onChange={v => set({ leading: v })} />
      <Choice label="A sentence" value={p.breaks ?? 'none'} options={opts([['none', 'Runs on'], ['spread', 'Ends its line, spread wide'], ['ragged', 'Ends its line, ragged']])} onChange={v => set({ breaks: v })} />
    </Group>
    <Group title="Moves">
      <Range label="Letters as icons" value={p.icons} min={0} max={0.25} step={0.005} format={pct} onChange={v => set({ icons: v })} />
      <Choice label="Icons from" value={p.iconSet ?? 'main'} options={opts([['main', 'The main set'], ['all', 'Every board']])} onChange={v => set({ iconSet: v })} />
      <Range label="Words redacted" value={p.redact} min={0} max={0.4} step={0.01} format={pct} onChange={v => set({ redact: v })} />
    </Group>
    <Group title="Boxes">
      <Choice label="A hit boxes" value={p.hitStyle ?? 'word'} options={opts([['word', 'The word'], ['letters', 'The letters the query found']])} onChange={v => set({ hitStyle: v })} />
      <Choice label="Hits" value={p.hitFrom ?? 'theme'} options={opts([['theme', "The theme's colour"], ['chosen', 'The colour below']])} onChange={v => set({ hitFrom: v })} />
      <Choice label="Near misses" value={p.nearColour ?? ''} options={opts([['', "The theme's second tone"], ['#72F5C6', 'Teal'], ['#6B9EFF', 'Light blue'], ['#FFC107', 'Warning yellow'], ['#C6FF3D', 'Lime']])} onChange={v => set({ nearColour: v })} />
      <Switch label="Mixed: colours from the theme's set" checked={p.mixed ?? false} onChange={v => set({ mixed: v })} />
    </Group>
    <Palette p={p} set={set} candidates={candidates} setCandidates={setCandidates} />
    <p className="note">A word is a hit when it holds half the query's trigrams, a near miss at a quarter. The themes marked experiment are loud flat grounds after the reference.</p>
  </>;
}

// The copy list, lab/copy.json: loaded once, shared by the Copy group and the Shuffle button. A
// static file, so the published lab has it too; adding and deleting need the lab's server.
let copyCache = null;
const copyListeners = new Set();
// The engine keeps the list too: a frame that fills the page continues into it.
const setCopyList = list => { copyCache = list; E.setCopyLibrary(list); copyListeners.forEach(f => f(list)); };
// Loaded as the lab starts, so the Pack and Posters' Index frames have it without the Type tab open.
fetch('copy.json', { cache: 'no-cache' }).then(r => r.ok ? r.json() : []).then(setCopyList).catch(() => {});
function useCopyList() {
  const [list, setList] = useState(copyCache ?? []);
  useEffect(() => {
    copyListeners.add(setList);
    if (copyCache) setList(copyCache);
    return () => copyListeners.delete(setList);
  }, []);
  return list;
}
const SOURCE_LABEL = { lab: '', written: 'Written: ', own: 'Yours: ' };

// The copy: one piece of the list, all of them shuffled, or the Text box's own words. New pieces
// are written by the model on request, or saved from the fields; both go into copy.json.
function TypeCopy({ p, set }) {
  const list = useCopyList();
  const [brief, setBrief] = useState('');
  const [busy, setBusy] = useState(''), [error, setError] = useState('');
  const use = c => set({ copy: c.id, headline: c.headline, query: c.query, text: c.text });
  const choose = v => {
    if (v === 'all') { const c = E.shuffledCopy(list, p.seed); if (c) set({ copy: 'all', ...c }); return; }
    const c = list.find(x => x.id === v);
    if (c) use(c); else set({ copy: v });
  };
  const another = () => {
    const others = list.filter(c => c.id !== p.copy);
    if (others.length) use(others[Math.floor(Math.random() * others.length)]);
  };
  const call = async (what, url, init) => {
    setBusy(what); setError('');
    try {
      const r = await fetch(url, init);
      const body = await r.json();
      if (!r.ok) throw new Error(body.error ?? `HTTP ${r.status}`);
      return body;
    } catch (e) { setError(e.message.includes('JSON') || e.message.includes('fetch') ? 'Needs the lab server (npm start in lab/).' : e.message); return null; } finally { setBusy(''); }
  };
  const post = (what, url, body) => call(what, url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const writeOne = async () => { const item = await post('write', '/api/write', { brief }); if (item) { setCopyList([item, ...list]); use(item); } };
  const saveOwn = async () => { const item = await post('save', '/api/copy', { headline: p.headline, query: p.query, text: p.text }); if (item) { setCopyList([item, ...list]); use(item); } };
  const current = list.find(c => c.id === p.copy);
  const remove = async () => {
    if (!current || current.source === 'lab') return;
    if (await call('delete', `/api/copy?id=${encodeURIComponent(current.id)}`, { method: 'DELETE' })) { setCopyList(list.filter(c => c !== current)); set({ copy: 'own' }); }
  };
  const options = [
    { value: 'all', label: `Everything, shuffled (${list.length})` },
    ...list.map(c => ({ value: c.id, label: SOURCE_LABEL[c.source] + (c.label || c.headline) })),
    { value: 'own', label: 'Unsaved (the fields below)' },
  ];
  return <Group title="Copy">
    <Choice label="Copy" value={p.copy ?? 'own'} options={options} onChange={choose} />
    <div className="buttons">
      <Button size="micro" variant="secondary" onClick={another}>Another</Button>
      <Button size="micro" variant="secondary" loading={busy === 'save'} onClick={saveOwn}>Save as new</Button>
      {current && current.source !== 'lab' && <Button size="micro" variant="ghost" loading={busy === 'delete'} onClick={remove}>Delete</Button>}
    </div>
    <InputField label="Brief for a new piece (optional)" placeholder="e.g. boost rules for a shop" value={brief} onChange={e => setBrief(e.target.value)} />
    <div className="buttons"><Button size="micro" variant="secondary" loading={busy === 'write'} onClick={writeOne}>Write new copy</Button></div>
    {error && <p className="note">{error}</p>}
    <p className="note">The list is lab/copy.json. Write new copy asks Gemini, from the product's facts and in the brand voice; Save as new keeps the fields below as a piece of your own.</p>
  </Group>;
}

function TypeMain({ p, set, exports }) {
  const ref = useRef(null), seqRef = useRef(null);
  const copyList = useCopyList();
  const [info, setInfo] = useState(null);
  const [playing, setPlaying] = useState(true), [recording, setRecording] = useState(false);
  const pRef = useRef(p); pRef.current = p;
  useDraw(() => { const r = E.drawIndexed(p, 2); blit(ref.current, r.canvas); setInfo(r); }, [p, copyList]);
  // The sequence plays in its own canvas at 1x, from the same settings.
  const clock = useRef({ start: performance.now(), pausedAt: 0, playing: true });
  useEffect(() => {
    let frame = 0;
    const loop = now => {
      const c = clock.current, el = seqRef.current;
      if (el && (c.playing || c.recording)) blit(el, E.drawSequence(pRef.current, (now - c.start) / 1000, 1).canvas);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, []);
  const toggle = () => {
    const c = clock.current;
    c.playing = !c.playing;
    if (c.playing) c.start = performance.now() - c.pausedAt; else c.pausedAt = performance.now() - c.start;
    setPlaying(c.playing);
  };
  const record = () => {
    const type = ['video/webm;codecs=vp9', 'video/webm', 'video/mp4'].find(t => window.MediaRecorder?.isTypeSupported?.(t));
    if (!type) return;
    const rec = new MediaRecorder(seqRef.current.captureStream(60), { mimeType: type, videoBitsPerSecond: 16_000_000 });
    const chunks = [];
    rec.ondataavailable = e => chunks.push(e.data);
    rec.onstop = () => { clock.current.recording = false; setRecording(false); exports.addVideo(URL.createObjectURL(new Blob(chunks, { type })), `type-sequence-${p.size}-${p.theme}.${type.includes('mp4') ? 'mp4' : 'webm'} · right-click, Save Video As`); };
    clock.current.start = performance.now(); clock.current.recording = true; setRecording(true);
    rec.start();
    setTimeout(() => rec.stop(), E.SEQUENCE_LENGTH * 1000 + 100);
  };
  return <>
    <section>
      <h2>Indexed text</h2>
      <p className="note">Type on one character grid, justified to the measure; the query reads it as Indx does, by trigrams. After Ksawery Kirklewski's Symphony in Acid.</p>
      <div className="frame" style={{ maxWidth: E.TYPE_SIZES[p.size][0] }}><canvas ref={ref} /></div>
      <div className="buttons">
        <Button size="micro" variant="secondary" onClick={() => set({ seed: p.seed + 1, ...(p.copy === 'all' ? E.shuffledCopy(copyList, p.seed + 1) ?? {} : {}) })}>Shuffle</Button>
        <Button size="micro" variant="primary" onClick={() => exports.add(E.drawIndexed(p, 2).canvas, `type-${p.frame}-${p.size}-${p.theme}.png`)}>Export PNG at 2x</Button>
        {info && <span className="note">{info.hits} hits · {info.cols} × {info.rows} characters</span>}
      </div>
    </section>
    <section>
      <h2>Sequence</h2>
      <p className="note">The query typed on the Sentence, then Block, Index and Sparse, each building up line by line: {Math.round(E.SEQUENCE_LENGTH)} seconds a loop. For posts, record one loop as a video.</p>
      <div className="frame" style={{ maxWidth: E.TYPE_SIZES[p.size][0] }}><canvas ref={seqRef} /></div>
      <div className="buttons">
        <Button size="micro" variant="secondary" onClick={toggle}>{playing ? 'Pause' : 'Play'}</Button>
        <Button size="micro" variant="secondary" loading={recording} onClick={record}>Record one loop</Button>
      </div>
    </section>
  </>;
}

// ── Posters ─────────────────────────────────────────────────────────────────────────
// The icon field as the poster's grid, the type in blocks of its cells; and mockups of the poster
// on a wall or printed on merch, from Nano Banana with the poster as the artwork.
const MOCKUPS = [
  { key: 'wall', label: 'On a concrete wall', aspect: '3:4', scene: 'A large printed poster hanging on a raw concrete wall in soft daylight, photographed straight on, a little of the wall visible round it.' },
  { key: 'frame', label: 'Framed, in an office', aspect: '4:3', scene: 'The poster in a thin black frame on a light wall above a desk in a calm, modern office, photographed slightly from the side.' },
  { key: 'tee', label: 'Black tee', aspect: '1:1', scene: 'A heavyweight black t-shirt laid flat on dark grey linen, the artwork screen-printed large on the front, the fabric texture visible through the print.' },
  { key: 'tote', label: 'Tote bag', aspect: '1:1', scene: 'A natural off-white canvas tote bag hanging on a hook, the artwork printed on it, soft daylight.' },
];
const mockupPrompt = scene => `Product mockup photograph. ${scene} Use the attached image exactly as the artwork: keep every icon, letter, grid line, dot and colour of it unchanged, no redrawing, no added or changed text. Realistic material, light and perspective; the print follows the surface it is on. No logos other than those in the artwork.`;

// A saved design that is gone (Typos welcome, removed 3 Nov 2026) shows as The Index.
const posterDesign = p => E.POSTER_DESIGNS[p.design] ? p.design : 'index';

function PostersPanel({ p, set, candidates, setCandidates }) {
  return <>
    <Group title="Poster">
      <SegmentedControl size="micro" stretch items={Object.entries(E.POSTER_DESIGNS).map(([value, d]) => ({ value, label: d.label }))} value={posterDesign(p)} onChange={v => set({ design: v })} aria-label="Design" />
      <Choice label="Size" value={p.size} options={Object.entries(E.POSTER_SIZES).map(([value, v]) => ({ value, label: v[2] }))} onChange={v => set({ size: v })} />
      <Choice label="Theme" value={p.palette} options={Object.entries(E.FIELD_PALETTES).filter(([v]) => v !== 'ladder').map(([value, x]) => ({ value, label: x.label }))} onChange={v => set({ palette: v })} />
    </Group>
    <Group title="Grid">
      <Range label="Cell" value={p.cell} min={40} max={120} step={1} format={v => `${v} px`} onChange={v => set({ cell: v })} />
      <Range label="Padding, in icon pixels" value={p.pad} min={0} max={4} step={1} onChange={v => set({ pad: v })} />
      <Range label="Sparks" value={p.spark} min={0} max={0.12} step={0.005} format={pct} onChange={v => set({ spark: v })} />
    </Group>
    <Palette p={p} set={set} candidates={candidates} setCandidates={setCandidates} />
    <p className="note">The type sits in blocks of the field's cells: a pitch in from the block's left line, on its bottom line. The accent colours the sparks and the large icons.</p>
  </>;
}

function PostersMain({ p, set, exports, gen, generations, refreshGenerations, typeP }) {
  const ref = useRef(null);
  const [sending, setSending] = useState(null);
  const [error, setError] = useState(null);
  // The Indexed design sets the Type tab's text, query and moves in its block.
  const P = { ...p, design: posterDesign(p), type: typeP };
  useDraw(() => blit(ref.current, E.drawPoster(P, 1)), [p, typeP]);
  const W = E.POSTER_SIZES[p.size][0];
  const mockups = generations.filter(g => g.settings?.mockup);
  const send = async m => {
    setSending(m.key); setError(null);
    try {
      const art = E.drawPoster(P, 1);
      const r = await fetch('/api/generate', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prompt: mockupPrompt(m.scene), images: [{ name: 'artwork', data: base64Of(art) }], aspectRatio: m.aspect, imageSize: '2K', count: 1,
          settings: { ...P, icon: `poster-${P.design}`, mockup: m.key, mat: 'mockup' } }),
      });
      const meta = await r.json();
      if (!r.ok || meta.errors?.length) setError(meta.errors?.join('; ') || meta.error || `HTTP ${r.status}`);
      refreshGenerations();
    } catch (e) { setError(e.message); }
    setSending(null);
  };
  return <>
    <section>
      <h2>{E.POSTER_DESIGNS[P.design].label}</h2>
      <div className="frame" style={{ maxWidth: Math.min(W, 620) }}><canvas ref={ref} /></div>
      <div className="buttons">
        <Button size="micro" variant="secondary" onClick={() => set({ seed: p.seed + 1 })}>Shuffle</Button>
        <Button size="micro" variant="primary" onClick={() => exports.add(E.drawPoster(P, 2), `poster-${P.design}-${p.size}-${p.palette}.png`)}>Export PNG at 2x</Button>
      </div>
    </section>
    <section>
      <h2>Mockups</h2>
      {!gen?.hasKey
        ? <p className="note">Mockups are made by Nano Banana in the lab on your machine (<code>node lab/server.mjs</code> with a key).</p>
        : <>
          <p className="note">The poster above, as the artwork, in a scene: one image each, kept with the generations.</p>
          <div className="buttons">
            {MOCKUPS.map(m => <Button key={m.key} size="micro" variant="secondary" loading={sending === m.key} disabled={!!sending && sending !== m.key} onClick={() => send(m)}>{m.label}</Button>)}
          </div>
          {error && <Alert variant="destructive"><AlertTitle>Mockup failed</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
          {mockups.length > 0 && (
            <div className="mockups">
              {mockups.flatMap(g => g.outputs.map(o => (
                <figure key={o}>
                  <a href={o} target="_blank" rel="noreferrer"><img src={o} alt={`Mockup: ${MOCKUPS.find(m => m.key === g.settings.mockup)?.label ?? g.settings.mockup}`} /></a>
                  <figcaption className="note">{MOCKUPS.find(m => m.key === g.settings.mockup)?.label} · {E.POSTER_DESIGNS[g.settings.design]?.label}</figcaption>
                </figure>
              )))}
            </div>
          )}
        </>}
    </section>
  </>;
}

// ── The page ────────────────────────────────────────────────────────────────────────
function App() {
  const [tab, setTab] = useState(() => { const t = saved('tab', 'banners'); return TABS.some(x => x.value === t) ? t : 'banners'; });
  useEffect(() => save('tab', tab), [tab]);
  const [banners, setBanners, resetBanners] = useParams('banners');
  const [vx, setVx, resetVx] = useParams('voxl');
  const [field, setField, resetField] = useParams('field');
  const [pack, setPack, resetPack] = useParams('pack');
  const [posters, setPosters, resetPosters] = useParams('posters');
  const [typeP, setTypeP, resetType] = useParams('type');
  const [candidates, setCandidatesState] = useState(() => saved('candidates', MOODBOARD_CANDIDATES));
  const setCandidates = list => { setCandidatesState(list); save('candidates', list); };
  const exports = useExports();
  // The local server answers /api/health; the published page has none, and gen stays null.
  const [gen, setGen] = useState(undefined);
  const [generations, setGenerations] = useState([]);
  const refreshGenerations = useCallback(() => fetch('/api/generations').then(r => r.json()).then(setGenerations).catch(() => {}), []);
  useEffect(() => {
    fetch('/api/health').then(r => r.ok ? r.json() : null).then(h => { setGen(h?.ok ? h : null); if (h?.ok) refreshGenerations(); }).catch(() => setGen(null));
  }, [refreshGenerations]);
  const reset = { banners: resetBanners, voxl: resetVx, field: resetField, pack: resetPack, posters: resetPosters, type: resetType }[tab];
  return (
    <div className="lab">
      <header>
        <h1>Pixl Lab</h1>
        <Tabs items={TABS} value={tab} onValueChange={setTab} getPanelId={t => `panel-${t.value}`} />
      </header>
      <div className="body">
        <aside aria-label={`${TABS.find(t => t.value === tab).label} parameters`}>
          {tab === 'banners' && <BannersPanel p={banners} set={setBanners} />}
          {tab === 'voxl' && <VoxlPanel p={vx} set={setVx} candidates={candidates} setCandidates={setCandidates} gen={gen} />}
          {tab === 'field' && <FieldPanel p={field} set={setField} candidates={candidates} setCandidates={setCandidates} />}
          {tab === 'pack' && <PackPanel p={pack} set={setPack} />}
          {tab === 'posters' && <PostersPanel p={posters} set={setPosters} candidates={candidates} setCandidates={setCandidates} />}
          {tab === 'type' && <TypePanel p={typeP} set={setTypeP} candidates={candidates} setCandidates={setCandidates} />}
          <div className="buttons"><Button size="micro" variant="ghost" onClick={reset}>Reset this tab</Button></div>
        </aside>
        <main id={`panel-${tab}`} role="tabpanel">
          {tab === 'banners' && <BannersMain p={banners} set={setBanners} exports={exports} />}
          {tab === 'voxl' && <VoxlMain p={vx} set={setVx} exports={exports} gen={gen} generations={generations} refreshGenerations={refreshGenerations} />}
          {tab === 'field' && <FieldMain p={field} set={setField} exports={exports} />}
          {tab === 'pack' && <PackMain p={pack} set={setPack} exports={exports} gen={gen} generations={generations} vx={vx} typeP={typeP} />}
          {tab === 'type' && <TypeMain p={typeP} set={setTypeP} exports={exports} />}
          {tab === 'posters' && <PostersMain p={posters} set={setPosters} exports={exports} gen={gen} generations={generations} refreshGenerations={refreshGenerations} typeP={typeP} />}
          <Exports items={exports.items} />
        </main>
      </div>
    </div>
  );
}

await Promise.all(['350 40px FunktionalGrotesk', '500 40px FunktionalGrotesk', '350 40px Geist', '400 13px "Geist Mono"'].map(f => document.fonts.load(f).catch(() => null)));
createRoot(document.getElementById('root')).render(<App />);
