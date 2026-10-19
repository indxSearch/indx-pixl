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
  constructor(public version: string | null) { super('Changed on disk'); }
}
/** Save with compare-and-set on `baseVersion`. Throws ConflictError if the file changed since. */
export async function saveDoc(doc: Doc, baseVersion: string | null, opts: { force?: boolean; keepalive?: boolean } = {}): Promise<string> {
  const r = await fetch('/api/doc', { method: 'PUT', keepalive: opts.keepalive, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ doc, baseVersion, force: opts.force }) });
  if (r.status === 409) throw new ConflictError(((await r.json().catch(() => ({}))) as { version?: string }).version ?? null);
  return (await j<{ version: string }>(r)).version;
}
export const rawIcons = () => fetch('/api/raw-icons').then((r) => j<{ name: string; svg: string }[]>(r));
export const exportIcons = (files: { name: string; svg: string; kind?: 'icons' | 'pictograms' }[], convert: boolean, build: boolean, colorsCss?: string, variants?: Record<string, Record<string, string[]>>) =>
  fetch('/api/export', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ files, convert, build, colorsCss, variants }) }).then((r) => j<{ ok: true; written: string[]; convertOutput: string; buildOutput: string }>(r));

/** Where the editor's document lives. Autosave, the conflict banner and external-change reloads go through
 *  this, so pixl.json and the spinners folder get the same protection. */
export interface DocSource {
  /** Names the file or folder in the toolbar and in messages. */
  label: string;
  /** The dev server's event for a change on disk. The desktop app polls `version` instead. */
  event: string;
  load(): Promise<{ doc: Doc | null; version: string | null }>;
  /** Compare-and-set on `baseVersion`. Throws ConflictError if the files changed since. */
  save(doc: Doc, baseVersion: string | null, opts?: { force?: boolean; keepalive?: boolean }): Promise<string>;
  version(): Promise<string | null>;
}
export const pixlSource: DocSource = {
  label: 'pixl.json', event: 'pixl:doc-changed', load: loadDoc, save: saveDoc,
  version: () => loadDoc().then((r) => r.version),
};

// ---- spinners (indx-systm's spinners/ folder; see server/projectApi.ts) ----
export type SpinnerLayout = 'keyframes' | 'flat';
export interface SpinnerOnDisk { name: string; layout: SpinnerLayout; config: Record<string, unknown> | null; frames: { file: string; svg: string }[] }
export interface SpinnerWrite { name: string; from: string | null; layout: SpinnerLayout; frames: string[]; config?: Record<string, unknown> | null }

/** The spinners, or why there are none: `folder` is null until this machine has been told where they are. */
export async function loadSpinners(): Promise<{ folder: string | null; error?: string; spinners: SpinnerOnDisk[]; version: string | null }> {
  const r = await fetch('/api/spinners');
  if (r.status === 404) {
    const body = await r.json().catch(() => ({})) as { error?: string; dir?: string };
    return { folder: body.dir ?? null, error: body.error === 'no folder' ? undefined : body.error, spinners: [], version: null };
  }
  const body = await j<{ dir: string; spinners: SpinnerOnDisk[]; version: string }>(r);
  return { folder: body.dir, spinners: body.spinners, version: body.version };
}
export async function saveSpinners(write: SpinnerWrite[], remove: string[], baseVersion: string | null, opts: { force?: boolean; keepalive?: boolean } = {}): Promise<string> {
  const r = await fetch('/api/spinners', { method: 'PUT', keepalive: opts.keepalive, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ write, remove, baseVersion, force: opts.force }) });
  if (r.status === 409) throw new ConflictError(((await r.json().catch(() => ({}))) as { version?: string }).version ?? null);
  return (await j<{ version: string }>(r)).version;
}
export const spinnersVersion = () => fetch('/api/spinners/version').then((r) => (r.ok ? j<{ version: string }>(r).then((b) => b.version) : null));
export const setSpinnersFolder = (dir: string) =>
  fetch('/api/spinners/folder', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dir }) }).then((r) => j<{ dir: string }>(r));
export const generateSpinners = () => fetch('/api/spinners/generate', { method: 'POST' }).then((r) => j<{ output: string }>(r));
