// ─── User Presets & Brand Storage — Epic Hertz Studio v2 ──────────────────────
import type { CaptionStyle, LowerThirdSpec } from '../engine/spec';
import type { CaptionTemplate } from '../engine/templateSchema';
import { validateTemplatePack, templateToStyle } from '../engine/templateSchema';
import { CAPTION_TEMPLATES } from '../engine/templateCatalog';

const STORAGE_KEY_LOWER_THIRD_PRESETS = 'ehs.lower_third_presets.v2';

export interface LowerThirdPreset {
  id: string;
  name: string;
  spec: Omit<LowerThirdSpec, 'id' | 'start' | 'end'>;
  createdAt: number;
}

export function getLowerThirdPresets(): LowerThirdPreset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOWER_THIRD_PRESETS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load lower third presets:', e);
  }
  return [];
}

export function saveLowerThirdPreset(preset: LowerThirdPreset): LowerThirdPreset[] {
  const current = getLowerThirdPresets().filter((p) => p.id !== preset.id);
  const updated = [preset, ...current];
  try {
    localStorage.setItem(STORAGE_KEY_LOWER_THIRD_PRESETS, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save lower third preset:', e);
  }
  return updated;
}

export function deleteLowerThirdPreset(id: string): LowerThirdPreset[] {
  const updated = getLowerThirdPresets().filter((p) => p.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY_LOWER_THIRD_PRESETS, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to delete lower third preset:', e);
  }
  return updated;
}

const STORAGE_KEY_PRESETS = 'ehs.user_presets.v2';
const STORAGE_KEY_FAVORITES = 'ehs.favorite_presets.v2';
const STORAGE_KEY_RECENTS = 'ehs.recent_presets.v2';
const STORAGE_KEY_BRAND_COLORS = 'ehs.brand_colors.v2';
const STORAGE_KEY_LAYOUT = 'ehs.layout.v2';

export interface UserPreset {
  id: string;
  name: string;
  category: string;
  style: CaptionStyle;
  createdAt: number;
  previewText?: string;
}

export interface WorkspaceLayout {
  leftWidth: number;
  rightWidth: number;
  timelineHeight: number;
  isLeftCollapsed: boolean;
  isRightCollapsed: boolean;
}

export const DEFAULT_LAYOUT: WorkspaceLayout = {
  leftWidth: 380,
  rightWidth: 340,
  timelineHeight: 220,
  isLeftCollapsed: false,
  isRightCollapsed: false,
};

export function getStoredLayout(): WorkspaceLayout {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LAYOUT);
    if (raw) return { ...DEFAULT_LAYOUT, ...JSON.parse(raw) };
  } catch (e) {
    console.warn('Failed to load layout from storage:', e);
  }
  return DEFAULT_LAYOUT;
}

export function saveStoredLayout(layout: WorkspaceLayout) {
  try {
    localStorage.setItem(STORAGE_KEY_LAYOUT, JSON.stringify(layout));
  } catch (e) {
    console.warn('Failed to save layout to storage:', e);
  }
}

export function getUserPresets(): UserPreset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PRESETS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load user presets:', e);
  }
  return [];
}

export function saveUserPreset(preset: UserPreset): UserPreset[] {
  const current = getUserPresets().filter((p) => p.id !== preset.id);
  const updated = [preset, ...current];
  try {
    localStorage.setItem(STORAGE_KEY_PRESETS, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save user preset:', e);
  }
  return updated;
}

export function deleteUserPreset(id: string): UserPreset[] {
  const updated = getUserPresets().filter((p) => p.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY_PRESETS, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to delete user preset:', e);
  }
  return updated;
}

export function getFavoritePresetIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FAVORITES);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load favorites:', e);
  }
  return ['pulse', 'block', 'amber'];
}

export function toggleFavoritePresetId(id: string): string[] {
  const current = getFavoritePresetIds();
  const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
  try {
    localStorage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify(next));
  } catch (e) {
    console.warn('Failed to update favorites:', e);
  }
  return next;
}

export function getRecentPresetIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RECENTS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load recents:', e);
  }
  return ['pulse', 'block'];
}

export function addRecentPresetId(id: string): string[] {
  const current = getRecentPresetIds().filter((x) => x !== id);
  const next = [id, ...current].slice(0, 8);
  try {
    localStorage.setItem(STORAGE_KEY_RECENTS, JSON.stringify(next));
  } catch (e) {
    console.warn('Failed to save recent presets:', e);
  }
  return next;
}

export const DEFAULT_BRAND_COLORS = [
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#10B981', // Emerald
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#FAF6EE', // Bone
  '#000000', // Black
];

export function getBrandColors(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BRAND_COLORS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load brand colors:', e);
  }
  return DEFAULT_BRAND_COLORS;
}

export function saveBrandColors(colors: string[]): string[] {
  try {
    localStorage.setItem(STORAGE_KEY_BRAND_COLORS, JSON.stringify(colors));
  } catch (e) {
    console.warn('Failed to save brand colors:', e);
  }
  return colors;
}

// ─── JSON Import & Export ───────────────────────────────────────────────────

export function exportUserPresetsAsJson(): string {
  const presets = getUserPresets();
  const lowerThirdPresets = getLowerThirdPresets();
  const brandColors = getBrandColors();
  const payload = {
    app: 'Epic Hertz Studio',
    version: 3,
    exportedAt: new Date().toISOString(),
    presets,
    lowerThirdPresets,
    brandColors,
  };
  return JSON.stringify(payload, null, 2);
}

export function importUserPresetsFromJson(jsonStr: string): {
  importedCount: number;
  errors: string[];
} {
  try {
    const data = JSON.parse(jsonStr);
    const presets: UserPreset[] = Array.isArray(data.presets) ? data.presets : [];
    const ltPresets: LowerThirdPreset[] = Array.isArray(data.lowerThirdPresets)
      ? data.lowerThirdPresets
      : [];
    if (!presets.length && !ltPresets.length && !Array.isArray(data.brandColors)) {
      return { importedCount: 0, errors: ['No valid presets or brand colors found in file.'] };
    }
    for (const p of presets) {
      if (p.id && p.name && p.style) {
        saveUserPreset(p);
      }
    }
    for (const lt of ltPresets) {
      if (lt.id && lt.name && lt.spec) {
        saveLowerThirdPreset(lt);
      }
    }
    if (Array.isArray(data.brandColors)) {
      saveBrandColors(data.brandColors);
    }
    return { importedCount: presets.length + ltPresets.length, errors: [] };
  } catch (err) {
    return {
      importedCount: 0,
      errors: [err instanceof Error ? err.message : 'Invalid JSON file structure.'],
    };
  }
}

export function exportTemplatePackAsJson(templates?: CaptionTemplate[]): string {
  const pack = {
    app: 'Epic Hertz Studio',
    format: 'caption-template-pack',
    version: 1,
    exportedAt: new Date().toISOString(),
    templates: templates || CAPTION_TEMPLATES,
  };
  return JSON.stringify(pack, null, 2);
}

export function importTemplatePackFromJson(jsonStr: string): {
  importedCount: number;
  errors: string[];
} {
  try {
    const raw = JSON.parse(jsonStr);
    const val = validateTemplatePack(raw);
    if (!val.success) {
      return { importedCount: 0, errors: val.errors };
    }

    let count = 0;
    for (const t of val.data) {
      const style = templateToStyle(t);
      saveUserPreset({
        id: 'tpl_' + t.id + '_' + Date.now(),
        name: t.name,
        category: t.category,
        style,
        createdAt: Date.now(),
      });
      count++;
    }

    return { importedCount: count, errors: [] };
  } catch (err) {
    return {
      importedCount: 0,
      errors: [err instanceof Error ? err.message : 'Invalid JSON file.'],
    };
  }
}
