---
name: Cyberpunk Cinema Glass
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#393939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1b1b1b'
  surface-container: '#1f1f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353535'
  on-surface: '#e2e2e2'
  on-surface-variant: '#e8bcbe'
  inverse-surface: '#e2e2e2'
  inverse-on-surface: '#303030'
  outline: '#ae8789'
  outline-variant: '#5e3e41'
  surface-tint: '#ffb2b8'
  primary: '#ffb2b8'
  on-primary: '#67001d'
  primary-container: '#ff506e'
  on-primary-container: '#5b0018'
  inverse-primary: '#be003d'
  secondary: '#d3fbff'
  on-secondary: '#00363a'
  secondary-container: '#00eefc'
  on-secondary-container: '#00686f'
  tertiary: '#d0bcff'
  on-tertiary: '#3c0091'
  tertiary-container: '#a078ff'
  on-tertiary-container: '#340080'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdadb'
  primary-fixed-dim: '#ffb2b8'
  on-primary-fixed: '#40000f'
  on-primary-fixed-variant: '#91002d'
  secondary-fixed: '#7df4ff'
  secondary-fixed-dim: '#00dbe9'
  on-secondary-fixed: '#002022'
  on-secondary-fixed-variant: '#004f54'
  tertiary-fixed: '#e9ddff'
  tertiary-fixed-dim: '#d0bcff'
  on-tertiary-fixed: '#23005c'
  on-tertiary-fixed-variant: '#5516be'
  background: '#131313'
  on-background: '#e2e2e2'
  surface-variant: '#353535'
typography:
  display-hero:
    fontFamily: Outfit
    fontSize: 64px
    fontWeight: '800'
    lineHeight: 72px
    letterSpacing: -0.02em
  display-hero-mobile:
    fontFamily: Outfit
    fontSize: 36px
    fontWeight: '800'
    lineHeight: 44px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Outfit
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Outfit
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Outfit
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Outfit
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.02em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.04em
  label-sm:
    fontFamily: Inter
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.08em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 0.75rem
  margin: 3rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system targets an elite tier of anime connoisseurs, cinephiles, and digital-first viewers who demand a theatre-grade audiovisual experience. It bridges futuristic cyberpunk aesthetics with high-end editorial streaming elegance. The atmosphere is nocturnal, razor-sharp, and cinematic—evoking deep immersion, electric energy, and uncompromising fidelity.

The aesthetic fuses **Cyberpunk High-Contrast** with **Optical Glassmorphism**:
- **Pure Canvas:** Built on uncompromised AMOLED pitch black to maximize OLED contrast ratios and allow keyframes to project off the screen.
- **Translucent Obsidian:** UI surfaces float as multi-layered smoked acrylic and frosted glass panes with luminous micro-borders and neon chromatic luminescence.
- **Laser Accents:** Focused beams of neon crimson, electric cyber cyan, and synth purple provide precise functional signaling without overwhelming the artwork.

## Colors

The palette establishes an aggressive dark hierarchy designed for low-light viewing environments:

- **Primary (`#ff0055` — Neon Crimson):** Reserved for high-priority interactive signals: primary CTA buttons, active playback state, watch progress indicators, live-air badges, and critical notices.
- **Secondary (`#00f0ff` — Cyber Cyan):** Used for technical metadata, audio/resolution specs (4K UHD, HDR10+, Master Audio), timecode displays, and focused navigational states.
- **Tertiary (`#8b5cf6` — Synth Purple):** Anchors secondary milestones such as skip intro/outro markers, chapter markers, community tags, and seasonal event tiers.
- **Neutral Core (`#000000` — AMOLED Black):** The deepest canvas layer. UI structural containers use tiered translucent layers:
  - Surface Glass: `rgba(255, 255, 255, 0.03)` to `rgba(255, 255, 255, 0.07)`
  - Elevated Glass: `rgba(18, 18, 24, 0.65)` with heavy backdrop blur
  - Subtle Borders: `rgba(255, 255, 255, 0.10)`
  - Active/Glow Borders: Semi-opaque tinted key colors (`rgba(255, 0, 85, 0.4)` or `rgba(0, 240, 255, 0.4)`)

## Typography

Typography delivers an immediate contrast between cinematic scale and functional data legibility:

- **Outfit (Display & Titles):** Used for anime titles, billboard headlines, hero banners, and modal section titles. Features wide, clean geometric terminals with confident geometric weight.
- **Inter (Body, UI, & Metadata):** Provides neutral, hyper-legible rendering for episode synopses, actor line-ups, technical badges, system notifications, and scrub counters.
- **Monospaced Accents:** Timecode tracks, bitrates, and audio channel indicators use monospaced numbers via `font-variant-numeric: tabular-nums` to eliminate jitter during playback.
- **Hierarchy Rules:** Titles at `display-hero` use tight letter spacing with high contrast against the dark background. Micro labels (`label-sm`) strictly enforce uppercase styling with tracked-out spacing (+0.08em) for instantaneous recognition at miniature scale.

## Layout & Spacing

The streaming layout uses a 12-column responsive fluid grid with edge-to-edge ambient bleed support for billboard video units:

- **Desktop (1280px+):** 12 columns, 48px margins, 24px gutters. Content shelves (carousels) intentionally bleed past the right margin to signal horizontal overflow and discoverability.
- **Tablet (768px - 1279px):** 8 columns, 32px margins, 16px gutters. Media grids scale from 6-across to 4-across.
- **Mobile (< 768px):** 4 columns, 16px margins, 12px gutters. Navigation shifts from top-persistent glass header to a floating bottom glass docking strip. Media rows shift to high-density peek carousels.

Spacing rhythm follows a strict 4px/8px baseline grid:
- `space-xs` (4px) and `space-sm` (8px) govern micro-alignments, badge padding, and icon gaps.
- `space-md` (16px) controls intra-component layout (card interiors, drawer paddings).
- `space-lg` (24px) and `space-xl` (40px) manage inter-component separation between streaming rows, detail headers, and player controls.

## Elevation & Depth

Depth is articulated entirely through translucent glass layering and targeted optical neon photoluminescence:

- **Base Layer (Canvas):** Pure `#000000` AMOLED base with no global lighting or grey gradients.
- **Level 1 (Shelves & Surfaces):** Background `rgba(255, 255, 255, 0.04)`, `backdrop-filter: blur(24px)`, encircled by a crisp `1px solid rgba(255, 255, 255, 0.08)`.
- **Level 2 (Modals, Overlays, Floating Nav):** Smoked translucent substrate `rgba(10, 10, 16, 0.75)` with `backdrop-filter: blur(40px)`, edged with `1px solid rgba(255, 255, 255, 0.14)`. Drop shadow: `0 20px 50px rgba(0, 0, 0, 0.8)`.
- **Level 3 (Focused & Active Interactive Elements):** Neon chromatic glow emission:
  - Crimson Focus: `box-shadow: 0 0 24px rgba(255, 0, 85, 0.45), 0 0 2px #ff0055;`
  - Cyber Cyan Focus: `box-shadow: 0 0 24px rgba(0, 240, 255, 0.45), 0 0 2px #00f0ff;`
  - Synth Purple Milestone: `box-shadow: 0 0 20px rgba(139, 92, 246, 0.40);`
- Outlines remain strictly 1px to preserve high-tech industrial precision. Heavy or blurry drop shadows without neon tinting are prohibited.

## Shapes

The design uses balanced, modern geometric curvature:

- **Base Radius (0.5rem / 8px):** Applied to thumbnail cards, inputs, episode selectors, dropdowns, and video transport panels.
- **Large Radius (1rem / 16px):** Applied to hero modal dialogue boxes, stream configuration drawers, and player HUD control shells.
- **Full Radius (Pill / 9999px):** Strictly reserved for dynamic badges, filter chips, action pills (Play, Resume, Add to Watchlist), and scrub handle nodules.

## Components

### Buttons
- **Primary Action (Play / Resume):** Solid `#ff0055` fill with pure white label typography (`label-lg`), pill-shaped. Hover triggers an intensified outer neon pulse (`0 0 28px rgba(255, 0, 85, 0.6)`).
- **Secondary Action (Trailer / Info):** Glass pill (`rgba(255, 255, 255, 0.08)`), `1px solid rgba(255, 255, 255, 0.20)` with `backdrop-filter: blur(16px)`. Hover state adopts a cyber cyan border and text shift (`#00f0ff`).
- **Milestone Action (Skip Intro / Outro):** Compact pill on player HUD, translucent obsidian fill (`rgba(15, 15, 20, 0.85)`), border and icon accented in `#8b5cf6`.

### Media Cards (Anime Poster & Episode Thumbnails)
- Smoked base card with 8px corner radius. Poster image utilizes an interior inset gradient overlay on the bottom third (`rgba(0,0,0,0.9)` to transparent).
- Hover initiates smooth scale (`scale-105`), crisp 1px border illumination (`#00f0ff` or `#ff0055`), and activates inline video preview with a neon crimson progress bar visible at the lower edge.

### Chips & Filter Tags
- Fully rounded pills with `label-md` uppercase typography. Default state: `rgba(255, 255, 255, 0.05)` fill and `rgba(255, 255, 255, 0.12)` border.
- Selected state: Backlit with `#00f0ff` background glow, `#00f0ff` text color, and deep translucent cyan interior tint (`rgba(0, 240, 255, 0.15)`).

### Video Scrubber & Transport Bar
- Track background: 4px tall ribbon in `rgba(255, 255, 255, 0.2)`. Buffered segment: `rgba(255, 255, 255, 0.45)`.
- Played progress: High-visibility `#ff0055` fill with a trailing beam glow. Scrub thumb: 14px glowing cyan circle (`#00f0ff`) with `0 0 12px #00f0ff` elevation, appearing on scrub hover. Intro/outro regions along the track are marked with subtle `#8b5cf6` highlights.

### High-Contrast Badges
- Micro tags (`HDR`, `4K`, `SUB`, `DUB`, `SIMULCAST`): 10px uppercase bold font with 2px vertical, 6px horizontal padding.
- Rendered with 1px border in cyan or crimson, obsidian backfill, and 100% saturation text for instant readability over fast-moving video thumbnails.

### Form Inputs & Search
- Inputs feature glass panes (`rgba(255, 255, 255, 0.04)`), muted placeholder text (`rgba(255, 255, 255, 0.4)`), and sharp 1px borders.
- Focused state transitions border to `#00f0ff` with an ambient glow (`box-shadow: 0 0 16px rgba(0, 240, 255, 0.25)`).