import { useMemo, useState } from 'react';
import { Button, Modal, Slider } from '@indxsearch/systm';
import { useEditor } from '../model/store';
import type { ColorToken } from '../model/types';
import * as ops from '../model/ops';
import { colorRef, isLink, resolveColor, usageOf } from '../model/colors';

/** The fixed level colors ("light lv3", "dark lv0") are look-alikes on purpose and never offered. */
const isFixedLevel = (c: ColorToken) => /^(light|dark) lv\d$/.test(c.name);
const rgb = (h: string) => { const n = parseInt(h.slice(1, 7), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
const dist = (a: string, b: string) => { const [p, q] = [rgb(a), rgb(b)]; return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]); };

/** Groups of library colors that look alike in both modes. Nothing merges by itself: each group is a
 *  suggestion, merged into the color you pick, or marked to keep separate so it is not suggested again. */
export function TidyColors({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { state, edit } = useEditor();
  const colors = state.doc.colors ?? [];
  const [threshold, setThreshold] = useState(14);
  const [keepers, setKeepers] = useState<Record<string, string>>({});
  const groups = useMemo(() => {
    // linked colors already share a value, and kept or fixed ones are left alone
    const cand = colors.filter((c) => !c.keep && !isFixedLevel(c) && !isLink(c.light) && !isLink(c.dark));
    const val = new Map(cand.map((c) => [c.id, [resolveColor(colors, c, 'light'), resolveColor(colors, c, 'dark')]]));
    const parent = new Map(cand.map((c) => [c.id, c.id]));
    const root = (x: string): string => (parent.get(x) === x ? x : root(parent.get(x)!));
    for (let i = 0; i < cand.length; i++) for (let j = i + 1; j < cand.length; j++) {
      const [a, b] = [val.get(cand[i].id)!, val.get(cand[j].id)!];
      if (Math.max(dist(a[0], b[0]), dist(a[1], b[1])) <= threshold) parent.set(root(cand[j].id), root(cand[i].id));
    }
    const by = new Map<string, ColorToken[]>();
    for (const c of cand) by.set(root(c.id), [...(by.get(root(c.id)) ?? []), c]);
    return [...by.values()].filter((g) => g.length > 1)
      .map((g) => g.map((c) => ({ c, used: usageOf(state.doc, colorRef(c.id)) })).sort((x, y) => y.used - x.used));
  }, [colors, threshold, state.doc]);
  const kept = colors.filter((c) => c.keep);
  const keeperOf = (g: { c: ColorToken }[]) => g.find((m) => m.c.id === keepers[g[0].c.id]) ?? g[0];
  const merge = (g: { c: ColorToken }[]) => { const k = keeperOf(g).c.id; edit((d) => ops.mergeColors(d, k, g.map((m) => m.c.id))); };
  const keepApart = (g: { c: ColorToken }[]) => edit((d) => g.reduce((acc, m) => ops.updateColor(acc, m.c.id, { keep: true }), d));
  const sw = (c: ColorToken) => ({ background: `linear-gradient(135deg, ${resolveColor(colors, c, 'light')} 50%, ${resolveColor(colors, c, 'dark')} 50%)` });

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Tidy colors" description="Library colors that look nearly the same in both modes. Pick the one to keep in each group and merge: the others' pixels, texts and links move to it. Fixed levels are never included.">
      <div className="stack tidy">
        <Slider min={2} max={40} step={1} value={threshold} onChange={(v) => setThreshold(v as number)} label={`How alike: within ${threshold}`} />
        {!groups.length && <div className="hint">No look-alikes at this distance.</div>}
        <div className="tidy-groups">
          {groups.map((g) => {
            const keep = keeperOf(g);
            return (
              <div key={g[0].c.id} className="tidy-group">
                <div className="tidy-members">
                  {g.map((m) => (
                    <button key={m.c.id} className={'tidy-member' + (m === keep ? ' keep' : '')} onClick={() => setKeepers({ ...keepers, [g[0].c.id]: m.c.id })} title={m === keep ? 'Kept' : 'Keep this one'}>
                      <span className="sw-btn" style={sw(m.c)} />
                      <span className="name">{m.c.name}</span>
                      <span className="dim">{m.used}</span>
                    </button>
                  ))}
                </div>
                <div className="btn-row">
                  <Button size="micro" variant="secondary" onClick={() => merge(g)}>Merge into {keep.c.name}</Button>
                  <Button size="micro" variant="ghost" onClick={() => keepApart(g)}>Keep separate</Button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="btn-row tidy-foot">
          {kept.length > 0 && <Button size="micro" variant="ghost" onClick={() => edit((d) => kept.reduce((acc, c) => ops.updateColor(acc, c.id, { keep: undefined }), d))}>Suggest the {kept.length} kept separate again</Button>}
          <span className="spacer" />
          {groups.length > 1 && <Button size="micro" variant="secondary" onClick={() => edit((d) => groups.reduce((acc, g) => ops.mergeColors(acc, keeperOf(g).c.id, g.map((m) => m.c.id)), d))}>Merge all {groups.length} groups</Button>}
          <Button size="micro" variant="primary" onClick={() => onOpenChange(false)}>Done</Button>
        </div>
      </div>
    </Modal>
  );
}
