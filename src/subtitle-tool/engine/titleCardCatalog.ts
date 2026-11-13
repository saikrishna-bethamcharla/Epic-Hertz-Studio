// ─── Title Card Styles Catalog — Epic Hertz Studio ──────────────────────────
// 14 Cinematic full-frame Title & End Cards designed as Text Caption Styles.
// Formats video text and subtitles with movie-grade typography, animations, and graphic effects:
// - Mixkit 222: Spin & Twist (geometric brackets & rotating line)
// - Mixkit 28: Mirror Splash (liquid splash bursts & bubble bounce)
// - Cinema Serif, Epic Display, Gold Chapter, Film Noir, Cyberpunk HUD, etc.
import type { CaptionStyle } from './spec';
import { makeStyle } from './presets';
import { getTemplateById } from './templateCatalog';
import { templateToStyle } from './templateSchema';

export interface TitleCardDefinition {
  id: string;
  name: string;
  category: 'Opening Title' | 'Blockbuster' | 'MOGRT Style' | 'Chapter' | 'End Card';
  description: string;
  tags: string[];
  style: CaptionStyle;
}

export const TITLE_CARD_STYLES: TitleCardDefinition[] = [
  // 1. Mixkit 222: Spin & Twist Title Block
  {
    id: 'spin-and-twist',
    name: 'Spin & Twist',
    category: 'MOGRT Style',
    description: 'Mixkit 222: Rotating line spin into expanding framing brackets [ MOTION ]',
    tags: ['mixkit', 'brackets', 'spin', 'geometric', 'minimal'],
    style: (() => {
      const t = getTemplateById('spin-and-twist');
      if (t) return templateToStyle(t);
      return makeStyle({
        id: 'spin-and-twist',
        name: 'Spin & Twist',
        font: {
          family: 'inter',
          weight: 800,
          size: 0.082,
          tracking: 0.03,
          lineHeight: 1.18,
          textCase: 'upper',
        },
        fill: '#FFFFFF',
        highlight: { color: '#00D2C4', scale: 1.08 },
        stroke: { color: '#000000', width: 0.06 },
        shadow: { x: 0, y: 0.03, blur: 0.08, color: 'rgba(0,0,0,0.7)' },
        layout: { wordsPerPage: 4, maxLines: 2, widthPct: 0.88, x: 0.5, y: 0.5 },
        motion: { in: 'pop', inMs: 360, unit: 'word', ease: 'out', stagger: 40, bounce: 0.3 },
      });
    })(),
  },

  // 2. Mixkit 28: Mirror Splash Title
  {
    id: 'mirror-splash',
    name: 'Mirror Splash',
    category: 'MOGRT Style',
    description: 'Mixkit 28: Dual cyan liquid streams colliding into radial droplets & bubble pop',
    tags: ['mixkit', 'splash', 'burst', 'bubble', 'pop', 'comic'],
    style: (() => {
      const t = getTemplateById('mirror-splash');
      if (t) return templateToStyle(t);
      return makeStyle({
        id: 'mirror-splash',
        name: 'Mirror Splash',
        font: {
          family: 'bangers',
          weight: 400,
          size: 0.088,
          tracking: 0.02,
          lineHeight: 1.15,
          textCase: 'upper',
        },
        fill: '#A7F7FF',
        highlight: { color: '#FFFA6F', scale: 1.15 },
        stroke: { color: '#000000', width: 0.12 },
        shadow: { x: 0.02, y: 0.04, blur: 0.01, color: 'rgba(0,0,0,0.95)' },
        layout: { wordsPerPage: 4, maxLines: 2, widthPct: 0.88, x: 0.5, y: 0.5 },
        motion: { in: 'pop', inMs: 350, unit: 'word', ease: 'spring', stagger: 40, bounce: 0.55 },
      });
    })(),
  },

  // 3. Cinema Serif — classic Hollywood title
  {
    id: 'title-cinema-serif',
    name: 'Cinema Serif',
    category: 'Opening Title',
    description: 'Playfair Display serif with warm golden highlights and elegant cinematic fade',
    tags: ['cinema', 'serif', 'playfair', 'hollywood', 'classic'],
    style: makeStyle({
      id: 'title-cinema-serif',
      name: 'Cinema Serif',
      font: {
        family: 'playfair',
        weight: 700,
        size: 0.085,
        tracking: 0.05,
        lineHeight: 1.25,
        textCase: 'title',
      },
      fill: '#FAFAF9',
      highlight: { color: '#EAB308', scale: 1.05 },
      stroke: { color: '#000000', width: 0.03 },
      shadow: { x: 0, y: 0.05, blur: 0.18, color: 'rgba(0,0,0,0.85)' },
      layout: { wordsPerPage: 3, maxLines: 2, widthPct: 0.86, x: 0.5, y: 0.5 },
      motion: { in: 'fade', inMs: 450, unit: 'line', ease: 'out', stagger: 50 },
    }),
  },

  // 4. Epic Display — high-impact blockbuster title
  {
    id: 'title-epic-display',
    name: 'Epic Display',
    category: 'Blockbuster',
    description: 'Ultra-bold Unbounded / Bebas impact trailer title with cinematic warm shadow',
    tags: ['epic', 'display', 'blockbuster', 'action', 'trailer'],
    style: makeStyle({
      id: 'title-epic-display',
      name: 'Epic Display',
      font: {
        family: 'unbounded',
        weight: 800,
        size: 0.088,
        tracking: 0.04,
        lineHeight: 1.15,
        textCase: 'upper',
      },
      fill: '#FFFFFF',
      highlight: { color: '#F59E0B', scale: 1.1 },
      stroke: { color: '#000000', width: 0.08 },
      shadow: { x: 0, y: 0.06, blur: 0.22, color: 'rgba(0,0,0,0.9)' },
      layout: { wordsPerPage: 3, maxLines: 2, widthPct: 0.88, x: 0.5, y: 0.5 },
      motion: { in: 'pop', inMs: 320, unit: 'word', ease: 'spring', stagger: 45, bounce: 0.4 },
    }),
  },

  // 5. Gold Chapter — opulent chapter title with gold framing
  {
    id: 'title-gold-chapter',
    name: 'Gold Chapter',
    category: 'Chapter',
    description: 'Regal serif typography with gold chapter styling and subtle letterspaced rhythm',
    tags: ['gold', 'chapter', 'luxury', 'serif', 'film'],
    style: makeStyle({
      id: 'title-gold-chapter',
      name: 'Gold Chapter',
      font: {
        family: 'playfair',
        weight: 700,
        size: 0.078,
        tracking: 0.08,
        lineHeight: 1.28,
        textCase: 'upper',
      },
      fill: '#F5EFE2',
      highlight: { color: '#D4AF37', scale: 1.06 },
      stroke: { color: '#000000', width: 0.04 },
      shadow: { x: 0, y: 0.04, blur: 0.16, color: 'rgba(0,0,0,0.85)' },
      layout: { wordsPerPage: 4, maxLines: 2, widthPct: 0.88, x: 0.5, y: 0.5 },
      motion: { in: 'fade', inMs: 400, unit: 'line', ease: 'out', stagger: 40 },
    }),
  },

  // 6. Film Noir — dramatic black & white suspense
  {
    id: 'title-film-noir',
    name: 'Film Noir',
    category: 'Opening Title',
    description: 'High-contrast monochrome suspense title with stark shadows and dramatic presence',
    tags: ['noir', 'thriller', 'mystery', 'suspense', 'monochrome'],
    style: makeStyle({
      id: 'title-film-noir',
      name: 'Film Noir',
      font: {
        family: 'playfair',
        weight: 600,
        size: 0.08,
        tracking: 0.07,
        lineHeight: 1.25,
        textCase: 'upper',
      },
      fill: '#FFFFFF',
      highlight: { color: '#D4D4D8', scale: 1.04 },
      stroke: { color: '#000000', width: 0.06 },
      shadow: { x: 0.03, y: 0.06, blur: 0.25, color: '#000000' },
      layout: { wordsPerPage: 3, maxLines: 2, widthPct: 0.84, x: 0.5, y: 0.5 },
      motion: { in: 'fade', inMs: 420, unit: 'line', ease: 'out', stagger: 40 },
    }),
  },

  // 7. Cyberpunk HUD — sci-fi neon interface title
  {
    id: 'title-cyberpunk-hud',
    name: 'Cyberpunk HUD',
    category: 'Blockbuster',
    description: 'Neon cyan sci-fi head-up display title with futuristic geometric weight',
    tags: ['cyberpunk', 'scifi', 'hud', 'neon', 'futuristic'],
    style: makeStyle({
      id: 'title-cyberpunk-hud',
      name: 'Cyberpunk HUD',
      font: {
        family: 'inter',
        weight: 800,
        size: 0.082,
        tracking: 0.05,
        lineHeight: 1.2,
        textCase: 'upper',
      },
      fill: '#00F0FF',
      highlight: { color: '#FFE600', scale: 1.1 },
      stroke: { color: '#050510', width: 0.08 },
      shadow: { x: 0, y: 0.04, blur: 0.2, color: 'rgba(0,240,255,0.45)' },
      plate: { mode: 'block', color: 'rgba(10,12,20,0.85)', padX: 0.3, padY: 0.18, radius: 0.2 },
      layout: { wordsPerPage: 3, maxLines: 2, widthPct: 0.88, x: 0.5, y: 0.5 },
      motion: { in: 'pop', inMs: 300, unit: 'word', ease: 'out', stagger: 35 },
    }),
  },

  // 8. Chapter Marker — clean modern section break
  {
    id: 'title-chapter-marker',
    name: 'Chapter Marker',
    category: 'Chapter',
    description: 'Clean modern documentary chapter marker with frosted translucent framing pill',
    tags: ['chapter', 'clean', 'modern', 'pill', 'section'],
    style: makeStyle({
      id: 'title-chapter-marker',
      name: 'Chapter Marker',
      font: {
        family: 'montserrat',
        weight: 700,
        size: 0.075,
        tracking: 0.06,
        lineHeight: 1.25,
        textCase: 'upper',
      },
      fill: '#FFFFFF',
      highlight: { color: '#38BDF8', scale: 1.06 },
      plate: { mode: 'block', color: 'rgba(24,24,27,0.88)', padX: 0.35, padY: 0.2, radius: 0.3 },
      shadow: { x: 0, y: 0.04, blur: 0.15, color: 'rgba(0,0,0,0.7)' },
      layout: { wordsPerPage: 4, maxLines: 2, widthPct: 0.86, x: 0.5, y: 0.5 },
      motion: { in: 'fade', inMs: 340, unit: 'line', ease: 'out', stagger: 30 },
    }),
  },

  // 9. Documentary Bold — authoritative lower-center headline
  {
    id: 'title-documentary-bold',
    name: 'Documentary Bold',
    category: 'Blockbuster',
    description: 'Authoritative journalistic bold title with dark contrast plate',
    tags: ['documentary', 'bold', 'journalism', 'impact', 'news'],
    style: makeStyle({
      id: 'title-documentary-bold',
      name: 'Documentary Bold',
      font: {
        family: 'oswald',
        weight: 700,
        size: 0.082,
        tracking: 0.03,
        lineHeight: 1.18,
        textCase: 'upper',
      },
      fill: '#FFFFFF',
      highlight: { color: '#FACC15', scale: 1.08 },
      plate: { mode: 'line', color: 'rgba(15,15,18,0.92)', padX: 0.3, padY: 0.15, radius: 0.15 },
      shadow: { x: 0, y: 0.04, blur: 0.12, color: 'rgba(0,0,0,0.8)' },
      layout: { wordsPerPage: 4, maxLines: 2, widthPct: 0.88, x: 0.5, y: 0.5 },
      motion: { in: 'pop', inMs: 280, unit: 'word', ease: 'out', stagger: 35 },
    }),
  },

  // 10. Typewriter Case — vintage investigation case file
  {
    id: 'title-typewriter-case',
    name: 'Typewriter Case',
    category: 'Opening Title',
    description:
      'Vintage monospace typewriter title evoking investigation archives & true crime files',
    tags: ['typewriter', 'courier', 'crime', 'investigation', 'vintage'],
    style: makeStyle({
      id: 'title-typewriter-case',
      name: 'Typewriter Case',
      font: {
        family: 'courier',
        weight: 400,
        size: 0.076,
        tracking: 0.02,
        lineHeight: 1.25,
        textCase: 'title',
      },
      fill: '#86EFAC',
      highlight: { color: '#22C55E', scale: 1.05 },
      plate: { mode: 'block', color: 'rgba(5,15,10,0.9)', padX: 0.32, padY: 0.18, radius: 0.15 },
      shadow: { x: 0, y: 0.04, blur: 0.14, color: 'rgba(0,0,0,0.9)' },
      layout: { wordsPerPage: 4, maxLines: 2, widthPct: 0.88, x: 0.5, y: 0.5 },
      motion: { in: 'fade', inMs: 380, unit: 'char', ease: 'out', stagger: 30 },
    }),
  },

  // 11. Western Slab — rugged vintage slab serif
  {
    id: 'title-western-slab',
    name: 'Western Slab',
    category: 'Opening Title',
    description: 'Rugged vintage Americana slab serif with warm amber dust tone and bold presence',
    tags: ['western', 'slab', 'vintage', 'vintage-film', 'bold'],
    style: makeStyle({
      id: 'title-western-slab',
      name: 'Western Slab',
      font: {
        family: 'unbounded',
        weight: 900,
        size: 0.084,
        tracking: 0.03,
        lineHeight: 1.15,
        textCase: 'upper',
      },
      fill: '#FEF3C7',
      highlight: { color: '#D97706', scale: 1.1 },
      stroke: { color: '#451A03', width: 0.08 },
      shadow: { x: 0.02, y: 0.05, blur: 0.16, color: 'rgba(69,26,3,0.85)' },
      layout: { wordsPerPage: 3, maxLines: 2, widthPct: 0.88, x: 0.5, y: 0.5 },
      motion: { in: 'pop', inMs: 340, unit: 'word', ease: 'spring', stagger: 40, bounce: 0.35 },
    }),
  },

  // 12. Classic Credits — centered elegant ending credits
  {
    id: 'end-classic-credits',
    name: 'Classic Credits',
    category: 'End Card',
    description: 'Pristine centered cinematic credits card for closing titles & acknowledgments',
    tags: ['credits', 'end', 'cinema', 'closing', 'minimal'],
    style: makeStyle({
      id: 'end-classic-credits',
      name: 'Classic Credits',
      font: {
        family: 'montserrat',
        weight: 500,
        size: 0.068,
        tracking: 0.06,
        lineHeight: 1.35,
        textCase: 'title',
      },
      fill: '#F8FAFC',
      highlight: { color: '#94A3B8', scale: 1.02 },
      shadow: { x: 0, y: 0.04, blur: 0.15, color: 'rgba(0,0,0,0.8)' },
      layout: { wordsPerPage: 5, maxLines: 3, widthPct: 0.84, x: 0.5, y: 0.5 },
      motion: { in: 'fade', inMs: 500, unit: 'line', ease: 'out', stagger: 40 },
    }),
  },

  // 13. Fade Tribute — gentle memorial / dedications card
  {
    id: 'end-fade-tribute',
    name: 'Fade Tribute',
    category: 'End Card',
    description: 'Soft and respectful Playfair serif dedication card with whisper-quiet fade',
    tags: ['tribute', 'memorial', 'dedication', 'end', 'quiet'],
    style: makeStyle({
      id: 'end-fade-tribute',
      name: 'Fade Tribute',
      font: {
        family: 'playfair',
        weight: 500,
        size: 0.072,
        tracking: 0.04,
        lineHeight: 1.3,
        textCase: 'title',
      },
      fill: '#F1F5F9',
      highlight: { color: '#CBD5E1', scale: 1.02 },
      shadow: { x: 0, y: 0.03, blur: 0.12, color: 'rgba(0,0,0,0.7)' },
      layout: { wordsPerPage: 4, maxLines: 2, widthPct: 0.84, x: 0.5, y: 0.5 },
      motion: { in: 'fade', inMs: 550, unit: 'line', ease: 'out', stagger: 45 },
    }),
  },

  // 14. Minimal Signoff — clean modern signature outro
  {
    id: 'end-minimal-signoff',
    name: 'Minimal Signoff',
    category: 'End Card',
    description: 'Ultra-clean modern signature signoff card for social and branded video endings',
    tags: ['signoff', 'outro', 'modern', 'creator', 'end'],
    style: makeStyle({
      id: 'end-minimal-signoff',
      name: 'Minimal Signoff',
      font: {
        family: 'inter',
        weight: 600,
        size: 0.074,
        tracking: 0.08,
        lineHeight: 1.25,
        textCase: 'upper',
      },
      fill: '#FFFFFF',
      highlight: { color: '#A1A1AA', scale: 1.04 },
      shadow: { x: 0, y: 0.04, blur: 0.16, color: 'rgba(0,0,0,0.85)' },
      layout: { wordsPerPage: 3, maxLines: 2, widthPct: 0.86, x: 0.5, y: 0.5 },
      motion: { in: 'fade', inMs: 450, unit: 'line', ease: 'out', stagger: 35 },
    }),
  },
];
