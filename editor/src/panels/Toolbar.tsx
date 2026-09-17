import { Button, ToggleSwitch } from '@indxsearch/systm';
import { Component, Crop, Cursor, Document_or_file, Download, Drop_full, Indx, Maximize, Minus, Plus, Refresh } from '@indxsearch/pixl';
import type { SaveState } from '../hooks/useAutosave';

const SAVE_LABEL: Record<SaveState, string> = { loading: 'Loading…', saved: 'Saved', unsaved: 'Unsaved', saving: 'Saving…', conflict: 'Changed on disk', error: 'Save failed' };
import { persist, useEditor, type Tool } from '../model/store';

const TOOLS: { id: Tool; label: string; key: string; icon: React.ReactElement<{ size?: string | number; color?: string }> }[] = [
  { id: 'select', label: 'Select', key: 'V', icon: <Cursor /> },
  { id: 'artboard', label: 'Artboard', key: 'A', icon: <Maximize /> },
  { id: 'icon', label: 'Icon', key: 'I', icon: <Document_or_file /> },
  { id: 'rect', label: 'Rect', key: 'R', icon: <Crop /> },
  { id: 'eyedropper', label: 'Pick', key: 'P', icon: <Drop_full /> },
];

export function Toolbar({ dark, onDark, onExportAll, onImport, onZoom, onZoomFit, saveState }: {
  dark: boolean; onDark: (v: boolean) => void; onExportAll: () => void; onImport: () => void; onZoom: (f: number) => void; onZoomFit: () => void; saveState: SaveState;
}) {
  const { state, ui } = useEditor();
  const count = state.doc.artboards.reduce((n, a) => n + a.icons.length, 0);
  return (
    <div className="toolbar">
      <span className="brand"><Indx size={21} color="var(--lv4)" /></span>
      <span className="sep" />
      {TOOLS.map((t) => (
        <Button key={t.id} size="micro" variant={state.ui.tool === t.id ? 'primary' : 'ghost'} iconLeft={t.icon} title={`${t.label} (${t.key})`} onClick={() => ui({ tool: t.id })}>{t.label}</Button>
      ))}
      <Button size="micro" variant={state.ui.grid ? 'secondary' : 'ghost'} iconLeft={<Component />} title="Pixel grid (G)" onClick={() => ui({ grid: !state.ui.grid })}>Grid</Button>
      <span className="sep" />
      <span title="Merge an icon's pixels into as few rects per color when you leave it (⌥⌘U merges manually)">
        <ToggleSwitch checked={state.ui.autoMerge} onChange={(v) => { persist('pixl.autoMerge', v); ui({ autoMerge: v }); }} label="Auto merge" />
      </span>
      <span className="sep" />
      <span className="meta">pixl.json · {count} icons · <span className={'save-state ' + saveState} title="Saves automatically. ⌘S saves now.">{SAVE_LABEL[saveState]}</span></span>
      <span className="status" title={state.ui.status}>{state.ui.status}</span>
      <span className="spacer" />
      <Button size="micro" variant="ghost" iconLeft={<Minus />} onClick={() => onZoom(0.8)} aria-label="Zoom out" title="Zoom out (⌘−)" />
      <button className="zoom" onClick={onZoomFit} title="Zoom to fit (⌘0)">{Math.round(state.ui.view.k / 8 * 100)}%</button>
      <Button size="micro" variant="ghost" iconLeft={<Plus />} onClick={() => onZoom(1.25)} aria-label="Zoom in" title="Zoom in (⌘+)" />
      <span className="sep" />
      <ToggleSwitch checked={dark} onChange={onDark} label="Dark" />
      <span className="sep" />
      <Button size="micro" variant="ghost" iconLeft={<Refresh />} title="Import raw-icons/ into a new artboard" onClick={onImport}>Import</Button>
      <Button size="micro" variant="primary" iconLeft={<Download />} onClick={onExportAll}>Export all</Button>
    </div>
  );
}
