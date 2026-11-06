// ─── LowerThirdInspector — Epic Hertz Studio v2 ──────────────────────────────
// Comprehensive inspector panel for Lower Third overlays:
// - Variant picker (1-8) with miniature visual previews
// - Name, Role, and Handle inputs
// - Photo avatar uploader with IndexedDB persistence and auto-crop
// - Font family (Unbounded, Albert Sans, etc.), weight & scale
// - Custom primary/secondary/text colors with brand palettes
// - Position (alignment, X%, Y%)
// - Configurable intro & outro animation timing
// - Save as reusable preset

import React, { useRef, useState } from 'react';
import { Trash2, Bookmark, Upload, User, Clock, Layout, Palette, Type } from 'lucide-react';
import type { LowerThirdSpec, LowerThirdVariant } from '../../types';
import { FONT_FAMILIES } from '../../engine/spec';
import { savePhotoBlob, deletePhotoBlob } from '../../utils/projectStorage';
import { saveLowerThirdPreset, getBrandColors } from '../userPresets';
import ColorPopover from '../ColorPopover';

interface LowerThirdInspectorProps {
  spec: LowerThirdSpec;
  onChange: (updated: LowerThirdSpec) => void;
  onDelete: (id: string) => void;
  photoImage?: HTMLImageElement | null;
  onPhotoUploaded?: (photoBlobId: string, img: HTMLImageElement) => void;
  onPhotoRemoved?: (photoBlobId: string) => void;
}

const VARIANTS: Array<{
  id: LowerThirdVariant;
  name: string;
  desc: string;
}> = [
  { id: 1, name: 'Box Highlight', desc: 'Solid accent box with dark role plate' },
  { id: 2, name: 'Clean Underline', desc: 'Minimal bold name with animated underline' },
  { id: 3, name: 'Photo Creator', desc: 'Avatar ring with smooth expanding container' },
  { id: 4, name: 'Vertical Divider', desc: 'Broadcast split anchored by vertical line' },
  { id: 5, name: 'Slanted Ribbon', desc: 'High-energy kinetic angled ribbons' },
  { id: 6, name: 'Framed Tech', desc: 'Wireframe card with accent corner brackets' },
  { id: 7, name: 'Dual-Tone Pill', desc: 'Rounded capsule with monogram badge' },
  { id: 8, name: 'Cinematic Glass', desc: 'Translucent frosted plate with top line sweep' },
];

export default function LowerThirdInspector({
  spec,
  onChange,
  onDelete,
  photoImage,
  onPhotoUploaded,
  onPhotoRemoved,
}: LowerThirdInspectorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeColorTarget, setActiveColorTarget] = useState<
    'primary' | 'secondary' | 'textPrimary' | 'textSecondary' | null
  >(null);
  const [presetSavedToast, setPresetSavedToast] = useState(false);
  const brandColors = getBrandColors();

  // Helper to update partial spec properties
  const updateSpec = (patch: Partial<LowerThirdSpec>) => {
    onChange({ ...spec, ...patch });
  };

  const updateColors = (patch: Partial<LowerThirdSpec['colors']>) => {
    onChange({ ...spec, colors: { ...spec.colors, ...patch } });
  };

  const updatePosition = (patch: Partial<LowerThirdSpec['position']>) => {
    onChange({ ...spec, position: { ...spec.position, ...patch } });
  };

  const updateFont = (patch: Partial<LowerThirdSpec['font']>) => {
    onChange({ ...spec, font: { ...spec.font, ...patch } });
  };

  // Photo upload handling
  const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const photoId = `photo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    try {
      await savePhotoBlob(photoId, file, file.name);
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        onPhotoUploaded?.(photoId, img);
        updateSpec({ photoBlobId: photoId, photoUrl: url });
      };
      img.src = url;
    } catch (err) {
      console.warn('Failed to save lower third photo:', err);
    }
  };

  const handleRemovePhoto = async () => {
    if (spec.photoBlobId) {
      void deletePhotoBlob(spec.photoBlobId);
      onPhotoRemoved?.(spec.photoBlobId);
    }
    updateSpec({ photoBlobId: undefined, photoUrl: undefined });
  };

  // Save current style as preset
  const handleSavePreset = () => {
    const presetName = prompt(
      'Enter a name for this Lower Third preset:',
      `${spec.name || 'Custom'} Preset`,
    );
    if (!presetName) return;

    const { id, start, end, ...styleSpec } = spec;
    saveLowerThirdPreset({
      id: `lt-preset-${Date.now()}`,
      name: presetName.trim(),
      spec: styleSpec,
      createdAt: Date.now(),
    });

    setPresetSavedToast(true);
    setTimeout(() => setPresetSavedToast(false), 2500);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-[#141413] text-bone text-xs select-none p-4 space-y-5">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-bone">Lower Third</span>
            <span className="px-1.5 py-0.5 rounded bg-amber-400/15 border border-amber-400/30 text-amber-300 font-mono text-[10px]">
              V{spec.variant}
            </span>
          </div>
          <span className="text-[11px] text-smoke">
            {VARIANTS.find((v) => v.id === spec.variant)?.name}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleSavePreset}
            className="p-1.5 rounded-lg border border-white/10 hover:border-amber-400/50 bg-[#1c1c1a] hover:bg-amber-400/10 text-smoke hover:text-amber-300 transition-colors"
            title="Save this Lower Third style as preset"
          >
            <Bookmark className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(spec.id)}
            className="p-1.5 rounded-lg border border-white/10 hover:border-red-500/50 bg-[#1c1c1a] hover:bg-red-500/10 text-smoke hover:text-red-400 transition-colors"
            title="Delete this Lower Third"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {presetSavedToast && (
        <div className="px-3 py-1.5 rounded-lg bg-amber-400/20 border border-amber-400/40 text-amber-200 text-center text-[11px] animate-in fade-in duration-200">
          Preset saved to your library
        </div>
      )}

      {/* ── 1. Variant Picker (Thumbnail Grid) ────────────────────────────── */}
      <div className="space-y-2">
        <label className="text-[11px] font-semibold text-smoke uppercase tracking-wider flex items-center gap-1.5">
          <Layout className="w-3.5 h-3.5 text-amber-400" />
          <span>Design Variant</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {VARIANTS.map((v) => {
            const isSelected = spec.variant === v.id;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => updateSpec({ variant: v.id })}
                className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between h-[68px] ${
                  isSelected
                    ? 'bg-[#272621] border-amber-400 text-amber-200 shadow-md ring-1 ring-amber-400/40'
                    : 'bg-[#1a1a18] border-white/10 text-smoke hover:border-white/30 hover:bg-[#22221f] hover:text-bone'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-semibold text-[11px] truncate">{v.name}</span>
                  <span className="text-[9px] font-mono opacity-60">#{v.id}</span>
                </div>
                <div className="text-[10px] line-clamp-1 opacity-70">{v.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 2. Content Section (Name, Role, Handle) ───────────────────────── */}
      <div className="space-y-3 pt-1 border-t border-white/5">
        <label className="text-[11px] font-semibold text-smoke uppercase tracking-wider flex items-center gap-1.5">
          <Type className="w-3.5 h-3.5 text-amber-400" />
          <span>Content</span>
        </label>

        <div className="space-y-2">
          <div>
            <span className="text-[10px] text-smoke">Name</span>
            <input
              type="text"
              value={spec.name}
              onChange={(e) => updateSpec({ name: e.target.value })}
              placeholder="e.g. RAVI TEJA"
              className="mt-1 w-full px-2.5 py-1.5 rounded-lg bg-[#1a1a18] border border-white/10 focus:border-amber-400 focus:outline-none text-bone font-medium"
            />
          </div>

          <div>
            <span className="text-[10px] text-smoke">Role / Subtitle</span>
            <input
              type="text"
              value={spec.role}
              onChange={(e) => updateSpec({ role: e.target.value })}
              placeholder="e.g. CREATIVE DIRECTOR"
              className="mt-1 w-full px-2.5 py-1.5 rounded-lg bg-[#1a1a18] border border-white/10 focus:border-amber-400 focus:outline-none text-bone font-medium"
            />
          </div>

          <div>
            <span className="text-[10px] text-smoke">Handle (Optional)</span>
            <input
              type="text"
              value={spec.handle || ''}
              onChange={(e) => updateSpec({ handle: e.target.value || undefined })}
              placeholder="e.g. @raviteja"
              className="mt-1 w-full px-2.5 py-1.5 rounded-lg bg-[#1a1a18] border border-white/10 focus:border-amber-400 focus:outline-none text-bone font-medium"
            />
          </div>
        </div>
      </div>

      {/* ── 3. Photo Avatar (For Variant 3 or Any) ────────────────────────── */}
      <div className="space-y-2 pt-1 border-t border-white/5">
        <label className="text-[11px] font-semibold text-smoke uppercase tracking-wider flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-amber-400" />
            <span>Photo Avatar</span>
          </span>
          {spec.variant === 3 && (
            <span className="text-[10px] text-amber-400/80 font-normal">Active in V3</span>
          )}
        </label>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoFileChange}
          className="hidden"
        />

        <div className="flex items-center gap-3 bg-[#1a1a18] p-2.5 rounded-xl border border-white/10">
          <div className="w-12 h-12 rounded-full border border-white/20 bg-[#242422] flex items-center justify-center overflow-hidden shrink-0">
            {spec.photoUrl || photoImage ? (
              <img
                src={spec.photoUrl || (photoImage ? (photoImage as HTMLImageElement).src : '')}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-5 h-5 text-smoke" />
            )}
          </div>

          <div className="flex-1 min-w-0 flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-lg bg-[#272621] hover:bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[11px] font-semibold transition-colors flex items-center gap-1.5"
            >
              <Upload className="w-3 h-3" />
              <span>{spec.photoBlobId ? 'Change' : 'Upload'}</span>
            </button>

            {spec.photoBlobId && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-[11px] transition-colors"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── 4. Colors ─────────────────────────────────────────────────────── */}
      <div className="space-y-2 pt-1 border-t border-white/5">
        <label className="text-[11px] font-semibold text-smoke uppercase tracking-wider flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5 text-amber-400" />
          <span>Colors</span>
        </label>

        <div className="grid grid-cols-2 gap-2">
          {/* Primary Accent */}
          <div className="relative">
            <span className="text-[10px] text-smoke block mb-1">Primary Accent</span>
            <button
              type="button"
              onClick={() =>
                setActiveColorTarget(activeColorTarget === 'primary' ? null : 'primary')
              }
              className="w-full h-8 px-2 rounded-lg border border-white/10 bg-[#1a1a18] flex items-center gap-2 hover:border-white/30 transition-colors"
            >
              <span
                className="w-4 h-4 rounded-full border border-white/30 shrink-0"
                style={{ backgroundColor: spec.colors.primary }}
              />
              <span className="font-mono text-[10px] truncate">{spec.colors.primary}</span>
            </button>
            {activeColorTarget === 'primary' && (
              <div className="absolute top-12 left-0 z-50">
                <ColorPopover
                  value={spec.colors.primary}
                  onChange={(c) =>
                    updateColors({ primary: typeof c === 'string' ? c : c.stops[0][1] })
                  }
                  onClose={() => setActiveColorTarget(null)}
                />
              </div>
            )}
          </div>

          {/* Secondary Plate */}
          <div className="relative">
            <span className="text-[10px] text-smoke block mb-1">Plate / Secondary</span>
            <button
              type="button"
              onClick={() =>
                setActiveColorTarget(activeColorTarget === 'secondary' ? null : 'secondary')
              }
              className="w-full h-8 px-2 rounded-lg border border-white/10 bg-[#1a1a18] flex items-center gap-2 hover:border-white/30 transition-colors"
            >
              <span
                className="w-4 h-4 rounded-full border border-white/30 shrink-0"
                style={{ backgroundColor: spec.colors.secondary || '#18181b' }}
              />
              <span className="font-mono text-[10px] truncate">
                {spec.colors.secondary || '#18181b'}
              </span>
            </button>
            {activeColorTarget === 'secondary' && (
              <div className="absolute top-12 left-0 z-50">
                <ColorPopover
                  value={spec.colors.secondary || '#18181b'}
                  onChange={(c) =>
                    updateColors({ secondary: typeof c === 'string' ? c : c.stops[0][1] })
                  }
                  onClose={() => setActiveColorTarget(null)}
                />
              </div>
            )}
          </div>

          {/* Name Text */}
          <div className="relative">
            <span className="text-[10px] text-smoke block mb-1">Name Text</span>
            <button
              type="button"
              onClick={() =>
                setActiveColorTarget(activeColorTarget === 'textPrimary' ? null : 'textPrimary')
              }
              className="w-full h-8 px-2 rounded-lg border border-white/10 bg-[#1a1a18] flex items-center gap-2 hover:border-white/30 transition-colors"
            >
              <span
                className="w-4 h-4 rounded-full border border-white/30 shrink-0"
                style={{ backgroundColor: spec.colors.textPrimary }}
              />
              <span className="font-mono text-[10px] truncate">{spec.colors.textPrimary}</span>
            </button>
            {activeColorTarget === 'textPrimary' && (
              <div className="absolute top-12 left-0 z-50">
                <ColorPopover
                  value={spec.colors.textPrimary}
                  onChange={(c) =>
                    updateColors({ textPrimary: typeof c === 'string' ? c : c.stops[0][1] })
                  }
                  onClose={() => setActiveColorTarget(null)}
                />
              </div>
            )}
          </div>

          {/* Role Text */}
          <div className="relative">
            <span className="text-[10px] text-smoke block mb-1">Role Text</span>
            <button
              type="button"
              onClick={() =>
                setActiveColorTarget(activeColorTarget === 'textSecondary' ? null : 'textSecondary')
              }
              className="w-full h-8 px-2 rounded-lg border border-white/10 bg-[#1a1a18] flex items-center gap-2 hover:border-white/30 transition-colors"
            >
              <span
                className="w-4 h-4 rounded-full border border-white/30 shrink-0"
                style={{ backgroundColor: spec.colors.textSecondary }}
              />
              <span className="font-mono text-[10px] truncate">{spec.colors.textSecondary}</span>
            </button>
            {activeColorTarget === 'textSecondary' && (
              <div className="absolute top-12 left-0 z-50">
                <ColorPopover
                  value={spec.colors.textSecondary}
                  onChange={(c) =>
                    updateColors({ textSecondary: typeof c === 'string' ? c : c.stops[0][1] })
                  }
                  onClose={() => setActiveColorTarget(null)}
                />
              </div>
            )}
          </div>
        </div>

        {/* Quick Brand Colors */}
        <div className="flex items-center gap-1.5 pt-1">
          <span className="text-[10px] text-smoke mr-1">Brand:</span>
          {brandColors.slice(0, 6).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => updateColors({ primary: c })}
              className="w-4 h-4 rounded-full border border-white/20 hover:scale-110 transition-transform"
              style={{ backgroundColor: c }}
              title={`Apply ${c}`}
            />
          ))}
        </div>
      </div>

      {/* ── 5. Typography & Scale ─────────────────────────────────────────── */}
      <div className="space-y-2 pt-1 border-t border-white/5">
        <label className="text-[11px] font-semibold text-smoke uppercase tracking-wider flex items-center gap-1.5">
          <Type className="w-3.5 h-3.5 text-amber-400" />
          <span>Typography &amp; Scale</span>
        </label>

        <div className="space-y-2">
          <div>
            <span className="text-[10px] text-smoke">Font Family</span>
            <select
              value={spec.font.family}
              onChange={(e) => updateFont({ family: e.target.value })}
              className="mt-1 w-full px-2.5 py-1.5 rounded-lg bg-[#1a1a18] border border-white/10 focus:border-amber-400 focus:outline-none text-bone font-medium text-xs"
            >
              {FONT_FAMILIES.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label} ({f.group})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[10px] text-smoke">Weight</span>
              <select
                value={spec.font.weight}
                onChange={(e) => updateFont({ weight: Number(e.target.value) })}
                className="mt-1 w-full px-2 py-1.5 rounded-lg bg-[#1a1a18] border border-white/10 focus:border-amber-400 focus:outline-none text-bone font-mono text-xs"
              >
                <option value={600}>SemiBold (600)</option>
                <option value={700}>Bold (700)</option>
                <option value={800}>ExtraBold (800)</option>
                <option value={900}>Black (900)</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-smoke">Scale</span>
                <span className="font-mono text-[10px] text-amber-300">
                  {spec.scale.toFixed(2)}x
                </span>
              </div>
              <input
                type="range"
                min={0.6}
                max={1.6}
                step={0.05}
                value={spec.scale}
                onChange={(e) => updateSpec({ scale: parseFloat(e.target.value) })}
                className="mt-2 w-full accent-amber-400 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── 6. Position ───────────────────────────────────────────────────── */}
      <div className="space-y-2 pt-1 border-t border-white/5">
        <label className="text-[11px] font-semibold text-smoke uppercase tracking-wider flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Layout className="w-3.5 h-3.5 text-amber-400" />
            <span>Position</span>
          </span>
          <span className="font-mono text-[10px] text-smoke">
            {Math.round(spec.position.x * 100)}%, {Math.round(spec.position.y * 100)}%
          </span>
        </label>

        <div className="space-y-2">
          {/* Alignment */}
          <div className="flex items-center gap-1 bg-[#1a1a18] p-1 rounded-lg border border-white/10">
            {(['left', 'center', 'right'] as const).map((align) => {
              const isSel = spec.position.align === align;
              return (
                <button
                  key={align}
                  type="button"
                  onClick={() =>
                    updatePosition({
                      align,
                      x: align === 'center' ? 0.5 : align === 'right' ? 0.85 : 0.08,
                    })
                  }
                  className={`flex-1 py-1 rounded text-center text-[10px] font-medium transition-colors ${
                    isSel
                      ? 'bg-amber-400/20 text-amber-300 font-semibold'
                      : 'text-smoke hover:text-bone'
                  }`}
                >
                  {align === 'left' && 'Left'}
                  {align === 'center' && 'Center'}
                  {align === 'right' && 'Right'}
                </button>
              );
            })}
          </div>

          <div>
            <div className="flex items-center justify-between text-[10px] text-smoke">
              <span>Vertical Position (Y)</span>
              <span className="font-mono text-amber-300">{Math.round(spec.position.y * 100)}%</span>
            </div>
            <input
              type="range"
              min={0.1}
              max={0.92}
              step={0.01}
              value={spec.position.y}
              onChange={(e) => updatePosition({ y: parseFloat(e.target.value) })}
              className="mt-1 w-full accent-amber-400 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* ── 7. Timing & Easing ────────────────────────────────────────────── */}
      <div className="space-y-2 pt-1 border-t border-white/5">
        <label className="text-[11px] font-semibold text-smoke uppercase tracking-wider flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Timing &amp; Animation</span>
          </span>
          <span className="font-mono text-[10px] text-smoke">
            {(spec.end - spec.start).toFixed(1)}s total
          </span>
        </label>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-[10px] text-smoke">Start Time</span>
            <input
              type="number"
              step={0.1}
              min={0}
              value={spec.start}
              onChange={(e) => updateSpec({ start: Math.max(0, parseFloat(e.target.value) || 0) })}
              className="mt-1 w-full px-2 py-1.5 rounded-lg bg-[#1a1a18] border border-white/10 text-bone font-mono text-xs focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <span className="text-[10px] text-smoke">End Time</span>
            <input
              type="number"
              step={0.1}
              min={spec.start + 0.5}
              value={spec.end}
              onChange={(e) =>
                updateSpec({
                  end: Math.max(spec.start + 0.5, parseFloat(e.target.value) || spec.start + 1),
                })
              }
              className="mt-1 w-full px-2 py-1.5 rounded-lg bg-[#1a1a18] border border-white/10 text-bone font-mono text-xs focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-[10px] text-smoke">
              <span>Intro Wipe</span>
              <span className="font-mono text-amber-300">
                {(spec.introDuration ?? 0.7).toFixed(1)}s
              </span>
            </div>
            <input
              type="range"
              min={0.2}
              max={1.8}
              step={0.05}
              value={spec.introDuration ?? 0.7}
              onChange={(e) => updateSpec({ introDuration: parseFloat(e.target.value) })}
              className="mt-1 w-full accent-amber-400 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-[10px] text-smoke">
              <span>Outro Wipe</span>
              <span className="font-mono text-amber-300">
                {(spec.outroDuration ?? 0.6).toFixed(1)}s
              </span>
            </div>
            <input
              type="range"
              min={0.2}
              max={1.8}
              step={0.05}
              value={spec.outroDuration ?? 0.6}
              onChange={(e) => updateSpec({ outroDuration: parseFloat(e.target.value) })}
              className="mt-1 w-full accent-amber-400 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
