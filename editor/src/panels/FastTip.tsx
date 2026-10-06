import { useEffect, useState } from 'react';

/** The browser's own tooltip waits about a second. For swatches that is too slow to scan a palette, so their
 *  title is shown at once in this one shared tip instead (and taken off the element while hovered, so the
 *  native one does not follow). */
export function FastTip() {
  const [tip, setTip] = useState<{ text: string; x: number; y: number } | null>(null);
  useEffect(() => {
    let el: HTMLElement | null = null;
    const over = (e: PointerEvent) => {
      const t = (e.target as HTMLElement).closest?.('.sw-btn, .link-row, .variant-preview') as HTMLElement | null;
      if (t === el) return;
      if (el?.dataset.tip) { el.title = el.dataset.tip; delete el.dataset.tip; }
      el = t;
      if (!t || !(t.title || t.dataset.tip)) { setTip(null); return; }
      const text = t.title || t.dataset.tip!;
      t.dataset.tip = text; t.removeAttribute('title');
      const b = t.getBoundingClientRect();
      setTip({ text, x: b.left + b.width / 2, y: b.top });
    };
    const hide = () => { if (el?.dataset.tip) { el.title = el.dataset.tip; delete el.dataset.tip; } el = null; setTip(null); };
    document.addEventListener('pointerover', over);
    document.addEventListener('pointerdown', hide, true);
    window.addEventListener('blur', hide);
    return () => { document.removeEventListener('pointerover', over); document.removeEventListener('pointerdown', hide, true); window.removeEventListener('blur', hide); };
  }, []);
  if (!tip) return null;
  return <div className="fast-tip" style={{ left: tip.x, top: tip.y }}>{tip.text}</div>;
}
