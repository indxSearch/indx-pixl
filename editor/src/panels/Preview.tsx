import { useEditor } from '../model/store';
import { type Icon, fillAttr } from '../model/types';
import { Panel } from './Panel';

export function Preview() {
  const { state, sel, index } = useEditor();
  const iconId = state.ui.focus ?? (sel[0]?.kind === 'icon' ? sel[0].id : sel[0]?.iconId ?? null);
  const ic = iconId ? (index.get(iconId)?.obj as Icon | undefined) : undefined;
  if (!ic) return null;
  const inner = ic.rects.map((r) => <rect key={r.id} x={r.x} y={r.y} width={r.w} height={r.h} fill={fillAttr(r.fill)} />);
  const sizes = [14, 21, 28, 42];
  return (
    <Panel title="Preview">
      <div className="previews">
        {sizes.map((s) => <svg key={s} width={s} height={(s * ic.h) / ic.w} viewBox={`0 0 ${ic.w} ${ic.h}`} shapeRendering="crispEdges">{inner}</svg>)}
      </div>
      <div className="hint">{ic.name} · {sizes.join(' · ')}</div>
    </Panel>
  );
}
