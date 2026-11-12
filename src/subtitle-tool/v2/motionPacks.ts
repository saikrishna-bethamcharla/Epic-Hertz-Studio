// ─── Installed Motion Packs — Epic Hertz Studio ─────────────────────────────
// Motion packs are user-installed JSON files. They live in localStorage so a
// pack survives reloads and can be removed again from the Animations tab.

import type { MotionPack, MotionPackPreset } from '../engine/animation/presetPack';

const STORAGE_KEY = 'ehs.motion_packs.v1';
const MAX_PACKS = 25;

export interface InstalledMotionPack {
  id: string;
  name: string;
  author?: string;
  importedAt: number;
  presets: MotionPackPreset[];
}

function readPacks(): InstalledMotionPack[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Failed to read installed motion packs:', err);
    return [];
  }
}

function writePacks(packs: InstalledMotionPack[]): InstalledMotionPack[] {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(packs.slice(0, MAX_PACKS)));
  } catch (err) {
    console.warn('Failed to save installed motion packs:', err);
  }
  return packs.slice(0, MAX_PACKS);
}

export function getInstalledMotionPacks(): InstalledMotionPack[] {
  return readPacks();
}

/** Install (or replace by name) a validated pack and return the new list. */
export function installMotionPack(pack: MotionPack): InstalledMotionPack[] {
  const existing = readPacks().filter((p) => p.name !== pack.name);
  const installed: InstalledMotionPack = {
    id: `pack_${Date.now().toString(36)}`,
    name: pack.name,
    author: pack.author,
    importedAt: Date.now(),
    presets: pack.presets,
  };
  return writePacks([installed, ...existing]);
}

export function removeMotionPack(id: string): InstalledMotionPack[] {
  return writePacks(readPacks().filter((p) => p.id !== id));
}
