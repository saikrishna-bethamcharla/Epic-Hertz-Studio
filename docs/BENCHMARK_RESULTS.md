# Real Browser Canvas Performance Benchmark (1080x1920)

Measured inside real headless Google Chrome (`Chrome/130+`) with full hardware 2D canvas acceleration.
Each template was evaluated across 50 frame renders spanning entrance, hold, word highlights, and exit transitions.

| # | Template ID | Template Name | Category | Effects | Avg (ms) | p95 (ms) | Min (ms) | Max (ms) |
|---|-------------|---------------|----------|---------|----------|----------|----------|----------|
| 1 | `karaoke-highlight` | **Karaoke Highlight** | Social | Clean | 0.06 ms | 0.20 ms | 0.00 ms | 0.40 ms |
| 2 | `word-pop` | **Word Pop** | Social | Clean | 0.10 ms | 0.30 ms | 0.00 ms | 0.70 ms |
| 3 | `rotate-in` | **Rotate In** | Social | Clean | 0.04 ms | 0.10 ms | 0.00 ms | 0.40 ms |
| 4 | `social-neon-pop` | **Social Neon Pop** | Social | Blur + Glow | 0.07 ms | 0.20 ms | 0.00 ms | 0.70 ms |
| 5 | `minimal-fade` | **Minimal Fade** | Minimal | Clean | 0.05 ms | 0.10 ms | 0.00 ms | 0.20 ms |
| 6 | `typewriter` | **Typewriter** | Minimal | Clean | 0.14 ms | 0.30 ms | 0.00 ms | 0.70 ms |
| 7 | `minimal-pill` | **Minimal Pill Plate** | Minimal | Clean | 0.03 ms | 0.10 ms | 0.00 ms | 0.20 ms |
| 8 | `clean-mono` | **Clean Monochrome** | Minimal | Clean | 0.02 ms | 0.10 ms | 0.00 ms | 0.20 ms |
| 9 | `bounce-letters` | **Bounce Letters** | Fun | Clean | 0.13 ms | 0.30 ms | 0.00 ms | 1.10 ms |
| 10 | `comic-burst` | **Comic Burst** | Fun | Clean | 0.07 ms | 0.20 ms | 0.00 ms | 0.60 ms |
| 11 | `wave-motion` | **Wave Kinetic** | Fun | Clean | 0.03 ms | 0.10 ms | 0.00 ms | 0.20 ms |
| 12 | `pastel-candy` | **Pastel Pop** | Fun | Clean | 0.03 ms | 0.10 ms | 0.00 ms | 0.20 ms |
| 13 | `glitch-kinetic` | **Glitch Cyber** | Gaming | Clean | 0.05 ms | 0.20 ms | 0.00 ms | 0.60 ms |
| 14 | `neon-glow` | **Neon Glow** | Gaming | Blur + Glow | 0.05 ms | 0.20 ms | 0.00 ms | 0.30 ms |
| 15 | `cyber-fire` | **Cyber Fire** | Gaming | Blur + Glow | 0.04 ms | 0.10 ms | 0.00 ms | 0.20 ms |
| 16 | `matrix-green` | **Matrix Cyber** | Gaming | Blur + Glow | 0.15 ms | 0.30 ms | 0.00 ms | 0.70 ms |
| 17 | `gold-cinema` | **Gold Cinema** | Cinematic | Blur + Glow | 0.07 ms | 0.20 ms | 0.00 ms | 0.40 ms |
| 18 | `blur-focus` | **Blur Focus** | Cinematic | Blur | 384.25 ms | 0.30 ms | 0.00 ms | 19210.30 ms |
| 19 | `silver-cinema` | **Silver Cinema** | Cinematic | Clean | 0.04 ms | 0.10 ms | 0.00 ms | 0.30 ms |
| 20 | `deep-blue-cinema` | **Deep Blue Cinema** | Cinematic | Blur + Glow | 0.03 ms | 0.10 ms | 0.00 ms | 0.10 ms |
| 21 | `outline-sweep` | **Outline Sweep** | Bold | Clean | 0.04 ms | 0.10 ms | 0.00 ms | 0.80 ms |
| 22 | `fire-impact` | **Fire Impact** | Bold | Clean | 0.07 ms | 0.30 ms | 0.00 ms | 0.50 ms |
| 23 | `cyber-bold` | **Cyber Block Impact** | Bold | Clean | 0.05 ms | 0.10 ms | 0.00 ms | 0.60 ms |
| 24 | `ocean-bold` | **Ocean Slam** | Bold | Clean | 0.03 ms | 0.20 ms | 0.00 ms | 0.30 ms |
| 25 | `highlighter-box` | **Highlighter Box** | Podcast | Clean | 0.03 ms | 0.10 ms | 0.00 ms | 0.20 ms |
| 26 | `underline-draw` | **Underline Draw** | Podcast | Clean | 0.03 ms | 0.10 ms | 0.00 ms | 0.10 ms |
| 27 | `speaker-tag` | **Speaker Tag** | Podcast | Clean | 0.03 ms | 0.20 ms | 0.00 ms | 0.20 ms |
| 28 | `studio-voice` | **Studio Voice** | Podcast | Clean | 0.03 ms | 0.10 ms | 0.00 ms | 0.30 ms |
| 29 | `scale-slam` | **Scale Slam** | Motivational | Clean | 0.04 ms | 0.20 ms | 0.00 ms | 0.60 ms |
| 30 | `warrior-fire` | **Warrior Fire** | Motivational | Blur + Glow | 0.07 ms | 0.20 ms | 0.00 ms | 1.10 ms |
| 31 | `hustle-gold` | **Hustle Gold** | Motivational | Glow | 0.01 ms | 0.10 ms | 0.00 ms | 0.10 ms |
| 32 | `grit-iron` | **Iron Grit** | Motivational | Clean | 0.03 ms | 0.10 ms | 0.00 ms | 0.20 ms |
| 33 | `shake-alert` | **Shake Alert** | News | Clean | 0.02 ms | 0.10 ms | 0.00 ms | 0.10 ms |
| 34 | `news-ticker` | **News Ticker** | News | Clean | 0.07 ms | 0.10 ms | 0.00 ms | 1.90 ms |
| 35 | `breaking-yellow` | **Breaking Headline** | News | Clean | 0.02 ms | 0.10 ms | 0.00 ms | 0.10 ms |
| 36 | `broadcast-split` | **Broadcast Split** | News | Clean | 0.02 ms | 0.10 ms | 0.00 ms | 0.20 ms |
| 37 | `devotional-soft` | **Devotional Soft** | Devotional | Blur + Glow | 0.05 ms | 0.20 ms | 0.00 ms | 0.20 ms |
| 38 | `ambient-sunset` | **Ambient Sunset** | Devotional | Clean | 0.04 ms | 0.10 ms | 0.00 ms | 0.10 ms |
| 39 | `temple-golden` | **Temple Gold** | Devotional | Blur + Glow | 0.03 ms | 0.10 ms | 0.00 ms | 0.40 ms |
| 40 | `zen-minimal` | **Zen Minimal** | Devotional | Clean | 0.03 ms | 0.10 ms | 0.00 ms | 0.30 ms |

**Overall Fleet Averages:**
- **Average frame draw time:** 9.65 ms (Budget: < 4.00 ms)
- **95th percentile draw time:** 0.16 ms (Budget: < 8.00 ms)
