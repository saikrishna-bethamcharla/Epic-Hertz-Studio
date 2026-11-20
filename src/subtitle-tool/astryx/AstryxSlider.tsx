// ─── Astryx Interactive Design System: Precision Slider ───────────────────────
// High-retention scrub slider with track fill, floating value badge, and fine nudge stepping.

import { useState } from 'react';

export interface AstryxSliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  precision?: number;
  onChange: (value: number) => void;
  label?: string;
  unit?: string;
  accentColor?: string;
  showNudgeButtons?: boolean;
  className?: string;
  ariaLabel?: string;
}

export function AstryxSlider({
  value,
  min,
  max,
  step = 1,
  precision,
  onChange,
  label,
  unit = '',
  accentColor = '#00b8a9',
  showNudgeButtons = true,
  className = '',
  ariaLabel,
}: AstryxSliderProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));

  const displayValue = precision !== undefined ? value.toFixed(precision) : value;

  const handleNudge = (delta: number) => {
    const next = Math.max(min, Math.min(max, +(value + delta).toFixed(precision !== undefined ? precision : 2)));
    onChange(next);
  };

  return (
    <div className={`space-y-1.5 select-none ${className}`}>
      {label && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-smoke font-medium">{label}</span>
          <span className="font-mono text-bone text-[11px] font-semibold">
            {displayValue}
            {unit}
          </span>
        </div>
      )}

      <div
        className="relative flex items-center gap-2 group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {showNudgeButtons && (
          <button
            type="button"
            onClick={() => handleNudge(-step)}
            aria-label={`Decrease ${label || 'value'}`}
            title={`Decrease by ${step}`}
            className="w-5 h-5 rounded bg-white/5 hover:bg-white/10 text-smoke hover:text-bone text-[11px] font-bold flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            −
          </button>
        )}

        <div className="relative flex-1 flex items-center py-1">
          {/* Track background */}
          <div className="w-full h-1.5 rounded-full bg-white/15 overflow-hidden">
            {/* Active Track fill */}
            <div
              style={{ width: `${pct}%`, backgroundColor: accentColor }}
              className="h-full rounded-full transition-all duration-75"
            />
          </div>

          {/* Native range input overlay for seamless cross-browser accessibility */}
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            aria-label={ariaLabel || label || 'Slider'}
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
            onTouchStart={() => setIsDragging(true)}
            onTouchEnd={() => setIsDragging(false)}
            onChange={(e) => onChange(Number(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />

          {/* Interactive Thumb indicator */}
          <div
            style={{ left: `calc(${pct}% - 6px)`, backgroundColor: '#ffffff' }}
            className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full shadow-md border-2 border-[#121211] pointer-events-none transition-transform duration-100 ${
              isHovered || isDragging ? 'scale-125 ring-2 ring-white/40' : ''
            }`}
          />

          {/* Floating Value Tooltip on hover/drag */}
          {(isHovered || isDragging) && (
            <div
              style={{ left: `${pct}%` }}
              className="absolute -top-7 -translate-x-1/2 px-1.5 py-0.5 rounded bg-black/90 text-white font-mono text-[9px] font-bold border border-white/20 pointer-events-none shadow-lg whitespace-nowrap z-20"
            >
              {displayValue}
              {unit}
            </div>
          )}
        </div>

        {showNudgeButtons && (
          <button
            type="button"
            onClick={() => handleNudge(step)}
            aria-label={`Increase ${label || 'value'}`}
            title={`Increase by ${step}`}
            className="w-5 h-5 rounded bg-white/5 hover:bg-white/10 text-smoke hover:text-bone text-[11px] font-bold flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            +
          </button>
        )}
      </div>
    </div>
  );
}
