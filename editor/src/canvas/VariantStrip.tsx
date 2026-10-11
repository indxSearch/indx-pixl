import { useEditor } from '../model/store';
import { type Icon, type Variant, fillAttr, swapRects } from '../model/types';
import { masterOf } from '../model/instances';
import * as ops from '../model/ops';

const THUMB = 28;
const BASE: Variant = { id: '', name: 'base', swaps: {} };

/** The variants of the selected icon, drawn in a strip just under it on the canvas. On a component a click
 *  shows that variant in place (the same preview the Preview panel sets); on an instance it switches the
 *  variant the instance draws. */
export function VariantStrip({ icon }: { icon: Icon }) {
  const { state, edit, ui } = useEditor();
  const m = icon.instance ? masterOf(state.doc, icon) : icon;
  if (!m?.variants?.length) return null;
  const current = icon.instance ? icon.instance.variant ?? '' : state.ui.preview?.icon === m.id ? state.ui.preview.variant : '';
  const pick = (v: Variant) => {
    if (icon.instance) edit((d) => ops.setProps(d, icon.id, { instance: { of: m.id, variant: v.id || undefined } }));
    else ui({ preview: v.id ? { icon: m.id, variant: v.id } : null });
  };
  const h = (THUMB * m.h) / m.w;
  // the canvas starts drags and marquees on pointerdown: keep the strip's clicks to itself
  const stop = (e: React.SyntheticEvent) => e.stopPropagation();
  return (
    <div className="variant-strip" onPointerDown={stop} onClick={stop} onDoubleClick={stop} onContextMenu={stop}>
      {[BASE, ...m.variants].map((v) => (
        <button key={v.id || 'base'} className={'variant-thumb' + (v.id === current ? ' on' : '')} title={v.id ? `${m.name} ${v.name}` : m.name} onClick={() => pick(v)}>
          <svg width={THUMB} height={h} viewBox={`0 0 ${m.w} ${m.h}`} shapeRendering="crispEdges">
            {swapRects(m.rects, v.swaps).map((r, i) => <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} fill={fillAttr(r.fill)} />)}
          </svg>
          <span>{v.name}</span>
        </button>
      ))}
    </div>
  );
}

/** Width the strip needs, so its foreignObject can be sized before it renders. */
export const variantStripWidth = (icon: Icon, master: Icon | undefined) => 8 + ((master ?? icon).variants?.length ?? 0) * 52 + 52;
export const VARIANT_STRIP_HEIGHT = 58;
