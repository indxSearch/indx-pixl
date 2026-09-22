import { useState } from 'react';
import { Button, InputField } from '@indxsearch/systm';
import { Plus, X_or_error } from '@indxsearch/pixl';
import { useEditor } from '../model/store';
import { type Icon } from '../model/types';
import * as ops from '../model/ops';
import { Panel } from './Panel';

const cleanAlias = (value: string) => value.trim().replace(/\s+/g, ' ');

export function Aliases() {
  const { state, sel, index, edit } = useEditor();
  const iconId = state.ui.focus ?? (sel[0]?.kind === 'icon' ? sel[0].id : sel[0]?.iconId ?? null);
  const node = iconId ? index.get(iconId) : undefined;
  const icon = node?.kind === 'icon' ? (node.obj as Icon) : undefined;
  const [draft, setDraft] = useState('');

  if (!icon || !iconId) return null;

  const aliases = icon.aliases ?? [];
  const setAliases = (next: string[]) => {
    const cleaned = [...new Set(next.map(cleanAlias).filter(Boolean))];
    edit((d) => ops.setProps(d, iconId, { aliases: cleaned.length ? cleaned : undefined }));
  };
  const add = () => {
    const value = cleanAlias(draft);
    if (!value) return;
    setAliases([...aliases, value]);
    setDraft('');
  };

  return (
    <Panel title="Synonyms">
      <div className="stack alias-panel">
        <div className="hint">Extra search terms for this icon. They do not change the component name or exported SVG.</div>
        <div className="alias-add">
          <InputField
            value={draft}
            placeholder="synonym"
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') add(); }}
          />
          <Button size="micro" variant="secondary" iconLeft={<Plus />} onClick={add}>Add</Button>
        </div>
        {aliases.length ? (
          <div className="alias-list">
            {aliases.map((alias, index) => (
              <div className="alias-row" key={`${alias}-${index}`}>
                <InputField
                  value={alias}
                  onChange={(e) => {
                    const next = [...aliases];
                    next[index] = e.target.value;
                    setAliases(next);
                  }}
                  onBlur={(e) => {
                    const next = [...aliases];
                    next[index] = cleanAlias(e.target.value);
                    setAliases(next);
                  }}
                />
                <Button size="micro" variant="ghost" iconLeft={<X_or_error />} aria-label={`Remove ${alias}`} onClick={() => setAliases(aliases.filter((_, i) => i !== index))} />
              </div>
            ))}
          </div>
        ) : <div className="hint">No synonyms yet.</div>}
      </div>
    </Panel>
  );
}
