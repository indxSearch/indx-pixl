import type { Doc } from './model/types';

async function j<T>(r: Response): Promise<T> {
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((body as { error?: string }).error ?? r.statusText);
  return body as T;
}
export async function loadDoc(): Promise<{ doc: Doc | null; version: string | null }> {
  const r = await fetch('/api/doc');
  if (r.status === 404) return { doc: null, version: null };
  return j<{ doc: Doc; version: string }>(r);
}

export class ConflictError extends Error {
  constructor(public version: string | null) { super('pixl.json changed on disk'); }
}
/** Save with compare-and-set on `baseVersion`. Throws ConflictError if the file changed since. */
export async function saveDoc(doc: Doc, baseVersion: string | null, opts: { force?: boolean; keepalive?: boolean } = {}): Promise<string> {
  const r = await fetch('/api/doc', { method: 'PUT', keepalive: opts.keepalive, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ doc, baseVersion, force: opts.force }) });
  if (r.status === 409) throw new ConflictError(((await r.json().catch(() => ({}))) as { version?: string }).version ?? null);
  return (await j<{ version: string }>(r)).version;
}
export const rawIcons = () => fetch('/api/raw-icons').then((r) => j<{ name: string; svg: string }[]>(r));
export const exportIcons = (files: { name: string; svg: string }[], convert: boolean) =>
  fetch('/api/export', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ files, convert }) }).then((r) => j<{ ok: true; written: string[]; convertOutput: string }>(r));
