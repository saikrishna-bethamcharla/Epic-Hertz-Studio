// ─── useTranscription Hook — Epic Hertz Studio ──────────────────────────────
// Encapsulates audio extraction and chunked Gemini transcription orchestration.

import { useState, useCallback } from 'react';
import type { AppStage, Segment, SpokenLanguage, ScriptOutput } from '../types';
import { extractAudio } from '../utils/extractAudio';
import { transcribeAudio } from '../api/transcribe';
import { refineSegmentsFromAudio } from '../utils/alignWords';

export interface TranscriptionConfig {
  spokenLanguage: SpokenLanguage;
  scriptOutput: ScriptOutput;
}

export interface UseTranscriptionOptions {
  setStage: (stage: AppStage) => void;
  setStatusText: (status: string) => void;
  setError: (error: string | null) => void;
  setSegments: (segments: Segment[]) => void;
  setHistory: (history: Segment[][]) => void;
  setRedoStack: (redo: Segment[][]) => void;
}

export function useTranscription({
  setStage,
  setStatusText,
  setError,
  setSegments,
  setHistory,
  setRedoStack,
}: UseTranscriptionOptions) {
  const [isProcessing, setIsProcessing] = useState(false);

  const processVideo = useCallback(
    async (file: File, config: TranscriptionConfig) => {
      setIsProcessing(true);
      setError(null);

      try {
        // Step A: Extract 16kHz mono audio track in-browser
        setStage('extracting');
        setStatusText('Extracting audio track…');
        const audioBlob = await extractAudio(file);

        // Step B: Upload & Transcribe via Gemini serverless proxy
        setStage('uploading');
        setStatusText('Uploading to AI studio…');

        const segs = await transcribeAudio(audioBlob, {
          spokenLanguage: config.spokenLanguage,
          scriptOutput: config.scriptOutput,
          onStatus: (msg) => {
            setStatusText(msg);
            if (msg.toLowerCase().includes('transcrib')) {
              setStage('transcribing');
            }
          },
        });

        // Step C: Acoustic Onset Alignment
        // Snaps word boundaries to exact voice energy attacks in the 16kHz audio
        let finalSegs = segs;
        try {
          setStatusText('Aligning word timings with speech onsets…');
          finalSegs = await refineSegmentsFromAudio(audioBlob, segs);
        } catch (alignErr) {
          console.warn('[useTranscription] Acoustic alignment fallback:', alignErr);
        }

        setSegments(finalSegs);
        setHistory([]);
        setRedoStack([]);
        setStage('editing');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        setStage('idle');
      } finally {
        setIsProcessing(false);
      }
    },
    [setStage, setStatusText, setError, setSegments, setHistory, setRedoStack],
  );

  return {
    isProcessing,
    processVideo,
  };
}
