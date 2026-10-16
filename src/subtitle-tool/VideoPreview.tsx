// ─── VideoPreview ──────────────────────────────────────────────────────────────
// Video player with live caption overlay and time-sync back to the editor.

import {
  useRef,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
  useState,
  useMemo,
} from 'react';
import type { Segment, SubtitleStyle } from './types';

interface VideoPreviewProps {
  videoFile: File;
  segments: Segment[];
  style?: SubtitleStyle;
  onTimeUpdate: (time: number) => void;
}

export interface VideoPreviewHandle {
  seekTo: (time: number) => void;
}

/**
 * Robust video player with synced custom subtitle overlay.
 * Bypasses buggy browser <track> reloading which causes video decoders to stall/freeze.
 */
const VideoPreview = forwardRef<VideoPreviewHandle, VideoPreviewProps>(
  ({ videoFile, segments, style, onTimeUpdate }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [currentTime, setCurrentTime] = useState(0);

    // Create stable Blob URL for the video file
    const videoURL = useMemo(() => URL.createObjectURL(videoFile), [videoFile]);

    // Clean up video blob URL on unmount or file change
    useEffect(() => {
      return () => {
        URL.revokeObjectURL(videoURL);
      };
    }, [videoURL]);

    // Expose seekTo to parent (CaptionEditor clicks)
    useImperativeHandle(ref, () => ({
      seekTo(time: number) {
        if (videoRef.current) {
          videoRef.current.currentTime = time;
          videoRef.current.play().catch(() => {});
        }
      },
    }));

    const handleTimeUpdate = useCallback(() => {
      if (videoRef.current) {
        const t = videoRef.current.currentTime;
        setCurrentTime(t);
        onTimeUpdate(t);
      }
    }, [onTimeUpdate]);

    // Active subtitle segment for current playhead position
    const activeSegment = useMemo(() => {
      return segments.find((s) => currentTime >= s.start && currentTime <= s.end);
    }, [segments, currentTime]);

    // Position CSS helper
    const posClass =
      style?.position === 'top'
        ? 'top-8'
        : style?.position === 'middle'
        ? 'top-1/2 -translate-y-1/2'
        : 'bottom-10';

    const displayText = activeSegment?.text
      ? style?.uppercase
        ? activeSegment.text.toUpperCase()
        : activeSegment.text
      : '';

    return (
      <div className="relative w-full rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center">
        <video
          ref={videoRef}
          src={videoURL}
          className="w-full h-full object-contain"
          controls
          preload="auto"
          onTimeUpdate={handleTimeUpdate}
          playsInline
        />

        {/* Live Subtitle Overlay styled in real-time according to Studio settings */}
        {activeSegment && displayText && (
          <div className={`pointer-events-none absolute inset-x-0 flex justify-center px-6 transition-all duration-150 ${posClass}`}>
            <span
              className="max-w-[92%] text-center font-bold px-4 py-1.5 rounded-lg shadow-lg leading-relaxed tracking-wide transition-all duration-150"
              style={{
                fontSize: `${style?.fontSize ?? 22}px`,
                color: style?.textColor ?? '#FFFFFF',
                backgroundColor: style?.backgroundColor ?? 'rgba(0, 0, 0, 0.75)',
                fontFamily: 'Gautami, "Nirmala UI", sans-serif',
                WebkitTextStroke: style?.outlineWidth
                  ? `${style.outlineWidth}px ${style.outlineColor}`
                  : undefined,
                textShadow: '0 2px 5px rgba(0,0,0,0.8)',
              }}
            >
              {displayText}
            </span>
          </div>
        )}
      </div>
    );
  },
);

VideoPreview.displayName = 'VideoPreview';
export default VideoPreview;
