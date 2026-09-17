import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Checkbox, Modal } from '@indxsearch/systm';
import { EditorProvider, persist, useEditor } from './model/store';
import { Canvas, type MenuRequest } from './canvas/Canvas';
import { ContextMenu, type MenuItem, type MenuState } from './panels/ContextMenu';
import { Toolbar } from './panels/Toolbar';
import { Layers } from './panels/Layers';
import { Inspector } from './panels/Inspector';
import { FillPanel } from './panels/Fill';
import { Preview } from './panels/Preview';
import { useShortcuts } from './hooks/useShortcuts';
import { useAutosave } from './hooks/useAutosave';
import { allComponents, exportIconSvg, importSvg, skippedComponents } from './model/svg';
import { looksLikeSvg, parseSvg } from './model/pasteSvg';
import { editorColorCss, exportColorCss } from './model/colors';
import * as ops from './model/ops';
import { type Artboard, type Doc, type Icon, type Node, type TextNode, bboxOf, uid } from './model/types';
import * as api from './api';

/** Figma's normal Copy can put an SVG inside the HTML clipboard flavor. */
const svgFromHtml = (html: string): string | null => {
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const svg = doc.querySelector('svg');
    return svg ? new XMLSerializer().serializeToString(svg) : null;
  } catch { return null; }
};

export default function App() {
  return <EditorProvider><Editor /></EditorProvider>;
}

function Editor() {
  const { state, dispatch, edit, ui, sel, dirty, index } = useEditor();
  const status = useCallback((s: string) => { ui({ status: s }); setTimeout(() => ui({ status: '' }), Math.max(2000, s.length * 60)); }, [ui]);

  // ---- theme ----
  const sysDark = useMemo(() => window.matchMedia('(prefers-color-scheme: dark)'), []);
  const [sys, setSys] = useState(sysDark.matches);
  useEffect(() => { const f = () => setSys(sysDark.matches); sysDark.addEventListener('change', f); return () => sysDark.removeEventListener('change', f); }, [sysDark]);
  const dark = state.ui.theme === 'system' ? sys : state.ui.theme === 'dark';
  useEffect(() => { document.documentElement.classList.toggle('theme-dark', dark); document.documentElement.classList.toggle('theme-light', !dark); }, [dark]);
  const onDark = (v: boolean) => { const t = v ? 'dark' : 'light'; ui({ theme: t }); persist('pixl.theme', t); };

  // ---- persist viewport ----
  useEffect(() => { const t = setTimeout(() => persist('pixl.view', state.ui.view), 300); return () => clearTimeout(t); }, [state.ui.view]);

  // ---- load ----
  const [loaded, setLoaded] = useState(false);
  const autosave = useAutosave(status);
  useEffect(() => {
    autosave.load().then(() => setLoaded(true)).catch((e) => status('Load failed: ' + e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // zoom to fit once after load, so the document is never off-screen on first open
  useEffect(() => { if (loaded) zoomFit(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  // ---- commands ----
  const save = autosave.saveNow;

  const currentIcon = (): Icon | null => {
    const id = state.ui.focus ?? (sel[0]?.kind === 'icon' ? sel[0].id : sel[0]?.iconId ?? null);
    return id ? (state.doc.artboards.flatMap((a) => a.icons).find((i) => i.id === id) ?? null) : null;
  };
  const copySvg = useCallback(async (ic?: Icon) => {
    const icon = ic ?? currentIcon();
    if (!icon) return status('No icon selected');
    try { await navigator.clipboard.writeText(exportIconSvg(icon, state.doc.colors)); status(`Copied ${icon.name}.svg`); } catch { status('Clipboard blocked'); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, sel]);
  const exportIcon = useCallback(async (ic: Icon) => {
    try { await api.exportIcons([{ name: ic.name, svg: exportIconSvg(ic, state.doc.colors) }], false, exportColorCss(state.doc.colors)); status(`Wrote raw-icons/${ic.name}.svg`); } catch (e) { status('Export failed: ' + (e as Error).message); }
  }, [status, state.doc.colors]);
  const [exportOpen, setExportOpen] = useState(false);
  const [convert, setConvert] = useState(true);
  const [exporting, setExporting] = useState(false);
  const icons = allComponents(state.doc);
  const skipped = skippedComponents(state.doc);
  const dupes = [...new Set(icons.map((i) => i.name).filter((n, i, a) => a.indexOf(n) !== i))];
  const badNames = icons.map((i) => i.name).filter((n) => !/^[\p{L}\p{N}][\p{L}\p{N} \-_]*$/u.test(n));
  const exportAll = useCallback(async () => {
    setExporting(true);
    try {
      const r = await api.exportIcons(icons.map((i) => ({ name: i.name, svg: exportIconSvg(i, state.doc.colors) })), convert, exportColorCss(state.doc.colors));
      status(`Exported ${r.written.length} icons${convert ? ' + converted' : ''}`);
      if (r.convertOutput) console.log(r.convertOutput);
      setExportOpen(false);
    } catch (e) { status('Export failed: ' + (e as Error).message); }
    finally { setExporting(false); }
  }, [icons, convert, status]);
  const makeComponent = useCallback((name?: string) => {
    const rects = sel.filter((n) => n.kind === 'rect' && !n.iconId);
    if (!rects.length || new Set(rects.map((n) => n.artboardId)).size !== 1) return status('Select loose rects on one artboard');
    const id = uid(), nm = (name || '').trim() || ops.nextName(state.doc, 'icon');
    edit((d) => ops.makeComponent(d, rects[0].artboardId, rects.map((n) => n.id), id, nm));
    ui({ sel: [id], focus: null });
  }, [sel, state.doc, edit, ui, status]);
  const importRaw = useCallback(async () => {
    try {
      const files = await api.rawIcons();
      if (!files.length) return status('raw-icons/ is empty');
      const icons: Icon[] = files.map((f, i) => ({ ...importSvg(f.svg, f.name, state.doc.colors), x: i, y: 0 }));
      const last = state.doc.artboards[state.doc.artboards.length - 1];
      const ab: Artboard = { id: uid(), name: ops.nextName(state.doc, 'Imported'), x: last ? last.x + last.w + 20 : 0, y: last ? last.y : 0, w: 1, h: 1, icons, rects: [] };
      edit((d) => ops.arrangeIcons(ops.addArtboard(d, ab), ab.id));
      ui({ sel: [ab.id] });
      status(`Imported ${icons.length} icons`);
    } catch (e) { status('Import failed: ' + (e as Error).message); }
  }, [state.doc, edit, ui, status]);

  const zoom = useCallback((f: number) => {
    const el = document.querySelector('svg.canvas')!.getBoundingClientRect();
    const v = state.ui.view, p = { x: el.width / 2, y: el.height / 2 };
    const k = Math.min(200, Math.max(0.5, v.k * f)), r = k / v.k;
    ui({ view: { x: p.x - (p.x - v.x) * r, y: p.y - (p.y - v.y) * r, k } });
  }, [state.ui.view, ui]);
  const zoomToBox = useCallback((b: { x: number; y: number; w: number; h: number }, pad = 120) => {
    const el = document.querySelector('svg.canvas')!.getBoundingClientRect();
    const k = Math.min(200, Math.max(0.5, Math.min((el.width - pad) / Math.max(1, b.w), (el.height - pad) / Math.max(1, b.h))));
    ui({ view: { k, x: (el.width - b.w * k) / 2 - b.x * k, y: (el.height - b.h * k) / 2 - b.y * k } });
  }, [ui]);
  const zoomFit = useCallback(() => {
    const abs = state.doc.artboards;
    if (!abs.length) return ui({ view: { x: 80, y: 80, k: 8 } });
    const x0 = Math.min(...abs.map((a) => a.x)), y0 = Math.min(...abs.map((a) => a.y)), x1 = Math.max(...abs.map((a) => a.x + a.w)), y1 = Math.max(...abs.map((a) => a.y + a.h));
    zoomToBox({ x: x0, y: y0, w: x1 - x0, h: y1 - y0 });
  }, [state.doc, ui, zoomToBox]);
  const zoomSel = useCallback(() => {
    const nodes = sel.length ? sel : state.ui.focus ? [index.get(state.ui.focus)!].filter(Boolean) : [];
    const b = bboxOf(nodes);
    if (b) zoomToBox(b, 240);
  }, [sel, state.ui.focus, index, zoomToBox]);

  const duplicate = useCallback((nodes: Node[] = sel) => {
    if (!nodes.length) return;
    const ids = nodes.map((n) => n.id), map = ops.duplicateIdMap(nodes, uid);
    edit((d) => ops.duplicateNodes(d, ids, map));
    ui({ sel: ids.map((i) => map[i]) });
  }, [sel, edit, ui]);
  const remove = useCallback((nodes: Node[] = sel) => {
    if (!nodes.length) return;
    const ids = nodes.map((n) => n.id);
    edit((d) => ops.deleteNodes(d, ids));
    ui({ sel: [], focus: nodes.some((n) => n.id === state.ui.focus) ? null : state.ui.focus });
  }, [sel, edit, ui, state.ui.focus]);

  /** Merge (union) the rects of the given icons, or of the current selection / focused icon. */
  const merge = useCallback((iconIds?: string[]) => {
    const ids = iconIds ?? [...new Set(sel.map((n) => (n.kind === 'icon' ? n.id : n.iconId)).filter((x): x is string => !!x).concat(state.ui.focus ? [state.ui.focus] : []))];
    if (!ids.length) return status('Select an icon to merge');
    const before = state.doc;
    edit((d) => ops.mergeIcons(d, ids));
    if (ops.mergeIcons(before, ids) !== before) { ui({ sel: state.ui.sel.filter((id) => index.get(id)?.kind !== 'rect') }); status(`Merged ${ids.length} icon${ids.length === 1 ? '' : 's'}`); }
    else status('Already merged');
  }, [sel, state.ui.focus, state.ui.sel, state.doc, edit, ui, index, status]);
  // split into 1×1 pixels when entering an icon; auto-merge when leaving it
  const prevFocus = useMemo(() => ({ id: null as string | null }), []);
  useEffect(() => {
    const left = prevFocus.id, entered = state.ui.focus;
    prevFocus.id = entered;
    if (left === entered) return;
    const base = state.doc, idMap = new Map<string, string[]>();
    const merged = left && state.ui.autoMerge && index.has(left) ? ops.mergeIcons(base, [left]) : base;
    const next = entered && index.has(entered) ? ops.splitIcons(merged, [entered], idMap) : merged;
    if (next === base) return;
    // splitting alone is not an undo step; merging is
    edit((d) => (d === base ? next : d), merged === base);
    if (idMap.size) ui({ sel: ops.remapSel(state.ui.sel, idMap) });
  }, [state.ui.focus, state.ui.autoMerge, state.doc, state.ui.sel, edit, ui, index, prevFocus]);

  const cmds = useMemo(() => ({ save, copySvg: () => copySvg(), makeComponent: () => makeComponent(), duplicate: () => duplicate(), remove: () => remove(), merge: () => merge(), zoomFit, zoomSel, zoom }), [save, copySvg, makeComponent, duplicate, remove, merge, zoomFit, zoomSel, zoom]);
  useShortcuts(cmds);

  // dev-only handle for debugging in the browser console
  if (import.meta.env.DEV) (window as unknown as { __pixl: unknown }).__pixl = { state, sel };

  // ---- paste SVG (e.g. Figma › Copy as SVG) ----
  const pasteSvg = useCallback((text: string) => {
    let result;
    try { result = parseSvg(text, state.doc.colors); } catch (e) { return status((e as Error).message); }
    const found = result.icons.filter((i) => i.rects.length);
    if (!found.length) return status('No filled shapes found in the SVG');
    const focusIconId = state.ui.focus;
    const artboardId = focusIconId ? index.get(focusIconId)?.artboardId ?? null : sel[0]?.artboardId ?? null;
    const placed = ops.placePasted(state.doc, found, { artboardId, focusIconId }, uid);
    edit(() => placed.doc);
    if (placed.into === 'icon') ui({ sel: placed.sel });
    else ui({ sel: placed.sel, focus: null, expanded: placed.artboardId ? { ...state.ui.expanded, [placed.artboardId]: true } : state.ui.expanded });
    const where = placed.into === 'icon' ? 'into the icon' : placed.into === 'new' ? 'on a new artboard' : 'on the artboard';
    const how = result.mode === 'clusters' ? ' (no frames found, grouped by spacing: check positions)' : '';
    const unnamed = placed.into !== 'icon' && found.some((i) => !i.name) && result.mode !== 'clusters' ? ' Names missing: enable "Include id attribute" in Figma.' : '';
    status(`Pasted ${found.length} icon${found.length === 1 ? '' : 's'} ${where}${how}.${result.skipped ? ` Skipped ${result.skipped} unsupported shape${result.skipped === 1 ? '' : 's'}.` : ''}${unnamed}`);
  }, [state.doc, state.ui.focus, state.ui.expanded, index, sel, edit, ui, status]);
  const pasteRef = useMemo(() => ({ fn: pasteSvg }), []); // eslint-disable-line react-hooks/exhaustive-deps
  pasteRef.fn = pasteSvg;
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      if ((e.target as HTMLElement | null)?.closest?.('input,textarea,[contenteditable]')) return;
      const data = e.clipboardData;
      if (!data) return;
      const text = data.getData('image/svg+xml') || data.getData('text/plain');
      if (text && looksLikeSvg(text)) { e.preventDefault(); pasteRef.fn(text); return; }
      const html = data.getData('text/html');
      const htmlSvg = html && svgFromHtml(html);
      if (htmlSvg && looksLikeSvg(htmlSvg)) { e.preventDefault(); pasteRef.fn(htmlSvg); return; }
      if (html && /figma/i.test(html)) { e.preventDefault(); status('That is a Figma copy. Use right-click › Copy/Paste as › Copy as SVG, then paste here.'); }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [pasteRef, status]);
  const pasteFromClipboard = useCallback(async () => {
    try {
      if (navigator.clipboard.read) {
        for (const item of await navigator.clipboard.read()) {
          if (item.types.includes('image/svg+xml')) {
            const text = await (await item.getType('image/svg+xml')).text();
            if (looksLikeSvg(text)) return pasteSvg(text);
          }
          if (item.types.includes('text/html')) {
            const text = svgFromHtml(await (await item.getType('text/html')).text());
            if (text && looksLikeSvg(text)) return pasteSvg(text);
          }
        }
      }
      const text = await navigator.clipboard.readText();
      if (looksLikeSvg(text)) pasteSvg(text); else status('Clipboard does not contain SVG. Use Copy as SVG in Figma, or paste with ⌘V.');
    } catch { status('Clipboard access blocked. Use ⌘V instead.'); }
  }, [pasteSvg, status]);

  // ---- context menu ----
  const [menu, setMenu] = useState<MenuState | null>(null);
  const closeMenu = useCallback(() => setMenu(null), []);
  const openMenu = useCallback((x: number, y: number, nodeId: string | null, world?: { x: number; y: number }) => {
    // selection may have been updated in the same event; resolve from the latest doc index
    const node = nodeId ? index.get(nodeId) ?? null : null;
    const cur = state.ui.sel.includes(nodeId ?? '') ? sel : node ? [node] : [];
    const one = cur.length === 1 ? cur[0] : null;
    const ids = cur.map((n) => n.id);
    const items: MenuItem[] = [];
    const canvasItems = (): MenuItem[] => [{ label: 'New artboard here', shortcut: 'A', onClick: () => {
      const ab: Artboard = { id: uid(), name: ops.nextName(state.doc, 'Artboard'), x: Math.round(world?.x ?? 0), y: Math.round(world?.y ?? 0), w: 80, h: 40, icons: [], rects: [] };
      edit((d) => ops.addArtboard(d, ab)); ui({ sel: [ab.id] });
    } }, { label: 'Paste SVG', shortcut: '⌘V', onClick: pasteFromClipboard }, { label: 'Zoom to fit', shortcut: '⌘0', onClick: zoomFit }];
    if (!node) {
      items.push({ label: 'New artboard here', shortcut: 'A', onClick: () => {
        const ab: Artboard = { id: uid(), name: ops.nextName(state.doc, 'Artboard'), x: Math.round(world?.x ?? 0), y: Math.round(world?.y ?? 0), w: 80, h: 40, icons: [], rects: [] };
        edit((d) => ops.addArtboard(d, ab)); ui({ sel: [ab.id] });
      } });
      items.push({ label: 'Paste SVG', shortcut: '⌘V', onClick: pasteFromClipboard });
      items.push({ label: 'Zoom to fit', shortcut: '⌘0', onClick: zoomFit });
      if (state.ui.focus) items.push({ label: 'Zoom to icon', shortcut: '⇧2', onClick: zoomSel });
      if (state.ui.focus) items.push({ label: 'Leave icon', shortcut: 'Esc', onClick: () => ui({ focus: null, sel: [] }) });
      setMenu({ x, y, items }); return;
    }
    const looseRects = cur.every((n) => n.kind === 'rect' && !n.iconId) && new Set(cur.map((n) => n.artboardId)).size === 1;
    if (looseRects) items.push({ label: 'Make component', shortcut: '⌘⌥K', onClick: () => makeComponent() });
    if (cur.length > 1 && cur.every((n) => n.kind === 'icon')) items.push({ label: 'Merge rects (union)', shortcut: '⌥⌘U', onClick: () => merge(ids) });
    if (cur.every((n) => n.kind === 'rect' && n.iconId)) items.push({ label: 'Merge icon rects (union)', shortcut: '⌥⌘U', onClick: () => merge([cur[0].iconId!]) });
    if (one?.kind === 'icon') {
      const ic = one.obj as Icon;
      items.push({ label: 'Add label', shortcut: 'T', onClick: () => {
        const t: TextNode = { id: uid(), text: ic.name, x: ic.x + ic.w + 2, y: ic.y, w: Math.max(1, ic.name.length * 3), h: 3, size: 3, fill: 'lv8' };
        edit((d) => ops.addText(d, one.artboardId, t));
        ui({ sel: [t.id], expanded: { ...state.ui.expanded, [one.artboardId]: true } });
      } });
      items.push({ label: 'Edit icon', shortcut: 'Enter', onClick: () => ui({ focus: one.id, sel: [] }) });
      items.push({ label: 'Rename', onClick: () => ui({ sel: [one.id], renaming: { id: one.id, at: 'layers' }, expanded: { ...state.ui.expanded, [one.artboardId]: true } }) });
      items.push({ label: ic.export ? 'Exclude from export' : 'Include in export', onClick: () => edit((d) => ops.setProps(d, one.id, { export: !ic.export })) });
      items.push({ label: 'Merge rects (union)', shortcut: '⌥⌘U', onClick: () => merge([one.id]) });
      items.push('sep');
      items.push({ label: 'Copy SVG', shortcut: '⌘E', onClick: () => copySvg(ic) });
      items.push({ label: 'Export this icon', onClick: () => exportIcon(ic) });
      items.push({ label: 'Detach component', onClick: () => { edit((d) => ops.detachComponent(d, one.id)); ui({ sel: [] }); } });
    }
    if (one?.kind === 'artboard') {
      const a = one.obj as Artboard;
      items.push({ label: 'Rename', onClick: () => ui({ sel: [one.id], renaming: { id: one.id, at: 'layers' }, expanded: { ...state.ui.expanded, [one.artboardId]: true } }) });
      items.push({ label: a.export === false ? 'Include in Export all' : 'Exclude from Export all', onClick: () => edit((d) => ops.setProps(d, one.id, { export: a.export === false })) });
      items.push({ label: 'Arrange icons', onClick: () => edit((d) => ops.arrangeIcons(d, one.id)) });
    }
    if (cur.length) {
      items.push('sep');
      items.push({ label: 'Zoom to selection', shortcut: '⇧2', onClick: zoomSel });
      items.push({ label: 'Duplicate', shortcut: '⌘D', onClick: () => duplicate(cur) });
      if (one?.kind !== 'artboard') {
        items.push({ label: 'Bring to front', shortcut: '⌘]', onClick: () => edit((d) => ops.reorder(d, ids, 1)) });
        items.push({ label: 'Send to back', shortcut: '⌘[', onClick: () => edit((d) => ops.reorder(d, ids, -1)) });
      }
      items.push('sep');
      items.push({ label: 'Delete', shortcut: '⌫', danger: true, onClick: () => remove(cur) });
    }
    if (world) { items.push('sep'); items.push(...canvasItems()); }
    setMenu({ x, y, items });
  }, [index, state.ui.sel, state.ui.focus, state.doc, sel, edit, ui, zoomFit, zoomSel, makeComponent, copySvg, exportIcon, duplicate, remove, merge, pasteFromClipboard]);
  const onCanvasMenu = useCallback((r: MenuRequest) => openMenu(r.x, r.y, r.nodeId, r.world), [openMenu]);
  const onLayerMenu = useCallback((x: number, y: number, id: string) => openMenu(x, y, id), [openMenu]);

  return (
    <div className={'app' + (state.ui.hideUi ? ' ui-hidden' : '')}>
      <style>{editorColorCss(state.doc.colors)}</style>
      <div className="surface">
        {!state.ui.hideUi && <Toolbar dark={dark} onDark={onDark} onExportAll={() => setExportOpen(true)} onImport={importRaw} onZoom={zoom} onZoomFit={zoomFit} saveState={autosave.saveState} />}
        {autosave.saveState === 'conflict' && (
          <div className="banner">
            <span>pixl.json changed on disk{dirty ? ' while you have unsaved edits' : ''}.</span>
            <span className="spacer" />
            <Button size="micro" variant="secondary" onClick={autosave.resolveReload}>Reload from disk</Button>
            <Button size="micro" variant="primary" onClick={autosave.resolveKeepMine}>Keep my version</Button>
          </div>
        )}
        <div className="body">
          {!state.ui.hideUi && <div className="column"><Layers onMenu={onLayerMenu} /></div>}
          <div className="stage">
            <Canvas onMenu={onCanvasMenu} />
            {!state.ui.hideUi && <div className="hints"><span>V Select</span><span>A Artboard</span><span>I Icon</span><span>R Rect</span><span>P Pick color</span><span>0–8 Level</span><span>⌘V Paste SVG</span><span>⌘-click Deep select</span><span>⌘⌥K Make component</span><span>⌥⌘U Merge</span><span>⌥-drag Duplicate</span><span>⌘D Duplicate</span><span>⌘[ ⌘] Order</span><span>⇧2 Zoom to selection</span><span>⌘Z Undo</span><span>Space + drag Pan</span><span>⌘ + scroll Zoom</span><span>⌘. Hide UI</span></div>}
          </div>
          {!state.ui.hideUi && (
            <div className="column">
              <Inspector onCopySvg={copySvg} onExportIcon={exportIcon} onMakeComponent={makeComponent} />
              <FillPanel />
              <Preview />
              <div className="filler" />
            </div>
          )}
        </div>
      </div>
      <ContextMenu menu={menu} onClose={closeMenu} />
      <Modal open={exportOpen} onOpenChange={setExportOpen} title="Export all" description={`Write ${icons.length} icon${icons.length === 1 ? '' : 's'} to raw-icons/ as SVG.`}>
        <div className="stack" style={{ paddingTop: 10 }}>
          {skipped.length > 0 && <div className="hint">Skipping {skipped.length} icon{skipped.length === 1 ? '' : 's'} not included in export: {skipped.slice(0, 12).map((s) => s.icon.name).join(', ')}{skipped.length > 12 ? ', …' : ''}</div>}
          {dupes.length > 0 && <div className="warn">Duplicate names: {dupes.join(', ')}</div>}
          {badNames.length > 0 && <div className="warn">Invalid names (letters, digits, space, - and _ only): {badNames.join(', ')}</div>}
          <Checkbox label="Run convert-icons.js afterwards (regenerates src/icons)" checked={convert} onChange={(e) => setConvert(e.target.checked)} />
          <div className="btn-row" style={{ justifyContent: 'flex-end' }}>
            <Button size="micro" variant="ghost" onClick={() => setExportOpen(false)}>Cancel</Button>
            <Button size="micro" variant="primary" disabled={!icons.length || dupes.length > 0 || badNames.length > 0} loading={exporting} onClick={exportAll}>Export</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export type { Doc };
