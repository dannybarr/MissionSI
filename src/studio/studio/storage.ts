import { normalizeProject } from './schema';
import type { Project, ViewSettings } from './types';

const PROJECT_KEY = 'mission-studio:project:v1';
const VIEW_KEY = 'mission-studio:view:v1';

export type StorageStatus = 'available' | 'unavailable';

let cached: StorageStatus | null = null;

export function storageStatus(): StorageStatus {
  if (cached) return cached;
  try {
    const k = '__mission_probe__';
    window.localStorage.setItem(k, '1');
    window.localStorage.removeItem(k);
    cached = 'available';
  } catch {
    cached = 'unavailable';
  }
  return cached;
}

export type SaveResult = { ok: true; at: number } | { ok: false; reason: string };

export function saveProject(project: Project): SaveResult {
  if (storageStatus() !== 'available') {
    return { ok: false, reason: 'Browser storage is unavailable (private mode or blocked). Export a JSON project to keep your work.' };
  }
  try {
    const at = Date.now();
    window.localStorage.setItem(PROJECT_KEY, JSON.stringify({ ...project, savedAt: at }));
    return { ok: true, at };
  } catch (e) {
    const quota = e instanceof DOMException && (e.name === 'QuotaExceededError' || e.code === 22);
    return {
      ok: false,
      reason: quota
        ? 'Local storage is full — likely a large uploaded SVG. Export JSON or remove the custom logo.'
        : 'Could not write to local storage.',
    };
  }
}

export type LoadResult =
  | { kind: 'empty' }
  | { kind: 'loaded'; project: Project }
  | { kind: 'corrupt'; reason: string }
  | { kind: 'unavailable' };

export function loadProject(): LoadResult {
  if (storageStatus() !== 'available') return { kind: 'unavailable' };
  const raw = window.localStorage.getItem(PROJECT_KEY);
  if (!raw) return { kind: 'empty' };
  try {
    return { kind: 'loaded', project: normalizeProject(JSON.parse(raw)) };
  } catch (e) {
    try {
      window.localStorage.setItem(`${PROJECT_KEY}:recovery:${Date.now()}`, raw);
    } catch {
      // Do not permit automatic defaults to overwrite the only recoverable copy.
      cached = 'unavailable';
      return { kind: 'unavailable' };
    }
    return { kind: 'corrupt', reason: e instanceof Error ? e.message : 'Unreadable data' };
  }
}

export function loadView(): Partial<ViewSettings> | null {
  if (storageStatus() !== 'available') return null;
  try {
    const raw = window.localStorage.getItem(VIEW_KEY);
    return raw ? (JSON.parse(raw) as Partial<ViewSettings>) : null;
  } catch {
    return null;
  }
}

export function saveView(view: ViewSettings) {
  if (storageStatus() !== 'available') return;
  try {
    window.localStorage.setItem(VIEW_KEY, JSON.stringify(view));
  } catch {
    /* non-critical */
  }
}

/** Keep a copy of the current project before an import replaces it (undo also reverts in-session). */
export function backupBeforeImport(project: Project): boolean {
  if (storageStatus() !== 'available') return false;
  try {
    window.localStorage.setItem(`${PROJECT_KEY}:pre-import`, JSON.stringify({ ...project, savedAt: Date.now() }));
    return true;
  } catch {
    return false;
  }
}

export interface BackupEntry {
  key: string;
  kind: 'pre-import' | 'recovery';
  at: number | null;
  bytes: number;
  /** parsed project if it validates, else the reason it cannot be restored directly */
  project: Project | null;
  error: string | null;
  raw: string;
}

/** Local copies kept by the app: the pre-import backup and any corrupt saves set aside at boot. */
export function listBackups(): BackupEntry[] {
  if (storageStatus() !== 'available') return [];
  const out: BackupEntry[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (!key || !key.startsWith(`${PROJECT_KEY}:`)) continue;
    const kind = key.endsWith(':pre-import') ? 'pre-import' : key.includes(':recovery:') ? 'recovery' : null;
    if (!kind) continue;
    const raw = window.localStorage.getItem(key) ?? '';
    let project: Project | null = null;
    let error: string | null = null;
    try {
      project = normalizeProject(JSON.parse(raw));
    } catch (e) {
      error = e instanceof Error ? e.message : 'Unreadable data';
    }
    const ts = kind === 'recovery' ? Number(key.split(':').pop()) : (project?.savedAt ?? null);
    out.push({ key, kind, at: Number.isFinite(ts) ? ts : null, bytes: raw.length, project, error, raw });
  }
  return out.sort((a, b) => (b.at ?? 0) - (a.at ?? 0));
}

export function deleteBackup(key: string) {
  if (!key.startsWith(`${PROJECT_KEY}:`)) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}
