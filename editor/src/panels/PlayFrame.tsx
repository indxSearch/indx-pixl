import { useCallback, useEffect, useState } from 'react';
import { Button, InputField } from '@indxsearch/systm';
import { Fast_backward, Fast_forward, Layers, Loop, Next, Pause, Play, Prev } from '@indxsearch/pixl';
import { persist, useEditor } from '../model/store';
import { type Artboard, type Icon, fillAttr } from '../model/types';
import { framesOf, settingsOf, ticksOf } from '../model/spinners';
import * as ops from '../model/ops';

/** The spinner the selection or the frame being edited belongs to, and that frame. Null outside spinner mode. */
export function useCurrentSpinner(): { artboard: Artboard; frame: Icon | null } | null {
  const { state, sel, index, mode } = useEditor();
  if (mode !== 'spinners') return null;
  const n = state.ui.focus ? index.get(state.ui.focus) : sel[0];
  const artboard = n ? (index.get(n.artboardId)?.obj as Artboard | undefined) : undefined;
  if (!n || !artboard) return null;
  const frameId = n.kind === 'icon' ? n.id : n.iconId;
  return { artboard, frame: artboard.icons.find((ic) => ic.id === frameId) ?? null };
}

/** Step to the frame before or after the current one, looping, and stop playback so the step is what shows.
 *  While a frame is being edited the next one is entered for editing; otherwise it is selected. */
export function useStepFrame() {
  const { state, ui } = useEditor();
  const current = useCurrentSpinner();
  return useCallback((dir: -1 | 1) => {
    if (!current) return false;
    const frames = framesOf(current.artboard);
    if (!frames.length) return false;
    const at = current.frame ? frames.findIndex((f) => f.id === current.frame!.id) : dir > 0 ? -1 : 0;
    const next = frames[(at + dir + frames.length) % frames.length];
    ui(state.ui.focus ? { focus: next.id, sel: [], playing: false } : { sel: [next.id], playing: false });
    return true;
  }, [current, state.ui.focus, ui]);
}

/** Tick lengths the tempo buttons step through, in ms. The authored spinners use 50, 100, 250 and 500. */
const TEMPOS = [25, 50, 75, 100, 150, 200, 250, 300, 400, 500, 750, 1000];

const Frame = ({ ic, width }: { ic: Icon; width: number }) => (
  <svg width={width} height={(width * ic.h) / ic.w} viewBox={`0 0 ${ic.w} ${ic.h}`} shapeRendering="crispEdges">
    {ic.rects.map((r) => <rect key={r.id} x={r.x} y={r.y} width={r.w} height={r.h} fill={fillAttr(r.fill)} />)}
  </svg>
);

/** Plays the selected spinner the way the Spinner component will, over the canvas. Paused, it shows the
 *  frame selected on the canvas, and stepping moves that selection. */
export function PlayFrame() {
  const { state, edit, ui } = useEditor();
  const current = useCurrentSpinner();
  const step = useStepFrame();
  const a = current?.artboard;
  const ticks = a ? ticksOf(a) : [];
  const { delay, pingpong } = a ? settingsOf(a) : { delay: 100, pingpong: false };
  const playing = state.ui.playing;
  const [tick, setTick] = useState(0);
  useEffect(() => setTick(0), [a?.id]);
  useEffect(() => {
    if (!playing || ticks.length < 2) return;
    const t = window.setInterval(() => setTick((i) => (i + 1) % ticks.length), delay);
    return () => window.clearInterval(t);
  }, [playing, delay, ticks.length]);
  const [delayText, setDelayText] = useState(String(delay));
  useEffect(() => setDelayText(String(delay)), [delay, a?.id]);
  if (!a || state.ui.hideUi) return null;

  const frames = framesOf(a);
  const shown = playing ? ticks[tick % Math.max(1, ticks.length)] : current?.frame ?? frames[0];
  const setSettings = (patch: Partial<{ delay: number; pingpong: boolean }>) => edit((d) => ops.setProps(d, a.id, { spinner: { delay, pingpong, ...patch } }));
  const tempo = (dir: -1 | 1) => {
    // slower is a longer tick: step to the next listed length past the current one
    const next = dir > 0 ? TEMPOS.find((t) => t > delay) : [...TEMPOS].reverse().find((t) => t < delay);
    if (next) setSettings({ delay: next });
  };
  const commitDelay = () => { const v = Math.round(+delayText); if (Number.isFinite(v) && v > 0 && v !== delay) setSettings({ delay: v }); else setDelayText(String(delay)); };
  const position = shown ? frames.findIndex((f) => f.id === shown.id) + 1 : 0;
  const loopMs = ticks.length * delay;
  // keep the canvas's own clicks and keys from reacting to the frame's controls
  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  return (
    <div className="play-frame" onPointerDown={stop} onDoubleClick={stop} onContextMenu={stop} aria-label="Play">
      <div className="play-head">
        <span className="play-name">{a.name}</span>
        <span className="dim">{frames.length ? `${position}/${frames.length}` : 'no frames'}</span>
      </div>
      <div className="play-stage">
        {shown ? <><Frame ic={shown} width={84} /><Frame ic={shown} width={21} /></> : <span className="hint">Add a frame with I, or duplicate one with ⌘D.</span>}
      </div>
      <div className="play-transport">
        <Button size="micro" variant="ghost" iconLeft={<Prev />} aria-label="Previous frame" title="Previous frame (,)" onClick={() => step(-1)} />
        <Button size="micro" variant="primary" iconLeft={playing ? <Pause /> : <Play />} aria-label={playing ? 'Pause' : 'Play'} title={(playing ? 'Pause' : 'Play') + ' (K)'} onClick={() => ui({ playing: !playing })} />
        <Button size="micro" variant="ghost" iconLeft={<Next />} aria-label="Next frame" title="Next frame (.)" onClick={() => step(1)} />
        <span className="sep" />
        <Button size="micro" variant={pingpong ? 'secondary' : 'ghost'} iconLeft={<Loop />} aria-label="Ping-pong" title={pingpong ? 'Ping-pong: plays forward, then back' : 'Plays forward and starts over'} onClick={() => setSettings({ pingpong: !pingpong })} />
        <Button size="micro" variant={state.ui.onion ? 'secondary' : 'ghost'} iconLeft={<Layers />} aria-label="Onion skin" title="Onion skin: the previous frame shows faintly while you edit" onClick={() => { persist('pixl.onion', !state.ui.onion); ui({ onion: !state.ui.onion }); }} />
      </div>
      <div className="play-tempo">
        <Button size="micro" variant="ghost" iconLeft={<Fast_backward />} aria-label="Slower" title="Slower" disabled={delay >= TEMPOS[TEMPOS.length - 1]} onClick={() => tempo(1)} />
        <InputField className="play-delay" type="number" min={1} value={delayText} aria-label="Milliseconds per tick" onChange={(e) => setDelayText(e.target.value)} onBlur={commitDelay}
          onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') setDelayText(String(delay)); }} />
        <span className="dim">ms</span>
        <Button size="micro" variant="ghost" iconLeft={<Fast_forward />} aria-label="Faster" title="Faster" disabled={delay <= TEMPOS[0]} onClick={() => tempo(-1)} />
      </div>
      <div className="hint">{ticks.length} tick{ticks.length === 1 ? '' : 's'} · {loopMs >= 1000 ? `${(loopMs / 1000).toFixed(loopMs % 1000 ? 2 : 0)} s` : `${loopMs} ms`} a loop</div>
    </div>
  );
}
