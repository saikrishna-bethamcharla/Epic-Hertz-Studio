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
import {
  Smartphone,
  Heart,
  MessageCircle,
  Share2,
  Disc3,
  Eye,
  EyeOff,
  Maximize2,
  Bookmark,
  ThumbsUp,
  ThumbsDown,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  SkipBack,
  SkipForward,
} from 'lucide-react';
import type {
  Segment,
  CaptionStyle,
  VideoAspectRatio,
  SegmentStyleOverride,
  LowerThirdSpec,
} from './types';
import CaptionCanvas from './CaptionCanvas';
import { formatTimecode } from './utils/formatTime';

export type SafeZonePlatform = 'reels' | 'tiktok' | 'shorts';

interface VideoPreviewProps {
  videoFile: File;
  segments: Segment[];
  style: CaptionStyle;
  onStyleChange?: (style: CaptionStyle) => void;
  onSegmentOverrideChange?: (
    segmentId: string,
    override: Partial<SegmentStyleOverride> | null,
  ) => void;
  aspectRatio?: VideoAspectRatio;
  onAspectRatioChange?: (ratio: VideoAspectRatio) => void;
  onTimeUpdate: (time: number) => void;
  onDurationChange?: (duration: number) => void;
  onPlayStateChange?: (isPlaying: boolean) => void;
  lowerThirds?: LowerThirdSpec[];
  photoCache?: Map<string, HTMLImageElement>;
  hideCaptions?: boolean;
  onToggleHideCaptions?: () => void;
  isLeftCollapsed?: boolean;
  onToggleLeftCollapsed?: () => void;
  isRightCollapsed?: boolean;
  onToggleRightCollapsed?: () => void;
}

export interface VideoPreviewHandle {
  seekTo: (time: number) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  getCurrentTime: () => number;
  toggleFullscreen: () => void;
}

const VideoPreview = forwardRef<VideoPreviewHandle, VideoPreviewProps>(
  (
    {
      videoFile,
      segments,
      style,
      onStyleChange,
      onSegmentOverrideChange,
      aspectRatio = '9:16',
      onAspectRatioChange,
      onTimeUpdate,
      onDurationChange,
      onPlayStateChange,
      lowerThirds,
      photoCache,
      hideCaptions = false,
      onToggleHideCaptions,
      isLeftCollapsed = false,
      onToggleLeftCollapsed,
      isRightCollapsed = false,
      onToggleRightCollapsed,
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
    const [safePlatform, setSafePlatform] = useState<SafeZonePlatform>('reels');
    const [localHideCaptions, setLocalHideCaptions] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const playPromiseRef = useRef<Promise<void> | null>(null);

    // Create stable Blob URL for the video file
    const videoURL = useMemo(() => URL.createObjectURL(videoFile), [videoFile]);

    const activeSeg = useMemo(() => {
      const t = currentTime - (style.syncOffset || 0);
      return segments.find((s) => t >= s.start && t <= s.end + 0.15);
    }, [segments, currentTime, style.syncOffset]);

    const hasCustomPos =
      activeSeg?.styleOverride?.positionX !== undefined ||
      activeSeg?.styleOverride?.positionY !== undefined;

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

    const toggleFullscreen = useCallback(() => {
      if (!containerRef.current) return;
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    }, []);

    // Expose methods to parent (Timeline & Caption editor clicks)
    useImperativeHandle(
      ref,
      () => ({
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
        toggleFullscreen() {
          toggleFullscreen();
        },
      }),
      [safePlay, safePause, togglePlay, toggleFullscreen, duration],
    );

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
        {/* Player View Settings Bar (Title, Aspect Ratio, Safe Zones, Panel Toggles) */}
        <div className="w-full flex items-center justify-between gap-2 mb-2 px-1 z-10 flex-wrap">
          {/* Left: Left Panel Toggle & Title */}
          <div className="flex items-center gap-2">
            {onToggleLeftCollapsed && (
              <button
                type="button"
                onClick={onToggleLeftCollapsed}
                className="p-1.5 rounded-lg bg-[#1b1b19] border border-white/10 text-smoke hover:text-bone hover:bg-white/10 transition-colors"
                title={isLeftCollapsed ? 'Expand Library panel ([)' : 'Collapse Library panel ([)'}
              >
                {isLeftCollapsed ? (
                  <PanelLeftOpen className="w-3.5 h-3.5" />
                ) : (
                  <PanelLeftClose className="w-3.5 h-3.5" />
                )}
              </button>
            )}
            <span className="text-xs font-bold text-bone tracking-tight hidden sm:inline">
              Preview
            </span>
          </div>

          {/* Center: Aspect Ratio & Safe Zones */}
          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            <div className="flex items-center gap-1 bg-[#1b1b19] p-0.5 rounded-xl border border-white/10 shadow-xs">
              {(['9:16', '16:9', '1:1', 'original'] as VideoAspectRatio[]).map((ratio) => (
                <button
                  key={ratio}
                  type="button"
                  onClick={() => onAspectRatioChange?.(ratio)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                    aspectRatio === ratio
                      ? 'bg-[#292826] text-amber-300 border border-amber-300/30'
                      : 'text-smoke hover:text-bone'
                  }`}
                >
                  {ratio === '9:16'
                    ? '9:16 Reel'
                    : ratio === '16:9'
                      ? '16:9'
                      : ratio === '1:1'
                        ? '1:1'
                        : 'Fit'}
                </button>
              ))}
            </div>

            {/* Safe Zones Selector */}
            <div className="flex items-center gap-1 bg-[#1b1b19] p-0.5 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => setShowSafeZones(!showSafeZones)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg flex items-center gap-1 ${
                  showSafeZones ? 'bg-amber-400 text-black font-bold' : 'text-smoke hover:text-bone'
                }`}
                title="Toggle Platform Safe Zones"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Safe Zones</span>
              </button>
              {showSafeZones &&
                (['reels', 'tiktok', 'shorts'] as SafeZonePlatform[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setSafePlatform(p)}
                    className={`px-1.5 py-0.5 text-[10px] font-semibold rounded capitalize ${
                      safePlatform === p ? 'bg-amber-400 text-black' : 'text-smoke hover:text-bone'
                    }`}
                  >
                    {p === 'reels' ? 'Reels' : p === 'tiktok' ? 'TikTok' : 'Shorts'}
                  </button>
                ))}
            </div>
          </div>

          {/* Right: Compare, Fullscreen & Inspector Toggle */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                if (onToggleHideCaptions) onToggleHideCaptions();
                else setLocalHideCaptions((prev) => !prev);
              }}
              title="Compare Before/After (Hold \)"
              className={`p-1.5 rounded-lg border transition-colors ${
                hideCaptions || localHideCaptions
                  ? 'bg-amber-400 text-black border-amber-400 font-bold'
                  : 'bg-[#1b1b19] border-white/10 text-smoke hover:text-bone'
              }`}
            >
              {hideCaptions || localHideCaptions ? (
                <EyeOff className="w-3.5 h-3.5" />
              ) : (
                <Eye className="w-3.5 h-3.5" />
              )}
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              title="Fullscreen Preview (F)"
              className="p-1.5 rounded-lg bg-[#1b1b19] border border-white/10 text-smoke hover:text-bone hover:bg-white/10 transition-colors"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>

            {onToggleRightCollapsed && (
              <button
                type="button"
                onClick={onToggleRightCollapsed}
                className="p-1.5 rounded-lg bg-[#1b1b19] border border-white/10 text-smoke hover:text-bone hover:bg-white/10 transition-colors"
                title={isRightCollapsed ? 'Expand Inspector (])' : 'Collapse Inspector (])'}
              >
                {isRightCollapsed ? (
                  <PanelRightOpen className="w-3.5 h-3.5" />
                ) : (
                  <PanelRightClose className="w-3.5 h-3.5" />
                )}
              </button>
            )}
          </div>
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
                background:
                  'radial-gradient(ellipse at center, rgba(217, 167, 74, 0.22) 0%, rgba(20, 20, 19, 0.85) 75%, transparent 100%)',
              }}
              aria-hidden="true"
            />
          )}

          {/* Social Media Native UI Safe Zone Overlay */}
          {showSafeZones && (
            <div className="absolute inset-0 pointer-events-none z-25 flex flex-col justify-between p-4 overflow-hidden select-none">
              {/* Top Danger Guideline */}
              <div className="flex items-center justify-between text-[10px] text-red-400/90 px-2 py-1 border-b border-dashed border-red-500/50 bg-red-950/40 backdrop-blur-xs rounded">
                <span>
                  ✕{' '}
                  {safePlatform === 'tiktok'
                    ? 'LIVE · Following · For You'
                    : safePlatform === 'shorts'
                      ? 'Shorts Search & Camera'
                      : 'Header / Search Area'}
                </span>
                <span className="font-mono text-[9px] uppercase tracking-wider">
                  {safePlatform.toUpperCase()} SAFE ZONE
                </span>
              </div>

              {/* Right Side Social Action Bar */}
              {safePlatform === 'reels' && (
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
              )}

              {safePlatform === 'tiktok' && (
                <div className="absolute right-3 bottom-24 flex flex-col items-center gap-3 text-white/70">
                  <div className="w-8 h-8 rounded-full bg-rose-500/80 border border-white flex items-center justify-center font-bold text-[10px] text-white">
                    +
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-black/40 border border-white/20 flex items-center justify-center">
                      <Heart className="w-4 h-4 text-white/90" />
                    </div>
                    <span className="text-[9px] font-mono mt-0.5">340K</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-black/40 border border-white/20 flex items-center justify-center">
                      <MessageCircle className="w-4 h-4 text-white/90" />
                    </div>
                    <span className="text-[9px] font-mono mt-0.5">12.4K</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-black/40 border border-white/20 flex items-center justify-center">
                      <Bookmark className="w-4 h-4 text-amber-300" />
                    </div>
                    <span className="text-[9px] font-mono mt-0.5">48K</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-black/40 border border-white/20 flex items-center justify-center">
                      <Share2 className="w-4 h-4 text-white/90" />
                    </div>
                    <span className="text-[9px] font-mono mt-0.5">29K</span>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-black/80 border border-white/40 flex items-center justify-center">
                    <Disc3 className="w-4 h-4 text-rose-400 animate-spin" />
                  </div>
                </div>
              )}

              {safePlatform === 'shorts' && (
                <div className="absolute right-3.5 bottom-24 flex flex-col items-center gap-3.5 text-white/70">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-black/40 border border-white/20 flex items-center justify-center">
                      <ThumbsUp className="w-4 h-4 text-white/90" />
                    </div>
                    <span className="text-[9px] font-mono mt-0.5">95K</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-black/40 border border-white/20 flex items-center justify-center">
                      <ThumbsDown className="w-4 h-4 text-white/90" />
                    </div>
                    <span className="text-[9px] font-mono mt-0.5">Dislike</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-black/40 border border-white/20 flex items-center justify-center">
                      <MessageCircle className="w-4 h-4 text-white/90" />
                    </div>
                    <span className="text-[9px] font-mono mt-0.5">3.1K</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-black/40 border border-white/20 flex items-center justify-center">
                      <Share2 className="w-4 h-4 text-white/90" />
                    </div>
                    <span className="text-[9px] font-mono mt-0.5">Share</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-black/40 border border-white/20 flex items-center justify-center">
                      <Disc3 className="w-4 h-4 text-white/90" />
                    </div>
                    <span className="text-[9px] font-mono mt-0.5">Remix</span>
                  </div>
                </div>
              )}

              {/* Bottom Danger Guideline */}
              <div className="w-3/4 space-y-1.5 pb-2 border-t border-dashed border-red-500/50 bg-red-950/40 p-2 rounded backdrop-blur-xs">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-white/90">
                  <span>@epic_creator</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[9px] font-semibold ${
                      safePlatform === 'shorts'
                        ? 'bg-red-600 text-white'
                        : 'bg-amber-400 text-black'
                    }`}
                  >
                    {safePlatform === 'shorts' ? 'Subscribe' : 'Follow'}
                  </span>
                </div>
                <p className="text-[10px] text-white/70 line-clamp-1">
                  Social native title & hashtags live in this lower area...
                </p>
                <div className="flex items-center gap-1 text-[9px] text-white/50 font-mono">
                  <span>Original Audio · Viral Beat</span>
                </div>
              </div>
            </div>
          )}

          {/* Clean Preview Badge when comparing */}
          {(hideCaptions || localHideCaptions) && (
            <div className="absolute top-3 right-3 z-30 px-2 py-0.5 rounded bg-black/80 border border-amber-400/50 text-amber-300 text-[10px] font-mono tracking-wide flex items-center gap-1 shadow-lg pointer-events-none">
              <EyeOff className="w-3 h-3 text-amber-400" />
              <span>Clean Preview (Captions Hidden)</span>
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
            lowerThirds={lowerThirds}
            photoCache={photoCache}
            videoRef={videoRef}
            hostRef={containerRef}
            onStyleChange={onStyleChange}
            onSegmentOverrideChange={onSegmentOverrideChange}
            visible={!hideCaptions && !localHideCaptions}
          />

          {/* Floating pill when active caption has a custom 2D position override */}
          {hasCustomPos && activeSeg && (
            <div className="absolute top-3 left-3 z-30 flex items-center gap-2 px-3 py-1.5 bg-[#141413]/90 backdrop-blur-md rounded-xl border border-amber-400/40 text-[11px] text-bone shadow-2xl animate-in fade-in duration-150">
              <span className="flex items-center gap-1.5 text-amber-300 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>Custom Position</span>
                <span className="text-smoke text-[10px] font-mono">
                  ({Math.round((activeSeg.styleOverride?.positionX ?? style.layout.x) * 100)}%,{' '}
                  {Math.round((activeSeg.styleOverride?.positionY ?? style.layout.y) * 100)}%)
                </span>
              </span>
              <div className="h-3 w-px bg-white/20 mx-0.5" />
              <button
                type="button"
                onClick={() => {
                  if (onStyleChange) {
                    onStyleChange({
                      ...style,
                      layout: {
                        ...style.layout,
                        x: activeSeg.styleOverride?.positionX ?? style.layout.x,
                        y: activeSeg.styleOverride?.positionY ?? style.layout.y,
                      },
                    });
                  }
                  if (onSegmentOverrideChange) {
                    onSegmentOverrideChange(activeSeg.id, {
                      positionX: undefined,
                      positionY: undefined,
                    });
                  }
                }}
                className="px-2 py-0.5 rounded-md bg-amber-400/20 hover:bg-amber-400 text-amber-300 hover:text-black font-semibold text-[10px] transition-colors"
                title="Apply this exact position to all captions across the video"
              >
                Apply to All
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onSegmentOverrideChange) {
                    onSegmentOverrideChange(activeSeg.id, {
                      positionX: undefined,
                      positionY: undefined,
                    });
                  }
                }}
                className="px-1.5 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-smoke hover:text-bone text-[10px] transition-colors"
                title="Reset this caption back to default project position"
              >
                Reset
              </button>
            </div>
          )}
        </div>

        {/* Player Transport Bar (48px) */}
        <div className="flex items-center gap-2 mt-2 px-3 py-1.5 bg-[#1b1b19]/90 backdrop-blur-md rounded-2xl border border-white/10 shadow-lg text-bone text-xs">
          {/* Shuttle -1s (J) */}
          <button
            type="button"
            onClick={() => {
              if (videoRef.current) {
                const target = Math.max(0, currentTime - 1.0);
                videoRef.current.currentTime = target;
                setCurrentTime(target);
              }
            }}
            className="p-1 rounded text-smoke hover:text-amber-300 hover:bg-white/10 transition-colors"
            title="Rewind 1s (J)"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>

          {/* Frame Step Backward */}
          <button
            type="button"
            onClick={() => {
              if (videoRef.current) {
                const target = Math.max(0, currentTime - 1 / 30);
                videoRef.current.currentTime = target;
                setCurrentTime(target);
              }
            }}
            className="p-1 rounded text-smoke hover:text-amber-300 hover:bg-white/10 transition-colors"
            title="Step 1 frame backward (←)"
          >
            <span className="font-mono text-[10px] font-bold">◄</span>
          </button>

          {/* Play / Pause */}
          <button
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pause playback' : 'Start playback'}
            className="p-2 rounded-full bg-amber-400 hover:bg-amber-300 text-black shadow-xs transition-colors"
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          >
            {isPlaying ? (
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5 translate-x-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* Frame Step Forward */}
          <button
            type="button"
            onClick={() => {
              if (videoRef.current) {
                const target = Math.min(duration, currentTime + 1 / 30);
                videoRef.current.currentTime = target;
                setCurrentTime(target);
              }
            }}
            className="p-1 rounded text-smoke hover:text-amber-300 hover:bg-white/10 transition-colors"
            title="Step 1 frame forward (→)"
          >
            <span className="font-mono text-[10px] font-bold">►</span>
          </button>

          {/* Shuttle +1s (L) */}
          <button
            type="button"
            onClick={() => {
              if (videoRef.current) {
                const target = Math.min(duration, currentTime + 1.0);
                videoRef.current.currentTime = target;
                setCurrentTime(target);
              }
            }}
            className="p-1 rounded text-smoke hover:text-amber-300 hover:bg-white/10 transition-colors"
            title="Forward 1s (L)"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-white/10 mx-1" />

          {/* Time display: 0:01.20 / 0:08.50 */}
          <div className="font-mono text-mist text-[11px] px-1">
            <span className="text-bone font-semibold">{formatTime(currentTime)}</span>
            <span className="text-smoke mx-1">/</span>
            <span>{formatTime(duration)}</span>
          </div>

          <div className="h-4 w-px bg-white/10 mx-1" />

          {/* Volume */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleMute}
              aria-label={isMuted || volume === 0 ? 'Unmute video audio' : 'Mute video audio'}
              title={isMuted || volume === 0 ? 'Unmute' : 'Mute'}
              className="p-1 hover:text-amber-300 transition-colors text-smoke"
            >
              {isMuted || volume === 0 ? (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                  />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                  />
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
              className="w-12 h-1 accent-amber-400 bg-white/20 rounded-lg cursor-pointer"
            />
          </div>

          {/* Speed badge */}
          <button
            onClick={cyclePlaybackRate}
            aria-label={`Playback speed: ${playbackRate}x`}
            className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 font-mono text-[10px] font-bold text-amber-200 transition-colors"
            title="Playback Speed"
          >
            {playbackRate}x
          </button>
        </div>
      </div>
    );
  },
);

VideoPreview.displayName = 'VideoPreview';
export default VideoPreview;
