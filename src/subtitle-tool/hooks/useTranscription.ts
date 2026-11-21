// ─── useTranscription Hook — Epic Hertz Studio ──────────────────────────────
// Encapsulates audio extraction and chunked Gemini transcription orchestration.

import { useState, useCallback } from 'react';
import type { AppStage, Segment, SpokenLanguage, ScriptOutput } from '../types';
import { extractAudio } from '../utils/extractAudio';
import { transcribeAudio } from '../api/transcribe';
import { refineSegmentsFromAudioWithMetrics } from '../utils/alignWords';

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
  onMeasuredSyncOffset?: (offset: number) => void;
}

export function useTranscription({
  setStage,
  setStatusText,
  setError,
  setSegments,
  setHistory,
  setRedoStack,
  onMeasuredSyncOffset,
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
        // Snaps word boundaries to exact voice energy attacks in the 16kHz audio,
        // and measures per-video empirical lag to calibrate default sync offset.
        let finalSegs = segs;
        try {
          setStatusText('Aligning word timings with speech onsets…');
          const res = await refineSegmentsFromAudioWithMetrics(audioBlob, segs);
          finalSegs = res.segments;
          if (res.metrics.sampleCount > 0) {
            console.info(
              `[useTranscription] Acoustic analysis: aligned ${res.metrics.sampleCount} words (median onset lag = ${(res.metrics.medianLagSec * 1000).toFixed(0)}ms). Playback locked at 1:1 acoustic sync (syncOffset = 0.0s).`,
            );
            // Word timestamps have been snapped to physical acoustic onsets in the audio.
            // Playback syncOffset is set to 0.0s for 1:1 lockstep sync.
            if (onMeasuredSyncOffset) {
              onMeasuredSyncOffset(0.0);
            }
          } else {
            // Apply standard default speech calibration offset (-80ms) for unaligned words
            onMeasuredSyncOffset?.(-0.08);
          }
        } catch (alignErr) {
          console.warn('[useTranscription] Acoustic alignment fallback:', alignErr);
          // Fallback to standard default speech calibration offset (-80ms)
          onMeasuredSyncOffset?.(-0.08);
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
    [
      setStage,
      setStatusText,
      setError,
      setSegments,
      setHistory,
      setRedoStack,
      onMeasuredSyncOffset,
    ],
  );

  return {
    isProcessing,
    processVideo,
  };
}
