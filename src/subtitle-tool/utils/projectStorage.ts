// ─── IndexedDB Project Storage — Epic Hertz Studio ───────────────────────────
// Browser-side persistent autosave for video media + captions + styling.
// Separates media blob (written once on load) from project metadata (debounced autosave)
// to guarantee 60fps typing performance and instant recovery after refresh.

import type {
  Segment,
  SubtitleStyle,
  SpokenLanguage,
  ScriptOutput,
  VideoAspectRatio,
} from '../types';

const DB_NAME = 'epic_hertz_studio_db';
const DB_VERSION = 1;
const STORE_NAME = 'project_store';

export interface SavedProjectMeta {
  id: 'project_meta';
  videoName: string;
  videoType: string;
  segmentCount: number;
  segments: Segment[];
  style: SubtitleStyle;
  spokenLanguage: SpokenLanguage;
  scriptOutput: ScriptOutput;
  aspectRatio: VideoAspectRatio;
  updatedAt: number;
}

export interface SavedMediaAsset {
  id: 'media_asset';
  blob: Blob;
  name: string;
  type: string;
}

export interface FullProject {
  videoFile: File;
  segments: Segment[];
  style: SubtitleStyle;
  spokenLanguage: SpokenLanguage;
  scriptOutput: ScriptOutput;
  aspectRatio: VideoAspectRatio;
  updatedAt: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB not supported in this environment'));
    }

    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Saves media file blob into IndexedDB once when imported.
 */
export async function saveMediaAsset(file: File | Blob, name: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const record: SavedMediaAsset = {
        id: 'media_asset',
        blob: file,
        name,
        type: file.type || 'video/mp4',
      };
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to save media asset to IndexedDB:', err);
  }
}

/**
 * Saves captions, style, and project metadata (lightweight, safe for debounced autosave).
 */
export async function saveProjectMeta(meta: Omit<SavedProjectMeta, 'id'>): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const record: SavedProjectMeta = {
        id: 'project_meta',
        ...meta,
        segmentCount: meta.segments.length,
        updatedAt: Date.now(),
      };
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to save project meta to IndexedDB:', err);
  }
}

/**
 * Checks if a valid saved draft project exists.
 */
export async function getSavedProjectMeta(): Promise<SavedProjectMeta | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get('project_meta');
      req.onsuccess = () => {
        resolve((req.result as SavedProjectMeta) || null);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to read saved project meta:', err);
    return null;
  }
}

/**
 * Restores the full project including the reconstructed File object from the stored Blob.
 */
export async function restoreFullProject(): Promise<FullProject | null> {
  try {
    const db = await openDB();
    const [meta, media] = await Promise.all([
      new Promise<SavedProjectMeta | null>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get('project_meta');
        req.onsuccess = () => resolve((req.result as SavedProjectMeta) || null);
        req.onerror = () => reject(req.error);
      }),
      new Promise<SavedMediaAsset | null>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get('media_asset');
        req.onsuccess = () => resolve((req.result as SavedMediaAsset) || null);
        req.onerror = () => reject(req.error);
      }),
    ]);

    if (!meta || !media || !media.blob) {
      return null;
    }

    const file = new File([media.blob], media.name || meta.videoName || 'project.mp4', {
      type: media.type || meta.videoType || 'video/mp4',
    });

    return {
      videoFile: file,
      segments: meta.segments || [],
      style: meta.style,
      spokenLanguage: meta.spokenLanguage || 'te',
      scriptOutput: meta.scriptOutput || 'romanized',
      aspectRatio: meta.aspectRatio || '9:16',
      updatedAt: meta.updatedAt || Date.now(),
    };
  } catch (err) {
    console.warn('Failed to restore project from IndexedDB:', err);
    return null;
  }
}

/**
 * Deletes saved project draft and media from IndexedDB.
 */
export async function clearSavedProject(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to clear saved project:', err);
  }
}

/**
 * Formats relative time (e.g. "2 mins ago", "just now").
 */
export function formatRelativeTime(timestamp: number): string {
  const diffSec = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}
