// ─── ApiKeyModal ──────────────────────────────────────────────────────────────
// Modal dialog to configure and securely store the Gemini API Key in browser localStorage.

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getStoredApiKey, setStoredApiKey } from './api/transcribe';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export default function ApiKeyModal({ isOpen, onClose, onSaved }: ApiKeyModalProps) {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setApiKey(getStoredApiKey());
      setWarning(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    const trimmed = apiKey.trim();
    if (!trimmed) {
      setStoredApiKey('');
      onClose();
      return;
    }

    setWarning(null);
    setStoredApiKey(trimmed);
    onSaved?.();
    onClose();
  };

  const handleClear = () => {
    setApiKey('');
    setStoredApiKey('');
    setWarning(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        className="w-full max-w-md rounded-2xl bg-[#171716] border border-white/10 shadow-2xl p-6 flex flex-col"
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-base">⚙</span>
            <h2 className="text-base font-bold text-bone">Gemini API Key</h2>
          </div>
          <button
            onClick={onClose}
            className="text-smoke hover:text-bone text-sm p-1"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 text-xs text-smoke leading-relaxed space-y-2">
          <p>
            Epic Hertz uses the official Google Gemini API for transcription. Your key is stored
            <strong> locally in your own browser</strong> and never committed or stored on any server.
          </p>
          <p>
            Get your key for free from{' '}
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-300 hover:underline font-semibold"
            >
              Google AI Studio ↗
            </a>
            . (Starts with <code className="bg-black/40 px-1 py-0.5 rounded text-amber-200">AQ...</code> or <code className="bg-black/40 px-1 py-0.5 rounded text-amber-200">AIzaSy...</code>)
          </p>
        </div>

        {/* Input */}
        <div className="mt-4">
          <label className="block text-[11px] font-semibold text-mist uppercase tracking-wider mb-1.5">
            API Key
          </label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setWarning(null);
              }}
              placeholder="AIzaSy..."
              className="w-full bg-[#111110] border border-white/15 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs text-bone font-mono focus:outline-none transition-colors pr-20"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-smoke hover:text-bone px-2 py-1"
            >
              {showKey ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        {warning && (
          <div className="mt-3 p-2.5 rounded-lg bg-amber-400/10 border border-amber-400/30 text-[11px] text-amber-200 leading-snug">
            {warning}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between mt-6 pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-crimson-2 hover:underline"
          >
            Clear key
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-smoke hover:text-bone"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-full bg-amber-400 hover:bg-amber-300 text-black font-semibold text-xs transition-colors shadow-sm"
            >
              Save Key
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
