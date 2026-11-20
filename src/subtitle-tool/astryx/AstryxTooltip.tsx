// ─── Astryx Interactive Design System: Tooltip & Badge ─────────────────────────
// Lightweight accessible tooltip with smooth framer-motion micro-interaction.

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface AstryxTooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  shortcut?: string;
  className?: string;
}

export function AstryxTooltip({
  content,
  children,
  position = 'top',
  shortcut,
  className = '',
}: AstryxTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  const posClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-1.5',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-1.5',
    left: 'right-full top-1/2 -translate-y-1/2 mr-1.5',
    right: 'left-full top-1/2 -translate-y-1/2 ml-1.5',
  }[position];

  return (
    <div
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onFocus={() => setIsOpen(true)}
      onBlur={() => setIsOpen(false)}
    >
      {children}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: position === 'top' ? 2 : -2 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.12 }}
            role="tooltip"
            className={`absolute ${posClasses} z-50 flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#1f1f1d] text-bone border border-white/15 text-[10px] font-medium shadow-xl pointer-events-none whitespace-nowrap`}
          >
            <span>{content}</span>
            {shortcut && (
              <kbd className="px-1 py-0.5 rounded bg-white/10 text-[9px] text-smoke font-mono font-semibold">
                {shortcut}
              </kbd>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export interface AstryxBadgeProps {
  children: React.ReactNode;
  variant?: 'teal' | 'gold' | 'rose' | 'smoke';
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}

export function AstryxBadge({
  children,
  variant = 'teal',
  icon: Icon,
  className = '',
}: AstryxBadgeProps) {
  const variantStyles = {
    teal: 'bg-[#00b8a9]/15 text-[#00e5d4] border-[#00b8a9]/30',
    gold: 'bg-amber-400/15 text-amber-300 border-amber-400/30',
    rose: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    smoke: 'bg-white/10 text-mist border-white/10',
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold border ${variantStyles} ${className}`}
    >
      {Icon && <Icon className="w-2.5 h-2.5 shrink-0" />}
      <span>{children}</span>
    </span>
  );
}
