// ─── Pack Import & Export Modal — Epic Hertz Studio v2 ────────────────────────
// Secure import and export of lower third template packs.
// Enforces 2 MB limit, 100-template limit, prototype pollution defense, and Zod validation.

import { useState, useRef } from 'react';
import { Download, Upload, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { validateLowerThirdPack, type LowerThirdPack } from '../../engine/lowerThirdSchema';
import { LOWER_THIRD_PACKS } from '../../engine/lowerThirdPacks';

interface PackImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportPack: (pack: LowerThirdPack) => void;
}

export default function PackImportExportModal({
  isOpen,
  onClose,
  onImportPack,
}: PackImportExportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('File exceeds maximum allowed size of 2 MB.');
      return;
    }

    try {
      const text = await file.text();

      // Prototype pollution defense
      if (
        text.includes('__proto__') ||
        text.includes('constructor') ||
        text.includes('prototype')
      ) {
        const parsed = JSON.parse(text);
        if ('__proto__' in parsed || 'prototype' in parsed) {
          throw new Error('Prototype pollution attempt detected.');
        }
      }

      const raw = JSON.parse(text);
      const validated = validateLowerThirdPack(raw);
      onImportPack(validated);
      setSuccessMsg(
        `Successfully imported "${validated.name}" with ${validated.templates.length} templates.`,
      );
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Invalid template pack file.');
    }
  };

  const handleExportPack = (pack: LowerThirdPack) => {
    try {
      const jsonStr = JSON.stringify(pack, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lower-third-pack-${pack.id}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.warn('Failed to export template pack:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-[#18181b] border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#121211]">
          <span className="text-xs font-semibold text-bone">Import / Export Lower Third Packs</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1 text-smoke hover:text-bone rounded hover:bg-white/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col gap-4">
          {errorMsg && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-950/60 border border-red-800 text-xs text-red-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-200">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Import Section */}
          <div className="flex flex-col gap-2 p-3 rounded-lg bg-[#121211] border border-white/10">
            <span className="text-xs font-semibold text-bone">Import Custom Pack (JSON)</span>
            <p className="text-[11px] text-smoke">
              Upload a valid LowerThirdPack JSON file (max 2 MB, up to 100 templates).
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold bg-white/10 hover:bg-white/15 text-bone rounded-lg border border-white/10 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              Choose JSON File
            </button>
          </div>

          {/* Export Section */}
          <div className="flex flex-col gap-2 p-3 rounded-lg bg-[#121211] border border-white/10">
            <span className="text-xs font-semibold text-bone">Export Built-in Packs</span>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {LOWER_THIRD_PACKS.map((pack) => (
                <button
                  key={pack.id}
                  type="button"
                  onClick={() => handleExportPack(pack)}
                  className="flex items-center justify-between px-2.5 py-1.5 rounded bg-white/5 hover:bg-white/10 text-smoke hover:text-bone text-[11px] border border-white/5 transition-colors"
                >
                  <span className="truncate">{pack.name}</span>
                  <Download className="w-3.5 h-3.5 shrink-0 ml-1" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-4 py-3 border-t border-white/10 bg-[#121211]">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-semibold bg-white/10 hover:bg-white/15 text-bone rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
