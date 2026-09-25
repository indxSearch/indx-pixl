import { useState } from 'react';
import { Button, Modal, Slider, ToggleSwitch } from '@indxsearch/systm';
import { Component, Crop, Cursor, Document_or_file, Download, Drop_full, Indx, Maximize, Minus, Options_menu, Plus, Refresh, Text_cursor } from '@indxsearch/pixl';
import type { SaveState } from '../hooks/useAutosave';

const SAVE_LABEL: Record<SaveState, string> = { loading: 'Loading…', saved: 'Saved', unsaved: 'Unsaved', saving: 'Saving…', conflict: 'Changed on disk', error: 'Save failed' };
import { persist, useEditor, type Tool } from '../model/store';

const TOOLS: { id: Tool; label: string; key: string; icon: React.ReactElement<{ size?: string | number; color?: string }> }[] = [
  { id: 'select', label: 'Select', key: 'V', icon: <Cursor /> },
  { id: 'artboard', label: 'Artboard', key: 'A', icon: <Maximize /> },
  { id: 'icon', label: 'Icon', key: 'I', icon: <Document_or_file /> },
  { id: 'rect', label: 'Rect', key: 'R', icon: <Crop /> },
  { id: 'text', label: 'Text', key: 'T', icon: <Text_cursor /> },
  { id: 'eyedropper', label: 'Pick', key: 'P', icon: <Drop_full /> },
];

export function Toolbar({ dark, onDark, onExportAll, onImport, onZoom, onZoomFit, saveState }: {
  dark: boolean; onDark: (v: boolean) => void; onExportAll: () => void; onImport: () => void; onZoom: (f: number) => void; onZoomFit: () => void; saveState: SaveState;
}) {
  const { state, ui } = useEditor();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);
  const count = state.doc.artboards.reduce((n, a) => n + a.icons.length, 0);
  const zoomPercent = Math.round(state.ui.view.k / 8 * 100);
  const setZoomPercent = (next: number) => onZoom((next / 100 * 8) / state.ui.view.k);
  return (
    <>
    <div className="toolbar">
      <span className="brand"><Indx size={21} color="var(--lv4)" /></span>
      <span className="sep" />
      <span className="meta file-state">pixl.json · <span className={'save-state ' + saveState} title="Saves automatically. ⌘S saves now.">{SAVE_LABEL[saveState]}</span></span>
      <span className="meta icon-count">{count} icons</span>
      <span className="status" title={state.ui.status}>{state.ui.status}</span>
      <span className="spacer" />
      <div className="zoom-menu">
        <button className="zoom" onClick={() => setZoomOpen((v) => !v)} title="Zoom">{zoomPercent}%</button>
        {zoomOpen && (
          <div className="zoom-popover">
            <div className="zoom-row"><span>Zoom</span><span>{zoomPercent}%</span></div>
            <div className="zoom-slider-row">
              <Button size="micro" variant="ghost" iconLeft={<Minus />} onClick={() => setZoomPercent(Math.max(25, zoomPercent - 25))} aria-label="Zoom out" />
              <Slider min={25} max={800} step={5} value={Math.min(800, Math.max(25, zoomPercent))} onChange={(value) => setZoomPercent(typeof value === 'number' ? value : value[0])} aria-label="Zoom" />
              <Button size="micro" variant="ghost" iconLeft={<Plus />} onClick={() => setZoomPercent(Math.min(800, zoomPercent + 25))} aria-label="Zoom in" />
            </div>
            <div className="btn-row zoom-actions">
              <Button size="micro" variant="ghost" onClick={() => { setZoomPercent(100); setZoomOpen(false); }}>100%</Button>
              <Button size="micro" variant="secondary" onClick={() => { onZoomFit(); setZoomOpen(false); }}>Fit</Button>
            </div>
          </div>
        )}
      </div>
      <span className="sep" />
      <Button size="micro" variant={state.ui.grid ? 'secondary' : 'ghost'} iconLeft={<Component />} title="Pixel grid (G)" onClick={() => ui({ grid: !state.ui.grid })}><span className="toolbar-label">Grid</span></Button>
      <Button size="micro" variant="ghost" iconLeft={<Options_menu />} aria-label="Settings" title="Settings" onClick={() => setSettingsOpen(true)} />
      <ToggleSwitch checked={dark} onChange={onDark} label="Dark" />
      <span className="sep" />
      <Button size="micro" variant="ghost" iconLeft={<Refresh />} title="Import raw-icons/ into a new artboard" onClick={onImport}><span className="toolbar-label">Import</span></Button>
      <Button size="micro" variant="primary" iconLeft={<Download />} title="Export all" onClick={onExportAll}><span className="toolbar-label export-label">Export all</span></Button>
    </div>
    <div className="floating-tools" aria-label="Canvas tools">
      {TOOLS.map((t) => (
        <Button key={t.id} size="micro" variant={state.ui.tool === t.id ? 'primary' : 'ghost'} iconLeft={t.icon} title={`${t.label} (${t.key})`} onClick={() => ui({ tool: t.id })}><span className="floating-tool-label">{t.label}</span></Button>
      ))}
    </div>
    <Modal open={settingsOpen} onOpenChange={setSettingsOpen} title="Editor settings" description="Preferences for canvas editing and cleanup.">
      <div className="stack" style={{ paddingTop: 10 }}>
        <span title="Merge an icon's pixels into as few rects per color when you leave it. ⌥⌘U still merges manually.">
          <ToggleSwitch checked={state.ui.autoMerge} onChange={(v) => { persist('pixl.autoMerge', v); ui({ autoMerge: v }); }} label="Auto merge icon pixels" />
        </span>
        <div className="hint">When enabled, leaving an icon compacts adjacent pixels with the same fill into fewer rectangles. Exported SVGs stay the same; this mainly keeps pixl.json smaller and easier to diff.</div>
        <div className="btn-row" style={{ justifyContent: 'flex-end' }}>
          <Button size="micro" variant="secondary" onClick={() => setSettingsOpen(false)}>Done</Button>
        </div>
      </div>
    </Modal>
    </>
  );
}
