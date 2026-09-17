import { useEffect } from 'react';
import { useEditor } from '../model/store';
import * as ops from '../model/ops';

export interface Commands {
  save: () => void;
  copySvg: () => void;
  copy: () => void;
  cut: () => void;
  makeComponent: () => void;
  duplicate: () => void;
  remove: () => void;
  merge: () => void;
  zoomFit: () => void;
  zoomSel: () => void;
  zoom: (f: number) => void;
}

export function useShortcuts(cmd: Commands) {
  const { state, dispatch, edit, ui, sel, index } = useEditor();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t instanceof Element && t.matches('input,textarea,select,[contenteditable]')) { if (e.key === 'Escape' || e.key === 'Enter') t.blur(); return; }
      const m = e.metaKey || e.ctrlKey, k = e.key.toLowerCase();
      const ids = state.ui.sel;
      const autoLayoutSel = ids.some((id) => {
        const n = index.get(id), a = n && index.get(n.artboardId)?.obj as { grid?: { auto?: boolean } } | undefined;
        return !!a?.grid?.auto && (n?.kind === 'icon' || n?.kind === 'text');
      });
      const arrow = (dx: number, dy: number, dir: -1 | 1) => edit((d) => autoLayoutSel ? ops.reorderAutoLayoutItems(d, ids, dir) : ops.moveNodes(d, ids, dx, dy));
      if (m) {
        if (k === 'z') { dispatch({ type: e.shiftKey ? 'REDO' : 'UNDO' }); }
        else if (k === 'd') cmd.duplicate();
        else if (k === 'c') cmd.copy();
        else if (k === 'x') cmd.cut();
        else if (k === 'a') { const f = state.ui.focus; const all = [...index.values()].filter((n) => f ? n.kind === 'rect' && n.iconId === f : n.kind === 'icon' || (n.kind === 'rect' && !n.iconId)); ui({ sel: all.map((n) => n.id) }); }
        else if (k === 's') cmd.save();
        else if (k === 'e') cmd.copySvg();
        else if (k === 'k' && e.altKey) cmd.makeComponent();
        else if (k === 'u' && e.altKey) cmd.merge();
        else if (k === '[') edit((d) => ops.reorder(d, ids, -1));
        else if (k === ']') edit((d) => ops.reorder(d, ids, 1));
        else if (k === '.') ui({ hideUi: !state.ui.hideUi });
        else if (k === '0') cmd.zoomFit();
        else if (k === '=' || k === '+') cmd.zoom(1.25);
        else if (k === '-') cmd.zoom(0.8);
        else return;
        e.preventDefault(); return;
      }
      if (e.shiftKey && e.key === '@' || (e.shiftKey && e.code === 'Digit2')) { cmd.zoomSel(); e.preventDefault(); return; }
      switch (e.key) {
        case 'v': ui({ tool: 'select' }); break;
        case 'a': ui({ tool: 'artboard' }); break;
        case 'i': ui({ tool: 'icon' }); break;
        case 'r': ui({ tool: 'rect' }); break;
        case 't': ui({ tool: 'text' }); break;
        case 'p': ui({ tool: 'eyedropper' }); break;
        case 'g': ui({ grid: !state.ui.grid }); break;
        case 'Escape': if (ids.length) ui({ sel: [] }); else ui({ focus: null, tool: 'select' }); break;
        case 'Delete': case 'Backspace': cmd.remove(); break;
        case 'ArrowLeft': arrow(-1, 0, -1); break;
        case 'ArrowRight': arrow(1, 0, 1); break;
        case 'ArrowUp': arrow(0, -1, -1); break;
        case 'ArrowDown': arrow(0, 1, 1); break;
        case 'Enter': { const n = sel[0]; if (sel.length === 1 && n.kind === 'icon') ui({ focus: n.id, sel: (n.obj as { rects: { id: string }[] }).rects.map((r) => r.id) }); break; }
        default:
          if (/^[0-8]$/.test(e.key)) { const fill = `lv${e.key}`; ui({ fill }); if (ids.length) edit((d) => ops.setFill(d, ids, fill)); }
          else return;
      }
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state, sel, index, dispatch, edit, ui, cmd]);
}
