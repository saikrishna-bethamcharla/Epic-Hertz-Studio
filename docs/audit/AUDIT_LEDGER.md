# Audit Ledger — Epic Hertz Studio

| ID | Category | Severity | Title | File:Line | Status | Commit SHA | Verified By |
|---|---|---|---|---|---|---|---|
| `SEC-01` | Security | High | Historical Prototype Commit Leaked Secret in Git History | `git:0ed56f4` | **Open** | `0ed56f4` | Git log regex audit & external `SECURITY_PRIVATE.md` |
| `SEC-02` | Security | Medium | Missing Clickjacking (X-Frame-Options) and HSTS HTTP Headers | `vercel.json:1` | Fixed | `396fbd1` | `vercel.json` verification & manual review |
| `SEC-03` | Security | Medium | Prototype Pollution and Unbounded File Size Vulnerability in Preset Import | `src/subtitle-tool/v2/userPresets.ts:45` | Fixed | `77e3385` | `tests/userPresets.test.ts` & vitest |
| `BUG-01` | Bug | High | Caption List Textarea StopPropagation Prevents Caption Card Selection | `src/subtitle-tool/v2/LibraryPanel.tsx:648` | Fixed | `bb0bd6a` | `e2e/editor-scope-controls.spec.ts` & playwright |
| `A11Y-01` | Accessibility | Medium | Library Panel Tabs Missing WAI-ARIA Tablist and Tab Semantics | `src/subtitle-tool/v2/LibraryPanel.tsx:560` | Fixed | `bb0bd6a` | `e2e/accessibility-and-keyboard.spec.ts` & playwright |
| `TYPES-01` | Code Quality | Low | Missing override Modifiers in TypeScript ErrorBoundary | `src/main.tsx:15` | Fixed | `a630bd5` | `tsc -b` typecheck |
| `CICD-01` | CI/CD | Medium | GitHub Actions Not Pinned to Full Commit SHA and Missing Permissions | `.github/workflows/ci.yml:18` | Fixed | `16b302f` | `ci.yml` inspection & local E2E test run |
| `TEST-01` | Testing | Medium | Vitest Runner Globbing Playwright E2E Specs Causing Execution Collision | `vite.config.ts:23` | Fixed | `7fe1b7d` | `npm run test` & vitest run |
| `PERF-01` | Performance | Low | Over-sized Bundle Chunk from Mediabunny Exceeding 500kB | `vite.config.ts:13` | Documented | `3ceea84` | `npm run build` output analysis |
| `P0-1` | Bug | High | Applying Template in Playback Gap Overrides All Captions | `src/subtitle-tool/v2/LibraryPanel.tsx:213` | Fixed | `0a60582` | `tests/editorStyleScope.test.ts` |
| `P0-2` | Bug | High | Silent and Sticky Editor Scope Switching | `src/subtitle-tool/SubtitleTool.tsx:89` | Fixed | `0a60582` | `e2e/editor-scope-controls.spec.ts` |
| `P0-3` | Bug | High | Dead Buttons and Sliders in Per-Caption Mode | `src/subtitle-tool/v2/inspector/InspectorTypographySection.tsx:130` | Fixed | `0a60582` | `tests/editorStyleScope.test.ts:24-55` |
| `P0-4` | Bug | High | Controls Ignoring Scope and Mutating Global Styles | `src/subtitle-tool/v2/inspector/InspectorEffectsSection.tsx:40` | Fixed | `0a60582` | `tests/editorStyleScope.test.ts` |
| `P1-5` | Bug | Medium | Global Styles Blocked by Existing Overrides Without Reset Path | `src/subtitle-tool/SubtitleTool.tsx:358` | Fixed | `0a60582` | `tests/editorStyleScope.test.ts:109-137` |
| `P1-6` | Bug | Medium | Splitting a Caption Loses StyleOverride and Speaker on Second Half | `src/subtitle-tool/SubtitleTool.tsx:480` | Fixed | `0a60582` | `tests/editorStyleScope.test.ts:57-107` |
| `P1-7` | Performance | Medium | 60Hz Re-renders During Playback Slowing Sliders | `src/subtitle-tool/v2/LibraryPanel.tsx:150` | Fixed | `0a60582` | `React.memo` inspection & rendering audit |
| `P1-8` | Bug | Medium | Fragile and Incomplete Undo/Redo State | `src/subtitle-tool/SubtitleTool.tsx:300` | Fixed | `0a60582` | `tests/editorStyleScope.test.ts` |
| `SEC-04` | Security | Medium | 10 Dev-Only npm audit Vulnerabilities in Tooling (`minimatch` ReDoS) | `package-lock.json:1` | Documented | `pending` | `npm audit --json` & GHSA-g3hv-75wg-m249 |
| `SEC-05` | Security | Low | Content-Security-Policy-Report-Only Without Unsafe Inline | `vercel.json:30` | Fixed | `pending` | Header verification & `dist/` bundle inspection |
| `COMPAT-01` | Bug | High | Mobile Viewport (393px) Inspector & Timeline Unreachable in Small Screen | `src/subtitle-tool/SubtitleTool.tsx:780` | Fixed | `pending` | `e2e/editor-scope-controls.spec.ts` & mobile-chrome (25/25 pass) |
| `COMPAT-02` | Compatibility | High | WebKit / Safari Lacks `canvas.captureStream` & WebAudio Device Crash | `src/subtitle-tool/utils/extractAudio.ts:145` | Fixed | `pending` | Prebuilt static demo video & WebKit test suite (25/25 pass) |
| `CI-02` | CI/CD | Medium | Multi-Browser Test Matrix & Automated Security Scanners Missing in CI | `.github/workflows/ci.yml:45` | Fixed | `pending` | `ci.yml` multi-browser matrix & `security-scans.yml` |
| `REV-01` | Bug / Audio | High | Audio Extraction 1200ms Timeout Causes Premature Silent Fallback | `src/subtitle-tool/utils/extractAudio.ts:190` | Fixed | `pending` | Increased timeout to 30s & added 250MB buffer limit |
| `REV-02` | Bug / UI | High | Mobile Viewport `<VideoPreview>` Omits `lowerThirds` and `photoCache` | `src/subtitle-tool/SubtitleTool.tsx:1238` | Fixed | `pending` | Prop forwarding verified in `e2e/lower-thirds.spec.ts` |
| `REV-03` | Bug / State | High | Word Scope Mutates Entire Segment `customStyle` in Inspector | `src/subtitle-tool/v2/InspectorPanel.tsx:134` | Fixed | `pending` | Scoped mutation targeting selected words array |
| `REV-04` | Perf / API | Medium | Phantom `gemini-3.x` Models Causing Sequential HTTP 404 Round-trip Latency | `api/transcribe.js:46` | Fixed | `pending` | Pruned `DEFAULT_MODELS` to production Gemini models |
| `REV-05` | Bug / CORS | Medium | Missing IPv4 Loopback `127.0.0.1:5173` in Transcribe `ALLOWED_ORIGINS` | `api/transcribe.js:37` | Fixed | `pending` | Localhost IPv4 loopback allowed & tested |
| `REV-06` | Security / CI | High | CI Security Scans Failure Suppression (`continue-on-error`) & Mutable Tags | `.github/workflows/security-scans.yml:25` | Fixed | `pending` | Pinned commit SHAs & removed `continue-on-error` |
| `REV-07` | Resource Leak | Low | MediaStream Tracks and AudioContext Not Closed in Synthetic Video | `src/subtitle-tool/utils/createDemoVideo.ts:93` | Fixed | `pending` | Stopped stream tracks in `recorder.onstop` |
| `REV-08` | Bug / Parser | Low | Timestamp Parser NaN Poisoning and Two-Part Minute/Hour Offset | `src/subtitle-tool/utils/srt.ts:76` | Fixed | `pending` | Parts length check & `isFinite` validation |
