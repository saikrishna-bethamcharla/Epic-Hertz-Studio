# Caption Template Specification (Version 1.0)
*Epic Hertz Studio — Animated Caption Template Architecture*

This document defines the schema, runtime model, and rendering pipeline for the data-driven Caption Template Library in Epic Hertz Studio.

---

## 1. Overview & Architecture

Epic Hertz Studio replaces one-off hardcoded presets with a data-driven, composable template system:
1. **Templates as JSON specs:** Each template defines typography, palette, container treatment, layout, and pure animation primitives.
2. **Animation Building Blocks:** Animations are partitioned into pure transform functions (`entrance`, `emphasis`, `exit`) parameterized by progress $p \in [0, 1]$.
3. **Dual Compatibility:** Every `CaptionTemplate` maps deterministically to a runtime `CaptionStyle`, guaranteeing 100% backward compatibility with existing saved user projects and presets.
4. **Parity:** The same layout and animation calculations run in `CaptionCanvas` (live preview), `StyleThumbnail` (library browser), and `exportVideo` / `burnCaptionsCanvas` (MP4 WebCodecs / Canvas exports).
5. **Indic Script Integrity:** Grapheme clusters are preserved with `Intl.Segmenter` across Telugu, Hindi, Tamil, and Malayalam. Conjuncts and vowel signs are never separated.

---

## 2. Field Audit of Existing `CaptionStyle`

| Group | Field | Type | Usage in `render.ts` |
|---|---|---|---|
| Identity | `id`, `name` | `string` | Preset caching and UI labeling |
| Timing | `syncOffset` | `number` (seconds) | Global lead offset applied before time lookup ($t = \text{time} - \text{syncOffset}$) |
| Font | `family` | `string` | Canvas font family ID, mapped via `fontById()` |
| Font | `weight` | `number` | Numeric font weight (400, 600, 700, 800, 900) |
| Font | `italic`, `underline` | `boolean` | Canvas italic variant and rendered bottom underline |
| Font | `size` | `number` | Fractional font size relative to $\min(W, H)$ |
| Font | `tracking` | `number` | Letter spacing in `em` units (skipped on complex Indic scripts) |
| Font | `lineHeight` | `number` | Line box height multiplier |
| Font | `textCase` | `'none' \| 'upper' \| 'lower' \| 'title'` | Case transformation before word measurement |
| Layout | `wordsPerPage` | `number` | Word chunking per page (0 = all words in segment) |
| Layout | `maxLines` | `number` | Max lines before text auto-scales down |
| Layout | `widthPct` | `number` | Max block width as fraction of frame width |
| Layout | `align` | `'left' \| 'center' \| 'right'` | Horizontal line alignment within block |
| Layout | `x`, `y` | `number` | Block center coordinate ($0..1$ of frame) |
| Fill | `fill` | `string \| GradientPaint` | Word text fill (solid hex/rgba or multi-stop linear gradient) |
| Stroke | `width`, `color` | `number`, `string` | Centered text outline stroke in `px * width` |
| Shadow | `x`, `y`, `blur`, `color` | `number`, `string` | Canvas `shadowColor`, `shadowBlur`, `shadowOffset` |
| Glow | `color`, `blur`, `strength` | `string`, `number`, `number` | Stacked blurred shadow passes |
| Extrude | `depth`, `color`, `angle` | `number`, `string`, `number` | Stacked 3D block displacement passes |
| Plate | `mode`, `color`, `padX`, `padY`, `radius` | `'none' \| 'block' \| 'line'`, ... | Background rounded plate behind words or lines |
| Highlight | `mode` | `'none' \| 'color' \| 'box' \| 'underline' \| 'sweep'` | Word-level active emphasis style |
| Highlight | `color`, `textColor` | `string` | Accent color for active word or text-on-box |
| Highlight | `scale` | `number` | Word scale multiplier on active syllable |
| Highlight | `keep` | `boolean` | Sticky highlight accumulation (karaoke style) |
| Highlight | `boxPadX`, `boxPadY`, `boxRadius` | `number` | Sliding highlight box geometry |
| Reveal | `mode`, `dimUnspoken` | `'page' \| 'spoken'`, `number` | Page entrance or word-by-word opacity |
| Motion | `in`, `out` | `InAnim`, `OutAnim` | Entrance and exit transition primitives |
| Motion | `inMs`, `outMs` | `number` | Transition durations in milliseconds |
| Motion | `stagger`, `unit` | `number`, `'word' \| 'char' \| 'line'` | Progressive unit delay |
| Motion | `ease`, `bounce`, `wobble` | `EaseName`, `number`, `number` | Motion curve, spring overshoot, and random tilt |

---

## 3. Template Schema (JSON Specification)

```json
{
  "$schema": "https://epichertz.studio/schemas/caption-template-v1.json",
  "id": "karaoke-highlight",
  "name": "Karaoke Highlight",
  "version": 1,
  "category": "Social",
  "tags": ["viral", "reels", "karaoke", "active-word"],
  "author": "Epic Hertz Studio",
  "license": "OFL-1.1 / MIT",

  "font": {
    "family": "montserrat",
    "weight": 800,
    "size": 0.082,
    "case": "none",
    "letterSpacing": 0,
    "lineHeight": 1.15,
    "fallbacks": {
      "telugu": "Noto Sans Telugu",
      "devanagari": "Noto Sans Devanagari",
      "tamil": "Noto Sans Tamil"
    }
  },

  "colors": {
    "text": "#FFFFFF",
    "activeWord": "#FFE14D",
    "outline": "#0B0B0B",
    "outlineWidth": 0.08,
    "glow": { "color": "#FFE14D", "blur": 0, "strength": 0 },
    "shadow": { "x": 0, "y": 0.04, "blur": 0.08, "color": "rgba(0,0,0,0.6)" },
    "extrude": { "depth": 0, "color": "#000000", "angle": 90 },
    "gradient": null
  },

  "container": {
    "mode": "none",
    "color": "rgba(0,0,0,0.6)",
    "padX": 0.35,
    "padY": 0.12,
    "radius": 0.3
  },

  "layout": {
    "align": "center",
    "wordsPerPage": 3,
    "maxLines": 2,
    "widthPct": 0.88,
    "x": 0.5,
    "y": 0.74,
    "lineBreakRule": "auto"
  },

  "entrance": {
    "type": "slide-up",
    "duration": 0.28,
    "easing": "easeOutCubic",
    "params": { "distance": 0.45 }
  },

  "emphasis": {
    "type": "color-flip",
    "duration": 0.12,
    "easing": "easeOutQuad",
    "params": { "scale": 1.12, "keep": true }
  },

  "exit": {
    "type": "fade",
    "duration": 0.15,
    "easing": "easeOutCubic",
    "params": {}
  },

  "stagger": {
    "unit": "word",
    "delay": 0.045
  },

  "emphasisTrigger": "activeWord"
}
```

---

## 4. Animation Building Blocks & Primitives

Every animation in `engine/animation/` is a pure function:
$$\text{transform}(p, \text{params}) \to \{ \alpha, \Delta x, \Delta y, \text{scale}, \text{rotation}, \text{blur}, \text{clip}, \text{colorMix} \}$$

### 4.1 Easing Curves
- `linear`
- `easeOutQuad`: $1 - (1 - x)^2$
- `easeOutCubic`: $1 - (1 - x)^3$
- `easeInOutCubic`: $x < 0.5 \ ? \ 4x^3 : 1 - \frac{(-2x + 2)^3}{2}$
- `easeOutExpo`: $x = 1 \ ? \ 1 : 1 - 2^{-10x}$
- `easeOutBack`: $1 + (s + 1)(x - 1)^3 + s(x - 1)^2$
- `easeOutElastic`: damped sinusoidal oscillation
- `easeOutBounce`: decaying bounce physics
- `spring`: analytical second-order underdamped response ($m \ddot{x} + c \dot{x} + kx = 0$)

### 4.2 Entrances (12)
1. `fade`: Opacity sweep $0 \to 1$
2. `slide-up`: Upward translate with cubic deceleration
3. `slide-left`: Horizontal slide from right
4. `slide-right`: Horizontal slide from left
5. `scale-pop`: Underdamped overshoot scale $0.4 \to 1.0$
6. `rotate-in`: Angular entry $-12^\circ \to 0^\circ$ with scale
7. `blur-in`: Lens focus rack with fallback to opacity layering
8. `typewriter`: Discrete character step entry
9. `bounce-in`: Letter-by-letter vertical bounce
10. `wave`: Phase-shifted harmonic vertical displacement
11. `flip-in`: Vertical 3D perspective fold
12. `drop-in`: Gravitational drop from top with soft ground settle
13. `clip-reveal`: Bounding box wipe reveal

### 4.3 Active Word Emphasis (8)
1. `pop`: Scale pulse with elastic settle
2. `shake`: Fast horizontal micro-jitter for alert syllables
3. `glow-pulse`: Radial luminous accent flash
4. `underline-draw`: Animated bottom accent underline stroke
5. `highlight-box-sweep`: Sliding rounded background container
6. `color-flip`: High-contrast chromatic flip to palette accent
7. `scale-slam`: Explosive scale hit with rapid decay
8. `wobble`: Playful angular oscillation

### 4.4 Exits (8)
1. `fade`: Soft alpha decay
2. `slide-down`: Downward slide into floor
3. `scale-out`: Shrink to center
4. `blur-out`: Defocus blur with fade
5. `clip-hide`: Reverse curtain wipe
6. `typewriter-erase`: Reverse backspace wipe
7. `drop-out`: Gravitational fall past viewport
8. `glitch-out`: Chromatic RGB aberration split

---

## 5. Indic Script Handling Rules
1. **No Code-Unit Splitting:** Never use string indexing or naive regex splitting for Telugu (`[\u0C00-\u0C7F]`), Hindi (`[\u0900-\u097F]`), or Tamil (`[\u0B80-\u0BFF]`).
2. **Grapheme Clusters:** Split text using `Intl.Segmenter(lang, { granularity: 'grapheme' })`.
3. **Compound Shaping:** For per-letter effects on Indic text, whole grapheme clusters (base consonant + virama + conjunct + vowel matra) are treated as indivisible atoms.
4. **Fallback:** If a style specifies char-level animation on complex scripts, the engine safely promotes the motion unit to `word` to avoid glyph distortion.

---

## 6. Migration & Parity Proof
- Legacy presets (`Pulse`, `Block`, `Slam`, `Neon`, etc.) compile to valid v1 templates.
- Zod schema validates all imported/saved templates, rejecting unauthorized or unvalidated properties.
- Tests prove identical frame-for-frame pixel rendering between `CaptionStyle` and migrated `CaptionTemplate`.
