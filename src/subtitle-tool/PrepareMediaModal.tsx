// ─── PrepareMediaModal ────────────────────────────────────────────────────────
// ReplixCaptions-style pre-processing modal: video thumbnail preview, spoken language
// selector, and Romanized (Tanglish/Hinglish) vs Native Script output toggle.

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import type { SpokenLanguage, ScriptOutput } from './types';

interface PrepareMediaModalProps {
  videoFile: File;
  onContinue: (config: {
    spokenLanguage: SpokenLanguage;
    scriptOutput: ScriptOutput;
  }) => void;
  onCancel: () => void;
}

const LANGUAGES: Array<{ code: SpokenLanguage; label: string; nativeName: string }> = [
  { code: 'te', label: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'hi', label: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'en', label: 'English', nativeName: 'English' },
  { code: 'ta', label: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'kn', label: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'ml', label: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'mr', label: 'Marathi', nativeName: 'मराठी' },
  { code: 'bn', label: 'Bengali', nativeName: 'বাংলা' },
  { code: 'auto', label: 'Auto Detect', nativeName: 'Auto Detect' },
];

export default function PrepareMediaModal({
  videoFile,
  onContinue,
  onCancel,
}: PrepareMediaModalProps) {
  const [spokenLanguage, setSpokenLanguage] = useState<SpokenLanguage>('te');
  const [scriptOutput, setScriptOutput] = useState<ScriptOutput>('romanized');
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

  // Generate thumbnail from video file
  useEffect(() => {
    let isCancelled = false;
    const url = URL.createObjectURL(videoFile);
    const video = document.createElement('video');
    video.src = url;
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.playsInline = true;

    const handleLoadedData = () => {
      // Seek slightly into the video for a good thumbnail frame
      video.currentTime = Math.min(1.0, video.duration > 0.5 ? 0.5 : 0);
    };

    const handleSeeked = () => {
      if (isCancelled) return;
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 360;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setThumbnailUrl(dataUrl);
        }
      } catch (err) {
        console.warn('Could not extract thumbnail:', err);
      } finally {
        cleanup();
      }
    };

    const cleanup = () => {
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('seeked', handleSeeked);
      URL.revokeObjectURL(url);
    };

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('seeked', handleSeeked);
    video.load();

    return () => {
      isCancelled = true;
      cleanup();
    };
  }, [videoFile]);

  // Dynamic labels for Romanized script based on selected language
  const romanizedLabel = useMemo(() => {
    switch (spokenLanguage) {
      case 'te':
        return 'Tanglish';
      case 'hi':
        return 'Hinglish';
      case 'ta':
        return 'Tanglish / Tamil';
      case 'en':
        return 'English';
      default:
        return 'Romanized';
    }
  }, [spokenLanguage]);

  const nativeLabel = useMemo(() => {
    const found = LANGUAGES.find((l) => l.code === spokenLanguage);
    if (!found || spokenLanguage === 'auto' || spokenLanguage === 'en') {
      return 'Native Script';
    }
    return `${found.nativeName} లిపి`;
  }, [spokenLanguage]);

  const activeLangName = useMemo(() => {
    return LANGUAGES.find((l) => l.code === spokenLanguage)?.label || 'Audio';
  }, [spokenLanguage]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        className="w-full max-w-md rounded-2xl bg-[#171716] border border-white/[0.12] shadow-2xl p-6 sm:p-7 flex flex-col my-auto"
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
      >
        {/* Title & subtitle */}
        <div className="text-center mb-5">
          <h2 className="text-xl sm:text-2xl font-bold text-bone tracking-tight">
            Prepare your media
          </h2>
          <p className="text-sm text-smoke mt-1.5 leading-relaxed">
            Choose how captions should appear before processing starts.
          </p>
        </div>

        {/* Thumbnail preview */}
        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black/60 border border-white/10 mb-3 shadow-inner flex items-center justify-center">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt="Video preview thumbnail"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-smoke text-xs gap-1.5">
              <div className="w-6 h-6 border-2 border-white/20 border-t-white/70 rounded-full animate-spin" />
              <span>Loading preview…</span>
            </div>
          )}
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-2 mb-6">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-xs font-medium text-emerald-400/90 tracking-wide">
            Ready for processing
          </span>
        </div>

        {/* Language settings */}
        <div className="flex flex-col gap-4">
          <div>
            <div className="text-[11px] font-semibold text-smoke tracking-wider uppercase mb-2">
              Language Settings
            </div>
            <label className="text-xs text-mist block mb-1.5 font-medium">
              What language is spoken?
            </label>
            <div className="relative">
              <select
                value={spokenLanguage}
                onChange={(e) => setSpokenLanguage(e.target.value as SpokenLanguage)}
                className="w-full appearance-none bg-[#212120] hover:bg-[#282826] border border-white/15 focus:border-amber-400/70 rounded-xl px-4 py-3 text-sm text-bone font-medium focus:outline-none transition-colors cursor-pointer"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code} className="bg-[#212120] text-bone">
                    {lang.nativeName} ({lang.label})
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-smoke">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <p className="text-[11px] text-smoke mt-1.5">
              Epic Hertz AI auto-adapts cadence and dialogue boundaries.
            </p>
          </div>

          {/* Caption Output Toggle (Tanglish vs Native Script) */}
          <div>
            <label className="text-xs text-mist block mb-2 font-medium">
              Caption output
            </label>
            <div className="grid grid-cols-2 p-1 rounded-xl bg-[#121211] border border-white/10 gap-1">
              <button
                type="button"
                onClick={() => setScriptOutput('romanized')}
                className={`py-2.5 px-3 rounded-lg text-xs font-semibold transition-all duration-150 ${
                  scriptOutput === 'romanized'
                    ? 'bg-[#292826] text-amber-200 border border-amber-300/30 shadow-sm'
                    : 'text-smoke hover:text-bone'
                }`}
              >
                {romanizedLabel}
              </button>
              <button
                type="button"
                onClick={() => setScriptOutput('native')}
                className={`py-2.5 px-3 rounded-lg text-xs font-semibold transition-all duration-150 ${
                  scriptOutput === 'native'
                    ? 'bg-[#292826] text-amber-200 border border-amber-300/30 shadow-sm'
                    : 'text-smoke hover:text-bone'
                }`}
              >
                {nativeLabel}
              </button>
            </div>
            <p className="text-[11px] text-smoke mt-2 leading-relaxed">
              {scriptOutput === 'romanized'
                ? `${activeLangName} in English letters. Recommended for Reels and Shorts.`
                : `Authentic native ${activeLangName} script typography.`}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2 mt-7">
          <button
            type="button"
            onClick={() => onContinue({ spokenLanguage, scriptOutput })}
            className="w-full py-3.5 px-6 rounded-full bg-[#FAF6EE] text-[#141413] font-semibold text-sm hover:bg-white hover:shadow-lg active:scale-[0.99] transition-all duration-150 flex items-center justify-center gap-2"
          >
            <span>Continue</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="w-full py-2 text-xs text-smoke hover:text-bone transition-colors font-medium text-center"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
}
