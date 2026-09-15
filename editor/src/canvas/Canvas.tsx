import { useCallback, useEffect, useRef, useState } from 'react';
import { useEditor, type View } from '../model/store';
import { type Artboard, type Box, type Doc, type Icon, type Node, type Rect, bboxOf, fillAttr, intersects, isExported, uid } from '../model/types';
import * as ops from '../model/ops';
import { HANDLES, type Handle, handlePos, norm, resizeBox, screenBox, toWorld } from './geometry';

type Drag =
  | { type: 'pan'; sx: number; sy: number; vx: number; vy: number }
  | { type: 'move'; ids: string[]; sw: { x: number; y: number }; orig: Doc; moved: boolean }
  | { type: 'resize'; id: string; h: Handle; orig: Doc; box: Box; px: number; py: number; minW: number; minH: number }
  | { type: 'marquee'; base: string[]; add: boolean; start: { x: number; y: number }; end: { x: number; y: number }; level: 'top' | 'icon'; iconId: string | null }
  | { type: 'draw'; artboardId: string; iconId: string | null; ox: number; oy: number; x0: number; y0: number; x1: number; y1: number; cw: number; ch: number }
  | { type: 'drawArtboard'; x0: number; y0: number; x1: number; y1: number };

const LABEL_ZOOM = 3;   // show icon labels / frames from this zoom
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
  const [size, setSize] = useState({ w: 0, h: 0 });
  const lastDown = useRef<{ t: number; id: string | null }>({ t: 0, id: null });

  const setDragBoth = (d: Drag | null) => {
    if (!!d !== !!dragRef.current) ui({ dragging: !!d });
    dragRef.current = d; setDrag(d);
  };

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

    // manual double-click detection (focus into an icon)
    const now = performance.now();
    const hitId = hit?.node?.id ?? null;
    const dbl = tool === 'select' && hitId && lastDown.current.id === hitId && now - lastDown.current.t < 400;
    lastDown.current = { t: now, id: hitId };
    if (dbl && hit?.node) {
      const n = hit.node;
      const iconId = n.kind === 'icon' ? n.id : n.iconId;
      if (iconId && iconId !== focus) { ui({ focus: iconId, sel: n.kind === 'rect' ? [n.id] : [] }); return; }
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
      edit((d) => ops.addIcon(d, a.id, { id, name, x: Math.floor(w.x - a.ax), y: Math.floor(w.y - a.ay), w: 7, h: 5, rects: [] }));
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
      if (n.iconId !== focus) ui({ focus: n.iconId, sel: e.shiftKey ? [...state.ui.sel.filter((id) => index.get(id)?.iconId === n.iconId), n.id] : [n.id] });
      else toggleSel(n.id, e.shiftKey);
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
      if (hit?.node?.kind === 'artboard' && hit.role !== 'title') id = null;
      if (id !== hover) ui({ hover: id });
      return;
    }
    switch (d.type) {
      case 'pan': ui({ view: { ...view, x: d.vx + p.x - d.sx, y: d.vy + p.y - d.sy } }); return;
      case 'move': {
        const dx = Math.round(w.x - d.sw.x), dy = Math.round(w.y - d.sw.y);
        if (!d.moved && !dx && !dy) return;
        if (!d.moved) { dispatch({ type: 'CHECKPOINT' }); d.moved = true; }
        edit(() => ops.moveNodes(d.orig, d.ids, dx, dy), true);
        return;
      }
      case 'resize': {
        const box = resizeBox(d.box, d.h, w.x - d.px, w.y - d.py, d.minW, d.minH);
        edit(() => ops.setGeometry(d.orig, d.id, box), true);
        return;
      }
      case 'marquee': {
        const box = norm(d.start.x, d.start.y, w.x, w.y);
        const hits: string[] = [];
        for (const n of index.values()) {
          if (d.level === 'icon' ? !(n.kind === 'rect' && n.iconId === d.iconId) : !(n.kind === 'icon' || (n.kind === 'rect' && !n.iconId))) continue;
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

  const onPointerUp = () => {
    const d = dragRef.current;
    if (!d) return;
    setDragBoth(null);
    if (d.type === 'draw') {
      const b = norm(d.x0, d.y0, d.x1, d.y1);
      const rect: Rect = { id: uid(), x: b.x, y: b.y, w: b.w + 1, h: b.h + 1, fill: state.ui.fill };
      edit((doc) => ops.addRect(doc, d.artboardId, d.iconId, rect));
      ui({ sel: [rect.id] });
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
    const hit = hitOf(e.target);
    if (!hit?.node) return;
    const n = hit.node;
    const iconId = n.kind === 'icon' ? n.id : n.iconId;
    if (iconId && iconId !== focus) ui({ focus: iconId, sel: n.kind === 'rect' ? [n.id] : [] });
  };

  // ---- render ----
  const k = view.k;
  const vis = (b: Box) => { const s = screenBox(view, b); return s.x + s.w > -50 && s.y + s.h > -50 && s.x < size.w + 50 && s.y < size.h + 50; };
  const cursor = space ? 'grab' : tool === 'select' ? 'default' : 'crosshair';

  const overlay: React.ReactNode[] = [];
  for (const a of doc.artboards) {
    if (!vis(a)) continue;
    const s = screenBox(view, a);
    overlay.push(<text key={'t' + a.id} className={'ab-title' + (a.export === false ? ' draft' : '')} x={s.x} y={s.y - 6} data-id={a.id} data-kind="artboard" data-role="title">{a.name}{a.export === false ? ' · not exported' : ''}</text>);
    if (k >= LABEL_ZOOM) for (const ic of a.icons) {
      const ib = { x: a.x + ic.x, y: a.y + ic.y, w: ic.w, h: ic.h };
      if (!vis(ib)) continue;
      const is = screenBox(view, ib);
      const isFocus = ic.id === focus, live = isExported(a, ic);
      overlay.push(<g key={'l' + ic.id} className={'icon-label' + (isFocus ? ' focus' : '') + (live ? '' : ' draft')} data-id={ic.id} data-kind="icon" data-role="title">
        <path transform={`translate(${is.x} ${is.y - 14}) scale(1.4)`} d={COMPONENT_PATH} />
        <text x={is.x + 14} y={is.y - 6}>{ic.name}{ic.draft ? ' · draft' : ''}</text>
      </g>);
      overlay.push(<rect key={'f' + ic.id} className="icon-frame" x={is.x - 0.5} y={is.y - 0.5} width={is.w + 1} height={is.h + 1} />);
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
  for (const n of sel) { const s = screenBox(view, { x: n.ax, y: n.ay, w: n.w, h: n.h }); overlay.push(<rect key={'s' + n.id} className="outline" x={s.x + .5} y={s.y + .5} width={Math.max(0, s.w - 1)} height={Math.max(0, s.h - 1)} />); }
  if (sel.length > 1) { const b = bboxOf(sel)!; const s = screenBox(view, b); overlay.push(<rect key="bbox" className="bbox" x={s.x + .5} y={s.y + .5} width={s.w - 1} height={s.h - 1} />); }
  if (sel.length === 1 && !drag) {
    const n = sel[0]; const s = screenBox(view, { x: n.ax, y: n.ay, w: n.w, h: n.h });
    for (const h of HANDLES) { const [hx, hy] = handlePos(h); overlay.push(<rect key={'h' + h} className="handle" data-h={h} x={s.x + s.w * hx - 3.5} y={s.y + s.h * hy - 3.5} width={7} height={7} />); }
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
      <g transform={`translate(${view.x} ${view.y}) scale(${k})`}>
        {doc.artboards.map((a) => vis(a) && (
          <g key={a.id}>
            <rect className="ab-bg" data-id={a.id} data-kind="artboard" x={a.x} y={a.y} width={a.w} height={a.h} />
            {a.rects.map((r) => <RectEl key={r.id} r={r} ox={a.x} oy={a.y} />)}
            {a.icons.map((ic) => <IconEl key={ic.id} ic={ic} ox={a.x} oy={a.y} />)}
          </g>
        ))}
        {drag?.type === 'draw' && (() => { const b = norm(drag.x0, drag.y0, drag.x1, drag.y1); return <rect className="drawing" x={drag.ox + b.x} y={drag.oy + b.y} width={b.w + 1} height={b.h + 1} fill={fillAttr(state.ui.fill)} />; })()}
        {drag?.type === 'drawArtboard' && (() => { const b = norm(drag.x0, drag.y0, drag.x1, drag.y1); return <rect className="drawing ab" x={b.x} y={b.y} width={b.w} height={b.h} />; })()}
      </g>
      <g className="overlay">{overlay}</g>
    </svg>
  );
}

const COMPONENT_PATH = 'M4 5H3V4H4V5ZM3 3V4H2V3H3ZM5 4H4V3H5V4ZM2 3H1V2H2V3ZM4 3H3V2H4V3ZM6 3H5V2H6V3ZM3 2H2V1H3V2ZM5 2H4V1H5V2ZM4 1H3V0H4V1Z';

function RectEl({ r, ox, oy }: { r: Rect; ox: number; oy: number }) {
  return <rect data-id={r.id} data-kind="rect" x={ox + r.x} y={oy + r.y} width={r.w} height={r.h} fill={fillAttr(r.fill)} shapeRendering="crispEdges" />;
}
function IconEl({ ic, ox, oy }: { ic: Icon; ox: number; oy: number }) {
  return (
    <g>
      <rect data-id={ic.id} data-kind="icon" x={ox + ic.x} y={oy + ic.y} width={ic.w} height={ic.h} fill="transparent" />
      {ic.rects.map((r) => <RectEl key={r.id} r={r} ox={ox + ic.x} oy={oy + ic.y} />)}
    </g>
  );
}
