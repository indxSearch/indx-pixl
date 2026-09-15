import { useCallback, useEffect, useRef, useState } from 'react';
import { useEditor } from '../model/store';
import * as api from '../api';

export type SaveState = 'loading' | 'saved' | 'unsaved' | 'saving' | 'conflict' | 'error';
const DELAY = 800;

/**
 * Autosaves pixl.json shortly after edits settle, with compare-and-set on the file version so two tabs
 * or an external change (git pull, checkout) never silently overwrite each other.
 */
export function useAutosave(status: (s: string) => void) {
  const { state, dispatch, dirty } = useEditor();
  const [saveState, setSaveState] = useState<SaveState>('loading');
  const version = useRef<string | null>(null);
  const loaded = useRef(false);
  const inFlight = useRef(false);
  const latest = useRef({ doc: state.doc, dirty, conflict: false });
  latest.current = { doc: state.doc, dirty, conflict: saveState === 'conflict' };

  const load = useCallback(async (quiet = false) => {
    const { doc, version: v } = await api.loadDoc();
    version.current = v;
    if (doc) dispatch({ type: 'LOAD', doc });
    loaded.current = true;
    setSaveState('saved');
    if (quiet) status('Reloaded pixl.json (changed on disk)');
    return !!doc;
  }, [dispatch, status]);

  const save = useCallback(async (opts: { force?: boolean } = {}) => {
    if (!loaded.current || inFlight.current) return;
    if (latest.current.conflict && !opts.force) return;
    const doc = latest.current.doc;
    inFlight.current = true;
    setSaveState('saving');
    try {
      version.current = await api.saveDoc(doc, version.current, opts);
      dispatch({ type: 'MARK_SAVED', doc });
      setSaveState(latest.current.doc === doc ? 'saved' : 'unsaved');
    } catch (e) {
      if (e instanceof api.ConflictError) { setSaveState('conflict'); status('pixl.json changed on disk. Reload or keep your version.'); }
      else { setSaveState('error'); status('Save failed: ' + (e as Error).message); }
    } finally {
      inFlight.current = false;
    }
  }, [dispatch, status]);

  // debounce saves after edits, never mid-drag
  useEffect(() => {
    if (!loaded.current || !dirty || state.ui.dragging) return;
    if (saveState === 'conflict') return;
    if (saveState !== 'saving') setSaveState('unsaved');
    const t = setTimeout(() => save(), DELAY);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.doc, dirty, state.ui.dragging, saveState === 'conflict', saveState === 'saving']);

  // external changes: reload quietly when there is nothing unsaved, otherwise flag a conflict
  useEffect(() => {
    if (!import.meta.hot) return;
    const onChange = ({ version: v }: { version: string | null }) => {
      if (v === version.current) return; // our own write
      if (inFlight.current) return; // our save may be the cause; a real conflict still surfaces as a 409
      if (!latest.current.dirty) load(true).catch((e) => status('Reload failed: ' + e.message));
      else { setSaveState('conflict'); status('pixl.json changed on disk. Reload or keep your version.'); }
    };
    import.meta.hot.on('pixl:doc-changed', onChange);
    return () => import.meta.hot?.off('pixl:doc-changed', onChange);
  }, [load, status]);

  // last-chance save when the tab is hidden or closed
  useEffect(() => {
    const flush = () => {
      const { doc, dirty: d, conflict } = latest.current;
      if (!loaded.current || !d || conflict || inFlight.current) return;
      api.saveDoc(doc, version.current, { keepalive: true }).then((v) => { version.current = v; dispatch({ type: 'MARK_SAVED', doc }); }).catch(() => {});
    };
    const onVis = () => { if (document.visibilityState === 'hidden') flush(); };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('pagehide', flush);
    const warn = (e: BeforeUnloadEvent) => { if (latest.current.dirty && latest.current.conflict) e.preventDefault(); };
    window.addEventListener('beforeunload', warn);
    return () => { document.removeEventListener('visibilitychange', onVis); window.removeEventListener('pagehide', flush); window.removeEventListener('beforeunload', warn); };
  }, [dispatch]);

  const resolveReload = useCallback(() => load(false).then(() => status('Reloaded pixl.json from disk')), [load, status]);
  const resolveKeepMine = useCallback(() => save({ force: true }).then(() => status('Saved your version over pixl.json')), [save, status]);

  return { saveState, load, saveNow: () => save(), resolveReload, resolveKeepMine };
}
