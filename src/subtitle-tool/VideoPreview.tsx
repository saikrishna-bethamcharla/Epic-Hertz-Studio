// ─── VideoPreview ──────────────────────────────────────────────────────────────
// Video player with live custom subtitle overlay, word-level karaoke sync,
// aspect ratio switching (9:16 Reel with ambient blur background), and custom playback controls.

import {
  useRef,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
  useState,
  useMemo,
} from 'react';
import { Smartphone, Heart, MessageCircle, Share2, Disc3 } from 'lucide-react';
import type { Segment, CaptionStyle, VideoAspectRatio } from './types';
import CaptionCanvas from './CaptionCanvas';
import { formatTimecode } from './utils/formatTime';

interface VideoPreviewProps {
  videoFile: File;
  segments: Segment[];
  style: CaptionStyle;
  onStyleChange?: (style: CaptionStyle) => void;
  aspectRatio?: VideoAspectRatio;
  onAspectRatioChange?: (ratio: VideoAspectRatio) => void;
  onTimeUpdate: (time: number) => void;
  onDurationChange?: (duration: number) => void;
  onPlayStateChange?: (isPlaying: boolean) => void;
}

export interface VideoPreviewHandle {
  seekTo: (time: number) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  getCurrentTime: () => number;
}

const VideoPreview = forwardRef<VideoPreviewHandle, VideoPreviewProps>(
  (
    {
      videoFile,
      segments,
      style,
      onStyleChange,
      aspectRatio = '9:16',
      onAspectRatioChange,
      onTimeUpdate,
      onDurationChange,
      onPlayStateChange,
    },
    ref,
  ) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [showSafeZones, setShowSafeZones] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const playPromiseRef = useRef<Promise<void> | null>(null);

    // Create stable Blob URL for the video file
    const videoURL = useMemo(() => URL.createObjectURL(videoFile), [videoFile]);

    useEffect(() => {
      return () => {
        URL.revokeObjectURL(videoURL);
      };
    }, [videoURL]);

    // Robust play that handles user click interruption gracefully
    const safePlay = useCallback(async () => {
      if (!videoRef.current) return;
      try {
        playPromiseRef.current = videoRef.current.play();
        await playPromiseRef.current;
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
          // Play interrupted by pause or seek — normal browser behavior
          return;
        }
        console.warn('Video play error:', err);
      } finally {
        playPromiseRef.current = null;
      }
    }, []);

    // Robust pause that waits for pending play promise to settle
    const safePause = useCallback(async () => {
      if (!videoRef.current) return;
      if (playPromiseRef.current) {
        try {
          await playPromiseRef.current;
        } catch {
          // ignore
        }
      }
      videoRef.current.pause();
    }, []);

    const togglePlay = useCallback(() => {
      if (!videoRef.current) return;
      if (videoRef.current.paused) {
        safePlay();
      } else {
        safePause();
      }
    }, [safePlay, safePause]);

    // Expose methods to parent (Timeline & Caption editor clicks)
    useImperativeHandle(ref, () => ({
      seekTo(time: number) {
        if (videoRef.current) {
          const maxDur = videoRef.current.duration || duration || time;
          const target = Math.max(0, Math.min(maxDur, time));
          videoRef.current.currentTime = target;
          setCurrentTime(target);
        }
      },
      play() {
        safePlay();
      },
      pause() {
        safePause();
      },
      togglePlay() {
        togglePlay();
      },
      getCurrentTime() {
        return videoRef.current?.currentTime || 0;
      },
    }), [safePlay, safePause, togglePlay, duration]);

    const handleTimeUpdate = useCallback(() => {
      if (videoRef.current) {
        const t = videoRef.current.currentTime;
        setCurrentTime(t);
        onTimeUpdate(t);
      }
    }, [onTimeUpdate]);

    // Keep the time readout fresh while playing. Captions are drawn by CaptionCanvas on its own
    // frame loop, so this only needs to run a few times a second.
    useEffect(() => {
      let rafId: number;
      let lastPush = 0;
      const tick = (now: number) => {
        if (videoRef.current && !videoRef.current.paused && now - lastPush > 80) {
          lastPush = now;
          setCurrentTime(videoRef.current.currentTime);
        }
        rafId = requestAnimationFrame(tick);
      };

      if (isPlaying) {
        rafId = requestAnimationFrame(tick);
      }
      return () => {
        if (rafId) cancelAnimationFrame(rafId);
      };
    }, [isPlaying]);

    const handleLoadedMetadata = useCallback(() => {
      if (videoRef.current) {
        const d = videoRef.current.duration || 0;
        setDuration(d);
        onDurationChange?.(d);
      }
    }, [onDurationChange]);

    const toggleMute = () => {
      if (!videoRef.current) return;
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value);
      setVolume(val);
      if (videoRef.current) {
        videoRef.current.volume = val;
        videoRef.current.muted = val === 0;
      }
      setIsMuted(val === 0);
    };

    const cyclePlaybackRate = () => {
      const rates = [1, 1.25, 1.5, 2, 0.75];
      const next = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
      setPlaybackRate(next);
      if (videoRef.current) videoRef.current.playbackRate = next;
    };

    const toggleFullscreen = () => {
      if (!containerRef.current) return;
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    };

    // Format timestamp
    const formatTime = (secs: number) => formatTimecode(secs, { decimals: true });

    // Aspect ratio container styles
    const aspectContainerClass = useMemo(() => {
      switch (aspectRatio) {
        case '9:16':
          return 'aspect-[9/16] max-h-[580px] w-auto';
        case '16:9':
          return 'aspect-[16/9] w-full max-h-[580px]';
        case '1:1':
          return 'aspect-square max-h-[540px] w-auto';
        default:
          return 'w-full max-h-[580px]';
      }
    }, [aspectRatio]);

    return (
      <div className="flex flex-col items-center justify-center w-full h-full p-2 select-none">
        {/* Aspect Ratio Switcher Pills & Safe Zones */}
        <div className="flex items-center gap-2 mb-1.5 sm:mb-2.5 z-10 flex-wrap justify-center">
          <div className="flex items-center gap-1.5 bg-[#1b1b19] p-1 rounded-xl border border-white/10 shadow-sm">
            {(['9:16', '16:9', '1:1', 'original'] as VideoAspectRatio[]).map((ratio) => (
              <button
                key={ratio}
                type="button"
                onClick={() => onAspectRatioChange?.(ratio)}
                className={`px-2.5 sm:px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  aspectRatio === ratio
                    ? 'bg-[#292826] text-amber-300 shadow-sm border border-amber-300/30'
                    : 'text-smoke hover:text-bone'
                }`}
              >
                {ratio === '9:16' ? '9:16 Reel' : ratio === '16:9' ? '16:9' : ratio === '1:1' ? '1:1' : 'Original'}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowSafeZones(!showSafeZones)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer hidden sm:flex items-center gap-1.5 ${
              showSafeZones
                ? 'bg-amber-400 text-black border-amber-400 font-bold shadow-md shadow-amber-400/20'
                : 'bg-[#1b1b19] border-white/10 text-smoke hover:text-bone hover:border-white/25'
            }`}
            title="Toggle Instagram Reels & TikTok native UI safe zones to prevent captions from getting covered"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Safe Zones</span>
            {showSafeZones && <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />}
          </button>
        </div>

        {/* Video Frame */}
        <div
          ref={containerRef}
          className={`relative rounded-2xl overflow-hidden bg-black flex items-center justify-center shadow-2xl border border-white/10 ${aspectContainerClass}`}
        >
          {/* Ambient Glow for 9:16 Reels */}
          {aspectRatio === '9:16' && (
            <div
              className="absolute inset-0 pointer-events-none opacity-40 blur-2xl scale-110"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(217, 167, 74, 0.22) 0%, rgba(20, 20, 19, 0.85) 75%, transparent 100%)',
              }}
              aria-hidden="true"
            />
          )}

          {/* Social Media Native UI Safe Zone Overlay */}
          {showSafeZones && (
            <div className="absolute inset-0 pointer-events-none z-25 flex flex-col justify-between p-4 overflow-hidden select-none">
              {/* Top Danger Guideline (Profile / Search Area) */}
              <div className="flex items-center justify-between text-[10px] text-red-400/80 px-2 py-1 border-b border-dashed border-red-500/40 bg-red-950/20 rounded">
                <span>✕ Header Tab Area</span>
                <span className="font-mono text-[9px] uppercase tracking-wider">Unsafe Zone</span>
              </div>

              {/* Right Side Social Action Bar (Like, Comment, Share) */}
              <div className="absolute right-3.5 bottom-28 flex flex-col items-center gap-3.5 text-white/70">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-black/40 border border-white/20 flex items-center justify-center">
                    <Heart className="w-4 h-4 text-white/90" />
                  </div>
                  <span className="text-[9px] font-mono mt-0.5">182K</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-black/40 border border-white/20 flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 text-white/90" />
                  </div>
                  <span className="text-[9px] font-mono mt-0.5">6.2K</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-black/40 border border-white/20 flex items-center justify-center">
                    <Share2 className="w-4 h-4 text-white/90" />
                  </div>
                  <span className="text-[9px] font-mono mt-0.5">Share</span>
                </div>
                <div className="w-7 h-7 rounded-full bg-black/70 border border-white/30 flex items-center justify-center">
                  <Disc3 className="w-4 h-4 text-amber-300 animate-spin" />
                </div>
              </div>

              {/* Bottom Danger Guideline (Username, Native Caption & Audio bar) */}
              <div className="w-3/4 space-y-1.5 pb-2 border-t border-dashed border-red-500/40 bg-red-950/25 p-2 rounded">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-white/90">
                  <span>@epic_hertz_creator</span>
                  <span className="px-1.5 py-0.2 rounded bg-amber-400 text-black text-[9px] font-semibold">Follow</span>
                </div>
                <p className="text-[10px] text-white/70 line-clamp-1">
                  Social native description & hashtags live here...
                </p>
                <div className="flex items-center gap-1 text-[9px] text-white/50 font-mono">
                  <span>♫ Original Audio · Viral Beat</span>
                </div>
              </div>
            </div>
          )}

          {/* Crisp Primary Video */}
          <video
            ref={videoRef}
            src={videoURL}
            className="relative z-10 w-full h-full object-contain cursor-pointer"
            preload="auto"
            playsInline
            onClick={togglePlay}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onPlay={() => {
              setIsPlaying(true);
              onPlayStateChange?.(true);
            }}
            onPause={() => {
              setIsPlaying(false);
              onPlayStateChange?.(false);
            }}
            onEnded={() => {
              setIsPlaying(false);
              onPlayStateChange?.(false);
            }}
            onError={(e) => {
              console.warn('Video element error:', e);
            }}
          />

          {/* Big Play Button Overlay when paused */}
          {!isPlaying && (
            <button
              onClick={togglePlay}
              className="absolute z-20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md border border-white/20 transition-all hover:scale-105 shadow-2xl"
              aria-label="Play video"
            >
              <svg className="w-7 h-7 translate-x-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          )}

          {/* Captions: drawn by the same engine that renders the export */}
          <CaptionCanvas
            segments={segments}
            style={style}
            videoRef={videoRef}
            hostRef={containerRef}
            onStyleChange={onStyleChange}
          />
        </div>

        {/* Floating Transport Bar under Video Player (ReplixCaptions-style) */}
        <div className="flex items-center gap-3 mt-3 px-4 py-2 bg-[#1b1b19]/90 backdrop-blur-md rounded-2xl border border-white/10 shadow-lg text-bone text-xs">
          {/* Play / Pause */}
          <button
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pause playback' : 'Start playback'}
            className="p-1.5 hover:text-amber-300 transition-colors"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* Volume */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleMute}
              aria-label={isMuted || volume === 0 ? 'Unmute video audio' : 'Mute video audio'}
              title={isMuted || volume === 0 ? 'Unmute' : 'Mute'}
              className="p-1 hover:text-amber-300 transition-colors text-smoke"
            >
              {isMuted || volume === 0 ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              aria-label="Video volume"
              className="w-14 h-1 accent-amber-400 bg-white/20 rounded-lg cursor-pointer"
            />
          </div>

          {/* Time display: 0:01 / 0:08 */}
          <div className="font-mono text-mist text-[11px] px-2">
            <span className="text-bone">{formatTime(currentTime)}</span>
            <span className="text-smoke mx-1">/</span>
            <span>{formatTime(duration)}</span>
          </div>

          {/* Speed badge */}
          <button
            onClick={cyclePlaybackRate}
            aria-label={`Playback speed: ${playbackRate}x`}
            className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 font-mono text-[11px] text-amber-200 transition-colors"
            title="Playback Speed"
          >
            {playbackRate}x
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-1 hover:text-amber-300 transition-colors text-smoke ml-1"
            title="Fullscreen"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0 0l-5-5m-6 16l-5-5m0 0h4m-4 0v-4m16 4v-4m0 4h-4m4 0l-5-5" />
            </svg>
          </button>
        </div>
      </div>
    );
  },
);

VideoPreview.displayName = 'VideoPreview';
export default VideoPreview;
