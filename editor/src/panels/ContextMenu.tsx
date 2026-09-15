import { useEffect, useLayoutEffect, useRef, useState } from 'react';

export type MenuItem = { label: string; shortcut?: string; onClick?: () => void; disabled?: boolean; danger?: boolean } | 'sep';
export interface MenuState { x: number; y: number; items: MenuItem[] }

export function ContextMenu({ menu, onClose }: { menu: MenuState | null; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useLayoutEffect(() => {
    if (!menu || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setPos({ x: Math.min(menu.x, window.innerWidth - r.width - 8), y: Math.min(menu.y, window.innerHeight - r.height - 8) });
  }, [menu]);

  useEffect(() => {
    if (!menu) return;
    const down = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node)) onClose(); };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('pointerdown', down, true);
    window.addEventListener('keydown', key, true);
    window.addEventListener('blur', onClose);
    return () => { window.removeEventListener('pointerdown', down, true); window.removeEventListener('keydown', key, true); window.removeEventListener('blur', onClose); };
  }, [menu, onClose]);

  if (!menu) return null;
  return (
    <div ref={ref} className="ctx" style={{ left: pos.x, top: pos.y }} onContextMenu={(e) => e.preventDefault()}>
      {menu.items.map((it, i) => it === 'sep'
        ? <div key={i} className="ctx-sep" />
        : <button key={i} className={'ctx-item' + (it.danger ? ' danger' : '')} disabled={it.disabled} onClick={() => { it.onClick?.(); onClose(); }}>
            <span>{it.label}</span>{it.shortcut && <span className="ctx-key">{it.shortcut}</span>}
          </button>)}
    </div>
  );
}
