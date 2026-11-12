// ─── Rate Limit Status Bar ────────────────────────────────────────────────────
// Displays real-time rate limit information when using the shared Gemini API key.
// Shows remaining requests per minute/day and provides CTA to add own key.
// Falls back gracefully when no rate limit data is available.

import { useEffect, useState } from 'react';

export interface RateLimitStatus {
  /** Remaining requests in current minute window */
  remainingThisMinute: number;
  /** Remaining requests in current day window */
  remainingThisDay: number;
  /** Whether the shared key limit is active (true) or user key is being used (false) */
  usingSharedKey: boolean;
  /** Error message if rate limit was hit (empty string if ok) */
  errorMessage: string;
  /** Whether to show the "add your key" CTA */
  showCTA: boolean;
}

/**
 * Fetches rate limit status from the transcription API.
 * The API endpoints `/rate-limit` should return:
 * { remainingThisMinute: number, remainingThisDay: number, usingSharedKey: boolean }
 */
async function fetchRateLimitStatus(): Promise<RateLimitStatus> {
  try {
    const res = await fetch('/api/rate-limit', {
      method: 'GET',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      // If the endpoint doesn't exist yet, return graceful defaults
      return {
        remainingThisMinute: 999,
        remainingThisDay: 999,
        usingSharedKey: true,
        errorMessage: '',
        showCTA: true,
      };
    }

    const data = await res.json();
    return {
      remainingThisMinute: data.remainingThisMinute ?? 999,
      remainingThisDay: data.remainingThisDay ?? 999,
      usingSharedKey: data.usingSharedKey ?? true,
      errorMessage: data.errorMessage || '',
      showCTA: !(data.remainingThisMinute > 0 && data.remainingThisDay > 0),
    };
  } catch (err) {
    console.warn('[RateLimitStatus] failed to fetch:', err);
    return {
      remainingThisMinute: 999,
      remainingThisDay: 999,
      usingSharedKey: true,
      errorMessage: '',
      showCTA: true,
    };
  }
}

/** Renders the rate limit status bar */
export default function RateLimitStatusBar() {
  const [status, setStatus] = useState<RateLimitStatus>({
    remainingThisMinute: 999,
    remainingThisDay: 999,
    usingSharedKey: true,
    errorMessage: '',
    showCTA: true,
  });
  const [isVisible, setIsVisible] = useState(false);

  // Fetch rate limit status periodically when using shared key
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    async function loadStatus() {
      const newStatus = await fetchRateLimitStatus();
      setStatus(newStatus);
      setIsVisible(
        newStatus.usingSharedKey &&
          (newStatus.remainingThisMinute < 60 || newStatus.remainingThisDay < 60),
      );
      timeoutId = setTimeout(loadStatus, 30000); // refresh every 30s
    }

    loadStatus();

    return () => clearTimeout(timeoutId);
  }, []);

  if (!isVisible) return null;

  const minutePct = Math.max(0, Math.min(100, 100 - (status.remainingThisMinute / 8) * 100));
  const dayPct = Math.max(0, Math.min(100, 100 - (status.remainingThisDay / 60) * 100));

  return (
    <div
      className="fixed top-4 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-2 rounded-full bg-white/[0.06] border border-white/10 backdrop-blur-zxs z-50"
      style={{ transition: 'opacity 0.3s' }}
    >
      <span className="text-xs text-zinc-300 font-mono">
        {status.remainingThisMinute} requests this minute · {status.remainingThisDay} this day
      </span>

      {/* Visual progress bars */}
      <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full transition-colors duration-500"
          style={{
            width: `${minutePct}%`,
            backgroundColor: minutePct < 20 ? 'rgba(239, 68, 68, 0.4)' : 'rgba(34, 197, 94, 0.4)',
          }}
        ></div>
      </div>

      <div className="h-1 rounded-full bg-white/10 overflow-hidden mx-2">
        <div
          className="h-full rounded-full transition-colors duration-500"
          style={{
            width: `${dayPct}%`,
            backgroundColor: dayPct < 20 ? 'rgba(239, 68, 68, 0.4)' : 'rgba(34, 197, 94, 0.4)',
          }}
        ></div>
      </div>

      {/* CTA or error message */}
      {status.errorMessage ? (
        <span className="text-xs text-crimson-2 hover:text-crimson-300 transition-colors">
          {status.errorMessage}
        </span>
      ) : (
        status.showCTA && (
          <button
            type="button"
            onClick={() => window.open('/settings', '_blank')}
            className="text-xs font-medium text-amber-300 hover:text-amber-200 transition-colors"
            title="Add your free Gemini API key in Settings"
          >
            Add your key
          </button>
        )
      )}
    </div>
  );
}
