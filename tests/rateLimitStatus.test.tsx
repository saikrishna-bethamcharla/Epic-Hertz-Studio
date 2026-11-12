// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import RateLimitStatusBar from '../src/subtitle-tool/RateLimitStatus';

describe('RateLimitStatusBar', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('mounts without triggering a render-phase update loop', async () => {
    // The endpoint is absent in this environment; the bar must simply stay hidden.
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));

    expect(() => render(<RateLimitStatusBar />)).not.toThrow();

    await waitFor(() => {
      expect(document.body.textContent).not.toContain('RELOAD STUDIO');
    });
  });
});
