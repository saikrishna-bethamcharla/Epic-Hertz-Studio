// ─── IndexedDB Project Storage (v2) — Epic Hertz Studio ─────────────────────
// Multi-project persistent storage for video media + captions + styling.
// Separates media blob (written once on load) from project metadata (debounced autosave)
// to guarantee 60fps typing performance, multiple project switching, and zero data loss.

import type {
  Segment,
  CaptionStyle,
  SpokenLanguage,
  ScriptOutput,
  VideoAspectRatio,
} from '../types';
import { ensureCaptionStyle } from '../engine/compat';

export const DB_NAME = 'epic_hertz_studio_db';
export const DB_VERSION = 3;
export const PROJECTS_STORE = 'projects';
export const MEDIA_STORE = 'media';
export const LEGACY_STORE = 'project_store';
export const CUSTOM_FONTS_STORE = 'custom_fonts';

export interface ProjectRecord {
  id: string;
  name: string;
  videoName: string;
  videoType: string;
  thumbnail?: string;
  segmentCount: number;
  segments: Segment[];
  style: CaptionStyle;
  spokenLanguage: SpokenLanguage;
  scriptOutput: ScriptOutput;
  aspectRatio: VideoAspectRatio;
  schemaVersion: number;
  createdAt: number;
  updatedAt: number;
}

export interface MediaRecord {
  id: string; // matches ProjectRecord.id
  blob: Blob;
  name: string;
  type: string;
  size: number;
  updatedAt: number;
}

export interface FullProject {
  id: string;
  name: string;
  videoFile: File;
  segments: Segment[];
  style: CaptionStyle;
  spokenLanguage: SpokenLanguage;
  scriptOutput: ScriptOutput;
  aspectRatio: VideoAspectRatio;
  updatedAt: number;
}

// Backwards-compatible interface alias
export type SavedProjectMeta = ProjectRecord;

let activeDb: IDBDatabase | null = null;

export function closeDB(): void {
  if (activeDb) {
    try {
      activeDb.close();
    } catch {}
    activeDb = null;
  }
}

async function migrateLegacyIfPresent(db: IDBDatabase): Promise<void> {
  if (!db.objectStoreNames.contains(LEGACY_STORE)) return;

  return new Promise<void>((resolve) => {
    try {
      const tx = db.transaction([LEGACY_STORE, PROJECTS_STORE, MEDIA_STORE], 'readwrite');
      const oldStore = tx.objectStore(LEGACY_STORE);
      const projStore = tx.objectStore(PROJECTS_STORE);
      const mediaStore = tx.objectStore(MEDIA_STORE);

      const countReq = projStore.count();
      countReq.onsuccess = () => {
        // Only migrate if projects store is empty
        if (countReq.result > 0) {
          resolve();
          return;
        }

        const getOldMeta = oldStore.get('project_meta');
        const getOldMedia = oldStore.get('media_asset');

        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();

        getOldMeta.onsuccess = () => {
          const oldMeta = getOldMeta.result;
          if (oldMeta) {
            const migratedId = 'project-default';
            const newProj: ProjectRecord = {
              id: migratedId,
              name: oldMeta.videoName ? oldMeta.videoName.replace(/\.[^.]+$/, '') : 'My Project',
              videoName: oldMeta.videoName || 'video.mp4',
              videoType: oldMeta.videoType || 'video/mp4',
              segmentCount: oldMeta.segmentCount || oldMeta.segments?.length || 0,
              segments: oldMeta.segments || [],
              style: ensureCaptionStyle(oldMeta.style),
              spokenLanguage: oldMeta.spokenLanguage || 'te',
              scriptOutput: oldMeta.scriptOutput || 'romanized',
              aspectRatio: oldMeta.aspectRatio || '9:16',
              schemaVersion: 2,
              createdAt: oldMeta.updatedAt || Date.now(),
              updatedAt: oldMeta.updatedAt || Date.now(),
            };
            projStore.put(newProj);

            getOldMedia.onsuccess = () => {
              const oldMedia = getOldMedia.result;
              if (oldMedia && oldMedia.blob) {
                mediaStore.put({
                  id: migratedId,
                  blob: oldMedia.blob,
                  name: oldMedia.name || oldMeta.videoName || 'video.mp4',
                  type: oldMedia.type || oldMeta.videoType || 'video/mp4',
                  size: oldMedia.blob.size || 0,
                  updatedAt: Date.now(),
                });
              }
            };
          }
        };
      };
      countReq.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB not supported in this environment'));
    }

    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(PROJECTS_STORE)) {
        const projStore = db.createObjectStore(PROJECTS_STORE, { keyPath: 'id' });
        projStore.createIndex('updatedAt', 'updatedAt', { unique: false });
      }

      if (!db.objectStoreNames.contains(MEDIA_STORE)) {
        db.createObjectStore(MEDIA_STORE, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(CUSTOM_FONTS_STORE)) {
        db.createObjectStore(CUSTOM_FONTS_STORE, { keyPath: 'name' });
      }
    };

    req.onsuccess = async () => {
      const db = req.result;
      activeDb = db;
      db.onversionchange = () => {
        db.close();
        activeDb = null;
      };
      await migrateLegacyIfPresent(db);
      resolve(db);
    };

    req.onerror = () => reject(req.error);
  });
}

/**
 * Requests browser persistent storage to prevent eviction under disk pressure.
 */
export async function requestPersistentStorage(): Promise<{
  persisted: boolean;
  usageBytes?: number;
  quotaBytes?: number;
}> {
  if (typeof navigator === 'undefined' || !navigator.storage) {
    return { persisted: false };
  }

  let persisted = false;
  if (navigator.storage.persist) {
    try {
      persisted = await navigator.storage.persist();
    } catch {
      persisted = false;
    }
  }

  let usageBytes: number | undefined;
  let quotaBytes: number | undefined;
  if (navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      usageBytes = estimate.usage;
      quotaBytes = estimate.quota;
    } catch {}
  }

  return { persisted, usageBytes, quotaBytes };
}

/**
 * Lists all projects stored in IndexedDB, sorted by most recently updated.
 */
export async function listProjects(): Promise<ProjectRecord[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(PROJECTS_STORE, 'readonly');
      const store = tx.objectStore(PROJECTS_STORE);
      const req = store.getAll();

      req.onsuccess = () => {
        const list = (req.result as ProjectRecord[]) || [];
        list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
        resolve(list);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to list projects from IndexedDB:', err);
    return [];
  }
}

/**
 * Retrieves a single project record by id.
 */
export async function getProject(id: string): Promise<ProjectRecord | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(PROJECTS_STORE, 'readonly');
      const store = tx.objectStore(PROJECTS_STORE);
      const req = store.get(id);

      req.onsuccess = () => resolve((req.result as ProjectRecord) || null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(`Failed to get project ${id}:`, err);
    return null;
  }
}

/**
 * Saves a project record (debounced metadata autosave).
 */
export async function saveProjectRecord(project: ProjectRecord): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(PROJECTS_STORE, 'readwrite');
      const store = tx.objectStore(PROJECTS_STORE);
      const updated: ProjectRecord = {
        ...project,
        segmentCount: project.segments.length,
        updatedAt: project.updatedAt ?? Date.now(),
      };
      const req = store.put(updated);

      req.onsuccess = () => resolve();
      req.onerror = () => {
        if (req.error?.name === 'QuotaExceededError') {
          reject(
            new Error('Browser storage is full. Please delete old projects to free up space.'),
          );
        } else {
          reject(req.error);
        }
      };
    });
  } catch (err) {
    console.warn('Failed to save project record to IndexedDB:', err);
    throw err;
  }
}

/**
 * Saves media asset file blob for a project (written once on import).
 */
export async function saveProjectMedia(id: string, file: File | Blob, name: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(MEDIA_STORE, 'readwrite');
      const store = tx.objectStore(MEDIA_STORE);
      const record: MediaRecord = {
        id,
        blob: file,
        name,
        type: file.type || 'video/mp4',
        size: file.size || 0,
        updatedAt: Date.now(),
      };
      const req = store.put(record);

      req.onsuccess = () => resolve();
      req.onerror = () => {
        if (req.error?.name === 'QuotaExceededError') {
          reject(
            new Error(
              'Browser storage quota exceeded while saving video. Consider using a shorter or lower resolution video.',
            ),
          );
        } else {
          reject(req.error);
        }
      };
    });
  } catch (err) {
    console.warn('Failed to save project media to IndexedDB:', err);
    throw err;
  }
}

/**
 * Loads a project and its video file.
 */
export async function loadProjectWithMedia(id: string): Promise<FullProject | null> {
  try {
    const db = await openDB();
    const [project, media] = await Promise.all([
      new Promise<ProjectRecord | null>((resolve, reject) => {
        const tx = db.transaction(PROJECTS_STORE, 'readonly');
        const req = tx.objectStore(PROJECTS_STORE).get(id);
        req.onsuccess = () => resolve((req.result as ProjectRecord) || null);
        req.onerror = () => reject(req.error);
      }),
      new Promise<MediaRecord | null>((resolve, reject) => {
        const tx = db.transaction(MEDIA_STORE, 'readonly');
        const req = tx.objectStore(MEDIA_STORE).get(id);
        req.onsuccess = () => resolve((req.result as MediaRecord) || null);
        req.onerror = () => reject(req.error);
      }),
    ]);

    if (!project || !media || !media.blob) return null;

    const file = new File([media.blob], media.name || project.videoName || 'video.mp4', {
      type: media.type || project.videoType || 'video/mp4',
    });

    return {
      id: project.id,
      name: project.name,
      videoFile: file,
      segments: project.segments || [],
      style: ensureCaptionStyle(project.style),
      spokenLanguage: project.spokenLanguage || 'te',
      scriptOutput: project.scriptOutput || 'romanized',
      aspectRatio: project.aspectRatio || '9:16',
      updatedAt: project.updatedAt || Date.now(),
    };
  } catch (err) {
    console.warn(`Failed to load project with media ${id}:`, err);
    return null;
  }
}

/**
 * Deletes a project and its media asset.
 */
export async function deleteProject(id: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([PROJECTS_STORE, MEDIA_STORE], 'readwrite');
      tx.objectStore(PROJECTS_STORE).delete(id);
      tx.objectStore(MEDIA_STORE).delete(id);

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn(`Failed to delete project ${id}:`, err);
  }
}

/**
 * Duplicates an existing project under a new ID and '(Copy)' name.
 */
export async function duplicateProject(id: string): Promise<ProjectRecord> {
  const source = await getProject(id);
  if (!source) throw new Error('Source project not found');

  const newId = `proj-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const cloned: ProjectRecord = {
    ...structuredClone(source),
    id: newId,
    name: `${source.name} (Copy)`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await saveProjectRecord(cloned);

  // Copy media asset if exists
  try {
    const db = await openDB();
    const tx = db.transaction(MEDIA_STORE, 'readonly');
    const req = tx.objectStore(MEDIA_STORE).get(id);
    req.onsuccess = async () => {
      const media = req.result as MediaRecord;
      if (media && media.blob) {
        await saveProjectMedia(newId, media.blob, media.name);
      }
    };
  } catch (err) {
    console.warn('Failed to copy media during project duplication:', err);
  }

  return cloned;
}

/**
 * Renames a project record.
 */
export async function renameProject(id: string, newName: string): Promise<void> {
  const project = await getProject(id);
  if (!project) return;
  project.name = newName.trim() || 'Untitled Video';
  await saveProjectRecord(project);
}

// ── Backwards-Compatibility Layer ───────────────────────────────────────────
// Allows existing SubtitleTool autosave and restore calls to operate seamlessly.

let activeProjectId: string = 'project-default';

export function setActiveProjectId(id: string): void {
  activeProjectId = id;
}

export function getActiveProjectId(): string {
  return activeProjectId;
}

export async function saveMediaAsset(file: File | Blob, name: string): Promise<void> {
  await saveProjectMedia(activeProjectId, file, name);
  void requestPersistentStorage();
}

export async function saveProjectMeta(
  meta: Omit<ProjectRecord, 'id' | 'schemaVersion' | 'createdAt' | 'name'> & {
    id?: string;
    name?: string;
  },
): Promise<void> {
  const id = meta.id || activeProjectId;
  const existing = await getProject(id);
  const now = Date.now();

  const record: ProjectRecord = {
    id,
    name:
      meta.name ||
      existing?.name ||
      (meta.videoName ? meta.videoName.replace(/\.[^.]+$/, '') : 'Untitled Video'),
    videoName: meta.videoName,
    videoType: meta.videoType,
    thumbnail: meta.thumbnail || existing?.thumbnail,
    segmentCount: meta.segments.length,
    segments: meta.segments,
    style: meta.style,
    spokenLanguage: meta.spokenLanguage,
    scriptOutput: meta.scriptOutput,
    aspectRatio: meta.aspectRatio,
    schemaVersion: 2,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };

  await saveProjectRecord(record);
}

export async function getSavedProjectMeta(): Promise<ProjectRecord | null> {
  const list = await listProjects();
  return list.length > 0 ? list[0] : null;
}

export async function restoreFullProject(): Promise<FullProject | null> {
  const list = await listProjects();
  if (list.length === 0) return null;
  const mostRecent = list[0];
  activeProjectId = mostRecent.id;
  return await loadProjectWithMedia(mostRecent.id);
}

export async function clearSavedProject(): Promise<void> {
  await deleteProject(activeProjectId);
}

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

// ─── Custom Font Storage ────────────────────────────────────────────────────

export interface CustomFontRecord {
  name: string;
  buffer: ArrayBuffer;
  addedAt: number;
}

export async function saveCustomFont(name: string, buffer: ArrayBuffer): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CUSTOM_FONTS_STORE, 'readwrite');
    const store = tx.objectStore(CUSTOM_FONTS_STORE);
    const req = store.put({ name, buffer, addedAt: Date.now() });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function listCustomFonts(): Promise<CustomFontRecord[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CUSTOM_FONTS_STORE, 'readonly');
    const store = tx.objectStore(CUSTOM_FONTS_STORE);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteCustomFont(name: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CUSTOM_FONTS_STORE, 'readwrite');
    const store = tx.objectStore(CUSTOM_FONTS_STORE);
    const req = store.delete(name);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
