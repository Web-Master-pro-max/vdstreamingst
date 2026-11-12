# Infinx Anime — Video Player Screen Design Specification (DESIGN.md for Stitch)

> **Document Type:** Stitch UI & Design System Specification  
> **Target Screen:** Cinema Video Player & Episode Watch Page (`/video-player/index.html`)  
> **Platform:** Web (Desktop Cinema Mode, Tablet, Mobile Landscape & Fullscreen)  
> **Design Tone:** Cyberpunk Dark Glassmorphism, Cinema Immersion, Neon Tech Accents  

---

## 1. Visual Identity & Design Tokens

### 1.1 Color Palette
- **Player Stage Background:** `#000000` (Pitch Black for maximum OLED contrast)
- **Ambient Glow Backdrop:** `radial-gradient(ellipse at 50% 30%, rgba(255, 0, 85, 0.12) 0%, rgba(0, 0, 0, 0) 70%)`
- **Player Chrome & Control Surfaces:**
  - Control Bar Gradient: `linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(5,5,10,0.85) 50%, rgba(0,0,0,0.98) 100%)`
  - Floating Settings Sheet / Drawer: `rgba(14, 14, 24, 0.94)` with `backdrop-filter: blur(28px)`
  - Pill Buttons (Default): `rgba(255, 255, 255, 0.07)` with `border: 1px solid rgba(255, 255, 255, 0.12)`
  - Pill Buttons (Active): `linear-gradient(135deg, #ff0055 0%, #b800ff 100%)` with neon drop shadow
- **Neon Accent Colors:**
  - **Playback Primary (Scrubber Knob & Time Fill):** `#ff0055` (Crimson Glow)
  - **Buffer Bar Fill:** `rgba(255, 255, 255, 0.35)`
  - **Timeline Intro (OP) Marker:** `#00f0ff` (Cyan Highlight Marker)
  - **Timeline Outro (ED) Marker:** `#b800ff` (Purple Highlight Marker)
  - **Server / Stream Active Badge:** `#00ff88` (Neon Emerald / High-speed connection)
- **Typography Colors:**
  - High Emphasis: `#ffffff`
  - Subtitles & Labels: `#e2e4ed`
  - Time Codes & Track Progress: `#a0a5b9`
  - Inactive / Disabled: `#525666`

---

### 1.2 Typography System
- **Player Controls & Time Display:** `Outfit`, sans-serif (Weights: 600, 700)
- **Episode Titles & Section Headings:** `Outfit`, sans-serif (Weights: 700, 800)
- **Metadata, Chat & Settings Text:** `Inter`, sans-serif (Weights: 400, 500, 600)
- **Hierarchy Scale:**
  - `Now Playing Episode Title`: 22px – 26px (Desktop), 18px – 20px (Mobile) | Weight: 800
  - `Series Name / Subtitle`: 14px – 16px | Weight: 500 | Color: `#a0a5b9`
  - `Time Display Code (00:00 / 24:15)`: 13px – 14px | Font: Monospace / Outfit tabular figures
  - `Settings Pill & Tab Labels`: 12px – 13px | Weight: 600 | Letter-spacing: `0.4px`
  - `Subtitle Display Text`: 18px – 26px (Configurable) | Heavy Drop Shadow | Line Height: 1.35

---

### 1.3 Radii & Elevation
- **Control Bar Knobs & Pills:** `9999px` (Full roundness)
- **Settings Drawers & In-Player Panels:** `16px` – `20px` border-radius
- **Video Player Container:**
  - Windowed / Cinema Mode: `16px` radius with `overflow: hidden`, subtle border `1px solid rgba(255,255,255,0.08)`
  - Fullscreen Mode: `0px` radius (Edge-to-edge flush canvas)
- **Glow & Shadows:**
  - Scrubber Knob Glow: `0 0 12px #ff0055, 0 0 24px rgba(255, 0, 85, 0.6)`
  - Active Button Glow: `0 4px 18px rgba(255, 0, 85, 0.4)`
  - Glass Drawer Shadow: `0 25px 60px rgba(0, 0, 0, 0.85)`

---

## 2. Screen Architecture & Layout Hierarchy

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [Sticky Mini Glass Header] (Logo | Search | Back to Show Details | Watchlist | Avatar) │
├────────────────────────────────────────────────────────────┬───────────────────────────┤
│ [Main Player Container (16:9 Cinema View)]                 │ [Right Sidebar (Tabs)]    │
│  ┌──────────────────────────────────────────────────────┐  │ ┌───────────────────────┐ │
│  │ Video Canvas (WebGL / HLS / HTML5 Video)             │  │ │ [Episodes] [Chat/Sync]│ │
│  │                                                      │  │ ├───────────────────────┤ │
│  │ Floating Badges: [Auto-Skip Intro Active]            │  │ │ Series Watch Progress │ │
│  │ Center Overlays: [Loading Spinner / Tap to Play]     │  │ │  Track: [██████░] 78% │ │
│  │ Floating Skip CTAs: [⏭ Skip Intro (01:30)]            │  │ │  Total: 24 | Left: 5  │ │
│  │ Subtitles / Styled Closed Caption Layer              │  │ ├───────────────────────┤ │
│  │                                                      │  │ │ Episode Cards List    │ │
│  │ ─── Custom Controls Bar ──────────────────────────── │  │ │  [Thumb] Ep 1: Pilot  │ │
│  │ [Progress Bar: Buffer + Intro Mark + Knob + Outro]   │  │ │  [Thumb] Ep 2: Active │ │
│  │ [⏮] [⏪10] [▶/⏸] [⏩10] [⏭] [12:45 / 24:00]        │  │ │  [Thumb] Ep 3: Locked │ │
│  │                                [🔊 Volume] [⚙] [⛶]   │  │ │  ...                  │ │
│  └──────────────────────────────────────────────────────┘  │ └───────────────────────┘ │
│                                                            │                           │
│ [Video Settings & Switcher Bar]                            │ [Watch Party Live Panel]  │
│  - Streaming Server: [Server 1 (HD)] [Server 2] [Direct]   │  - Sync playback avatar   │
│  - Quality: [Auto] [1080p] [720p] [480p]                   │  - Real-time timestamped  │
│  - Audio: [Japanese Sub] [English Dub]                     │    chat message stream    │
│  - Quick Actions: [⬇ Download] [🔗 Share] [♥ Favorite]      │  - Emoji reaction pulses  │
│                                                            │                           │
│ [Show Metadata & Synopsis]                                 │                           │
│  - Title, Season / Episode tags, Genre chips               │                           │
│  - Expandable description & character voice credits        │                           │
├────────────────────────────────────────────────────────────┴───────────────────────────┤
│ [Comments & Community Discussion Section]                                              │
│  - Sort: [Top Comments] [Newest First] | Write comment input with spoiler tag shield   │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Detailed Player Component Specifications

### 3.1 Custom Video Scrubber (Timeline Bar)
- **Track Height:** `5px` resting state, expands to `9px` on hover / scrubbing.
- **Layers Stack:**
  1. Background Track: `rgba(255, 255, 255, 0.15)`
  2. Buffered Track: `rgba(255, 255, 255, 0.35)` (Visualizes HLS buffered segments)
  3. **Timeline Intro (OP) Zone Marker:** Bright Cyan highlight (`#00f0ff`) positioned from start time to end time of anime opening (e.g., `01:15` to `02:45`).
  4. **Timeline Outro (ED) Zone Marker:** Electric Purple highlight (`#b800ff`) positioned at anime ending sequence.
  5. Played Track Fill: Neon Crimson gradient (`#ff0055` to `#a200ff`).
  6. **Scrubber Knob:** `16px` circular knob with pulsing glow halo, tooltipped with floating preview time thumbnail.

---

### 3.2 Timeline Skipping & Automation Floating Badges
- **Skip Intro (OP) Button:**
  - Appears automatically when playback reaches the Intro Zone Marker.
  - Floating pill at bottom-right above controls: `⏭ Skip Intro (01:30)`
  - Style: Glassmorphic background with Cyan accent border and subtle animated pulse.
- **Skip Outro (ED) / Next Episode Button:**
  - Appears when Outro Zone Marker is triggered.
  - Countdown ring showing seconds until autoplaying the next episode.

---

### 3.3 All-In-One Playback Settings Drawer
- **Trigger:** Gear icon (`fa-sliders-h` or `fa-cog`) in controls bar.
- **Presentation:**
  - Desktop: Floating frosted-glass popover anchored to gear icon.
  - Mobile & Fullscreen: Bottom-sheet slide-up drawer with top drag handle.
- **Sections Included:**
  1. **Audio Language:** Sub / Dub segmented pill selector (`Japanese (Sub)`, `English (Dub)`).
  2. **Streaming Server:** Pills for `Server 1 (AWS HD)`, `Server 2 (Multi-Audio)`, `Server 3 (Backup)`.
  3. **Quality Level:** Pills for `Auto`, `1080p`, `720p`, `480p`, `360p`.
  4. **Playback Speed:** Granular speed pills (`0.5x`, `0.75x`, `1x Normal`, `1.25x`, `1.5x`, `2x`).
  5. **Subtitles & Captions:** Dropdown selector + direct link to "Customize Subtitle Style...".
  6. **Automation Toggles:**
     - Toggle 1: Auto-Skip Intro (OP) [ON/OFF switch]
     - Toggle 2: Auto-Skip Outro (ED) [ON/OFF switch]
     - Toggle 3: Auto-Play Next Episode [ON/OFF switch]

---

### 3.4 Subtitle & Caption Customization Engine
- **Preview Canvas:** Real-time preview stage displaying sample subtitle over a simulated anime background.
- **Customization Controls:**
  - **Font Size:** Small (`16px`), Medium (`20px` - Default), Large (`25px`), Huge (`30px`).
  - **Text Color Palette:** White (`#ffffff`), Anime Yellow (`#ffcc00`), Cyber Cyan (`#00f0ff`), Neon Green (`#00ff88`).
  - **Outline & Shadow Styles:**
    - Cinematic Outline: Deep crisp drop shadow for anime readability.
    - Semi-Translucent Box: 75% dark tinted rounded backdrop.
    - High-Contrast Solid Box: Pure black backing.
  - **Screen Placement:** Bottom standard (`30px` from bottom) vs. Raised (`80px` to clear controls).

---

### 3.5 Right Sidebar: Playlist & Watch Progress
- **Series Watch Progress Card:**
  - Progress bar track showing percent of series completed (e.g. `75% Watched`).
  - Stat Chips: `Total Episodes`, `Watched`, `Remaining Left`.
- **Episode List Items:**
  - Horizontal card: Mini thumbnail (`90px x 56px`), Episode Number (`EP 04`), Title (`The Crimson Oath`), Duration (`24m`).
  - Currently Playing State: Active neon pink border, animated equalizer sound-wave bars, `NOW PLAYING` tag.
  - Watched State: Subtle checkmark badge with darkened thumbnail overlay.

---

### 3.6 Watch Party & Live Chat Drawer
- Real-time room status: Room ID pill, participant count, synchronized host control indicator.
- Message Stream: Glassmorphic chat bubbles with colored username tags, timestamps, and emoji reactions.
- Timestamp Tagging: Clicking a timestamp in chat jumps video directly to that second.

---

## 4. Fullscreen & Mobile Player Adaptation

- **Double-Tap Seeking:**
  - Double tap left third: Animated rewind circle ripple (`-10s`).
  - Double tap right third: Animated fast-forward circle ripple (`+10s`).
- **In-Player Episode Drawer (Swipeable):**
  - In fullscreen mode, an episode list button pulls out a translucent drawer from the right without exiting fullscreen.
- **Orientation Behavior:**
  - Mobile portrait: Video occupies top `35vh`, scrollable controls, playlist and comments below.
  - Mobile landscape: Automatically switches to full cinema canvas with autohiding overlay controls.

---

## 5. Micro-Interactions & Transitions

1. **Controls Auto-Hide:** Controls bar and header fade out smoothly after 3.5 seconds of mouse/touch inactivity (`opacity: 0`, `transition: opacity 0.4s ease`). Hovering or tapping immediately revives controls.
2. **Buffer Pulsing:** Loader spinner features dual counter-rotating neon rings with a pulsing play glyph core.
3. **Volume Slider:** Slides out horizontally on hovering the volume icon with smooth expand animation.
