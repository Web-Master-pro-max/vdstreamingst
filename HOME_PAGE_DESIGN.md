# Infinx Anime — Home Page Screen Design Specification (DESIGN.md for Stitch)

> **Document Type:** Stitch UI & Design System Specification  
> **Target Screen:** Home Page / Streaming Hub (`/index.html`)  
> **Platform:** Web (Desktop, Tablet, Mobile Responsive)  
> **Design Tone:** Cyberpunk Dark Glassmorphism, Premium Cinema, Electric Neon Accents  

---

## 1. Visual Identity & Design Tokens

### 1.1 Color Palette
- **Canvas Background (Deep Dark):** `#000000` (AMOLED Black) and `#07070d` (Deep Space Dark)
- **Elevated Surfaces / Glass Cards:**
  - Standard Card: `rgba(20, 20, 35, 0.65)` with `backdrop-filter: blur(20px)`
  - Hover Card: `rgba(32, 32, 55, 0.85)` with `backdrop-filter: blur(24px)`
  - Dropdown & Nav Drawer: `rgba(12, 12, 22, 0.96)` with `backdrop-filter: blur(25px)`
- **Accent & Brand Colors:**
  - **Primary Neon:** `#ff0055` (Crimson Neon — Main CTAs, Active States, Live Indicator)
  - **Primary Dark / Hover:** `#d60047`
  - **Primary Glow:** `rgba(255, 0, 85, 0.45)`
  - **Secondary Cyan:** `#00f0ff` (Cyber Cyan — Badges, Icons, Secondary Glows)
  - **Tertiary Violet:** `#b800ff` (Electric Purple — Gradients, Accents)
- **Linear Gradients:**
  - Brand Hero Gradient: `linear-gradient(135deg, #ff0055 0%, #a200ff 50%, #00f0ff 100%)`
  - Card Vignette Overlay: `linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(7,7,13,0.95) 100%)`
  - Hero Slider Vignette: `linear-gradient(90deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 45%, rgba(0,0,0,0) 80%)`
- **Typography Colors:**
  - High Emphasis (Headings): `#ffffff`
  - Medium Emphasis (Body/Titles): `#f3f3f6`
  - Muted Text (Metadata/Subtitles): `#a0a5b9`
  - Disabled / Subtle Text: `#64697d`
- **Borders & Dividers:**
  - Card Border: `1px solid rgba(255, 255, 255, 0.08)`
  - Card Border Active / Hover: `1px solid rgba(255, 0, 85, 0.45)`
  - Subtle Section Divider: `1px solid rgba(255, 255, 255, 0.05)`

---

### 1.2 Typography System
- **Display & Headline Font:** `Outfit`, sans-serif (Weights: 600, 700, 800, 900)
- **Body & UI Font:** `Inter`, sans-serif (Weights: 400, 500, 600, 700)
- **Hierarchy Scale:**
  - `Display / Hero Title`: 42px – 56px (Desktop), 28px – 34px (Mobile) | Line Height: 1.15 | Weight: 800
  - `Section Headings (H2)`: 24px – 28px | Line Height: 1.2 | Weight: 800 | Letter-spacing: `-0.5px`
  - `Sub-headings (H3)`: 18px – 20px | Line Height: 1.3 | Weight: 700
  - `Card Title`: 15px – 16px | Line Height: 1.3 | Weight: 600 | 1-line truncation (`text-overflow: ellipsis`)
  - `Body Regular`: 14px – 15px | Line Height: 1.6 | Weight: 400
  - `Metadata / Badges / Pills`: 11px – 13px | Line Height: 1.2 | Weight: 700 | Letter-spacing: `0.5px`

---

### 1.3 Shapes, Elevation & Spacing
- **Border Radii:**
  - Small (Badges, Buttons): `8px` – `10px`
  - Medium (Poster Cards, Search Box): `14px` – `16px`
  - Large (Modals, Featured Banners): `20px` – `24px`
  - Pill / Full: `9999px`
- **Shadows & Glow Effects:**
  - Surface Elevation: `0 15px 45px rgba(0, 0, 0, 0.7)`
  - Neon Crimson Glow: `0 0 25px rgba(255, 0, 85, 0.35)`
  - Neon Cyan Glow: `0 0 20px rgba(0, 240, 255, 0.25)`
  - Floating Button Hover: `0 8px 25px rgba(255, 0, 85, 0.5)`
- **Grid & Layout Spacing:**
  - Header Height: `76px` (Desktop), `64px` (Mobile)
  - Max Content Width: `1440px` with `padding: 0 32px` (Desktop), `0 16px` (Mobile)
  - Vertical Section Gap: `48px` – `64px`
  - Horizontal Card Gap: `16px` – `20px`

---

## 2. Screen Anatomy & Layout Sections

```
┌────────────────────────────────────────────────────────────────────────┐
│ [Sticky Glassmorphic Header]                                           │
│ Logo (Neon Infinity) | Nav Links | Genres Dropdown | Search | User/Auth│
├────────────────────────────────────────────────────────────────────────┤
│ [Hero Showcase Carousel (Swiper)]                                      │
│  - Full-width backdrop artwork with left-to-right gradient vignette    │
│  - Anime Title, Season/Episode tags, Rating badge, Synopsis excerpt    │
│  - Dual CTAs: [▶ Watch Episode 1] [＋ Watchlist] [ℹ Details]          │
│  - Glow Pagination dots & Progress indicators                         │
├────────────────────────────────────────────────────────────────────────┤
│ [Continue Watching Row] (Dynamic User History)                         │
│  - Horizontal cards with progress bar overlay on thumbnail             │
├────────────────────────────────────────────────────────────────────────┤
│ [Trending Anime & Top Releases Rails]                                  │
│  - Section title with neon gradient underline + "View All →" link      │
│  - 2:3 vertical poster cards with episode badge, sub/dub tags, rating  │
├────────────────────────────────────────────────────────────────────────┤
│ [Top 10 Ranked Shows (Numbered Badges 1-10)]                           │
│  - Large translucent rank numeral overlay + trending trajectory        │
├────────────────────────────────────────────────────────────────────────┤
│ [Genre & Curated Hub Collections]                                      │
│  - Action, Shonen, Fantasy, Romance, Sci-Fi carousel rows              │
├────────────────────────────────────────────────────────────────────────┤
│ [Live Community & Chat Banner]                                         │
│  - Real-time pulse indicator, active watch parties, participant count  │
├────────────────────────────────────────────────────────────────────────┤
│ [Glassmorphic Footer]                                                  │
│  - Brand statement, quick links, category sitemap, copyright           │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Detailed Component Specifications

### 3.1 Sticky Glassmorphic Header
- **Layout:** Sticky `top: 0`, full width, `z-index: 1000`.
- **Background:** `rgba(7, 7, 13, 0.85)` with `backdrop-filter: blur(20px)`.
- **Logo:**
  - Icon: FontAwesome `fa-infinity` rotated `45deg`, neon pink gradient fill.
  - Text: `Infinx Anime` with `-webkit-background-clip: text` gradient from `#ffffff` to `#ff0055`.
- **Navigation Links:**
  - Links: `Home`, `Anime`, `Genres ▾`, `Categories ▾`, `Watchlist`, `Live Chat`.
  - Active State: Background `rgba(255, 0, 85, 0.12)`, text `#ffffff`, border `1px solid rgba(255, 0, 85, 0.3)`.
- **Live Search Bar:**
  - Integrated pill container with neon search icon (`fa-search`).
  - Typing triggers floating dropdown modal listing instant matches with mini-poster thumbnails, genres, and release year.
- **User Actions:**
  - Signed-in: User avatar with level ring badge, notification bell, profile dropdown.
  - Signed-out: Glassmorphic `Login` button + Neon gradient `Sign Up` CTA.

---

### 3.2 Hero Banner Carousel
- **Aspect Ratio:** `21:9` on Desktop (min-height `560px`), `16:9` to `4:5` on Mobile.
- **Visuals:** High-res cinematic key art with multi-directional vignette (darkened on the left for text contrast, faded to black at the bottom to merge seamlessly with page content).
- **Metadata Stack:**
  - Spot badge: `🔥 #1 Trending This Week` in Cyberpunk Cyan pill.
  - Title: Up to 48px `Outfit` bold with subtle text-shadow.
  - Meta Line: `⭐ 9.8` | `2024` | `TV-MA` | `Season 2` | `24 Episodes` | `Sub & Dub`.
  - Synopsis: 3-line clamped description (`line-clamp: 3`).
- **Interactive Buttons:**
  - Primary CTA: `▶ Watch Now` with gradient `linear-gradient(135deg, #ff0055, #a200ff)` and glow shadow.
  - Secondary CTA: `＋ Add to Watchlist` glass button (`rgba(255,255,255,0.08)` border).
  - Info CTA: `ℹ Show Details` opens quick-view drawer.

---

### 3.3 Media Card (Poster Card Component)
- **Aspect Ratio:** `2:3` standard poster format (width `180px` – `220px`).
- **Border & Corner:** `border-radius: 14px`, `overflow: hidden`, `border: 1px solid rgba(255,255,255,0.08)`.
- **Badges:**
  - Top Left: `EP 12` / `COMPLETED` in dark glass chip.
  - Top Right: `SUB / DUB` badge in Cyber Cyan accent.
  - Bottom Right: `⭐ 8.9` rating star pill.
- **Hover Micro-Interaction:**
  - `transform: translateY(-8px) scale(1.03)`
  - Transition: `all 0.35s cubic-bezier(0.16, 1, 0.3, 1)`
  - Border transitions to `rgba(255, 0, 85, 0.6)` with outward neon glow.
  - Play overlay button with pulse animation appears on center of card.

---

### 3.4 Continue Watching Row
- **Aspect Ratio:** `16:9` landscape thumbnail cards.
- **Progress Indicator:** Horizontal track at card bottom:
  - Background track: `rgba(255, 255, 255, 0.2)`
  - Active fill: Gradient `#ff0055` to `#00f0ff` representing exact minutes watched.
- **Card Content:** Episode title (e.g., `S1:E8 - The Crimson Blade`), remaining time (`14m left`).

---

### 3.5 Quick Genre Filter Pills
- Horizontally scrollable row of glassmorphic chips: `All`, `Action`, `Dark Fantasy`, `Sci-Fi`, `Shonen`, `Isekai`, `Romance`, `Cyberpunk`.
- Active Pill: Filled with neon gradient, white text, and glowing border.
- Hover Pill: Border changes to Cyan with subtle glow.

---

## 4. Responsive Breakpoints & Adaptations

- **Desktop (≥ 1200px):**
  - Full navigation menu visible.
  - 6 poster cards visible per row or Swiper slider.
  - Search bar expanded in header (`320px` width).
- **Tablet (768px – 1199px):**
  - 4 to 5 cards per row.
  - Navigation collapsed to compact icons or glass dropdown.
- **Mobile (< 768px):**
  - Top header compact (`64px`), hamburger menu trigger for right sliding glass drawer.
  - Fixed bottom navigation bar (Home, Search, Watchlist, Live Chat, Profile).
  - 2 to 3 cards per row with horizontal touch flick scrolling.
  - Hero banner adapts to vertical focal point with stacked CTAs.

---

## 5. Micro-Interactions & Animation Guidelines

1. **Card Hover:** Smooth cubic-bezier spring lift (`cubic-bezier(0.16, 1, 0.3, 1)`), shadow bloom.
2. **Skeleton Shimmer:** Smooth 1.8s infinite gradient sweep (`rgba(255,255,255,0.03)` → `rgba(255,255,255,0.1)` → `rgba(255,255,255,0.03)`) for loading states.
3. **Buttons:** Active button depression (`scale(0.97)`), glowing border ripples on tap.
4. **Modals & Drawers:** Blur backdrop fades in over 250ms, content slides upward 20px with easing.
