// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  parseMotionPresetPack,
  serializeMotionPresetPack,
  buildPackFromBuiltins,
  MOTION_PACK_FORMAT,
} from '../src/subtitle-tool/engine/animation/presetPack';
import {
  ENTRANCE_PRESETS,
  EXIT_PRESETS,
  HIGHLIGHT_PRESETS,
} from '../src/subtitle-tool/engine/animation/presets';
import {
  getInstalledMotionPacks,
  installMotionPack,
  removeMotionPack,
} from '../src/subtitle-tool/v2/motionPacks';

const starterJson = readFileSync('public/packs/editor-starter-pack.json', 'utf8');

describe('Motion preset packs', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('validates the shipped starter pack', () => {
    const result = parseMotionPresetPack(starterJson);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.pack.format).toBe(MOTION_PACK_FORMAT);
    expect(result.pack.name).toBe('Editor Starter Pack');
    expect(result.pack.presets.length).toBeGreaterThanOrEqual(20);
    expect(new Set(result.pack.presets.map((p) => p.id)).size).toBe(result.pack.presets.length);
    expect(result.pack.presets.some((p) => p.group === 'entrance')).toBe(true);
    expect(result.pack.presets.some((p) => p.group === 'exit')).toBe(true);
    expect(result.pack.presets.some((p) => p.group === 'highlight')).toBe(true);
  });

  it('accepts a bare preset array for quick authoring', () => {
    const result = parseMotionPresetPack(
      JSON.stringify([
        {
          id: 'quick-fade',
          name: 'Quick Fade',
          hint: 'Fast opacity fade',
          group: 'entrance',
          motion: { in: 'fade', entranceType: 'fade', inMs: 180 },
        },
      ]),
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.pack.presets[0].id).toBe('quick-fade');
  });

  it('rejects unsafe, malformed and duplicate presets', () => {
    const duplicate = parseMotionPresetPack(
      JSON.stringify({
        format: MOTION_PACK_FORMAT,
        version: 1,
        name: 'Dupes',
        presets: [
          {
            id: 'same',
            name: 'One',
            hint: 'First copy here',
            group: 'entrance',
            motion: { in: 'fade' },
          },
          {
            id: 'same',
            name: 'Two',
            hint: 'Second copy here',
            group: 'entrance',
            motion: { in: 'fade' },
          },
        ],
      }),
    );
    expect(duplicate.ok).toBe(false);

    const missingMotion = parseMotionPresetPack(
      JSON.stringify({
        format: MOTION_PACK_FORMAT,
        version: 1,
        name: 'Broken',
        presets: [{ id: 'no-motion', name: 'No Motion', hint: 'Missing in/out', group: 'exit' }],
      }),
    );
    expect(missingMotion.ok).toBe(false);

    const polluted = parseMotionPresetPack(
      '{"__proto__":{"polluted":true},"format":"epic-hertz-motion-pack","name":"X","presets":[]}',
    );
    expect(polluted.ok).toBe(false);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();

    expect(parseMotionPresetPack('not json').ok).toBe(false);
    expect(parseMotionPresetPack('').ok).toBe(false);
    expect(parseMotionPresetPack('x'.repeat(600_000)).ok).toBe(false);
  });

  it('round-trips the built-in library through export and import', () => {
    const presets = buildPackFromBuiltins(ENTRANCE_PRESETS, EXIT_PRESETS, HIGHLIGHT_PRESETS);
    const json = serializeMotionPresetPack({ name: 'Round Trip', presets });
    const parsed = parseMotionPresetPack(json);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.pack.presets.length).toBe(presets.length);
  });

  it('installs, replaces by name and removes packs', () => {
    const parsed = parseMotionPresetPack(starterJson);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    let packs = installMotionPack(parsed.pack);
    expect(packs.length).toBe(1);
    expect(packs[0].presets.length).toBe(parsed.pack.presets.length);

    packs = installMotionPack(parsed.pack);
    expect(packs.length).toBe(1);

    const installed = getInstalledMotionPacks();
    expect(installed[0].name).toBe('Editor Starter Pack');

    packs = removeMotionPack(packs[0].id);
    expect(packs.length).toBe(0);
    expect(getInstalledMotionPacks().length).toBe(0);
  });
});
