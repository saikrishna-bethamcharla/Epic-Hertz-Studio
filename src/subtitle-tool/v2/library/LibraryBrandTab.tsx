// ─── LibraryBrandTab — Epic Hertz Studio v2 ───────────────────────────────────
import React from 'react';
import { Upload, Trash2, Download, FileJson } from 'lucide-react';
import {
  saveCustomFont,
  deleteCustomFont,
  listCustomFonts,
  type CustomFontRecord,
} from '../../utils/projectStorage';
import {
  getUserPresets,
  getBrandColors,
  exportUserPresetsAsJson,
  importUserPresetsFromJson,
  type UserPreset,
} from '../userPresets';
import { downloadText } from '../../utils/srt';

export interface LibraryBrandTabProps {
  brandColors: string[];
  setBrandColors: (colors: string[]) => void;
  customFonts: CustomFontRecord[];
  setCustomFonts: (fonts: CustomFontRecord[]) => void;
  setUserPresetsList: (presets: UserPreset[]) => void;
  onNotification?: (msg: string) => void;
}

export const LibraryBrandTab: React.FC<LibraryBrandTabProps> = ({
  brandColors,
  setBrandColors,
  customFonts,
  setCustomFonts,
  setUserPresetsList,
  onNotification,
}) => {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-xs font-bold text-bone mb-1">Brand Colors</h4>
        <p className="text-[11px] text-smoke mb-2">Custom palette saved across your projects:</p>
        <div className="grid grid-cols-4 gap-2">
          {brandColors.map((hex, i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-1 p-2 bg-[#181817] rounded-xl border border-white/5"
            >
              <div
                style={{ backgroundColor: hex }}
                className="w-8 h-8 rounded-lg border border-white/20 shadow-xs"
              />
              <span className="text-[9px] font-mono text-smoke uppercase">{hex}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-3 border-t border-white/10">
        <h4 className="text-xs font-bold text-bone mb-1">Custom Font Upload</h4>
        <p className="text-[11px] text-smoke mb-2">
          Upload your brand’s .ttf / .otf / .woff2 font file:
        </p>
        <label className="flex flex-col items-center justify-center p-4 border border-dashed border-white/20 hover:border-amber-400 rounded-xl cursor-pointer bg-white/5 hover:bg-white/10 transition-colors text-center">
          <Upload className="w-5 h-5 text-amber-400 mb-1" />
          <span className="text-xs font-semibold text-bone">Choose font file</span>
          <span className="text-[10px] text-smoke mt-0.5">TTF, OTF, WOFF2 (up to 15MB)</span>
          <input
            type="file"
            accept=".ttf,.otf,.woff,.woff2"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                const buffer = await file.arrayBuffer();
                const fontName = file.name.replace(/\.[^/.]+$/, '');
                const fontFace = new FontFace(fontName, buffer);
                await fontFace.load();
                document.fonts.add(fontFace);
                await saveCustomFont(fontName, buffer);
                const updated = await listCustomFonts();
                setCustomFonts(updated);
                if (onNotification) onNotification(`Saved brand font "${fontName}"`);
              } catch (err) {
                console.warn('Font upload error:', err);
              }
            }}
          />
        </label>

        {customFonts.length > 0 && (
          <div className="mt-3 space-y-1.5">
            <span className="text-[10px] font-semibold text-smoke uppercase tracking-wider">
              Saved Custom Fonts ({customFonts.length})
            </span>
            <div className="space-y-1">
              {customFonts.map((f) => (
                <div
                  key={f.name}
                  className="flex items-center justify-between p-2 rounded-lg bg-[#181817] border border-white/5 text-xs text-bone"
                >
                  <span className="font-medium truncate">{f.name}</span>
                  <button
                    type="button"
                    onClick={async () => {
                      await deleteCustomFont(f.name);
                      setCustomFonts(await listCustomFonts());
                      if (onNotification) onNotification(`Removed font "${f.name}"`);
                    }}
                    className="p-1 text-smoke hover:text-crimson-2 transition-colors cursor-pointer"
                    title="Delete custom font"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-white/10">
        <h4 className="text-xs font-bold text-bone mb-1">Preset Management</h4>
        <p className="text-[11px] text-smoke mb-2">
          Backup or share your creator styles across devices:
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              const json = exportUserPresetsAsJson();
              downloadText(json, 'epic-hertz-presets.json', 'application/json');
              if (onNotification) onNotification('Presets exported to JSON');
            }}
            className="p-2 rounded-xl bg-[#181817] hover:bg-[#20201e] border border-white/10 hover:border-amber-400/50 flex items-center justify-center gap-1.5 text-xs font-medium text-bone transition-all cursor-pointer active:scale-95"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Export JSON</span>
          </button>

          <label className="p-2 rounded-xl bg-[#181817] hover:bg-[#20201e] border border-white/10 hover:border-amber-400/50 flex items-center justify-center gap-1.5 text-xs font-medium text-bone transition-all cursor-pointer active:scale-95 text-center">
            <FileJson className="w-3.5 h-3.5 text-amber-400" />
            <span>Import JSON</span>
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  const text = await file.text();
                  const res = importUserPresetsFromJson(text);
                  if (res.errors.length) {
                    if (onNotification) onNotification(`Import failed: ${res.errors[0]}`);
                  } else {
                    setUserPresetsList(getUserPresets());
                    setBrandColors(getBrandColors());
                    if (onNotification)
                      onNotification(`Imported ${res.importedCount} presets successfully`);
                  }
                } catch (err) {
                  console.warn('Import error:', err);
                }
              }}
            />
          </label>
        </div>
      </div>
    </div>
  );
};

export default LibraryBrandTab;
