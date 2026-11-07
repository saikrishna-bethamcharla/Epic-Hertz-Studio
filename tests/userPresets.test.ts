import { describe, it, expect, beforeEach } from 'vitest';
import {
  getUserPresets,
  saveUserPreset,
  exportUserPresetsAsJson,
  importUserPresetsFromJson,
  type UserPreset,
} from '../src/subtitle-tool/v2/userPresets';
import { DEFAULT_STYLE } from '../src/subtitle-tool/engine/presets';

// Node environment localStorage mock
const store = new Map<string, string>();
const mockStorage = {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, val: string) => store.set(key, String(val)),
  removeItem: (key: string) => store.delete(key),
  clear: () => store.clear(),
};
Object.defineProperty(globalThis, 'localStorage', {
  value: mockStorage,
  writable: true,
});

describe('userPresets: JSON import & export', () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  it('exports and re-imports user presets round-trip', () => {
    const preset1: UserPreset = {
      id: 'custom-preset-1',
      name: 'Viral Tanglish Look',
      category: 'creator',
      style: structuredClone(DEFAULT_STYLE),
      createdAt: Date.now(),
    };
    saveUserPreset(preset1);

    const json = exportUserPresetsAsJson();
    expect(json).toContain('Viral Tanglish Look');

    // Clear and verify clean state
    mockStorage.clear();
    expect(getUserPresets()).toHaveLength(0);

    // Import
    const res = importUserPresetsFromJson(json);
    expect(res.importedCount).toBe(1);
    expect(res.errors).toHaveLength(0);

    const reloaded = getUserPresets();
    expect(reloaded).toHaveLength(1);
    expect(reloaded[0].name).toBe('Viral Tanglish Look');
  });

  it('handles corrupted or invalid JSON payloads gracefully', () => {
    const res = importUserPresetsFromJson('{ invalid json');
    expect(res.importedCount).toBe(0);
    expect(res.errors.length).toBeGreaterThan(0);
  });

  it('rejects oversized JSON payloads exceeding 2MB', () => {
    const hugePayload = ' '.repeat(2_000_001);
    const res = importUserPresetsFromJson(hugePayload);
    expect(res.importedCount).toBe(0);
    expect(res.errors[0]).toMatch(/exceeds 2MB limit/i);
  });

  it('filters out prototype-pollution attempts safely', () => {
    const malicious = `{"presets":[{"id":"hack-1","name":"Exploit","style":${JSON.stringify(DEFAULT_STYLE)},"__proto__":{"isAdmin":true}}]}`;
    const res = importUserPresetsFromJson(malicious);
    expect((Object.prototype as Record<string, unknown>).isAdmin).toBeUndefined();
    expect(res.importedCount).toBe(1);
  });
});
