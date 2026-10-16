// ─── DropZone ────────────────────────────────────────────────────────────────
// Drag-and-drop + click-to-browse video upload zone.

import { useRef, useState, useCallback, type DragEvent, type ChangeEvent } from 'react';
import { motion } from 'framer-motion';

interface DropZoneProps {
  onFile: (file: File) => void;
}

const ACCEPTED = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-matroska', 'video/avi'];
const ACCEPTED_EXT = '.mp4,.mov,.webm,.mkv,.avi';

function isValidVideo(file: File): boolean {
  if (ACCEPTED.includes(file.type)) return true;
  // Fallback for browsers that don't set MIME correctly (e.g. .mkv)
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  return ['mp4', 'mov', 'webm', 'mkv', 'avi'].includes(ext);
}

export default function DropZone({ onFile }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!isValidVideo(file)) {
        setError(`Unsupported format. Please use MP4, MOV, WebM, or MKV.`);
        return;
      }
      setError(null);
      onFile(file);
    },
    [onFile],
  );

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = ''; // allow re-selecting the same file
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 py-20">
      {/* Hero label */}
      <motion.p
        className="mb-3 text-sm tracking-[0.18em] uppercase text-mist font-sans"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Auto-Subtitle Studio
      </motion.p>
      <motion.h1
        className="mb-10 font-display text-5xl sm:text-7xl text-center leading-none text-bone"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.05 }}
      >
        DROP YOUR VIDEO
      </motion.h1>

      {/* Drop zone */}
      <motion.div
        className={`
          relative w-full max-w-2xl rounded-2xl border-2 border-dashed transition-colors duration-200
          flex flex-col items-center justify-center gap-5 px-8 py-16 cursor-pointer
          ${dragging
            ? 'border-crimson bg-crimson/5 scale-[1.01]'
            : 'border-white/20 bg-white/[0.03] hover:border-white/40 hover:bg-white/[0.05]'
          }
        `}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Drop a video file here or click to browse"
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
      >
        {/* Icon */}
        <svg
          className={`w-16 h-16 transition-colors ${dragging ? 'text-crimson' : 'text-mist'}`}
          fill="none" viewBox="0 0 64 64" stroke="currentColor" strokeWidth={1.5}
        >
          <rect x="6" y="14" width="52" height="36" rx="6" strokeLinejoin="round" />
          <circle cx="32" cy="32" r="9" />
          <polygon points="29,28 29,36 37,32" fill="currentColor" stroke="none" />
        </svg>

        <div className="text-center">
          <p className="text-bone text-lg font-medium">
            {dragging ? 'Release to drop' : 'Drag & drop a video here'}
          </p>
          <p className="text-mist text-sm mt-1">
            or <span className="text-crimson-2 underline underline-offset-2">browse your files</span>
          </p>
          <p className="text-smoke text-xs mt-3">Supports MP4, MOV, WebM, MKV · up to 2 GB</p>
        </div>

        {/* Hidden file input */}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_EXT}
          className="sr-only"
          onChange={onInputChange}
          aria-hidden
        />
      </motion.div>

      {/* Error message */}
      {error && (
        <motion.p
          className="mt-4 text-crimson-2 text-sm"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        >
          ⚠ {error}
        </motion.p>
      )}

      {/* Footnote */}
      <motion.p
        className="mt-8 text-smoke text-xs text-center max-w-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
      >
        Your video stays in your browser. Nothing is sent to any server except
        the extracted audio, which goes to Gemini for transcription.
      </motion.p>
    </div>
  );
}
