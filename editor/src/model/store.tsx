import { createContext, useCallback, useContext, useMemo, useReducer, type ReactNode } from 'react';
import { type Doc, type Fill, type Node, emptyDoc, indexDoc } from './types';

export type Tool = 'select' | 'artboard' | 'icon' | 'rect';
export type Theme = 'system' | 'light' | 'dark';
export interface View { x: number; y: number; k: number }

export interface UI {
  tool: Tool;
  sel: string[];
  focus: string | null; // icon id being edited
  hover: string | null;
  view: View;
  fill: Fill;
  theme: Theme;
  grid: boolean;
  expanded: Record<string, boolean>;
  status: string;
  rename: string | null; // node id whose name field should take focus
  renaming: { id: string; at: 'canvas' | 'layers' } | null; // name being edited inline
  autoMerge: boolean; // merge an icon's rects when leaving it
  dragging: boolean; // a canvas drag is in progress (autosave waits)
}
export interface State {
  doc: Doc;
  past: Doc[];
  future: Doc[];
  savedDoc: Doc | null;
  ui: UI;
}

export type Action =
  | { type: 'EDIT'; fn: (doc: Doc) => Doc; transient?: boolean }
  | { type: 'CHECKPOINT' }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'LOAD'; doc: Doc }
  | { type: 'MARK_SAVED'; doc: Doc }
  | { type: 'UI'; patch: Partial<UI> };

const MAX_HISTORY = 200;

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'CHECKPOINT':
      return { ...s, past: [...s.past.slice(-MAX_HISTORY), s.doc], future: [] };
    case 'EDIT': {
      const doc = a.fn(s.doc);
      if (doc === s.doc) return s;
      return a.transient ? { ...s, doc } : { ...s, doc, past: [...s.past.slice(-MAX_HISTORY), s.doc], future: [] };
    }
    case 'UNDO': {
      if (!s.past.length) return s;
      const prev = s.past[s.past.length - 1];
      return { ...s, doc: prev, past: s.past.slice(0, -1), future: [s.doc, ...s.future] };
    }
    case 'REDO': {
      if (!s.future.length) return s;
      const [next, ...rest] = s.future;
      return { ...s, doc: next, past: [...s.past, s.doc], future: rest };
    }
    case 'LOAD': {
      // keep selection/focus when the nodes still exist (e.g. reloading after an external change)
      const ids = new Set(a.doc.artboards.flatMap((ab) => [ab.id, ...ab.rects.map((r) => r.id), ...ab.icons.flatMap((i) => [i.id, ...i.rects.map((r) => r.id)])]));
      return { ...s, doc: a.doc, past: [], future: [], savedDoc: a.doc, ui: { ...s.ui, sel: s.ui.sel.filter((id) => ids.has(id)), focus: s.ui.focus && ids.has(s.ui.focus) ? s.ui.focus : null } };
    }
    case 'MARK_SAVED':
      return { ...s, savedDoc: a.doc }; // the doc that was written, which may be older than the current one
    case 'UI':
      return { ...s, ui: { ...s.ui, ...a.patch } };
  }
}

const load = <T,>(k: string, d: T): T => { try { const v = localStorage.getItem(k); return v == null ? d : (JSON.parse(v) as T); } catch { return d; } };
export const persist = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } };

const initial: State = {
  doc: emptyDoc(), past: [], future: [], savedDoc: null,
  ui: {
    tool: 'select', sel: [], focus: null, hover: null,
    view: load('pixl.view', { x: 80, y: 80, k: 8 }),
    fill: 'lv8', theme: load('pixl.theme', 'system'), grid: true, expanded: {}, status: '', rename: null, renaming: null, autoMerge: load('pixl.autoMerge', true), dragging: false,
  },
};

interface Ctx {
  state: State;
  index: Map<string, Node>;
  dispatch: (a: Action) => void;
  edit: (fn: (doc: Doc) => Doc, transient?: boolean) => void;
  ui: (patch: Partial<UI>) => void;
  sel: Node[];
  dirty: boolean;
}
const EditorContext = createContext<Ctx | null>(null);

export function EditorProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial);
  const index = useMemo(() => indexDoc(state.doc), [state.doc]);
  const edit = useCallback((fn: (doc: Doc) => Doc, transient?: boolean) => dispatch({ type: 'EDIT', fn, transient }), []);
  const ui = useCallback((patch: Partial<UI>) => dispatch({ type: 'UI', patch }), []);
  const value = useMemo<Ctx>(() => ({
    state, index, dispatch, edit, ui,
    sel: state.ui.sel.map((id) => index.get(id)).filter((n): n is Node => !!n),
    dirty: state.savedDoc !== state.doc,
  }), [state, index, edit, ui]);
  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
}

export function useEditor(): Ctx {
  const c = useContext(EditorContext);
  if (!c) throw new Error('useEditor outside provider');
  return c;
}
