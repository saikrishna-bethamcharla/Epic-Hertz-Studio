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
import {
  AstryxSwitch,
  AstryxSlider,
  AstryxSegmentedGroup,
} from '../../astryx';

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
      <div className="p-3.5 rounded-xl bg-[#181817] border border-white/10 space-y-3.5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-[#00b8a9]" />
            <span className="font-semibold text-bone">Video Progress Bar</span>
          </div>
          <AstryxSwitch
            checked={pb.enabled}
            onChange={(checked) => updateProgressBar({ enabled: checked })}
            accentColor="#00b8a9"
            ariaLabel="Toggle Video Progress Bar"
          />
        </div>

        {pb.enabled && (
          <div className="space-y-3 pt-2.5 border-t border-white/5">
            {/* Position: Bottom / Top */}
            <div className="grid grid-cols-[80px_1fr] items-center">
              <span className="text-smoke">Position</span>
              <AstryxSegmentedGroup
                options={[
                  { id: 'bottom', label: 'Bottom' },
                  { id: 'top', label: 'Top' },
                ]}
                value={pb.position}
                onChange={(pos) => updateProgressBar({ position: pos })}
                ariaLabel="Progress bar position"
              />
            </div>

            {/* Bar Height */}
            <AstryxSlider
              label="Bar Height"
              value={pb.height}
              min={3}
              max={20}
              step={1}
              unit="px"
              accentColor="#00b8a9"
              onChange={(h) => updateProgressBar({ height: h })}
            />

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
            <AstryxSwitch
              label="Glowing Progress Head"
              description="Renders a bright luminous cap at the leading edge"
              checked={pb.glow ?? true}
              onChange={(glow) => updateProgressBar({ glow })}
              accentColor="#00b8a9"
            />
          </div>
        )}
      </div>

      {/* ── 2. Sticky Headline / Topic Banner ── */}
      <div className="p-3.5 rounded-xl bg-[#181817] border border-white/10 space-y-3.5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Type className="w-3.5 h-3.5 text-[#ffd700]" />
            <span className="font-semibold text-bone">Topic Headline Banner</span>
          </div>
          <AstryxSwitch
            checked={hb.enabled}
            onChange={(checked) => updateHeadline({ enabled: checked })}
            accentColor="#ffd700"
            ariaLabel="Toggle Topic Headline Banner"
          />
        </div>

        {hb.enabled && (
          <div className="space-y-3 pt-2.5 border-t border-white/5">
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
            <AstryxSlider
              label="Vertical Position (Y)"
              value={Math.round(hb.positionY * 100)}
              min={3}
              max={25}
              step={1}
              unit="%"
              accentColor="#ffd700"
              onChange={(v) => updateHeadline({ positionY: v / 100 })}
            />

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
      <div className="p-3.5 rounded-xl bg-[#181817] border border-white/10 space-y-3.5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-[#00f2fe]" />
            <span className="font-semibold text-bone">Speech Waveform Spectrum</span>
          </div>
          <AstryxSwitch
            checked={av.enabled}
            onChange={(checked) => updateVisualizer({ enabled: checked })}
            accentColor="#00f2fe"
            ariaLabel="Toggle Speech Waveform Spectrum"
          />
        </div>

        {av.enabled && (
          <div className="space-y-3 pt-2.5 border-t border-white/5">
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
            <AstryxSlider
              label="Vertical Position (Y)"
              value={Math.round(av.positionY * 100)}
              min={10}
              max={95}
              step={2}
              unit="%"
              accentColor="#00f2fe"
              onChange={(v) => updateVisualizer({ positionY: v / 100 })}
            />
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
