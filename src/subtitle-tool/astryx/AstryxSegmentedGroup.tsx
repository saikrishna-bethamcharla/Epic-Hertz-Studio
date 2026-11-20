// ─── Astryx Interactive Design System: Segmented Control ──────────────────────
// Agent-ready, accessible segmented button group with keyboard navigation and sliding spring indicator.

import React from 'react';
import { motion } from 'framer-motion';

export interface AstryxSegmentedOption<T extends string = string> {
  id: T;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string;
  title?: string;
}

export interface AstryxSegmentedGroupProps<T extends string = string> {
  options: AstryxSegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
  className?: string;
  ariaLabel?: string;
}

export function AstryxSegmentedGroup<T extends string = string>({
  options,
  value,
  onChange,
  size = 'sm',
  className = '',
  ariaLabel = 'Options',
}: AstryxSegmentedGroupProps<T>) {
  const pad = size === 'sm' ? 'px-2 py-1 text-[10px]' : 'px-3 py-1.5 text-xs';

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={`relative inline-flex items-center bg-[#151514] border border-white/10 rounded-lg p-0.5 select-none ${className}`}
    >
      {options.map((opt) => {
        const isSelected = opt.id === value;
        const Icon = opt.icon;

        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(opt.id)}
            title={opt.title || opt.label}
            className={`relative z-10 flex items-center justify-center gap-1.5 font-semibold transition-colors rounded-md cursor-pointer ${pad} ${
              isSelected ? 'text-black' : 'text-smoke hover:text-bone'
            }`}
          >
            {isSelected && (
              <motion.div
                layoutId={`astryx-seg-pill-${ariaLabel.replace(/\s+/g, '-')}`}
                className="absolute inset-0 bg-amber-400 rounded-md shadow-sm z-[-1]"
                transition={{ type: 'spring', stiffness: 450, damping: 32 }}
              />
            )}
            {Icon && <Icon className="w-3 h-3 shrink-0" />}
            <span>{opt.label}</span>
            {opt.badge && (
              <span
                className={`text-[9px] px-1 py-0.2 rounded font-mono font-bold leading-none ${
                  isSelected ? 'bg-black/20 text-black' : 'bg-white/10 text-mist'
                }`}
              >
                {opt.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
