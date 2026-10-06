import { useEffect, useRef, useState } from 'react';
import { useEditor } from '../model/store';
import * as ops from '../model/ops';

/** Inline name editor. Enter or blur commits as one undo step, Escape cancels. `field` is what it edits:
 *  an artboard's or icon's name, or a text layer's text. */
export function NameInput({ id, name, className, style, field = 'name' }: { id: string; name: string; className?: string; style?: React.CSSProperties; field?: 'name' | 'text' }) {
  const { edit, ui } = useEditor();
  const [value, setValue] = useState(name);
  const cancelled = useRef(false);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); ref.current?.select(); }, []);
  const done = () => {
    const v = value.trim();
    if (!cancelled.current && v && v !== name) edit((d) => ops.setProps(d, id, { [field]: v }));
    ui({ renaming: null });
  };
  return (
    <input ref={ref} className={'name-input' + (className ? ' ' + className : '')} style={style} value={value} spellCheck={false}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => { if (e.key === 'Escape') cancelled.current = true; }}
      onBlur={done}
      onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()} onDoubleClick={(e) => e.stopPropagation()} />
  );
}
