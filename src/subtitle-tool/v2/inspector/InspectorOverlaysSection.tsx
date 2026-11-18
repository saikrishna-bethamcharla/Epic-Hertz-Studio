// ─── InspectorOverlaysSection — Epic Hertz Studio v2 ──────────────────────────
// Dedicated controls for viral video overlays:
// - Animated Video Progress Bar (retention bar)
// - Sticky Headline / Topic Banner (context retention)
// - Dynamic Speech Waveform Visualizer

import {
  type VideoOverlaysConfig,
  type ProgressBarOverlay,
  type HeadlineBannerOverlay,
  type AudioVisualizerOverlay,
  DEFAULT_OVERLAYS_CONFIG,
} from '../../engine/overlays';
import { Sparkles, Sliders, Type, Activity } from 'lucide-react';

interface InspectorOverlaysSectionProps {
  overlaysConfig?: VideoOverlaysConfig;
  onChange: (updated: VideoOverlaysConfig) => void;
}

const PRESET_COLORS = [
  { label: 'Teal', color: '#00b8a9' },
  { label: 'Pink', color: '#ff0055' },
  { label: 'Cyan', color: '#00f2fe' },
  { label: 'Gold', color: '#ffd700' },
  { label: 'Emerald', color: '#10b981' },
  { label: 'White', color: '#ffffff' },
];

export default function InspectorOverlaysSection({
  overlaysConfig = DEFAULT_OVERLAYS_CONFIG,
  onChange,
}: InspectorOverlaysSectionProps) {
  const pb: ProgressBarOverlay = overlaysConfig.progressBar || DEFAULT_OVERLAYS_CONFIG.progressBar!;
  const hb: HeadlineBannerOverlay =
    overlaysConfig.headlineBanner || DEFAULT_OVERLAYS_CONFIG.headlineBanner!;
  const av: AudioVisualizerOverlay =
    overlaysConfig.audioVisualizer || DEFAULT_OVERLAYS_CONFIG.audioVisualizer!;

  const updateProgressBar = (patch: Partial<ProgressBarOverlay>) => {
    onChange({
      ...overlaysConfig,
      progressBar: { ...pb, ...patch },
    });
  };

  const updateHeadline = (patch: Partial<HeadlineBannerOverlay>) => {
    onChange({
      ...overlaysConfig,
      headlineBanner: { ...hb, ...patch },
    });
  };

  const updateVisualizer = (patch: Partial<AudioVisualizerOverlay>) => {
    onChange({
      ...overlaysConfig,
      audioVisualizer: { ...av, ...patch },
    });
  };

  return (
    <div className="space-y-4 text-xs">
      {/* ── 1. Video Progress Bar ── */}
      <div className="p-3 rounded-xl bg-[#181817] border border-white/5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-[#00b8a9]" />
            <span className="font-semibold text-bone">Video Progress Bar</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={pb.enabled}
              onChange={(e) => updateProgressBar({ enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-8 h-4 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#00b8a9]" />
          </label>
        </div>

        {pb.enabled && (
          <div className="space-y-3 pt-2 border-t border-white/5">
            {/* Position: Bottom / Top */}
            <div className="grid grid-cols-[80px_1fr] items-center">
              <span className="text-smoke">Position</span>
              <div className="flex items-center gap-1.5 bg-[#121211] p-0.5 rounded-lg border border-white/5">
                {(['bottom', 'top'] as const).map((pos) => (
                  <button
                    key={pos}
                    type="button"
                    onClick={() => updateProgressBar({ position: pos })}
                    className={`flex-1 py-1 rounded text-[11px] capitalize font-medium transition-all cursor-pointer ${
                      pb.position === pos
                        ? 'bg-[#00b8a9] text-black font-bold shadow-xs'
                        : 'text-smoke hover:text-bone'
                    }`}
                  >
                    {pos}
                  </button>
                ))}
              </div>
            </div>

            {/* Bar Height */}
            <div className="grid grid-cols-[80px_1fr] items-center">
              <span className="text-smoke">Height</span>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={3}
                  max={20}
                  step={1}
                  value={pb.height}
                  onChange={(e) => updateProgressBar({ height: Number(e.target.value) })}
                  className="flex-1 accent-[#00b8a9] cursor-pointer"
                />
                <span className="font-mono text-smoke text-[11px] w-8 text-right">
                  {pb.height}px
                </span>
              </div>
            </div>

            {/* Color Presets */}
            <div className="grid grid-cols-[80px_1fr] items-center">
              <span className="text-smoke">Color</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {PRESET_COLORS.map(({ label, color }) => (
                  <button
                    key={color}
                    type="button"
                    title={label}
                    onClick={() => updateProgressBar({ color })}
                    style={{ backgroundColor: color }}
                    className={`w-5 h-5 rounded-full border transition-all cursor-pointer ${
                      pb.color.toLowerCase() === color.toLowerCase()
                        ? 'ring-2 ring-white scale-110 border-white'
                        : 'border-white/20 opacity-80 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Glowing Cap Toggle */}
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-smoke">Glowing progress head</span>
              <input
                type="checkbox"
                checked={pb.glow ?? true}
                onChange={(e) => updateProgressBar({ glow: e.target.checked })}
                className="accent-[#00b8a9] cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>

      {/* ── 2. Sticky Headline / Topic Banner ── */}
      <div className="p-3 rounded-xl bg-[#181817] border border-white/5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Type className="w-3.5 h-3.5 text-[#ffd700]" />
            <span className="font-semibold text-bone">Topic Headline Banner</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={hb.enabled}
              onChange={(e) => updateHeadline({ enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-8 h-4 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#ffd700]" />
          </label>
        </div>

        {hb.enabled && (
          <div className="space-y-3 pt-2 border-t border-white/5">
            <div>
              <label className="text-[11px] text-smoke block mb-1">Banner Title</label>
              <input
                type="text"
                value={hb.text}
                onChange={(e) => updateHeadline({ text: e.target.value })}
                placeholder="e.g. 3 CRITICAL MISTAKES TO AVOID"
                className="w-full bg-[#121211] border border-white/10 rounded-md px-2.5 py-1.5 text-xs text-bone focus:outline-none focus:border-[#ffd700] transition-colors"
              />
            </div>

            {/* Vertical Position */}
            <div className="grid grid-cols-[80px_1fr] items-center">
              <span className="text-smoke">Position Y</span>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={0.03}
                  max={0.25}
                  step={0.01}
                  value={hb.positionY}
                  onChange={(e) => updateHeadline({ positionY: Number(e.target.value) })}
                  className="flex-1 accent-[#ffd700] cursor-pointer"
                />
                <span className="font-mono text-smoke text-[11px] w-8 text-right">
                  {Math.round(hb.positionY * 100)}%
                </span>
              </div>
            </div>

            {/* Text Color Presets */}
            <div className="grid grid-cols-[80px_1fr] items-center">
              <span className="text-smoke">Text Color</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {PRESET_COLORS.map(({ label, color }) => (
                  <button
                    key={color}
                    type="button"
                    title={label}
                    onClick={() => updateHeadline({ textColor: color })}
                    style={{ backgroundColor: color }}
                    className={`w-5 h-5 rounded-full border transition-all cursor-pointer ${
                      hb.textColor?.toLowerCase() === color.toLowerCase()
                        ? 'ring-2 ring-white scale-110 border-white'
                        : 'border-white/20 opacity-80 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── 3. Speech Audio Waveform Visualizer ── */}
      <div className="p-3 rounded-xl bg-[#181817] border border-white/5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-[#00f2fe]" />
            <span className="font-semibold text-bone">Speech Waveform Spectrum</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={av.enabled}
              onChange={(e) => updateVisualizer({ enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-8 h-4 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#00f2fe]" />
          </label>
        </div>

        {av.enabled && (
          <div className="space-y-3 pt-2 border-t border-white/5">
            {/* Color Presets */}
            <div className="grid grid-cols-[80px_1fr] items-center">
              <span className="text-smoke">Color</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {PRESET_COLORS.map(({ label, color }) => (
                  <button
                    key={color}
                    type="button"
                    title={label}
                    onClick={() => updateVisualizer({ color })}
                    style={{ backgroundColor: color }}
                    className={`w-5 h-5 rounded-full border transition-all cursor-pointer ${
                      av.color?.toLowerCase() === color.toLowerCase()
                        ? 'ring-2 ring-white scale-110 border-white'
                        : 'border-white/20 opacity-80 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Vertical Position */}
            <div className="grid grid-cols-[80px_1fr] items-center">
              <span className="text-smoke">Position Y</span>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={0.1}
                  max={0.95}
                  step={0.02}
                  value={av.positionY}
                  onChange={(e) => updateVisualizer({ positionY: Number(e.target.value) })}
                  className="flex-1 accent-[#00f2fe] cursor-pointer"
                />
                <span className="font-mono text-smoke text-[11px] w-8 text-right">
                  {Math.round(av.positionY * 100)}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-2.5 rounded-lg bg-[#00b8a9]/10 border border-[#00b8a9]/20 text-[11px] text-[#00e5d4] flex items-center gap-2">
        <Sparkles className="w-3.5 h-3.5 shrink-0" />
        <span>Overlays render dynamically during playback and bake into your master video exports!</span>
      </div>
    </div>
  );
}
