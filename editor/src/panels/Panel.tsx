import type { ReactNode } from 'react';
import { Minus } from '@indxsearch/pixl';

export function Panel({ title, children, right, grow, className = '' }: { title: string; children: ReactNode; right?: ReactNode; grow?: boolean; className?: string }) {
  return (
    <div className={`panel ${grow ? 'grow' : ''} ${className}`}>
      <div className="panel-head">
        <span className="panel-title">{title}</span>
        <div className="panel-actions">{right}<Minus size={14} color="var(--lv4)" /></div>
      </div>
      <div className="panel-body">{children}</div>
    </div>
  );
}
