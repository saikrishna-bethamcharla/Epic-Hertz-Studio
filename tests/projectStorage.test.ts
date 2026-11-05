import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import 'fake-indexeddb/auto';
import {
  openDB,
  closeDB,
  listProjects,
  saveProjectRecord,
  saveProjectMedia,
  loadProjectWithMedia,
  duplicateProject,
  renameProject,
  deleteProject,
  saveCustomFont,
  listCustomFonts,
  deleteCustomFont,
  type ProjectRecord,
  DB_NAME,
  PROJECTS_STORE,
  MEDIA_STORE,
  LEGACY_STORE,
} from '../src/subtitle-tool/utils/projectStorage';
import { DEFAULT_STYLE } from '../src/subtitle-tool/engine/presets';

describe('projectStorage: v2 Multi-project CRUD', () => {
  beforeEach(async () => {
    closeDB();
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.deleteDatabase(DB_NAME);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
      req.onblocked = () => resolve();
    });
  });

  afterEach(() => {
    closeDB();
  });

  it('saves and lists multiple projects sorted by updatedAt', async () => {
    const proj1: ProjectRecord = {
      id: 'p1',
      name: 'First Project',
      videoName: 'one.mp4',
      videoType: 'video/mp4',
      segmentCount: 1,
      segments: [{ id: 's1', index: 1, start: 0, end: 1, text: 'Hello' }],
      style: structuredClone(DEFAULT_STYLE),
      spokenLanguage: 'en',
      scriptOutput: 'native',
      aspectRatio: '9:16',
      schemaVersion: 2,
      createdAt: 1000,
      updatedAt: 1000,
    };

    const proj2: ProjectRecord = {
      ...proj1,
      id: 'p2',
      name: 'Second Project',
      videoName: 'two.mp4',
      createdAt: 2000,
      updatedAt: 2000,
    };

    await saveProjectRecord(proj1);
    await saveProjectRecord(proj2);

    const list = await listProjects();
    expect(list.length).toBe(2);
    expect(list[0].id).toBe('p2'); // most recently updated first
    expect(list[1].id).toBe('p1');
  });

  it('saves and loads project with media file blob', async () => {
    const proj: ProjectRecord = {
      id: 'p-media',
      name: 'Video Clip',
      videoName: 'test.mp4',
      videoType: 'video/mp4',
      segmentCount: 1,
      segments: [{ id: 's1', index: 1, start: 0, end: 1, text: 'Hi' }],
      style: structuredClone(DEFAULT_STYLE),
      spokenLanguage: 'te',
      scriptOutput: 'romanized',
      aspectRatio: '9:16',
      schemaVersion: 2,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const blob = new Blob(['fake-video-bytes'], { type: 'video/mp4' });
    await saveProjectRecord(proj);
    await saveProjectMedia('p-media', blob, 'test.mp4');

    const loaded = await loadProjectWithMedia('p-media');
    expect(loaded).not.toBeNull();
    expect(loaded?.name).toBe('Video Clip');
    expect(loaded?.videoFile.name).toBe('test.mp4');
    expect(loaded?.segments.length).toBe(1);
  });

  it('duplicates an existing project', async () => {
    const proj: ProjectRecord = {
      id: 'original',
      name: 'Original Title',
      videoName: 'orig.mp4',
      videoType: 'video/mp4',
      segmentCount: 0,
      segments: [],
      style: structuredClone(DEFAULT_STYLE),
      spokenLanguage: 'en',
      scriptOutput: 'native',
      aspectRatio: '9:16',
      schemaVersion: 2,
      createdAt: 100,
      updatedAt: 100,
    };

    await saveProjectRecord(proj);
    const duplicated = await duplicateProject('original');

    expect(duplicated.id).not.toBe('original');
    expect(duplicated.name).toBe('Original Title (Copy)');

    const list = await listProjects();
    expect(list.length).toBe(2);
  });

  it('renames a project', async () => {
    const proj: ProjectRecord = {
      id: 'p-rename',
      name: 'Old Name',
      videoName: 'vid.mp4',
      videoType: 'video/mp4',
      segmentCount: 0,
      segments: [],
      style: structuredClone(DEFAULT_STYLE),
      spokenLanguage: 'en',
      scriptOutput: 'native',
      aspectRatio: '9:16',
      schemaVersion: 2,
      createdAt: 100,
      updatedAt: 100,
    };

    await saveProjectRecord(proj);
    await renameProject('p-rename', 'Brand New Name');

    const list = await listProjects();
    expect(list[0].name).toBe('Brand New Name');
  });

  it('deletes a project and its media', async () => {
    const proj: ProjectRecord = {
      id: 'p-delete',
      name: 'To Delete',
      videoName: 'del.mp4',
      videoType: 'video/mp4',
      segmentCount: 0,
      segments: [],
      style: structuredClone(DEFAULT_STYLE),
      spokenLanguage: 'en',
      scriptOutput: 'native',
      aspectRatio: '9:16',
      schemaVersion: 2,
      createdAt: 100,
      updatedAt: 100,
    };

    await saveProjectRecord(proj);
    await deleteProject('p-delete');

    const list = await listProjects();
    expect(list.length).toBe(0);
  });
});

describe('projectStorage: Migration from DB v1 to v2', () => {
  beforeEach(async () => {
    closeDB();
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.deleteDatabase(DB_NAME);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
      req.onblocked = () => resolve();
    });
  });

  afterEach(() => {
    closeDB();
  });

  it('migrates existing legacy v1 single project record into v2 projects and media store', async () => {
    // 1. Manually initialize a DB at version 1 with legacy structure
    await new Promise<void>((resolve, reject) => {
      const v1Req = indexedDB.open(DB_NAME, 1);
      v1Req.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        db.createObjectStore(LEGACY_STORE, { keyPath: 'id' });
      };
      v1Req.onsuccess = () => {
        const db = v1Req.result;
        const tx = db.transaction(LEGACY_STORE, 'readwrite');
        const store = tx.objectStore(LEGACY_STORE);
        store.put({
          id: 'project_meta',
          videoName: 'legacy_recording.mp4',
          videoType: 'video/mp4',
          segmentCount: 2,
          segments: [
            { id: '1', index: 1, start: 0, end: 1.5, text: 'Old segment 1' },
            { id: '2', index: 2, start: 1.5, end: 3.0, text: 'Old segment 2' },
          ],
          style: structuredClone(DEFAULT_STYLE),
          spokenLanguage: 'te',
          scriptOutput: 'romanized',
          aspectRatio: '9:16',
          updatedAt: 1700000000000,
        });
        store.put({
          id: 'media_asset',
          blob: new Blob(['legacy-video-data'], { type: 'video/mp4' }),
          name: 'legacy_recording.mp4',
          type: 'video/mp4',
        });
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => reject(tx.error);
      };
      v1Req.onerror = () => reject(v1Req.error);
    });

    // 2. Open with v2 code which triggers onupgradeneeded migration
    const db = await openDB();
    expect(db.objectStoreNames.contains(PROJECTS_STORE)).toBe(true);
    expect(db.objectStoreNames.contains(MEDIA_STORE)).toBe(true);

    // 3. Verify migrated data is present in v2 projects store
    const list = await listProjects();
    expect(list.length).toBe(1);
    expect(list[0].id).toBe('project-default');
    expect(list[0].name).toBe('legacy_recording');
    expect(list[0].segments.length).toBe(2);
    expect(list[0].segments[0].text).toBe('Old segment 1');

    // 4. Verify migrated media is present and loadable
    const full = await loadProjectWithMedia('project-default');
    expect(full).not.toBeNull();
    expect(full?.videoFile.name).toBe('legacy_recording.mp4');
    expect(full?.segments.length).toBe(2);
  });

  it('normalizes legacy or malformed style objects to full CaptionStyle on load', async () => {
    const rawProj: any = {
      id: 'legacy-style-proj',
      name: 'Legacy Style',
      videoName: 'test.mp4',
      videoType: 'video/mp4',
      segmentCount: 1,
      segments: [{ id: 's1', index: 1, start: 0, end: 1, text: 'Hi' }],
      // Legacy style format missing modern font/animation/layout
      style: { preset: 'hormozi-yellow', fontSize: 26, textColor: '#FFFFFF' },
      spokenLanguage: 'en',
      scriptOutput: 'native',
      aspectRatio: '9:16',
      schemaVersion: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await saveProjectRecord(rawProj);
    await saveProjectMedia('legacy-style-proj', new Blob(['data']), 'test.mp4');

    const loaded = await loadProjectWithMedia('legacy-style-proj');
    expect(loaded).not.toBeNull();
    // Must be normalized to valid CaptionStyle
    expect(loaded?.style.font).toBeDefined();
    expect(loaded?.style.motion).toBeDefined();
    expect(loaded?.style.layout).toBeDefined();
    expect(loaded?.style.fill).toBeDefined();
  });

  it('persists, retrieves, and deletes custom brand font buffers', async () => {
    const dummyBuffer = new Uint8Array([1, 2, 3, 4, 5]).buffer;
    await saveCustomFont('CustomBrandFont', dummyBuffer);

    let fonts = await listCustomFonts();
    expect(fonts).toHaveLength(1);
    expect(fonts[0].name).toBe('CustomBrandFont');
    expect(new Uint8Array(fonts[0].buffer)).toEqual(new Uint8Array([1, 2, 3, 4, 5]));

    await deleteCustomFont('CustomBrandFont');
    fonts = await listCustomFonts();
    expect(fonts).toHaveLength(0);
  });
});
