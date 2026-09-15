import type { Doc } from './model/types';

async function j<T>(r: Response): Promise<T> {
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((body as { error?: string }).error ?? r.statusText);
  return body as T;
}
export async function loadDoc(): Promise<Doc | null> {
  const r = await fetch('/api/doc');
  if (r.status === 404) return null;
  return j<Doc>(r);
}
export const saveDoc = (doc: Doc) => fetch('/api/doc', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(doc) }).then((r) => j<{ ok: true }>(r));
export const rawIcons = () => fetch('/api/raw-icons').then((r) => j<{ name: string; svg: string }[]>(r));
export const exportIcons = (files: { name: string; svg: string }[], convert: boolean) =>
  fetch('/api/export', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ files, convert }) }).then((r) => j<{ ok: true; written: string[]; convertOutput: string }>(r));
