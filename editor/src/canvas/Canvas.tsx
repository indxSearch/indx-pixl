import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useEditor, type View } from '../model/store';
import { type Artboard, type Box, type Doc, type Icon, type Node, type Rect, type TextNode, bboxOf, fillAttr, intersects, isExported, uid } from '../model/types';
import * as ops from '../model/ops';
import { NameInput } from '../panels/NameInput';
import { HANDLES, type Handle, handlePos, norm, resizeBox, screenBox, toWorld } from './geometry';
import { type Guide, measure, movingEdges, snap } from './guides';
import { drawnRects } from '../model/instances';

type Drag =
  | { type: 'pan'; sx: number; sy: number; vx: number; vy: number }
  | { type: 'move'; ids: string[]; sw: { x: number; y: number }; orig: Doc; moved: boolean }
  | { type: 'resize'; id: string; h: Handle; orig: Doc; box: Box; px: number; py: number; minW: number; minH: number }
  | { type: 'marquee'; base: string[]; add: boolean; start: { x: number; y: number }; end: { x: number; y: number }; level: 'top' | 'icon'; iconId: string | null }
  | { type: 'draw'; artboardId: string; iconId: string | null; ox: number; oy: number; x0: number; y0: number; x1: number; y1: number; cw: number; ch: number }
  | { type: 'drawArtboard'; x0: number; y0: number; x1: number; y1: number };

const LABEL_ZOOM = 6;   // show icon labels / frames from this zoom
const GRID_ZOOM = 8;    // show icon pixel grid from this zoom

export interface MenuRequest { x: number; y: number; nodeId: string | null; world: { x: number; y: number } }

export function Canvas({ onMenu }: { onMenu: (r: MenuRequest) => void }) {
  const { state, index, edit, ui, dispatch, sel } = useEditor();
  const { doc } = state;
  const { view, tool, focus, hover, grid } = state.ui;
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<Drag | null>(null);
  const [drag, setDrag] = useState<Drag | null>(null); // mirrored for rendering marquee/draw previews
  const [space, setSpace] = useState(false);
  const [guides, setGuides] = useState<Guide[]>([]); // smart guides while an artboard is dragged or resized
  const [alt, setAlt] = useState(false); // Alt held: measure from the selection to what the pointer is over
  useEffect(() => {
    const down = (e: KeyboardEvent) => { if (e.key === 'Alt') setAlt(true); };
    const up = (e: KeyboardEvent) => { if (e.key === 'Alt') setAlt(false); };
    const off = () => setAlt(false);
    window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('blur', off);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', off); };
  }, []);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const lastDown = useRef<{ t: number; id: string | null }>({ t: 0, id: null });

  const setDragBoth = (d: Drag | null) => {
    if (!!d !== !!dragRef.current) ui({ dragging: !!d });
    dragRef.current = d; setDrag(d);
  };

  // Keep the drawing still on screen when the stage moves in the window (⌘. hide UI, the conflict banner).
  // Runs before paint, so the shift never shows as a jump.
  const stageAt = useRef<{ left: number; top: number } | null>(null);
  useLayoutEffect(() => {
    const b = svgRef.current!.getBoundingClientRect(), prev = stageAt.current;
    stageAt.current = { left: b.left, top: b.top };
    if (!prev || (prev.left === b.left && prev.top === b.top)) return;
    const v = stateRef.current.ui.view;
    ui({ view: { ...v, x: v.x + prev.left - b.left, y: v.y + prev.top - b.top } });
  });

  // ---- stage size + wheel (non-passive) ----
  useEffect(() => {
    const el = svgRef.current!;
    const ro = new ResizeObserver(() => { const b = el.getBoundingClientRect(); setSize({ w: b.width, h: b.height }); });
    ro.observe(el);
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const v = stateRef.current.ui.view;
      if (e.ctrlKey || e.metaKey) {
        const b = el.getBoundingClientRect();
        zoomAt(v, { x: e.clientX - b.left, y: e.clientY - b.top }, Math.exp(-e.deltaY * 0.01));
      } else ui({ view: { ...v, x: v.x - e.deltaX, y: v.y - e.deltaY } });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => { ro.disconnect(); el.removeEventListener('wheel', onWheel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const stateRef = useRef(state); stateRef.current = state;

  const zoomAt = useCallback((v: View, p: { x: number; y: number }, f: number) => {
    const k = Math.min(200, Math.max(0.5, v.k * f)), r = k / v.k;
    ui({ view: { x: p.x - (p.x - v.x) * r, y: p.y - (p.y - v.y) * r, k } });
  }, [ui]);

  // ---- space key for panning ----
  useEffect(() => {
    const down = (e: KeyboardEvent) => { if (e.code === 'Space' && !(e.target as HTMLElement).matches('input,textarea')) { setSpace(true); e.preventDefault(); } };
    const up = (e: KeyboardEvent) => { if (e.code === 'Space') setSpace(false); };
    window.addEventListener('keydown', down); window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  // ---- helpers ----
  const pt = (e: { clientX: number; clientY: number }) => { const b = svgRef.current!.getBoundingClientRect(); return { x: e.clientX - b.left, y: e.clientY - b.top }; };
  const hitOf = (t: EventTarget | null): { node: Node; role: string | null; handle: Handle | null } | null => {
    const el = (t as Element | null)?.closest?.('[data-id],[data-h]') as HTMLElement | null;
    if (!el) return null;
    if (el.dataset.h) return { node: null as unknown as Node, role: null, handle: el.dataset.h as Handle };
    const node = index.get(el.dataset.id!);
    return node ? { node, role: el.dataset.role ?? null, handle: null } : null;
  };
  const toggleSel = (id: string, shift: boolean) => {
    const cur = state.ui.sel;
    if (shift) ui({ sel: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id] });
    else if (!cur.includes(id)) ui({ sel: [id] });
  };
  const containerOf = (n: Node): { artboardId: string; iconId: string | null; ox: number; oy: number; cw: number; ch: number } => {
    const a = index.get(n.artboardId)!;
    const iconId = n.kind === 'icon' ? n.id : n.iconId;
    if (iconId) { const ic = index.get(iconId)!; return { artboardId: a.id, iconId, ox: ic.ax, oy: ic.ay, cw: ic.w, ch: ic.h }; }
    return { artboardId: a.id, iconId: null, ox: a.ax, oy: a.ay, cw: a.w, ch: a.h };
  };

  // ---- pointer ----
  const onPointerDown = (e: React.PointerEvent) => {
    const p = pt(e), w = toWorld(view, p);
    svgRef.current!.setPointerCapture(e.pointerId);
    if (e.button === 1 || space) { setDragBoth({ type: 'pan', sx: p.x, sy: p.y, vx: view.x, vy: view.y }); return; }
    if (e.button !== 0) return;
    const hit = hitOf(e.target);

    if (tool === 'eyedropper') {
      if (hit?.node?.kind === 'rect') {
        const fill = (hit.node.obj as Rect).fill;
        const colorIds = state.ui.sel.filter((id) => { const kind = index.get(id)?.kind; return kind === 'rect' || kind === 'text'; });
        if (colorIds.length) edit((d) => ops.setFill(d, colorIds, fill));
        ui({ fill, tool: 'select' });
      }
      return;
    }

    // manual double-click detection (focus into an icon)
    const now = performance.now();
    const hitId = hit?.node?.id ?? null;
    const dbl = tool === 'select' && hitId && lastDown.current.id === hitId && now - lastDown.current.t < 400;
    lastDown.current = { t: now, id: hitId };
    if (dbl && hit?.node && hit.role !== 'title') {
      const n = hit.node;
      const iconId = n.kind === 'icon' ? n.id : n.iconId;
      if (iconId && iconId !== focus) { ui({ focus: iconId, sel: n.kind === 'rect' ? [enterAt(iconId, w)].filter(Boolean) : [] }); return; }
    }

    if (hit?.handle && sel.length === 1) {
      const n = sel[0];
      const parentX = n.ax - (n.obj as Box).x, parentY = n.ay - (n.obj as Box).y;
      dispatch({ type: 'CHECKPOINT' });
      setDragBoth({ type: 'resize', id: n.id, h: hit.handle, orig: doc, box: { x: (n.obj as Box).x, y: (n.obj as Box).y, w: n.w, h: n.h }, px: parentX, py: parentY, minW: 1, minH: 1 });
      return;
    }

    if (tool === 'artboard') {
      setDragBoth({ type: 'drawArtboard', x0: Math.round(w.x), y0: Math.round(w.y), x1: Math.round(w.x), y1: Math.round(w.y) });
      return;
    }
    if (tool === 'icon') {
      if (!hit) return;
      const a = index.get(hit.node.artboardId)!;
      const id = uid();
      const name = ops.nextName(doc, 'icon');
      edit((d) => {
        const next = ops.addIcon(d, a.id, { id, name, x: Math.floor(w.x - a.ax), y: Math.floor(w.y - a.ay), w: 7, h: 5, rects: [] });
        return ((a.obj as Artboard).grid?.auto) ? ops.arrangeArtboardItems(next, a.id) : next;
      });
      ui({ sel: [id], focus: null, tool: 'select' });
      return;
    }
    if (tool === 'text') {
      const a = hit ? index.get(hit.node.artboardId)?.obj as Artboard : [...doc.artboards].reverse().find((ab) => w.x >= ab.x && w.y >= ab.y && w.x <= ab.x + ab.w && w.y <= ab.y + ab.h);
      if (!a) return;
      const id = uid(), size = 2, value = 'Label';
      const text: TextNode = { id, text: value, x: Math.floor(w.x - a.x), y: Math.floor(w.y - a.y), w: 7, h: 3, size, fill: state.ui.fill };
      edit((d) => {
        const next = ops.addText(d, a.id, text);
        return a.grid?.auto ? ops.arrangeArtboardItems(next, a.id) : next;
      });
      ui({ sel: [id], focus: null, tool: 'select' });
      return;
    }
    if (tool === 'rect') {
      if (!hit) return;
      const c = containerOf(hit.node);
      const x = Math.floor(w.x - c.ox), y = Math.floor(w.y - c.oy);
      const cx = c.iconId ? Math.min(Math.max(x, 0), c.cw - 1) : x, cy = c.iconId ? Math.min(Math.max(y, 0), c.ch - 1) : y;
      setDragBoth({ type: 'draw', artboardId: c.artboardId, iconId: c.iconId, ox: c.ox, oy: c.oy, x0: cx, y0: cy, x1: cx, y1: cy, cw: c.cw, ch: c.ch });
      if (c.iconId !== focus) ui({ focus: c.iconId, sel: [] });
      return;
    }

    // ---- select tool ----
    if (!hit) {
      if (!e.shiftKey) ui({ sel: [], focus: null });
      setDragBoth({ type: 'marquee', base: e.shiftKey ? state.ui.sel : [], add: e.shiftKey, start: w, end: w, level: 'top', iconId: null });
      return;
    }
    let n = hit.node;
    if (hit.role === 'title') { toggleSel(n.id, e.shiftKey); startMove(n.id, w, e.shiftKey, e.altKey); return; }

    // ⌘-click: deep select a rect inside an icon (enters that icon)
    if (e.metaKey && n.kind === 'rect' && n.iconId) {
      if (n.iconId !== focus) {
        const pixel = enterAt(n.iconId, w);
        ui({ focus: n.iconId, sel: pixel ? [pixel] : [] });
        setDragBoth({ type: 'move', ids: [pixel], sw: w, orig: dragBase.current, moved: false });
        return;
      }
      toggleSel(n.id, e.shiftKey);
      setDragBoth({ type: 'move', ids: [n.id], sw: w, orig: doc, moved: false });
      return;
    }

    if (focus) {
      if (n.kind === 'rect' && n.iconId === focus) { toggleSel(n.id, e.shiftKey); startMove(n.id, w, e.shiftKey, e.altKey); return; }
      if (n.kind === 'icon' && n.id === focus) {
        // clicked empty space inside the focused icon: marquee within it
        if (!e.shiftKey) ui({ sel: [] });
        setDragBoth({ type: 'marquee', base: e.shiftKey ? state.ui.sel : [], add: e.shiftKey, start: w, end: w, level: 'icon', iconId: focus });
        return;
      }
      ui({ focus: null });
    }
    if (n.kind === 'rect' && n.iconId) n = index.get(n.iconId)!;
    if (n.kind === 'artboard') {
      if (!e.shiftKey) ui({ sel: [] });
      setDragBoth({ type: 'marquee', base: e.shiftKey ? state.ui.sel : [], add: e.shiftKey, start: w, end: w, level: 'top', iconId: null });
      return;
    }
    toggleSel(n.id, e.shiftKey);
    startMove(n.id, w, e.shiftKey, e.altKey);
  };

  /** Enter an icon at a world point: split it into pixels now and return the id of the pixel under the point. */
  const dragBase = useRef(doc);
  const enterAt = (iconId: string, w: { x: number; y: number }): string => {
    const n = index.get(iconId)!;
    const next = ops.splitIcons(doc, [iconId]);
    if (next !== doc) edit(() => next, true);
    dragBase.current = next;
    const x = Math.floor(w.x - n.ax), y = Math.floor(w.y - n.ay);
    const ic = next.artboards.find((a) => a.id === n.artboardId)!.icons.find((i) => i.id === iconId)!;
    return ic.rects.find((r) => r.x === x && r.y === y)?.id ?? '';
  };

  const startMove = (id: string, w: { x: number; y: number }, shift: boolean, alt = false) => {
    const cur = state.ui.sel;
    let ids = shift ? (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]) : cur.includes(id) ? cur : [id];
    if (alt && ids.length) {
      // alt-drag: duplicate in place, then move the copies
      const nodes = ids.map((i) => index.get(i)).filter((n): n is Node => !!n);
      const map = ops.duplicateIdMap(nodes, uid);
      const next = ops.duplicateNodes(doc, ids, map, 0);
      edit(() => next);
      ids = ids.map((i) => map[i]);
      ui({ sel: ids });
      setDragBoth({ type: 'move', ids, sw: w, orig: next, moved: true });
      return;
    }
    setDragBoth({ type: 'move', ids, sw: w, orig: doc, moved: false });
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    const p = pt(e), w = toWorld(view, p);
    if (!d) {
      const hit = hitOf(e.target);
      let id = hit?.node?.id ?? null;
      if (hit?.node && hit.node.kind === 'rect' && hit.node.iconId && hit.node.iconId !== focus) id = hit.node.iconId;
      if (hit?.node?.kind === 'artboard' && hit.role !== 'title' && !e.altKey) id = null;
      if (id !== hover) ui({ hover: id });
      return;
    }
    switch (d.type) {
      case 'pan': ui({ view: { ...view, x: d.vx + p.x - d.sx, y: d.vy + p.y - d.sy } }); return;
      case 'move': {
        let dx = Math.round(w.x - d.sw.x), dy = Math.round(w.y - d.sw.y);
        if (!d.moved && !dx && !dy) return;
        if (!d.moved) { dispatch({ type: 'CHECKPOINT' }); d.moved = true; }
        // artboards snap to the edges and centres of the other artboards
        const moved = d.orig.artboards.filter((a) => d.ids.includes(a.id));
        if (moved.length === d.ids.length && !e.metaKey) {
          const x0 = Math.min(...moved.map((a) => a.x)), y0 = Math.min(...moved.map((a) => a.y));
          const box = { x: x0 + dx, y: y0 + dy, w: Math.max(...moved.map((a) => a.x + a.w)) - x0, h: Math.max(...moved.map((a) => a.y + a.h)) - y0 };
          const s = snap(box, d.orig.artboards.filter((a) => !d.ids.includes(a.id)), 6 / view.k, movingEdges(null));
          dx += s.dx; dy += s.dy; setGuides(s.guides);
        }
        edit(() => ops.moveNodes(d.orig, d.ids, dx, dy), true);
        return;
      }
      case 'resize': {
        const box = resizeBox(d.box, d.h, w.x - d.px, w.y - d.py, d.minW, d.minH);
        if (d.orig.artboards.some((a) => a.id === d.id) && !e.metaKey) {
          // the dragged side of an artboard snaps to the other artboards
          const s = snap(box, d.orig.artboards.filter((a) => a.id !== d.id), 6 / view.k, movingEdges(d.h));
          if (d.h.includes('w')) { box.x += s.dx; box.w -= s.dx; } else if (d.h.includes('e')) box.w += s.dx;
          if (d.h.includes('n')) { box.y += s.dy; box.h -= s.dy; } else if (d.h.includes('s')) box.h += s.dy;
          box.w = Math.max(d.minW, box.w); box.h = Math.max(d.minH, box.h);
          setGuides(s.guides);
        }
        // an auto-layout artboard re-flows its items while it is resized
        edit(() => { const next = ops.setGeometry(d.orig, d.id, box); return next.artboards.find((a) => a.id === d.id)?.grid?.auto ? ops.arrangeArtboardItems(next, d.id) : next; }, true);
        return;
      }
      case 'marquee': {
        const box = norm(d.start.x, d.start.y, w.x, w.y);
        const hits: string[] = [];
        for (const n of index.values()) {
          if (d.level === 'icon' ? !(n.kind === 'rect' && n.iconId === d.iconId) : !(n.kind === 'icon' || n.kind === 'text' || (n.kind === 'rect' && !n.iconId))) continue;
          if (intersects(box, { x: n.ax, y: n.ay, w: n.w, h: n.h })) hits.push(n.id);
        }
        ui({ sel: [...new Set([...d.base, ...hits])] });
        setDragBoth({ ...d, end: w });
        return;
      }
      case 'draw': {
        let x = Math.floor(w.x - d.ox), y = Math.floor(w.y - d.oy);
        if (d.iconId) { x = Math.min(Math.max(x, 0), d.cw - 1); y = Math.min(Math.max(y, 0), d.ch - 1); }
        if (x !== d.x1 || y !== d.y1) setDragBoth({ ...d, x1: x, y1: y });
        return;
      }
      case 'drawArtboard': setDragBoth({ ...d, x1: Math.round(w.x), y1: Math.round(w.y) }); return;
    }
  };

  const onPointerUp = (e?: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    setDragBoth(null);
    setGuides([]);
    if (d.type === 'move' && d.moved && e) {
      const w = toWorld(view, pt(e));
      // A dragged icon can be dropped over another artboard. Keep the current
      // preview position, then change only its parent container on release.
      const target = [...stateRef.current.doc.artboards].reverse().find((a) => w.x >= a.x && w.y >= a.y && w.x <= a.x + a.w && w.y <= a.y + a.h);
      const icons = d.ids.filter((id) => index.get(id)?.kind === 'icon');
      const texts = d.ids.filter((id) => index.get(id)?.kind === 'text');
      const affected = new Set(d.ids.map((id) => index.get(id)?.artboardId).filter((id): id is string => !!id));
      if (target && [...icons, ...texts].some((id) => index.get(id)?.artboardId !== target.id)) {
        affected.add(target.id);
        edit((doc) => {
          let next = ops.moveIconsToArtboard(doc, icons, target.id);
          next = ops.moveTextsToArtboard(next, texts, target.id);
          for (const id of affected) if (next.artboards.find((a) => a.id === id)?.grid?.auto) next = ops.arrangeArtboardItems(next, id);
          return next;
        }, true);
      } else {
        edit((doc) => {
          let next = doc;
          for (const id of affected) if (next.artboards.find((a) => a.id === id)?.grid?.auto) next = ops.arrangeArtboardItems(next, id);
          return next;
        }, true);
      }
      return;
    }
    if (d.type === 'draw') {
      const b = norm(d.x0, d.y0, d.x1, d.y1);
      if (d.iconId) {
        // inside an icon, draw 1×1 pixels
        const pixels: Rect[] = [];
        for (let y = b.y; y <= b.y + b.h; y++) for (let x = b.x; x <= b.x + b.w; x++) pixels.push({ id: uid(), x, y, w: 1, h: 1, fill: state.ui.fill });
        edit((doc) => ops.splitIcons(pixels.reduce((acc, r) => ops.addRect(acc, d.artboardId, d.iconId, r), doc), [d.iconId!]));
        ui({ sel: pixels.map((r) => r.id), tool: 'select' });
      } else {
        const rect: Rect = { id: uid(), x: b.x, y: b.y, w: b.w + 1, h: b.h + 1, fill: state.ui.fill };
        edit((doc) => ops.addRect(doc, d.artboardId, d.iconId, rect));
        ui({ sel: [rect.id], tool: 'select' });
      }
    }
    if (d.type === 'resize') {
      const iconId = index.get(d.id)?.iconId;
      if (iconId) {
        const idMap = new Map<string, string[]>();
        const next = ops.splitIcons(doc, [iconId], idMap);
        if (next !== doc) { edit(() => next, true); ui({ sel: ops.remapSel(state.ui.sel, idMap) }); }
      }
    }
    if (d.type === 'drawArtboard') {
      const b = norm(d.x0, d.y0, d.x1, d.y1);
      if (b.w < 2 || b.h < 2) { b.w = Math.max(b.w, 40); b.h = Math.max(b.h, 24); }
      const ab: Artboard = { id: uid(), name: ops.nextName(doc, 'Artboard'), x: b.x, y: b.y, w: b.w, h: b.h, icons: [], rects: [] };
      edit((doc) => ops.addArtboard(doc, ab));
      ui({ sel: [ab.id], tool: 'select', expanded: { ...state.ui.expanded, [ab.id]: true } });
    }
  };

  const onContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const p = pt(e), w = toWorld(view, p);
    const hit = hitOf(e.target);
    let n = hit?.node ?? null;
    let background: string | null = null; // artboard under an empty-space click
    if (n && hit?.role !== 'title') {
      if (focus && !(n.kind === 'rect' && n.iconId === focus)) { ui({ focus: null }); }
      if (n.kind === 'rect' && n.iconId && n.iconId !== focus) n = index.get(n.iconId)!;
      if (n.kind === 'icon' && n.id === focus) { background = n.artboardId; n = null; }
      else if (n.kind === 'artboard') { background = n.id; n = null; }
    }
    // right-click on a node selects it; on empty space the current selection is kept (like Figma),
    // and with nothing selected the menu targets the artboard under the cursor
    if (n && !state.ui.sel.includes(n.id)) ui({ sel: [n.id] });
    onMenu({ x: e.clientX, y: e.clientY, nodeId: n?.id ?? state.ui.sel[0] ?? background, world: w });
  };

  const onDoubleClick = (e: React.MouseEvent) => {
    // pointer capture retargets click events to the svg, so find the element under the pointer
    const hit = hitOf(document.elementFromPoint(e.clientX, e.clientY));
    if (!hit?.node) return;
    const n = hit.node;
    // double-click a canvas title to rename the artboard or icon inline
    if (hit.role === 'title') { ui({ sel: [n.id], renaming: { id: n.id, at: 'canvas' } }); return; }
    // double-click a text layer to edit its text in place
    if (n.kind === 'text') { ui({ sel: [n.id], renaming: { id: n.id, at: 'canvas' } }); return; }
    const iconId = n.kind === 'icon' ? n.id : n.iconId;
    if (iconId && iconId !== focus) ui({ focus: iconId, sel: n.kind === 'rect' ? [enterAt(iconId, toWorld(view, pt(e)))].filter(Boolean) : [] });
  };

  // ---- render ----
  const k = view.k;
  const vis = (b: Box) => { const s = screenBox(view, b); return s.x + s.w > -50 && s.y + s.h > -50 && s.x < size.w + 50 && s.y < size.h + 50; };
  const cursor = space ? 'grab' : tool === 'select' ? 'default' : 'crosshair';

  const isRenaming = (id: string) => state.ui.renaming?.at === 'canvas' && state.ui.renaming.id === id;
  const overlay: React.ReactNode[] = [];
  for (const a of doc.artboards) {
    if (!vis(a)) continue;
    const s = screenBox(view, a);
    if (isRenaming(a.id)) overlay.push(<foreignObject key={'t' + a.id} x={s.x - 4} y={s.y - 22} width={Math.max(160, s.w)} height={20}><NameInput id={a.id} name={a.name} className="canvas-name ab" /></foreignObject>);
    else overlay.push(<text key={'t' + a.id} className={'ab-title' + (a.export === false ? ' draft' : '')} x={s.x} y={s.y - 6} data-id={a.id} data-kind="artboard" data-role="title">{a.name}{a.kind === 'pictograms' ? ' · pictograms' : ''}{a.export === false ? ' · not exported' : ''}</text>);
    if (k >= LABEL_ZOOM) for (const ic of a.icons) {
      const ib = { x: a.x + ic.x, y: a.y + ic.y, w: ic.w, h: ic.h };
      if (!vis(ib)) continue;
      const is = screenBox(view, ib);
      const isFocus = ic.id === focus, live = isExported(a, ic);
      // with Outlines off the canvas shows only the drawing: no frame and no name (except while renaming)
      if (state.ui.outlines || isRenaming(ic.id)) overlay.push(<g key={'l' + ic.id} className={'icon-label' + (isFocus ? ' focus' : '') + (ic.instance ? ' instance' : live ? '' : ' draft')} data-id={ic.id} data-kind="icon" data-role="title">
        <path transform={`translate(${is.x} ${is.y - 14}) scale(1.4)`} d={ic.instance ? INSTANCE_PATH : COMPONENT_PATH} />
        {isRenaming(ic.id)
          ? <foreignObject x={is.x + 10} y={is.y - 20} width={Math.max(120, is.w)} height={18}><NameInput id={ic.id} name={ic.name} className="canvas-name" /></foreignObject>
          : <text x={is.x + 14} y={is.y - 6}>{ic.name}</text>}
      </g>);
      if (state.ui.outlines) overlay.push(<rect key={'f' + ic.id} className={'icon-frame' + (live ? ' exportable' : '')} x={is.x - (live ? 2.5 : 0.5)} y={is.y - (live ? 2.5 : 0.5)} width={is.w + (live ? 5 : 1)} height={is.h + (live ? 5 : 1)} />);
      if (grid && k >= GRID_ZOOM) {
        let dd = '';
        for (let c = 1; c < ic.w; c++) dd += `M${is.x + c * k + 0.5} ${is.y}v${is.h}`;
        for (let r = 1; r < ic.h; r++) dd += `M${is.x} ${is.y + r * k + 0.5}h${is.w}`;
        overlay.push(<path key={'g' + ic.id} className="icon-grid" d={dd} />);
      }
    }
  }
  const hoverNode = hover && !state.ui.sel.includes(hover) ? index.get(hover) : null;
  if (hoverNode && !drag) { const s = screenBox(view, { x: hoverNode.ax, y: hoverNode.ay, w: hoverNode.w, h: hoverNode.h }); overlay.push(<rect key="hover" className="outline hover" x={s.x + .5} y={s.y + .5} width={Math.max(0, s.w - 1)} height={Math.max(0, s.h - 1)} />); }
  for (const id of state.ui.highlight) { const n = index.get(id); if (!n) continue; const s = screenBox(view, { x: n.ax, y: n.ay, w: n.w, h: n.h }); overlay.push(<rect key={'hl' + id} className="outline highlight" x={s.x + .5} y={s.y + .5} width={Math.max(0, s.w - 1)} height={Math.max(0, s.h - 1)} />); }
  for (const n of sel) { const s = screenBox(view, { x: n.ax, y: n.ay, w: n.w, h: n.h }); overlay.push(<rect key={'s' + n.id} className="outline" x={s.x + .5} y={s.y + .5} width={Math.max(0, s.w - 1)} height={Math.max(0, s.h - 1)} />); }
  if (sel.length > 1) { const b = bboxOf(sel)!; const s = screenBox(view, b); overlay.push(<rect key="bbox" className="bbox" x={s.x + .5} y={s.y + .5} width={s.w - 1} height={s.h - 1} />); }
  if (sel.length === 1 && !drag) {
    const n = sel[0]; const s = screenBox(view, { x: n.ax, y: n.ay, w: n.w, h: n.h });
    for (const h of HANDLES) { const [hx, hy] = handlePos(h); overlay.push(<rect key={'h' + h} className="handle" data-h={h} x={s.x + s.w * hx - 3.5} y={s.y + s.h * hy - 3.5} width={7} height={7} />); }
  }
  const editingText = state.ui.renaming?.at === 'canvas' ? index.get(state.ui.renaming.id) : undefined;
  if (editingText?.kind === 'text') {
    const t = editingText.obj as TextNode, b = screenBox(view, { x: editingText.ax, y: editingText.ay, w: editingText.w, h: editingText.h });
    overlay.push(<foreignObject key="edit-text" x={b.x - 4} y={b.y + b.h / 2 - 11} width={Math.max(160, b.w + 8)} height={22}><NameInput id={t.id} name={t.text} field="text" className="canvas-name" /></foreignObject>);
  }
  const sx = (x: number) => view.x + x * view.k, sy = (y: number) => view.y + y * view.k;
  guides.forEach((g, i) => overlay.push(g.axis === 'x'
    ? <line key={'gd' + i} className="guide" x1={sx(g.at) + .5} y1={sy(g.from)} x2={sx(g.at) + .5} y2={sy(g.to)} />
    : <line key={'gd' + i} className="guide" x1={sx(g.from)} y1={sy(g.at) + .5} x2={sx(g.to)} y2={sy(g.at) + .5} />));
  if (alt && sel.length && !drag) {
    const a = bboxOf(sel)!;
    const over = hover && !state.ui.sel.includes(hover) ? index.get(hover) : null;
    // nothing under the pointer: measure to the artboard the selection sits in
    const parent = !over && sel.every((n) => n.kind !== 'artboard' && n.artboardId === sel[0].artboardId) ? index.get(sel[0].artboardId) : null;
    const b = over ?? parent;
    if (b) measure(a, { x: b.ax, y: b.ay, w: b.w, h: b.h }).forEach((m, i) => {
      const x1 = sx(m.x1), y1 = sy(m.y1), x2 = sx(m.x2), y2 = sy(m.y2), label = String(Math.round(m.value));
      const lx = (x1 + x2) / 2, ly = (y1 + y2) / 2, lw = 6 + label.length * 6;
      overlay.push(<g key={'ms' + i} className="measure">
        <line x1={x1 + .5} y1={y1 + .5} x2={x2 + .5} y2={y2 + .5} />
        <rect x={lx - lw / 2} y={ly - 8} width={lw} height={16} rx={3} />
        <text x={lx} y={ly + 4} textAnchor="middle">{label}</text>
      </g>);
    });
  }
  if (drag?.type === 'marquee') {
    const b = screenBox(view, norm(drag.start.x, drag.start.y, drag.end.x, drag.end.y));
    overlay.push(<rect key="mq" className="marquee" x={b.x} y={b.y} width={b.w} height={b.h} />);
  }

  return (
    <svg ref={svgRef} className="canvas" style={{ cursor }}
      onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}
      onDoubleClick={onDoubleClick} onContextMenu={onContextMenu}
      onPointerLeave={() => { if (!dragRef.current && hover) ui({ hover: null }); }}>
      {/* Pixels are drawn in screen space, each edge rounded to the device-pixel grid, so rects that touch in
          the drawing share one rounded edge and no hairline shows between them at any zoom (as in Figma).
          Artboard backgrounds and text keep the world transform. */}
      {doc.artboards.map((a) => vis(a) && (
        <g key={a.id}>
          <rect className="ab-bg" data-id={a.id} data-kind="artboard" {...snapBox(view, a.x, a.y, a.w, a.h)} />
          {a.rects.map((r) => <RectEl key={r.id} r={r} ox={a.x} oy={a.y} v={view} />)}
          <g transform={`translate(${view.x} ${view.y}) scale(${k})`}>{(a.texts ?? []).map((t) => <TextEl key={t.id} t={t} ox={a.x} oy={a.y} />)}</g>
          {a.icons.map((ic) => <IconEl key={ic.id} ic={ic} rects={drawnRects(doc, ic)} ox={a.x} oy={a.y} v={view} swaps={state.ui.preview?.icon === ic.id ? ic.variants?.find((v) => v.id === state.ui.preview!.variant)?.swaps : undefined} />)}
        </g>
      ))}
      <g transform={`translate(${view.x} ${view.y}) scale(${k})`}>
        {drag?.type === 'draw' && (() => { const b = norm(drag.x0, drag.y0, drag.x1, drag.y1); return <rect className="drawing" x={drag.ox + b.x} y={drag.oy + b.y} width={b.w + 1} height={b.h + 1} fill={fillAttr(state.ui.fill)} />; })()}
        {drag?.type === 'drawArtboard' && (() => { const b = norm(drag.x0, drag.y0, drag.x1, drag.y1); return <rect className="drawing ab" x={b.x} y={b.y} width={b.w} height={b.h} />; })()}
      </g>
      <g className="overlay">{overlay}</g>
    </svg>
  );
}

const INSTANCE_PATH = 'M3 0H4V1H5V2H6V3H5V4H4V5H3V4H2V3H1V2H2V1H3ZM4 1H3V2H2V3H3V4H4V3H5V2H4Z';
const COMPONENT_PATH = 'M4 5H3V4H4V5ZM3 3V4H2V3H3ZM5 4H4V3H5V4ZM2 3H1V2H2V3ZM4 3H3V2H4V3ZM6 3H5V2H6V3ZM3 2H2V1H3V2ZM5 2H4V1H5V2ZM4 1H3V0H4V1Z';

/** A world box in screen pixels, its edges rounded to the device-pixel grid: shared edges round the same way. */
function snapBox(v: View, x: number, y: number, w: number, h: number) {
  const dpr = window.devicePixelRatio || 1, snap = (n: number) => Math.round(n * dpr) / dpr;
  const x0 = snap(v.x + x * v.k), y0 = snap(v.y + y * v.k), x1 = snap(v.x + (x + w) * v.k), y1 = snap(v.y + (y + h) * v.k);
  return { x: x0, y: y0, width: Math.max(0, x1 - x0), height: Math.max(0, y1 - y0) };
}
function RectEl({ r, ox, oy, v, swaps }: { r: Rect; ox: number; oy: number; v: View; swaps?: Record<string, string> }) {
  return <rect data-id={r.id} data-kind="rect" {...snapBox(v, ox + r.x, oy + r.y, r.w, r.h)} fill={fillAttr(swaps?.[r.fill] ?? r.fill)} shapeRendering="crispEdges" />;
}
/** `swaps` set while one of the icon's colour variants is previewed. */
function IconEl({ ic, rects, ox, oy, v, swaps }: { ic: Icon; rects: Rect[]; ox: number; oy: number; v: View; swaps?: Record<string, string> }) {
  const frame = <rect data-id={ic.id} data-kind="icon" {...snapBox(v, ox + ic.x, oy + ic.y, ic.w, ic.h)} fill="transparent" />;
  // an instance's pixels belong to its component: draw them without ids, under a frame that takes the clicks
  if (ic.instance) return <g className="instance">{rects.map((r, i) => <rect key={i} {...snapBox(v, ox + ic.x + r.x, oy + ic.y + r.y, r.w, r.h)} fill={fillAttr(r.fill)} shapeRendering="crispEdges" pointerEvents="none" />)}{frame}</g>;
  return (
    <g>
      {frame}
      {rects.map((r) => <RectEl key={r.id} r={r} ox={ox + ic.x} oy={oy + ic.y} v={v} swaps={swaps} />)}
    </g>
  );
}
function TextEl({ t, ox, oy }: { t: TextNode; ox: number; oy: number }) {
  return <text className="text-node" data-id={t.id} data-kind="text" x={ox + t.x} y={oy + t.y + t.h / 2} fontSize={t.size} fill={fillAttr(t.fill)}>{t.text}</text>;
}
