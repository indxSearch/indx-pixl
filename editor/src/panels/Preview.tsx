import { useEditor } from '../model/store';
import { type Icon, type Rect, fillAttr } from '../model/types';
import { masterOf } from '../model/instances';
import { Panel } from './Panel';

const draw = (rects: Rect[], swaps: Record<string, string> = {}) =>
  rects.map((r, i) => <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} fill={fillAttr(swaps[r.fill] ?? r.fill)} />);

export function Preview() {
  const { state, sel, index, ui } = useEditor();
  const iconId = state.ui.focus ?? (sel[0]?.kind === 'icon' ? sel[0].id : sel[0]?.iconId ?? null);
  const picked = iconId ? (index.get(iconId)?.obj as Icon | undefined) : undefined;
  // an instance previews its component, so its siblings show too
  const ic = picked?.instance ? masterOf(state.doc, picked) : picked;
  if (!ic) return null;
  const sizes = [14, 21, 28, 42];
  const variants = ic.variants ?? [];
  const showing = state.ui.preview?.icon === ic.id ? state.ui.preview.variant : null;
  return (
    <Panel title="Preview">
      <div className="previews">
        {sizes.map((s) => <svg key={s} width={s} height={(s * ic.h) / ic.w} viewBox={`0 0 ${ic.w} ${ic.h}`} shapeRendering="crispEdges">{draw(ic.rects)}</svg>)}
      </div>
      <div className="hint">{ic.name} · {sizes.join(' · ')}</div>
      {variants.length > 0 && (
        <>
          <span className="lbl">Variants</span>
          <div className="variant-previews">
            {[{ id: '', name: 'base', swaps: {} as Record<string, string> }, ...variants].map((v) => (
              <button key={v.id || 'base'} className={'variant-preview' + ((v.id || null) === showing ? ' on' : '')} title={v.id ? `Show ${v.name} on the canvas` : 'Show the original'}
                onClick={() => ui({ preview: v.id ? { icon: ic.id, variant: v.id } : null })}>
                <svg width={28} height={(28 * ic.h) / ic.w} viewBox={`0 0 ${ic.w} ${ic.h}`} shapeRendering="crispEdges">{draw(ic.rects, v.swaps)}</svg>
                <span>{v.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </Panel>
  );
}
