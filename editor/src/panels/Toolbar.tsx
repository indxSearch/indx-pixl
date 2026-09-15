import { Button, ToggleSwitch } from '@indxsearch/systm';
import { Component, Crop, Cursor, Document_or_file, Download, Indx, Maximize, Refresh, Save } from '@indxsearch/pixl';
import { persist, useEditor, type Tool } from '../model/store';

const TOOLS: { id: Tool; label: string; key: string; icon: React.ReactElement<{ size?: string | number; color?: string }> }[] = [
  { id: 'select', label: 'Select', key: 'V', icon: <Cursor /> },
  { id: 'artboard', label: 'Artboard', key: 'A', icon: <Maximize /> },
  { id: 'icon', label: 'Icon', key: 'I', icon: <Document_or_file /> },
  { id: 'rect', label: 'Rect', key: 'R', icon: <Crop /> },
];

export function Toolbar({ dark, onDark, onSave, onExportAll, onImport, onZoom, onZoomFit, saving }: {
  dark: boolean; onDark: (v: boolean) => void; onSave: () => void; onExportAll: () => void; onImport: () => void; onZoom: (f: number) => void; onZoomFit: () => void; saving: boolean;
}) {
  const { state, ui, dirty } = useEditor();
  const count = state.doc.artboards.reduce((n, a) => n + a.icons.length, 0);
  return (
    <div className="toolbar">
      <Indx size={28} color="var(--lv4)" />
      <span className="sep" />
      {TOOLS.map((t) => (
        <Button key={t.id} size="micro" variant={state.ui.tool === t.id ? 'primary' : 'ghost'} iconLeft={t.icon} title={`${t.label} (${t.key})`} onClick={() => ui({ tool: t.id })}>{t.label}</Button>
      ))}
      <Button size="micro" variant={state.ui.grid ? 'secondary' : 'ghost'} iconLeft={<Component />} title="Pixel grid (G)" onClick={() => ui({ grid: !state.ui.grid })}>Grid</Button>
      <Button size="micro" variant={state.ui.autoMerge ? 'secondary' : 'ghost'} title="Merge an icon's rects into one shape per color when you leave it (⌥⌘U merges manually)" onClick={() => { persist('pixl.autoMerge', !state.ui.autoMerge); ui({ autoMerge: !state.ui.autoMerge }); }}>Auto merge</Button>
      <span className="sep" />
      <span className="meta">pixl.json · {count} icons{dirty ? ' · unsaved' : ''}</span>
      <span className="status">{state.ui.status}</span>
      <span className="spacer" />
      <Button size="micro" variant="ghost" onClick={() => onZoom(0.8)} aria-label="Zoom out">−</Button>
      <button className="zoom" onClick={onZoomFit} title="Zoom to fit (⌘0)">{Math.round(state.ui.view.k / 8 * 100)}%</button>
      <Button size="micro" variant="ghost" onClick={() => onZoom(1.25)} aria-label="Zoom in">+</Button>
      <span className="sep" />
      <ToggleSwitch checked={dark} onChange={onDark} label="Dark" />
      <span className="sep" />
      <Button size="micro" variant="ghost" iconLeft={<Refresh />} title="Import raw-icons/ into a new artboard" onClick={onImport}>Import</Button>
      <Button size="micro" variant="secondary" iconLeft={<Download />} onClick={onExportAll}>Export all</Button>
      <Button size="micro" variant="primary" iconLeft={<Save />} onClick={onSave} loading={saving}>Save</Button>
    </div>
  );
}
