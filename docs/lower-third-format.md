# Lower Thirds Specification & Architecture Audit (Version 1.0)
*Epic Hertz Studio — Data-Driven Lower Third Overlay Engine*

This document audits the baseline Lower Thirds implementation in Epic Hertz Studio (`engine/lowerThirds.ts`, `LowerThirdSpec` in `engine/spec.ts`, `v2/inspector/LowerThirdInspector.tsx`, `Timeline.tsx`, and export pipelines) and establishes the foundation for migrating from a hardcoded 8-variant `switch` to a data-driven 48-template library across 6 packs.

---

## 1. Overview & System Architecture

Lower Thirds in Epic Hertz Studio provide broadcast-grade, resolution-independent animated overlays for speakers, hosts, locations, and dialogue context:

```
┌────────────────────────────────────────────────────────────────────────┐
│                          VIDEO TIMELINE                                │
│  Playhead t ──► LowerThirdSpec[] (start <= t <= end)                   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
               ┌────────────────────┴────────────────────┐
               ▼                                         ▼
   ┌───────────────────────┐                 ┌───────────────────────┐
   │    CaptionCanvas      │                 │  exportVideo / Burn   │
   │  (Live Preview Loop)  │                 │  (Canvas WebCodecs)   │
   └───────────┬───────────┘                 └───────────┬───────────┘
               │                                         │
               └────────────────────┬────────────────────┘
                                    ▼
                     ┌─────────────────────────────┐
                     │   engine/lowerThirds.ts     │
                     │  getLowerThirdPhase(spec, t)│
                     │     draw(ctx, spec, t)      │
                     └──────────────┬──────────────┘
                                    │
               ┌────────────────────┴────────────────────┐
               ▼                                         ▼
   ┌───────────────────────┐                 ┌───────────────────────┐
   │ 8 Classic Variants    │                 │ Multilingual Fit &    │
   │ (Canvas 2D Path)      │                 │ Photo Avatar Blit     │
   └───────────────────────┘                 └───────────────────────┘
```

### Key Architectural Tenets
1. **Resolution-Independent Coordinate Model:** Positions ($x, y$) are fractions of frame dimensions ($0..1$). Sizes and paddings scale off the base dimension $\min(W, H)$ and a user-selected `scale` multiplier ($0.5..2.0$).
2. **Unified Preview and Export Path:** The exact same `draw(ctx, spec, t, w, h, photoImage)` method executes in `CaptionCanvas` during playback/scrubbing and in `exportVideo` / `burnCaptionsCanvas` during offline MP4 encoding.
3. **Deterministic Animation Phases:** Intro, Hold, and Outro transitions are parameterized purely by normalized time progression without frame-rate dependency or cumulative drift.
4. **Indic & Complex Script Integrity:** Text measurement uses canvas metrics with automatic fallback cascades (`Noto Sans Telugu`, `Noto Sans Devanagari`, `Noto Sans Tamil`, etc.) and iterative `fitFontSize()` to prevent clipping or overflow.

---

## 2. Field Audit of Existing `LowerThirdSpec`

The existing interface is defined in `src/subtitle-tool/engine/spec.ts` (lines 301–358):

```ts
export type LowerThirdVariant = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface LowerThirdColors {
  primary: string;        // Accent / main shape / highlight / line color
  secondary?: string;     // Secondary container / plate / backdrop color
  textPrimary: string;    // Name text color
  textSecondary: string;  // Role / handle text color
}

export interface LowerThirdPosition {
  x: number;              // 0..1 frame width (e.g. 0.08 = 8% from left)
  y: number;              // 0..1 frame height (e.g. 0.82 = 82% down / lower third)
  align: 'left' | 'center' | 'right';
}

export interface LowerThirdSpec {
  id: string;             // Unique identifier (e.g. "lt-1731168000")
  start: number;          // In-point in seconds
  end: number;            // Out-point in seconds
  variant: LowerThirdVariant;
  name: string;           // Primary display line (e.g. "RAVI TEJA")
  role: string;           // Secondary display line (e.g. "CREATIVE DIRECTOR")
  handle?: string;        // Optional handle or metadata (e.g. "@raviteja")
  photoBlobId?: string;   // Reference to stored IndexedDB photo asset
  photoUrl?: string;      // Ephemeral object URL for preview
  position: LowerThirdPosition;
  colors: LowerThirdColors;
  font: {
    family: string;       // Font ID from FONT_FAMILIES (e.g. "unbounded")
    size: number;         // Fractional font size relative to min(W, H) (e.g. 0.035)
    weight: number;       // Numeric CSS weight (400, 600, 700, 800)
  };
  scale: number;          // Overall scale multiplier (0.5 .. 2.0)
  introDuration?: number; // Intro animation length in seconds (default ~0.7s)
  outroDuration?: number; // Outro animation length in seconds (default ~0.6s)
}
```

### Default State (`DEFAULT_LOWER_THIRD`)
```ts
export const DEFAULT_LOWER_THIRD: Omit<LowerThirdSpec, 'id' | 'start' | 'end'> = {
  variant: 1,
  name: 'RAVI TEJA',
  role: 'CREATIVE DIRECTOR',
  handle: '@raviteja',
  position: { x: 0.08, y: 0.82, align: 'left' },
  colors: {
    primary: '#f59e0b',
    secondary: '#18181b',
    textPrimary: '#ffffff',
    textSecondary: '#e4e4e7',
  },
  font: {
    family: 'unbounded',
    size: 0.035,
    weight: 800,
  },
  scale: 1.0,
  introDuration: 0.7,
  outroDuration: 0.6,
};
```

---

## 3. Timing & Animation State Machine

The timing calculation in `getLowerThirdPhase(spec, t)` partitions lower third playback into four discrete, mutually exclusive phases:

1. **`inactive` ($t < \text{start} \lor t > \text{end}$):**
   - Returns `active: false`, `opacity: 0`, and zero progress. Main renderer skips drawing entirely.
2. **`intro` ($0 \le \text{elapsed} < \text{introDur}$):**
   - Normalized progress $p = \text{clamp01}(\text{elapsed} / \text{introDur})$.
   - Shape wipe progress: $\text{shapeProgress} = \text{easeOutExpo}(p)$.
   - Text reveal progress (delayed stagger): $\text{textProgress} = \text{easeOutCubic}(\text{clamp01}((p - 0.2) / 0.8))$.
   - Fast fade-in: $\text{opacity} = \text{clamp01}(p / 0.25)$.
3. **`hold` ($\text{introDur} \le \text{elapsed} \le \text{duration} - \text{outroDur}$):**
   - Returns `active: true`, `phase: 'hold'`, `progress: 1.0`, `shapeProgress: 1.0`, `textProgress: 1.0`, and `opacity: 1.0`.
4. **`outro` ($\text{elapsed} > \text{duration} - \text{outroDur}$):**
   - Normalized outro progress $p = \text{clamp01}(\text{outroElapsed} / \text{outroDur})$.
   - Text exits first: $\text{textProgress} = 1 - \text{easeOutCubic}(\text{clamp01}(p / 0.7))$.
   - Shape wipes away: $\text{shapeProgress} = 1 - \text{easeOutExpo}(\text{clamp01}((p - 0.2) / 0.8))$.
   - Fade-out: $\text{opacity} = 1 - \text{clamp01}((p - 0.6) / 0.4)$.

### Boundary Protection for Short Clips
If $\text{introDur} + \text{outroDur} > \text{duration}$, the engine clamps both durations to $45\%$ of total span:
$$\text{introDur} = 0.45 \times \text{duration}, \quad \text{outroDur} = 0.45 \times \text{duration}$$
This prevents phase overlap or negative hold intervals.

---

## 4. Current 8 Design Variants

| Variant ID | Name | Visual Treatment | Intro Motion | Outro Motion |
|---|---|---|---|---|
| **1** | Box Highlight | Bold primary accent box for Name; secondary dark plate attached below for Role/Handle. | Horizontal shape wipe ($p_1$), secondary tag wipes ($p_2$), text unmasks with $-20\text{px}$ slide. | Text slides out, background shapes wipe back. |
| **2** | Clean Underline | Bold name on top with dynamic accent line expanding left-to-right; role reveals beneath. | Name rises $+12\text{px}$ from line, accent line draws left-to-right, role slides down $+6\text{px}$. | Reverse of intro; line collapses. |
| **3** | Photo Creator | Circular avatar with primary accent border; dark rounded container expands rightward. | Avatar scale bounce ($p$), pill expands rightward, text unmasks with clip rectangle. | Text retracts, pill collapses into avatar, avatar fades. |
| **4** | Vertical Divider | Sleek vertical accent bar wipes top-to-bottom; Name and Role slide out from behind divider. | Vertical line wipes down, text slides $+14\text{px}$ right from behind divider with clip guard. | Reverse; text retracts behind divider, line collapses. |
| **5** | Slanted Ribbon | Skewed parallelograms ($-14^\circ$) with high-energy kinetic slide-in. | Parallelograms slide in from $-120\text{px}$ with affine shear transform; text renders crisp. | Ribbons slide off horizontally. |
| **6** | Framed Tech | Semi-transparent dark card with distinct accent corner L-brackets (top-left & bottom-right). | Backdrop expands horizontally, L-brackets draw into place, text fades up inside frame. | Frame shrinks, brackets retract, text fades. |
| **7** | Dual-Tone Pill | Rounded capsule containing an accent circular monogram badge at left and name/role typography. | Capsule expands horizontally, circular monogram badge appears, name/role unmask with divider dot. | Capsule collapses horizontally toward badge. |
| **8** | Cinematic Glass | Translucent frosted glass plate with fine border and top accent line sweep. | Glass card expands, top accent bar sweeps horizontally across top edge, text slides in $+18\text{px}$. | Text exits, glass plate and top bar collapse. |

---

## 5. Subsystem Integrations

### 5.1 Preview Pipeline (`CaptionCanvas.tsx` & `VideoPreview.tsx`)
- In `CaptionCanvas.tsx`, `renderLowerThirds` is called immediately after captions:
  ```ts
  renderLowerThirds(
    ctx,
    rect.width,
    rect.height,
    currentTime,
    live.current.lowerThirds,
    live.current.photoCache,
  );
  ```
- Before rendering, `ensureLowerThirdFonts(lowerThirds)` preloads required font faces into `document.fonts`.

### 5.2 Export Pipeline (`exportVideo.ts` & `burnCaptionsCanvas.ts`)
- Offline video burn-in iterates through video frames at export resolution (e.g. 1080x1920).
- At each frame timestamp $t$, `renderLowerThirds(ctx, width, height, t, lowerThirds, photoCache)` is called.
- Uses identical font loading and canvas drawing code, guaranteeing 1:1 pixel parity between preview and MP4 render.

### 5.3 Timeline Track (`Timeline.tsx`)
- Displayed as a dedicated secondary track below the caption track.
- Interactivity:
  - Drag block to reposition (`lt-move`).
  - Drag left/right edge to adjust in/out points (`lt-trim-start`, `lt-trim-end`).
  - Snaps to playhead and adjacent caption boundaries when magnetic snapping is enabled.
  - Active selection highlighted with amber border and ring.

### 5.4 Inspector (`LowerThirdInspector.tsx`)
- Displays:
  - 8 variant selection cards with visual previews.
  - Inputs for Name, Role, and Handle.
  - Photo uploader with crop and delete actions.
  - Typography controls: font family, font weight, scale.
  - Color pickers: Primary accent, Secondary container, Text 1, Text 2.
  - Position coordinates: Alignment (left/center/right), X%, Y%.
  - Animation durations: Intro (seconds), Outro (seconds).
  - Save as reusable preset button.

### 5.5 Persistence & Storage (`projectStorage.ts` & `userPresets.ts`)
- **Project Records:** Saved in IndexedDB `projects` table at `schemaVersion: 3`. Lower thirds stored in `project.lowerThirds: LowerThirdSpec[]`.
- **Photo Assets:** Stored as binary blobs in IndexedDB `lower_third_photos` store keyed by `photoBlobId`.
- **User Presets:** Stored in `localStorage` under `ehs.lower_third_presets.v2` as `LowerThirdPreset[]`.

---

## 6. Migration Plan to Phase B (Data-Driven Templates)

In Phase B, the monolithic `switch (spec.variant)` will be replaced by a composable, Zod-validated template schema:

1. **`LowerThirdTemplate` Schema:**
   - Metadata: `id`, `packId`, `name`, `version`, `tags`, `author`, `license`.
   - Canvas: reference dimensions and safe-zone rules (expressed as fractions $0..1$).
   - Elements list: ordered primitives (`shape`, `line`, `text`, `image`, `icon`, `mask`) with relative geometry, visual styling, and entry/hold/exit animation blocks.
   - Customization slots: typed parameters (colors, typography, dimensions, positions, timing).
   - Auto-fit rules: multi-stage fallback (shrink font $\to$ wrap $\to$ truncate).
2. **Classic Pack Backfill:**
   - The 8 current variants will be translated into 8 declarative templates under the `classic` pack (`classic-box-highlight`, `classic-underline`, etc.).
   - Golden tests created in Phase A must pass identically against the Phase B template engine.
3. **Database Migration:**
   - Existing saved `LowerThirdSpec` records with numeric `variant: 1..8` will map seamlessly to `templateId: 'classic-box-highlight'`, ensuring zero user data loss.
