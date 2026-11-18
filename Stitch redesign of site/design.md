# Infinx Anime — Complete Multi-Page Design Specification (DESIGN.md)

## 1. Global Visual Identity & Tokens
- **Theme:** Modern Cyberpunk Dark Mode (OLED Pitch Black)
- **Backgrounds:** Canvas `#000000`, Section Surface `#070711`, Elevated Cards `rgba(20, 20, 35, 0.65)`
- **Primary Accent:** Neon Crimson (`#ff0055`) — Primary CTAs, active pills, scrubber knob, glows
- **Secondary Accent:** Cyber Cyan (`#00f0ff`) — Badges, intro timeline markers, live tags
- **Tertiary Accent:** Electric Violet (`#b800ff`) — Outro timeline markers, gradient accents
- **Gradients:** `linear-gradient(135deg, #ff0055 0%, #b800ff 50%, #00f0ff 100%)`
- **Typography:** `Outfit` (Headings, titles, badges) & `Inter` (Body, metadata, controls)
- **Border Radii:** `9999px` (Pills/Buttons), `12px – 16px` (Cards/Drawers), `20px` (Modals)

---

## 2. All Pages Design Specifications

### 📄 Page 1: Home Page / Streaming Hub (`/index.html`)
- **Header:** Sticky frosted glass bar with neon Infinity logo, search input with live auto-suggest dropdown, nav links, and login button.
- **Hero Carousel:** 21:9 wide spotlight banner with dark vignette, bold title, star rating, episode count, and dual CTAs: `[▶ Watch Now]` (neon crimson) and `[＋ Watchlist]` (glass).
- **Continue Watching Rail:** Horizontal 16:9 cards with bottom progress bars and quick resume triggers.
- **Curated Rails:** 2:3 poster cards with episode tags (`EP 24`), `SUB/DUB` chips, and hover zoom with crimson border glow.
- **Top 10 Rankings:** Translucent rank numerals (1–10) positioned behind poster cards.
- **Footer:** Multi-column sitemap, legal links, and social credentials.

---

### 🎬 Page 2: Cinema Video Player (`/video-player/index.html`)
- **Video Canvas (16:9):** Centered player with ambient backlight glow matching video colors.
- **Smart Scrubber Bar:**
  - Cyan segment for Intro (OP) and Purple segment for Outro (ED).
  - Floating `⏭ Skip Intro (01:30)` glass pill above controls.
  - Controls: Play/pause, 10s back/forward, volume slider, timecode, fullscreen, PiP.
- **Playback Quick Pills:** Server switcher (`Server 1 HD`, `Server 2 Dub`), Quality (`1080p`, `720p`, `Auto`), Audio (`Sub`, `Dub`), and Speed (`1x`, `1.25x`, `1.5x`).
- **Sidebar (Right):**
  - Series Watch Progress Card: percentage bar + chips (`Total: 24`, `Watched: 18`, `Left: 6`).
  - Scrollable Episode Playlist with thumbnails, duration, and animated equalizer on currently playing episode.
- **Bottom Section:** Title, tags, synopsis, download button, and synchronized comments/watch party tabs.

---

### 📺 Page 3: Anime Catalog & Hub (`/anime.html`)
- **Header Banner:** Subtle compact banner with quick search and trending tags.
- **Filter & Sort Toolbar:**
  - Genre pill filter row (Action, Shonen, Romance, Isekai, Sci-Fi).
  - Season selector chips (Winter, Spring, Summer, Fall 2026).
  - A-Z alphabet quick jump bar.
  - Sort dropdown: Top Rated, Latest Releases, Most Popular, Alphabetical.
- **Grid Layout:** Responsive 6-column 2:3 anime card grid with infinite scroll or pagination.
- **Card Badges:** Rating star, episode count, release year, and sub/dub status.

---

### 📂 Page 4: Category, Genre & Watchlist Hub (`/view.html`)
- **Top Tab Bar:** Switch between `Categories`, `My Watchlist`, and `Watch History`.
- **Watchlist Tab:**
  - Saved anime cards with "Remove" icon and "Mark Completed" toggle.
  - Filter by "Watching", "Plan to Watch", and "Completed".
- **History Tab:**
  - List of previously watched episodes with percentage bar and "Resume Episode" button.
  - "Clear History" button in header.
- **Category Grid:** Section header with category title (e.g. "Action Anime") + card grid.

---

### 👤 Page 5: Otaku Profile & Passport (`/profile.html`)
- **User Identity Header:**
  - Avatar with level progression ring (`Level 14 - Otaku Master`).
  - XP progress bar showing XP to next tier.
  - Username, join date, and custom status badge.
- **Stat Chips Row:** Total anime completed, total episodes watched, hours spent.
- **Hall of Fame Showcase:** 4 spotlight cards showcasing the user's all-time favorite anime.
- **Badges & Achievements:** Grid of collectible anime badges (e.g., "Night Owl", "Binge King", "Shonen Elite").
- **Account Settings Tab:** Password change, avatar selection, email preferences, and logout button.

---

### 📱 Page 6: Download App Landing Page (`/download.html`)
- **Hero Showcase:** 3D floating smartphone & TV mockups showing the Infinx streaming app UI.
- **Direct Download Cluster:**
  - Primary CTA: `[⬇ Download Android APK]` with version & file size badge.
  - Secondary CTA: `[📺 Android TV Version]` and `[📱 Install Web App (PWA)]`.
- **Feature Cards Grid:**
  - Offline Downloading & Playback
  - Ultra-fast 1080p HLS streaming
  - Auto-sync progress between Phone, Web, and TV
- **Install Guide:** Step-by-step 3-step visual guide for installing the APK.

---

### ⚙️ Page 7: Admin Dashboard (`/admin.html`)
- **Sidebar Navigation:** Dashboard, Shows Manager, Episodes Upload, Server Status, User Analytics, Settings.
- **Analytics KPI Cards:** Total Views (24h/All-time), Active Streamers, Total Anime Count, Storage Used.
- **Content Management Table:**
  - List of anime shows with poster thumbnail, title, total episodes, views, status, and Action buttons (`Edit`, `Add Episode`, `Delete`).
- **Quick Upload Modal / Form:**
  - Show Title, Poster URL, Synopsis, Genre checkboxes.
  - Video stream source input with HLS stream validator test button.
