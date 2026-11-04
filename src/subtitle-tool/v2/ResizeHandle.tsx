// ─── Workspace Resize Handle — Epic Hertz Studio v2 ──────────────────────────
import { useState, useEffect, useRef } from 'react';

interface ResizeHandleProps {
  direction: 'horizontal' | 'vertical';
  onResize: (delta: number) => void;
  onReset?: () => void;
  title?: string;
}

export default function ResizeHandle({ direction, onResize, onReset, title = 'Drag to resize, double-click to reset' }: ResizeHandleProps) {
  const [isDragging, setIsDragging] = useState(false);
  const startPos = useRef<number>(0);

  useEffect(() => {
    if (!isDragging) return;

    const onPointerMove = (e: PointerEvent) => {
      const current = direction === 'horizontal' ? e.clientX : e.clientY;
      const delta = current - startPos.current;
      startPos.current = current;
      onResize(delta);
    };

    const onPointerUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };
  }, [isDragging, direction, onResize]);

  return (
    <div
      role="separator"
      tabIndex={0}
      title={title}
      onDoubleClick={(e) => {
        e.preventDefault();
        if (onReset) onReset();
      }}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        startPos.current = direction === 'horizontal' ? e.clientX : e.clientY;
        setIsDragging(true);
      }}
      className={`group relative z-30 transition-colors ${
        direction === 'horizontal'
          ? 'w-1.5 hover:w-2 -mx-0.5 cursor-col-resize h-full flex items-center justify-center'
          : 'h-1.5 hover:h-2 -my-0.5 cursor-row-resize w-full flex items-center justify-center'
      }`}
    >
      <div
        className={`transition-colors rounded-full ${
          direction === 'horizontal'
            ? 'w-[2px] h-full'
            : 'h-[2px] w-full'
        } ${
          isDragging
            ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]'
            : 'bg-white/10 group-hover:bg-amber-400/80'
        }`}
      />
    </div>
  );
}
