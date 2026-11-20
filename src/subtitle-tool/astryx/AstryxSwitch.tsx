// ─── Astryx Interactive Design System: Switch Toggle ─────────────────────────
// Accessible toggle switch with tactile thumb physics, focus ring, and label composition.

import { motion } from 'framer-motion';

export interface AstryxSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  accentColor?: string;
  size?: 'sm' | 'md';
  className?: string;
  ariaLabel?: string;
}

export function AstryxSwitch({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  accentColor = '#fbbf24',
  size = 'sm',
  className = '',
  ariaLabel,
}: AstryxSwitchProps) {
  const isSm = size === 'sm';
  const trackW = isSm ? 'w-8' : 'w-10';
  const trackH = isSm ? 'h-4' : 'h-5';
  const thumbSize = isSm ? 'w-3 h-3' : 'w-4 h-4';
  const thumbTranslate = isSm ? 16 : 20;

  const handleToggle = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleToggle();
    }
  };

  return (
    <div
      className={`flex items-center justify-between gap-3 select-none ${
        disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
      } ${className}`}
      onClick={handleToggle}
    >
      {(label || description) && (
        <div className="flex flex-col">
          {label && <span className="text-xs font-medium text-bone">{label}</span>}
          {description && <span className="text-[10px] text-smoke leading-tight">{description}</span>}
        </div>
      )}

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel || label || 'Toggle switch'}
        disabled={disabled}
        onKeyDown={handleKeyDown}
        style={{ backgroundColor: checked ? accentColor : 'rgba(255, 255, 255, 0.15)' }}
        className={`relative inline-flex items-center ${trackW} ${trackH} rounded-full transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#121211] focus-visible:ring-amber-400 p-0.5 shrink-0`}
      >
        <motion.div
          animate={{ x: checked ? thumbTranslate : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className={`${thumbSize} rounded-full bg-white shadow-sm pointer-events-none`}
        />
      </button>
    </div>
  );
}
