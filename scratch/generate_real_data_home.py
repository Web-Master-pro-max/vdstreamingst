import os
import sys

def build_real_home():
    html_content = r'''<!DOCTYPE html>
<html class="dark" lang="en">

<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
  <meta name="description" content="Infinx Anime - Theatre Grade OLED Anime & Movie Streaming. Pure AMOLED zero-floor masterings, uncompressed audio bitrate, and simultaneous Tokyo transmissions." />
  <title>Infinx Anime - Theatre Grade OLED Anime Streaming</title>

  <!-- Google Fonts: Inter & Outfit -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Outfit:wght@500;600;700;800;900&display=swap" rel="stylesheet" />
  <!-- Google Material Symbols Outlined -->
  <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet" />
  <!-- FontAwesome for fallback & icons -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

  <!-- Swiper CSS -->
  <link rel="stylesheet" href="https://unpkg.com/swiper@8/swiper-bundle.min.css" />

  <!-- Tailwind CSS CDN with forms & container queries -->
  <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
  <script id="tailwind-config">
    tailwind.config = {
      darkMode: "class",
      theme: {
        extend: {
          colors: {
            "background": "#050508",
            "surface": "#09090d",
            "surface-dim": "#050508",
            "surface-bright": "#22222d",
            "surface-container-lowest": "#030305",
            "surface-container-low": "#0d0d13",
            "surface-container": "#13131b",
            "surface-container-high": "#191924",
            "surface-container-highest": "#222230",
            "surface-variant": "#2a2a3b",
            "on-surface": "#f1f1f6",
            "on-surface-variant": "#b8b8cc",
            "outline": "#686882",
            "outline-variant": "#343446",
            "primary": "#ff758f",
            "primary-container": "#ff2a55",
            "primary-fixed": "#ffccd5",
            "primary-fixed-dim": "#ff758f",
            "on-primary": "#400010",
            "on-primary-container": "#ffffff",
            "secondary": "#d3fbff",
            "secondary-container": "#00eefc",
            "secondary-fixed": "#7df4ff",
            "secondary-fixed-dim": "#00dbe9",
            "on-secondary-container": "#00474e",
            "tertiary": "#d0bcff",
            "tertiary-container": "#9d4edd",
            "tertiary-fixed": "#e9ddff",
            "on-tertiary-container": "#240046"
          },
          borderRadius: {
            DEFAULT: "0.25rem",
            lg: "0.5rem",
            xl: "0.75rem",
            "2xl": "1rem",
            full: "9999px"
          },
          spacing: {
            "space-xs": "0.25rem",
            "space-sm": "0.5rem",
            "space-md": "1rem",
            "space-lg": "1.5rem",
            "space-xl": "2.5rem",
            gutter: "1.5rem",
            "gutter-mobile": "0.75rem",
            margin: "3rem",
            "margin-mobile": "1rem"
          },
          fontFamily: {
            "display-hero": ["Outfit", "sans-serif"],
            "display-hero-mobile": ["Outfit", "sans-serif"],
            "headline-lg": ["Outfit", "sans-serif"],
            "headline-lg-mobile": ["Outfit", "sans-serif"],
            "headline-md": ["Outfit", "sans-serif"],
            "headline-sm": ["Outfit", "sans-serif"],
            "body-lg": ["Inter", "sans-serif"],
            "body-md": ["Inter", "sans-serif"],
            "body-sm": ["Inter", "sans-serif"],
            "label-lg": ["Inter", "sans-serif"],
            "label-md": ["Inter", "sans-serif"],
            "label-sm": ["Inter", "sans-serif"]
          },
          fontSize: {
            "display-hero": ["64px", { lineHeight: "72px", letterSpacing: "-0.02em", fontWeight: "800" }],
            "display-hero-mobile": ["36px", { lineHeight: "44px", letterSpacing: "-0.01em", fontWeight: "800" }],
            "headline-lg": ["32px", { lineHeight: "40px", letterSpacing: "-0.015em", fontWeight: "700" }],
            "headline-lg-mobile": ["24px", { lineHeight: "32px", letterSpacing: "-0.01em", fontWeight: "700" }],
            "headline-md": ["22px", { lineHeight: "28px", fontWeight: "600" }],
            "headline-sm": ["18px", { lineHeight: "24px", fontWeight: "600" }],
            "body-lg": ["16px", { lineHeight: "26px", fontWeight: "400" }],
            "body-md": ["14px", { lineHeight: "22px", fontWeight: "400" }],
            "body-sm": ["12px", { lineHeight: "18px", fontWeight: "400" }],
            "label-lg": ["14px", { lineHeight: "18px", letterSpacing: "0.02em", fontWeight: "600" }],
            "label-md": ["12px", { lineHeight: "16px", letterSpacing: "0.04em", fontWeight: "600" }],
            "label-sm": ["10px", { lineHeight: "14px", letterSpacing: "0.08em", fontWeight: "700" }]
          }
        }
      }
    };
  </script>

  <style>
    @layer base {
      html, body {
        width: 100vw;
        margin: 0;
        padding: 0;
        background-color: #050508;
        color: #f1f1f6;
        overflow-x: hidden;
      }
      body {
        overscroll-behavior-y: none;
        -webkit-font-smoothing: antialiased;
      }
      .pb-safe { padding-bottom: env(safe-area-inset-bottom, 0px); }
      .pt-safe { padding-top: env(safe-area-inset-top, 0px); }
    }

    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: #050508; }
    ::-webkit-scrollbar-thumb { background: #191924; border-radius: 9999px; }
    ::-webkit-scrollbar-thumb:hover { background: #00eefc; }
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

    /* Cyberpunk Glows & Animations */
    @keyframes cyberFlicker {
      0%, 100% { opacity: 0.95; filter: drop-shadow(0 0 16px rgba(0, 238, 252, 0.6)); }
      50% { opacity: 0.8; filter: drop-shadow(0 0 8px rgba(0, 238, 252, 0.3)); }
    }
    @keyframes neonCrimsonBloom {
      0%, 100% { filter: drop-shadow(0 0 20px rgba(255, 42, 85, 0.7)); }
      50% { filter: drop-shadow(0 0 10px rgba(255, 42, 85, 0.35)); }
    }
    @keyframes vipPulse {
      0%, 100% { box-shadow: 0 0 12px rgba(255, 42, 85, 0.35); border-color: rgba(255, 42, 85, 0.4); }
      50% { box-shadow: 0 0 24px rgba(0, 238, 252, 0.5); border-color: rgba(0, 238, 252, 0.6); }
    }
    @keyframes liveSheen {
      0% { transform: translateX(-150%) skewX(-20deg); }
      35%, 100% { transform: translateX(250%) skewX(-20deg); }
    }
    @keyframes bellWobble {
      0%, 100% { transform: rotate(0); }
      20% { transform: rotate(14deg); }
      40% { transform: rotate(-12deg); }
      60% { transform: rotate(8deg); }
      80% { transform: rotate(-4deg); }
    }

    .neon-bloom-flicker { animation: neonCrimsonBloom 4s ease-in-out infinite; }
    .vip-pulse-border { animation: vipPulse 3.5s ease-in-out infinite; }
    .sheen-effect { position: relative; overflow: hidden; }
    .sheen-effect::after {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.45), transparent);
      animation: liveSheen 4.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
      pointer-events: none;
    }
    .hover-bell:hover .bell-icon { animation: bellWobble 0.65s cubic-bezier(0.36, 0.07, 0.19, 0.97) both; }
    .spring-motion { transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }

    /* Swiper Hero Customizations */
    .hero-slider .swiper-slide {
      opacity: 0 !important;
      transition: opacity 0.8s ease-in-out !important;
    }
    .hero-slider .swiper-slide-active {
      opacity: 1 !important;
    }
    .hero-slider .swiper-pagination-bullet {
      width: 8px;
      height: 6px;
      border-radius: 9999px;
      background: rgba(255, 255, 255, 0.3);
      opacity: 1;
      transition: all 0.3s ease;
    }
    .hero-slider .swiper-pagination-bullet-active {
      width: 32px;
      background: #00eefc;
      box-shadow: 0 0 12px rgba(0, 238, 252, 0.8);
    }

    /* Modal styling */
    .infinx-modal {
      position: fixed;
      inset: 0;
      z-index: 9999;
      background: rgba(4, 4, 8, 0.88);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      display: none;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    .infinx-modal.active {
      display: flex;
      opacity: 1;
    }

    /* Live Search Dropdown */
    .live-search-dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      z-index: 60;
      margin-top: 0.5rem;
      background: rgba(13, 13, 19, 0.96);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border: 1px solid rgba(0, 238, 252, 0.25);
      border-radius: 1rem;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.95);
      max-height: 420px;
      overflow-y: auto;
      display: none;
    }
    .live-search-dropdown.active {
      display: block;
    }
    .live-search-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.65rem 1rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      cursor: pointer;
      transition: background 0.2s ease;
    }
    .live-search-item:hover {
      background: rgba(0, 238, 252, 0.12);
    }

    /* Mobile drawer */
    .mobile-drawer-overlay {
      position: fixed;
      inset: 0;
      z-index: 998;
      background: rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(10px);
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s ease;
    }
    .mobile-drawer-overlay.active {
      opacity: 1;
      pointer-events: auto;
    }
    .mobile-drawer {
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      width: 280px;
      max-width: 85vw;
      z-index: 999;
      background: #09090d;
      border-left: 1px solid rgba(0, 238, 252, 0.2);
      transform: translateX(100%);
      transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .mobile-drawer.active {
      transform: translateX(0);
    }
  </style>
</head>

<body class="bg-surface font-body-md text-on-surface min-h-screen">

  <!-- ==================== HEADER (Desktop Ribbon + Mobile Top Bar) ==================== -->
  <header class="fixed top-0 left-0 right-0 z-50 w-full bg-surface-container-lowest/80 backdrop-blur-2xl shadow-[0_4px_30px_rgba(0,0,0,0.8)] border-b border-surface-variant/30">
    <div class="h-16 lg:h-20 w-full px-gutter-mobile lg:px-gutter flex items-center justify-between gap-space-sm lg:gap-space-md">
      
      <!-- Left: Logo & Desktop Navigation Ribbon -->
      <div class="flex items-center gap-space-md lg:gap-space-lg flex-shrink-0">
        <!-- Logo -->
        <a class="flex items-center gap-space-xs sm:gap-space-sm group" href="index.html">
          <div class="relative flex items-center justify-center w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-surface-container-high/80 shadow-[0_0_16px_rgba(0,238,252,0.35)] group-hover:shadow-[0_0_24px_rgba(0,238,252,0.65)] group-hover:border group-hover:border-secondary-container/40 spring-motion">
            <svg class="w-5 h-5 lg:w-6 lg:h-6 transform -rotate-12 group-hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M18.178 8c-1.38 0-2.61.644-3.414 1.645C13.606 8.167 11.758 7 9.5 7 5.91 7 3 9.91 3 13.5S5.91 20 9.5 20c2.258 0 4.106-1.167 5.264-2.645C15.568 18.356 16.798 19 18.178 19 20.84 19 23 16.84 23 14.178c0-2.662-2.16-4.178-4.822-4.178zm-8.678 9.5c-2.206 0-4-1.794-4-4s1.794-4 4-4c1.862 0 3.398 1.282 3.824 3.013a5.55 5.55 0 0 1 0 1.974c-.426 1.731-1.962 3.013-3.824 3.013zm8.678-1c-1.396 0-2.533-.946-2.85-2.23a4.015 4.015 0 0 1 0-1.54c.317-1.284 1.454-2.23 2.85-2.23 1.556 0 2.822 1.266 2.822 2.822 0 1.556-1.266 2.822-2.822 2.822z" fill="#00eefc"></path>
              <circle cx="9.5" cy="13.5" fill="#ff2a55" r="1.5"></circle>
            </svg>
          </div>
          <div class="flex flex-col">
            <span class="font-headline-sm text-sm sm:text-headline-sm tracking-wider font-extrabold text-secondary-container drop-shadow-[0_0_12px_rgba(0,238,252,0.6)]">
              INFINX<span class="text-primary-container drop-shadow-[0_0_12px_rgba(255,42,85,0.6)] ml-1">ANIME</span>
            </span>
            <span class="font-label-sm text-[9px] tracking-widest uppercase text-outline hidden sm:inline">CINEMA LABS</span>
          </div>
        </a>

        <!-- Desktop Nav Ribbon -->
        <nav class="hidden xl:flex items-center gap-space-xs p-1 rounded-full bg-surface-container-lowest/60 backdrop-blur-md border border-surface-variant/40">
          <a aria-current="page" class="relative px-space-md py-space-xs font-label-lg transition-all duration-300 bg-secondary-container/15 text-secondary-container shadow-[0_0_16px_rgba(0,238,252,0.25)] rounded-full group" href="index.html">
            <span>Home</span>
            <span class="absolute -bottom-1 left-3 right-3 h-[2px] bg-secondary-container rounded-full shadow-[0_0_8px_#00eefc]"></span>
          </a>
          <a class="relative px-space-md py-space-xs rounded-full font-label-lg text-label-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all duration-200 group" href="anime.html">
            <span>Browse</span>
            <span class="absolute -bottom-1 left-4 right-4 h-[2px] bg-secondary-container/0 group-hover:bg-secondary-container/80 group-hover:shadow-[0_0_8px_#00eefc] rounded-full transition-all duration-300"></span>
          </a>
          <a class="relative px-space-md py-space-xs rounded-full font-label-lg text-label-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all duration-200 group" href="#simulcastsSection">
            <span>Simulcasts</span>
            <span class="absolute -bottom-1 left-4 right-4 h-[2px] bg-secondary-container/0 group-hover:bg-secondary-container/80 group-hover:shadow-[0_0_8px_#00eefc] rounded-full transition-all duration-300"></span>
          </a>
          <a class="relative px-space-md py-space-xs rounded-full font-label-lg text-label-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all duration-200 group" href="view.html#movies">
            <span>Movies</span>
            <span class="absolute -bottom-1 left-4 right-4 h-[2px] bg-secondary-container/0 group-hover:bg-secondary-container/80 group-hover:shadow-[0_0_8px_#00eefc] rounded-full transition-all duration-300"></span>
          </a>
          <a class="relative px-space-md py-space-xs rounded-full font-label-lg text-label-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all duration-200 group" href="anime.html">
            <span>Schedule</span>
            <span class="absolute -bottom-1 left-4 right-4 h-[2px] bg-secondary-container/0 group-hover:bg-secondary-container/80 group-hover:shadow-[0_0_8px_#00eefc] rounded-full transition-all duration-300"></span>
          </a>
          <a class="relative px-space-md py-space-xs rounded-full font-label-lg text-label-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all duration-200 group" href="#publicLiveChatSection" onclick="scrollToPublicChat(event)">
            <span>Community</span>
            <span class="ml-1 px-1.5 py-0.2 rounded-full bg-secondary-container/20 text-secondary-container text-[9px] font-bold">LIVE</span>
            <span class="absolute -bottom-1 left-4 right-4 h-[2px] bg-secondary-container/0 group-hover:bg-secondary-container/80 group-hover:shadow-[0_0_8px_#00eefc] rounded-full transition-all duration-300"></span>
          </a>
        </nav>
      </div>

      <!-- Center: Desktop Search Bar -->
      <div class="flex-1 max-w-md mx-space-md hidden md:block">
        <div class="relative flex items-center w-full">
          <span class="material-symbols-outlined absolute left-3.5 text-outline text-[20px] pointer-events-none">search</span>
          <input id="searchInput" class="w-full pl-11 pr-14 py-2 bg-surface-container-low/90 backdrop-blur-xl rounded-full font-body-sm text-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-1 focus:ring-secondary-container focus:shadow-[0_0_20px_rgba(0,238,252,0.3)] transition-all border border-surface-variant/40" placeholder="Search anime, movies, 4K releases..." type="text" autocomplete="off" />
          <div class="absolute right-3 px-2 py-0.5 rounded bg-surface-container-highest/80 font-label-sm text-[10px] text-on-surface-variant shadow-inner pointer-events-none">⌘K</div>
          <!-- Live Auto-Suggest Dropdown Box -->
          <div id="liveSearchDropdown" class="live-search-dropdown"></div>
        </div>
      </div>

      <!-- Right: Action Items (VIP Pass, Bell, Auth Header, Hamburger) -->
      <div class="flex items-center gap-space-xs sm:gap-space-sm flex-shrink-0">
        <!-- Mobile Quick Find Button -->
        <button id="mobileHeaderSearchBtn" class="md:hidden h-10 px-3 rounded-full bg-surface-container-highest/60 hover:bg-surface-container-highest backdrop-blur-md flex items-center gap-space-xs text-on-surface-variant transition-colors min-w-[40px]">
          <span class="material-symbols-outlined text-[18px]">search</span>
          <span class="font-label-sm text-label-sm tracking-wider uppercase text-on-surface/70 hidden sm:inline">Quick Find</span>
        </button>

        <!-- VIP Pass Button (Desktop) -->
        <a class="relative hidden sm:inline-flex items-center gap-space-xs px-3.5 py-1.5 rounded-full bg-surface-container-low border border-primary/30 text-primary vip-pulse-border hover:bg-primary-container hover:text-on-primary-container transition-all duration-300 group cursor-pointer" href="profile.html">
          <span class="material-symbols-outlined text-[16px] text-primary group-hover:text-on-primary-container group-hover:scale-110 spring-motion">local_fire_department</span>
          <span class="font-label-sm text-label-sm tracking-wider uppercase font-bold bg-gradient-to-r from-primary-fixed via-primary to-secondary-container bg-clip-text group-hover:text-on-primary-container">VIP PASS</span>
        </a>

        <!-- Notification Bell -->
        <button class="relative p-2 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container hover-bell transition-all cursor-pointer hidden md:flex items-center justify-center" aria-label="Notifications">
          <span class="material-symbols-outlined text-[22px] bell-icon inline-block">notifications</span>
          <span class="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary-container shadow-[0_0_8px_#ff2a55] animate-pulse"></span>
        </button>

        <!-- Dynamic Auth Header / Profile Avatar -->
        <div id="authHeader" class="flex items-center">
          <button class="px-3.5 py-1.5 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-sm uppercase tracking-wider font-bold transition-all border border-surface-variant text-xs cursor-pointer" onclick="openModal('login')">
            Sign In
          </button>
        </div>

        <!-- Mobile Menu Hamburger Trigger -->
        <button id="mobileMenuBtn" class="xl:hidden p-2 rounded-xl bg-surface-container text-on-surface hover:text-secondary-container transition-colors" aria-label="Open Navigation">
          <span class="material-symbols-outlined text-[24px]">menu</span>
        </button>
      </div>
    </div>
  </header>

  <!-- ==================== MOBILE SLIDE-OUT DRAWER ==================== -->
  <div id="mobileDrawerOverlay" class="mobile-drawer-overlay"></div>
  <aside id="mobileDrawer" class="mobile-drawer p-5 overflow-y-auto">
    <div class="flex items-center justify-between pb-4 border-b border-surface-variant/40">
      <div class="flex items-center gap-2">
        <span class="font-headline-sm text-secondary-container font-extrabold tracking-wide">INFINX<span class="text-primary-container ml-1">ANIME</span></span>
      </div>
      <button id="closeDrawerBtn" class="p-1 rounded-full text-outline hover:text-on-surface">
        <span class="material-symbols-outlined text-[24px]">close</span>
      </button>
    </div>
    <div class="flex flex-col gap-2 py-4">
      <a href="index.html" class="flex items-center gap-3 px-3 py-2 rounded-xl bg-secondary-container/15 text-secondary-container font-label-lg font-bold">
        <span class="material-symbols-outlined text-[20px]">home</span> Home
      </a>
      <a href="anime.html" class="flex items-center gap-3 px-3 py-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container font-label-lg font-semibold">
        <span class="material-symbols-outlined text-[20px]">explore</span> Browse Catalog
      </a>
      <a href="#simulcastsSection" onclick="closeMobileMenu()" class="flex items-center gap-3 px-3 py-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container font-label-lg font-semibold">
        <span class="material-symbols-outlined text-[20px]">broadcast_on_home</span> Simulcasts
      </a>
      <a href="view.html#movies" class="flex items-center gap-3 px-3 py-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container font-label-lg font-semibold">
        <span class="material-symbols-outlined text-[20px]">movie</span> Movies
      </a>
      <a href="view.html#watchlist" class="flex items-center gap-3 px-3 py-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container font-label-lg font-semibold">
        <span class="material-symbols-outlined text-[20px]">bookmark</span> Watchlist
      </a>
      <a href="download.html" class="flex items-center gap-3 px-3 py-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container font-label-lg font-semibold">
        <span class="material-symbols-outlined text-[20px]">download_for_offline</span> Downloads
      </a>
      <a href="profile.html" class="flex items-center gap-3 px-3 py-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container font-label-lg font-semibold">
        <span class="material-symbols-outlined text-[20px]">person</span> Otaku Profile
      </a>
      <a href="#publicLiveChatSection" onclick="closeMobileMenu(); scrollToPublicChat(event)" class="flex items-center gap-3 px-3 py-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container font-label-lg font-semibold">
        <span class="material-symbols-outlined text-[20px]">forum</span> Live Community
      </a>
    </div>
    <div id="drawerAuthSection" class="pt-4 border-t border-surface-variant/40"></div>
  </aside>

  <!-- ==================== MAIN CONTENT ==================== -->
  <main class="w-full pt-16 lg:pt-20 bg-surface-container-lowest min-h-screen">
    <div class="flex flex-col w-full text-on-surface select-none pb-space-xl">

      <!-- ==================== MOBILE TOP SEARCH & TRENDING SECTION ==================== -->
      <section class="block md:hidden px-gutter-mobile pt-space-xs pb-space-md" id="mobileSearchSection">
        <div class="relative w-full">
          <div class="relative flex items-center w-full rounded-full bg-surface-container/70 backdrop-blur-xl shadow-lg transition-all duration-300 focus-within:shadow-[0_0_20px_rgba(0,238,252,0.35)] focus-within:bg-surface-container-high/90">
            <span class="material-symbols-outlined text-secondary-fixed-dim pl-space-md text-[20px]">search</span>
            <input id="mobileSearchInlineInput" class="w-full bg-transparent py-space-sm pl-space-xs pr-10 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none" placeholder="Search anime, movies, creators..." type="text" autocomplete="off" />
            <button id="clearMobileSearchBtn" class="absolute right-space-sm w-7 h-7 rounded-full flex items-center justify-center text-on-surface-variant/70 hover:text-on-surface hover:bg-surface-variant/50 transition-all opacity-0 pointer-events-none">
              <span class="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
          <div id="mobileSearchInlinePanel" class="live-search-dropdown"></div>
        </div>

        <!-- Real Trending Search Pills -->
        <div class="flex items-center gap-space-xs overflow-x-auto no-scrollbar pt-space-sm">
          <span class="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant/70 shrink-0">Hot:</span>
          <button onclick="quickSearchTerm('One Piece')" class="px-space-sm py-0.5 rounded-full bg-secondary-container/15 text-secondary-fixed font-label-sm text-label-sm whitespace-nowrap shadow-[0_0_8px_rgba(0,238,252,0.25)]">One Piece</button>
          <button onclick="quickSearchTerm('Dandadan')" class="px-space-sm py-0.5 rounded-full bg-surface-container-high/80 text-on-surface-variant font-label-sm text-label-sm whitespace-nowrap hover:text-on-surface">Dandadan</button>
          <button onclick="quickSearchTerm('Chainsaw Man')" class="px-space-sm py-0.5 rounded-full bg-surface-container-high/80 text-on-surface-variant font-label-sm text-label-sm whitespace-nowrap hover:text-on-surface">Chainsaw Man</button>
          <button onclick="quickSearchTerm('Dr. Stone')" class="px-space-sm py-0.5 rounded-full bg-surface-container-high/80 text-on-surface-variant font-label-sm text-label-sm whitespace-nowrap hover:text-on-surface">Dr. Stone</button>
          <button onclick="quickSearchTerm('Spider-Man')" class="px-space-sm py-0.5 rounded-full bg-surface-container-high/80 text-on-surface-variant font-label-sm text-label-sm whitespace-nowrap hover:text-on-surface">Spider-Man</button>
        </div>
      </section>

      <!-- ==================== HERO SPOTLIGHT CAROUSEL (100% REAL SERVER DATA) ==================== -->
      <section class="relative w-full lg:-mt-20 overflow-hidden bg-surface-container-lowest" id="heroSpotlightSection">
        <div class="px-gutter-mobile lg:px-0 pb-space-lg lg:pb-0">
          <div class="hero-slider swiper w-full rounded-2xl lg:rounded-none overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.9)] lg:shadow-none bg-surface-container-lowest">
            <div class="swiper-wrapper" id="carouselWrapper">
              <!-- Dynamically populated with real shows from /api/shows/carousel via loadCarousel() -->
              <div class="swiper-slide relative w-full aspect-[16/10] sm:aspect-[21/9] lg:aspect-auto min-h-[380px] sm:min-h-[460px] lg:h-[840px] flex items-center justify-center bg-surface-container-low">
                <div class="flex flex-col items-center gap-3 text-outline animate-pulse">
                  <span class="material-symbols-outlined text-4xl text-secondary-container">sync</span>
                  <span class="font-label-md text-sm">Streaming Live Broadcast Pipeline...</span>
                </div>
              </div>
            </div>

            <!-- Custom Swiper Navigation Controls (Stitch Parity) -->
            <div class="hidden lg:flex items-center justify-between w-full max-w-7xl mx-auto px-gutter absolute bottom-12 left-0 right-0 z-20 pointer-events-none">
              <!-- Pagination Bullets Container -->
              <div class="swiper-pagination pointer-events-auto flex items-center gap-2"></div>

              <!-- Chevrons -->
              <div class="flex items-center gap-space-xs pointer-events-auto">
                <button class="swiper-btn-prev w-10 h-10 rounded-full bg-surface-container-high/80 flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-bright hover:scale-110 active:scale-95 spring-motion cursor-pointer shadow-lg backdrop-blur-md">
                  <span class="material-symbols-outlined text-[20px]">chevron_left</span>
                </button>
                <button class="swiper-btn-next w-10 h-10 rounded-full bg-surface-container-high/80 flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-bright hover:scale-110 active:scale-95 spring-motion cursor-pointer shadow-lg backdrop-blur-md">
                  <span class="material-symbols-outlined text-[20px]">chevron_right</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      <!-- ==================== QUICK FILTER CATEGORY PILLS (Floating Glass Ribbon) ==================== -->
      <section class="w-full max-w-7xl mx-auto px-gutter-mobile lg:px-gutter py-space-md">
        <div class="flex items-center gap-space-xs overflow-x-auto pb-space-xs no-scrollbar" id="genreQuickPills">
          <!-- Populated dynamically via renderQuickPills() -->
          <button onclick="filterCatalogBy('all')" class="cat-pill px-4 py-2 rounded-full bg-secondary-container text-on-secondary-container font-label-md text-label-md uppercase tracking-wider shadow-[0_0_16px_rgba(0,238,252,0.35)] shrink-0 cursor-pointer spring-motion">
            All Master Catalog
          </button>
        </div>
      </section>

      <!-- ==================== CONTINUE WATCHING ROW (16:9 Real History Cards) ==================== -->
      <section class="w-full max-w-7xl mx-auto pt-space-lg flex flex-col gap-space-sm pb-space-lg hidden" id="continueWatchingSection">
        <div class="flex items-center justify-between px-gutter-mobile lg:px-gutter">
          <div class="flex items-center gap-space-xs">
            <div class="w-1 h-5 rounded-full bg-primary-container shadow-[0_0_10px_#ff2a55] animate-pulse"></div>
            <h2 class="font-headline-sm lg:font-headline-md font-bold text-on-surface tracking-tight">Continue Watching</h2>
            <span id="continueWatchingCount" class="font-label-sm text-[11px] text-outline px-2 py-0.5 rounded bg-surface-container-low ml-2 hidden sm:inline">In-Flight</span>
          </div>
          <a class="font-label-sm text-label-sm text-secondary-fixed hover:text-secondary flex items-center gap-0.5" href="view.html#history">
            <span>History Hub</span>
            <span class="material-symbols-outlined text-[14px]">chevron_right</span>
          </a>
        </div>

        <!-- 16:9 Grid on Desktop & Horizontal Snap Scroll Carousel on Mobile -->
        <div class="flex lg:grid lg:grid-cols-4 gap-space-md overflow-x-auto lg:overflow-visible no-scrollbar px-gutter-mobile lg:px-gutter snap-x snap-mandatory" id="continueWatchingGrid">
          <!-- Populated dynamically from real user watch history via loadContinueWatching() -->
        </div>
      </section>

      <!-- ==================== TOP 10 MASTERPIECES TODAY (Massive Rank Numerals + Real Shows) ==================== -->
      <section class="w-full max-w-7xl mx-auto pt-space-xl flex flex-col gap-space-sm pb-space-lg" id="top10Section">
        <div class="flex items-end justify-between px-gutter-mobile lg:px-gutter mb-space-xs lg:mb-space-md">
          <div class="flex flex-col">
            <div class="flex items-center gap-space-xs font-label-sm text-label-sm text-secondary-container uppercase tracking-widest font-bold">
              <span class="material-symbols-outlined text-[16px] animate-pulse">equalizer</span>
              <span>Tokyo &amp; Global Ratings</span>
            </div>
            <h2 class="font-headline-sm sm:font-headline-md lg:font-headline-lg tracking-tight font-extrabold text-on-surface mt-1">
              Top 10 Masterpieces Today
            </h2>
          </div>
          <div class="hidden sm:flex items-center gap-2">
            <span class="font-label-sm text-label-sm text-outline uppercase tracking-wider">Live Bitrate Feed</span>
            <span class="w-2 h-2 rounded-full bg-secondary-container shadow-[0_0_8px_#00eefc] animate-ping"></span>
          </div>
        </div>

        <!-- 5-Col Grid on Desktop & Horizontal Snap Scroll on Mobile -->
        <div class="flex lg:grid lg:grid-cols-5 gap-space-lg lg:gap-space-md overflow-x-auto lg:overflow-visible no-scrollbar px-gutter-mobile lg:px-gutter snap-x snap-mandatory pt-space-xs" id="top10Grid">
          <!-- Populated dynamically via loadTop10Masterpieces() with REAL database shows -->
          <div class="w-full py-12 text-center text-outline">Loading Top Masterpieces...</div>
        </div>
      </section>

      <!-- ==================== SEASONAL SIMULCASTS (Real Anime Broadcasts) ==================== -->
      <section class="w-full max-w-7xl mx-auto pt-space-xl flex flex-col gap-space-sm pb-space-lg" id="simulcastsSection">
        <div class="flex flex-col md:flex-row md:items-end justify-between px-gutter-mobile lg:px-gutter mb-space-xs lg:mb-space-md gap-space-sm">
          <div class="flex flex-col">
            <div class="flex items-center gap-space-xs font-label-sm text-label-sm text-primary-container uppercase tracking-widest font-bold">
              <span class="w-2 h-2 rounded-full bg-primary-container animate-pulse"></span>
              <span>Tokyo Simultaneous Broadcasts</span>
            </div>
            <h2 class="font-headline-sm sm:font-headline-md lg:font-headline-lg tracking-tight font-extrabold text-on-surface mt-1">
              Weekly Simulcast Releases
            </h2>
          </div>
          <!-- Schedule Day Selector -->
          <div class="hidden lg:flex items-center gap-1 bg-surface-container-low p-1 rounded-full overflow-x-auto no-scrollbar">
            <button class="px-3.5 py-1 rounded-full bg-surface-container-highest text-secondary-container font-label-md text-xs cursor-pointer font-bold">Today</button>
            <button class="px-3 py-1 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high font-label-md text-xs cursor-pointer">Fri</button>
            <button class="px-3 py-1 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high font-label-md text-xs cursor-pointer">Sat</button>
            <button class="px-3 py-1 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high font-label-md text-xs cursor-pointer">Sun</button>
            <button class="px-3 py-1 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high font-label-md text-xs cursor-pointer">Mon</button>
          </div>
          <a class="lg:hidden font-label-sm text-label-sm text-secondary-fixed hover:text-secondary flex items-center gap-0.5" href="anime.html">
            <span>Schedule</span>
            <span class="material-symbols-outlined text-[14px]">calendar_month</span>
          </a>
        </div>

        <!-- Populated dynamically via loadSeasonalSimulcasts() with real anime from server -->
        <div id="simulcastContainer">
          <div class="w-full py-8 text-center text-outline">Loading Simulcast Schedule...</div>
        </div>
      </section>

      <!-- ==================== DYNAMIC CATEGORY CATALOG SECTIONS (Real Server Shows) ==================== -->
      <div id="homeDynamicSections" class="w-full">
        <!-- Rendered dynamically from /api/shows/categories via renderDynamicHomeSections() -->
      </div>

      <!-- ==================== COMMUNITY & VIP CINEMA PROMO (Asymmetric Split Panel) ==================== -->
      <section class="w-full max-w-7xl mx-auto px-gutter-mobile lg:px-gutter pt-space-xl" id="vipGuildSection">
        <div class="relative w-full rounded-2xl overflow-hidden bg-gradient-to-r from-surface-container to-surface-container-low border border-surface-variant/40 p-space-lg lg:p-space-xl flex flex-col lg:flex-row items-center justify-between gap-space-xl shadow-2xl">
          <div class="absolute -right-20 -top-20 w-96 h-96 rounded-full bg-secondary-container/10 filter blur-3xl pointer-events-none"></div>
          <div class="absolute -left-20 -bottom-20 w-96 h-96 rounded-full bg-primary-container/10 filter blur-3xl pointer-events-none"></div>

          <!-- Left Text Content -->
          <div class="relative z-10 flex flex-col max-w-xl gap-space-sm">
            <div class="inline-flex items-center gap-space-xs px-3 py-1 rounded-full bg-primary-container/15 text-primary font-label-sm text-label-sm uppercase tracking-widest w-fit border border-primary/20">
              <span class="material-symbols-outlined text-[16px] animate-pulse">verified</span>
              <span>Zero-Compression Theatre Guild</span>
            </div>
            <h3 class="font-headline-lg text-headline-lg font-extrabold text-on-surface tracking-tight">
              Unlock Pure Bitrate Mastery with <span class="text-secondary-container drop-shadow-[0_0_12px_rgba(0,238,252,0.6)]">INFINX VIP</span>
            </h3>
            <p class="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              Experience uncompressed 80 Mbps master streams directly from studio render pipelines in Tokyo. Zero artifacting, Dolby Atmos true surround, and early 1-hour premiere access.
            </p>
            <!-- Feature List Metrics -->
            <div class="grid grid-cols-3 gap-space-md pt-space-sm">
              <div class="flex flex-col group cursor-default">
                <span class="font-headline-md text-headline-md font-bold text-secondary-container group-hover:scale-105 spring-motion origin-left">80 Mbps</span>
                <span class="font-label-sm text-label-sm text-outline">Raw Master Feed</span>
              </div>
              <div class="flex flex-col group cursor-default">
                <span class="font-headline-md text-headline-md font-bold text-primary group-hover:scale-105 spring-motion origin-left">0 ms</span>
                <span class="font-label-sm text-label-sm text-outline">Stream Buffer Lag</span>
              </div>
              <div class="flex flex-col group cursor-default">
                <span class="font-headline-md text-headline-md font-bold text-tertiary group-hover:scale-105 spring-motion origin-left">24/7</span>
                <span class="font-label-sm text-label-sm text-outline">Watch Party Lounge</span>
              </div>
            </div>
          </div>

          <!-- Right Interactive VIP Card Deck -->
          <div class="relative z-10 flex flex-col sm:flex-row items-center gap-space-md w-full lg:w-auto shrink-0">
            <!-- VIP Pass Card -->
            <div class="p-space-lg rounded-xl bg-surface-container-highest/60 backdrop-blur-xl border border-primary-container/30 hover:border-primary-container/70 flex flex-col gap-space-md w-full sm:w-72 shadow-xl hover:-translate-y-1.5 hover:shadow-[0_16px_36px_rgba(255,42,85,0.3)] spring-motion">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-space-xs">
                  <span class="material-symbols-outlined text-primary-container text-[22px] animate-pulse">workspace_premium</span>
                  <span class="font-label-md text-label-md font-bold uppercase tracking-wider">VIP PASS</span>
                </div>
                <span class="font-headline-sm text-headline-sm font-bold text-on-surface">$12.99<span class="font-body-sm text-body-sm text-outline">/mo</span></span>
              </div>
              <ul class="flex flex-col gap-space-xs font-body-sm text-body-sm text-on-surface-variant">
                <li class="flex items-center gap-2">
                  <span class="material-symbols-outlined text-secondary-container text-[16px]">check_circle</span>
                  <span>4K Ultra-HD + Dolby Vision</span>
                </li>
                <li class="flex items-center gap-2">
                  <span class="material-symbols-outlined text-secondary-container text-[16px]">check_circle</span>
                  <span>Synchronized Tokyo Watch Parties</span>
                </li>
                <li class="flex items-center gap-2">
                  <span class="material-symbols-outlined text-secondary-container text-[16px]">check_circle</span>
                  <span>Offline Master Downloads</span>
                </li>
              </ul>
              <button onclick="if(isLoggedIn()){ window.location.href='profile.html'; } else { openModal('login'); }" class="relative w-full py-2.5 rounded-full bg-primary-container text-on-primary-container font-label-md text-label-md uppercase tracking-wider font-bold shadow-[0_0_20px_rgba(255,42,85,0.5)] hover:shadow-[0_0_32px_rgba(255,42,85,0.9)] hover:scale-105 active:scale-95 sheen-effect overflow-hidden spring-motion cursor-pointer">
                <span class="relative z-10">Activate VIP Pass</span>
              </button>
            </div>

            <!-- Discord Lounge Card -->
            <div class="p-space-lg rounded-xl bg-surface-container-low border border-transparent hover:border-secondary-container/40 flex flex-col justify-between gap-space-md w-full sm:w-64 shadow-xl hover:-translate-y-1.5 hover:shadow-[0_16px_36px_rgba(0,238,252,0.25)] spring-motion">
              <div class="flex items-center gap-space-xs text-secondary-container">
                <span class="material-symbols-outlined text-[20px]">groups</span>
                <span class="font-label-md text-label-md font-bold uppercase tracking-wider">Discord Core</span>
              </div>
              <div class="flex flex-col gap-1">
                <span class="font-headline-sm text-headline-sm font-bold text-on-surface">148,200+</span>
                <span class="font-body-sm text-body-sm text-outline">Active Cinephiles &amp; Critics</span>
              </div>
              <a class="inline-flex items-center justify-center gap-2 py-2 px-4 rounded-full bg-surface-container-high text-on-surface hover:text-secondary-container hover:bg-surface-container-highest hover:scale-105 active:scale-95 spring-motion font-label-md text-label-md" href="https://discord.gg" target="_blank">
                <span>Join Broadcast Core</span>
                <span class="material-symbols-outlined text-[16px]">open_in_new</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      <!-- ==================== PUBLIC LIVE COMMUNITY CHAT SECTION ==================== -->
      <section class="w-full max-w-7xl mx-auto px-gutter-mobile lg:px-gutter pt-space-xl" id="publicLiveChatSection">
        <div class="flex items-center justify-between mb-space-sm">
          <div class="flex items-center gap-space-xs">
            <span class="material-symbols-outlined text-secondary-fixed text-[22px] drop-shadow-[0_0_8px_rgba(0,238,252,0.5)]">forum</span>
            <h2 class="font-headline-sm text-headline-sm font-bold text-on-surface">Public Community Live Feed</h2>
            <span class="px-2 py-0.5 rounded-full bg-secondary-container/15 text-secondary-fixed font-label-sm text-[10px] uppercase font-bold animate-pulse ml-2">Synced</span>
          </div>
        </div>
        <div id="publicChatWidgetContainer" class="w-full rounded-2xl overflow-hidden border border-surface-variant/40 bg-surface-container shadow-2xl min-h-[360px]">
          <!-- Connected to public-chat.js -->
        </div>
      </section>

    </div>
  </main>

  <!-- ==================== DESKTOP FOOTER ==================== -->
  <footer class="w-full bg-surface-container-lowest shadow-[0_-8px_32px_rgba(0,0,0,0.9)] border-t border-surface-variant/30 hidden lg:block">
    <div class="w-full px-gutter py-space-xl max-w-7xl mx-auto">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-space-xl">
        <div class="lg:col-span-2 flex flex-col gap-space-md">
          <div class="flex items-center gap-space-sm group cursor-pointer">
            <div class="flex items-center justify-center w-8 h-8 rounded-lg bg-surface-container shadow-[0_0_12px_rgba(0,238,252,0.3)] group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(0,238,252,0.6)] spring-motion">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M18.178 8c-1.38 0-2.61.644-3.414 1.645C13.606 8.167 11.758 7 9.5 7 5.91 7 3 9.91 3 13.5S5.91 20 9.5 20c2.258 0 4.106-1.167 5.264-2.645C15.568 18.356 16.798 19 18.178 19 20.84 19 23 16.84 23 14.178c0-2.662-2.16-4.178-4.822-4.178z" fill="#00eefc"></path>
              </svg>
            </div>
            <span class="font-headline-sm text-headline-sm font-extrabold tracking-wide text-secondary-container">INFINX<span class="text-primary-container ml-1">ANIME</span></span>
          </div>
          <p class="font-body-md text-body-md text-outline max-w-sm">Theatre Grade OLED Anime Streaming. Pure AMOLED zero-floor masterings, uncompressed audio bitrate, and simultaneous Tokyo transmissions.</p>
          <div class="flex items-center gap-space-xs mt-space-xs">
            <div class="px-2.5 py-1 rounded bg-surface-container-low font-label-sm text-label-sm text-secondary tracking-widest uppercase shadow-[0_0_8px_rgba(0,238,252,0.2)]">4K UHD</div>
            <div class="px-2.5 py-1 rounded bg-surface-container-low font-label-sm text-label-sm text-primary-fixed tracking-widest uppercase shadow-[0_0_8px_rgba(255,42,85,0.2)]">HDR10+</div>
            <div class="px-2.5 py-1 rounded bg-surface-container-low font-label-sm text-label-sm text-tertiary tracking-widest uppercase shadow-[0_0_8px_rgba(160,120,255,0.2)]">ATMOS</div>
          </div>
        </div>
        <div class="flex flex-col gap-space-sm">
          <span class="font-label-lg text-label-lg text-on-surface tracking-wider uppercase font-bold">Browse</span>
          <ul class="flex flex-col gap-space-xs font-body-sm text-body-sm text-outline">
            <li class="hover:text-secondary-container hover:translate-x-1 spring-motion"><a href="anime.html">Top Airing Masterpieces</a></li>
            <li class="hover:text-secondary-container hover:translate-x-1 spring-motion"><a href="#simulcastsSection">New Seasonal Releases</a></li>
            <li class="hover:text-secondary-container hover:translate-x-1 spring-motion"><a href="anime.html">Dual-Audio Dubbed</a></li>
            <li class="hover:text-secondary-container hover:translate-x-1 spring-motion"><a href="view.html#movies">Dolby Vision Features</a></li>
          </ul>
        </div>
        <div class="flex flex-col gap-space-sm">
          <span class="font-label-lg text-label-lg text-on-surface tracking-wider uppercase font-bold">Community</span>
          <ul class="flex flex-col gap-space-xs font-body-sm text-body-sm text-outline">
            <li class="hover:text-secondary-container hover:translate-x-1 spring-motion"><a href="https://discord.gg" target="_blank">Infinx Discord Core</a></li>
            <li class="hover:text-secondary-container hover:translate-x-1 spring-motion"><a href="#publicLiveChatSection" onclick="scrollToPublicChat(event)">Live Community Feed</a></li>
            <li class="hover:text-secondary-container hover:translate-x-1 spring-motion"><a href="video-player/index.html">Synchronized Watch Parties</a></li>
          </ul>
        </div>
        <div class="flex flex-col gap-space-sm">
          <span class="font-label-lg text-label-lg text-on-surface tracking-wider uppercase font-bold">System</span>
          <ul class="flex flex-col gap-space-xs font-body-sm text-body-sm text-outline">
            <li class="hover:text-secondary-container hover:translate-x-1 spring-motion"><a href="profile.html">Otaku Passport</a></li>
            <li class="hover:text-secondary-container hover:translate-x-1 spring-motion"><a href="download.html">Device Applications</a></li>
            <li class="hover:text-secondary-container hover:translate-x-1 spring-motion"><a href="admin.html">Studio Administration</a></li>
          </ul>
        </div>
      </div>
      <div class="mt-space-xl pt-space-lg border-t border-surface-variant/30 flex flex-col md:flex-row items-center justify-between gap-space-md">
        <span class="font-body-sm text-body-sm text-outline">© 2025 INFINX ANIME BROADCAST CORP. ALL RIGHTS RESERVED. ZERO RE-COMPRESSION STANDARD.</span>
        <div class="flex items-center gap-space-md">
          <span class="relative flex h-2.5 w-2.5">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary-container opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-secondary-container shadow-[0_0_10px_#00eefc]"></span>
          </span>
          <span class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">All Tokyo Feeds Nominal</span>
        </div>
      </div>
    </div>
  </footer>

  <!-- ==================== MOBILE CARD FOOTER ==================== -->
  <footer class="block lg:hidden px-gutter-mobile pb-28 pt-space-lg">
    <div class="p-space-lg rounded-2xl bg-surface-container-low border border-surface-variant/40 shadow-xl flex flex-col gap-space-md text-center">
      <div class="flex items-center justify-center gap-2">
        <span class="font-headline-sm text-secondary-container font-extrabold tracking-wide">INFINX<span class="text-primary-container ml-1">ANIME</span></span>
      </div>
      <p class="font-body-sm text-xs text-outline">Theatre Grade OLED Anime Streaming. Pure AMOLED black mastering and raw uncompressed audio.</p>
      <div class="flex items-center justify-center gap-4 text-xs font-bold text-on-surface-variant">
        <a href="anime.html" class="hover:text-secondary-container">Browse</a>
        <span>•</span>
        <a href="view.html#watchlist" class="hover:text-secondary-container">Watchlist</a>
        <span>•</span>
        <a href="profile.html" class="hover:text-secondary-container">Passport</a>
      </div>
      <p class="font-label-sm text-[10px] text-outline/60 mt-1">
        © 2025 INFINX ANIME • TOKYO BROADCAST FEED
      </p>
    </div>
  </footer>

  <!-- ==================== MOBILE FLOATING BOTTOM TAB BAR (Exact 5 Tabs from Stitch Mobile) ==================== -->
  <nav class="fixed bottom-0 left-0 right-0 z-50 pb-safe pointer-events-none lg:hidden">
    <div class="px-gutter-mobile pb-space-sm pt-space-xs max-w-lg mx-auto pointer-events-auto">
      <div class="flex items-center justify-around h-16 rounded-full bg-surface-container-lowest/85 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] border border-surface-variant/40 px-1 sm:px-space-xs">
        <a aria-current="page" class="flex flex-col items-center justify-center min-w-[40px] sm:min-w-[44px] min-h-[44px] px-1.5 sm:px-space-sm rounded-full transition-all text-secondary-fixed bg-surface-variant/70 shadow-[0_0_16px_rgba(0,238,252,0.3)]" href="index.html">
          <span class="material-symbols-outlined text-[20px] sm:text-[22px]">home</span>
          <span class="text-[10px] sm:text-label-sm font-medium tracking-tight sm:tracking-normal">Home</span>
        </a>
        <a class="flex flex-col items-center justify-center min-w-[40px] sm:min-w-[44px] min-h-[44px] px-1.5 sm:px-space-sm rounded-full text-on-surface-variant transition-all hover:text-on-surface" href="anime.html">
          <span class="material-symbols-outlined text-[20px] sm:text-[22px]">explore</span>
          <span class="text-[10px] sm:text-label-sm font-medium tracking-tight sm:tracking-normal">Browse</span>
        </a>
        <a class="flex flex-col items-center justify-center min-w-[40px] sm:min-w-[44px] min-h-[44px] px-1.5 sm:px-space-sm rounded-full text-on-surface-variant transition-all hover:text-on-surface" href="view.html#watchlist">
          <span class="material-symbols-outlined text-[20px] sm:text-[22px]">bookmark</span>
          <span class="text-[10px] sm:text-label-sm font-medium tracking-tight sm:tracking-normal">Watchlist</span>
        </a>
        <a class="flex flex-col items-center justify-center min-w-[40px] sm:min-w-[44px] min-h-[44px] px-1.5 sm:px-space-sm rounded-full text-on-surface-variant transition-all hover:text-on-surface" href="download.html">
          <span class="material-symbols-outlined text-[20px] sm:text-[22px]">download_for_offline</span>
          <span class="text-[10px] sm:text-label-sm font-medium tracking-tight sm:tracking-normal">Downloads</span>
        </a>
        <a class="flex flex-col items-center justify-center min-w-[40px] sm:min-w-[44px] min-h-[44px] px-1.5 sm:px-space-sm rounded-full text-on-surface-variant transition-all hover:text-on-surface" href="profile.html">
          <span class="material-symbols-outlined text-[20px] sm:text-[22px]">person</span>
          <span class="text-[10px] sm:text-label-sm font-medium tracking-tight sm:tracking-normal">Profile</span>
        </a>
      </div>
    </div>
  </nav>

  <!-- ==================== SIGN IN MODAL ==================== -->
  <div class="infinx-modal" id="loginModal" onclick="if(event.target === this) closeModal('login')">
    <div class="relative w-full max-w-md p-6 sm:p-8 rounded-2xl bg-surface-container-low border border-surface-variant shadow-[0_25px_60px_rgba(0,0,0,0.9)] text-on-surface">
      <button class="absolute top-4 right-4 text-outline hover:text-on-surface p-1 cursor-pointer" onclick="closeModal('login')">
        <span class="material-symbols-outlined text-[24px]">close</span>
      </button>
      <div class="flex items-center gap-2 mb-1">
        <span class="material-symbols-outlined text-secondary-container text-[24px]">vpn_key</span>
        <h2 class="font-headline-md text-2xl font-bold">Sign In</h2>
      </div>
      <p class="font-body-sm text-xs text-outline mb-6">Enter your credentials to access 80 Mbps master anime streams.</p>
      
      <form id="loginForm" class="flex flex-col gap-4">
        <div class="flex flex-col gap-1.5">
          <label class="font-label-md text-xs text-on-surface-variant font-semibold">Email Address</label>
          <input type="email" id="loginEmail" required placeholder="name@example.com" class="w-full px-4 py-3 rounded-xl bg-surface-container-highest/60 border border-surface-variant text-on-surface placeholder:text-outline focus:outline-none focus:border-secondary-container focus:ring-1 focus:ring-secondary-container transition-all" />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="font-label-md text-xs text-on-surface-variant font-semibold">Password</label>
          <input type="password" id="loginPassword" required placeholder="••••••••" class="w-full px-4 py-3 rounded-xl bg-surface-container-highest/60 border border-surface-variant text-on-surface placeholder:text-outline focus:outline-none focus:border-secondary-container focus:ring-1 focus:ring-secondary-container transition-all" />
        </div>
        <button type="submit" class="w-full py-3.5 mt-2 rounded-full bg-primary-container text-on-primary-container font-label-md text-sm font-bold uppercase tracking-wider shadow-[0_0_24px_rgba(255,42,85,0.6)] hover:shadow-[0_0_36px_rgba(255,42,85,0.95)] hover:scale-[1.02] active:scale-95 transition-all cursor-pointer">
          Authorize Login
        </button>
      </form>

      <div class="mt-6 text-center text-xs text-outline">
        Don't have an account? 
        <a href="#" onclick="switchModal('login', 'register')" class="text-secondary-container hover:underline font-bold ml-1">Create Account</a>
      </div>
    </div>
  </div>

  <!-- ==================== SIGN UP MODAL ==================== -->
  <div class="infinx-modal" id="registerModal" onclick="if(event.target === this) closeModal('register')">
    <div class="relative w-full max-w-md p-6 sm:p-8 rounded-2xl bg-surface-container-low border border-surface-variant shadow-[0_25px_60px_rgba(0,0,0,0.9)] text-on-surface">
      <button class="absolute top-4 right-4 text-outline hover:text-on-surface p-1 cursor-pointer" onclick="closeModal('register')">
        <span class="material-symbols-outlined text-[24px]">close</span>
      </button>
      <div class="flex items-center gap-2 mb-1">
        <span class="material-symbols-outlined text-primary-container text-[24px]">person_add</span>
        <h2 class="font-headline-md text-2xl font-bold">Create Passport</h2>
      </div>
      <p class="font-body-sm text-xs text-outline mb-6">Join the high-fidelity OLED anime network today.</p>
      
      <form id="registerForm" class="flex flex-col gap-4">
        <div class="flex flex-col gap-1.5">
          <label class="font-label-md text-xs text-on-surface-variant font-semibold">Email Address</label>
          <input type="email" id="registerEmail" required placeholder="name@example.com" class="w-full px-4 py-3 rounded-xl bg-surface-container-highest/60 border border-surface-variant text-on-surface placeholder:text-outline focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all" />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="font-label-md text-xs text-on-surface-variant font-semibold">Password</label>
          <input type="password" id="registerPassword" required placeholder="••••••••" class="w-full px-4 py-3 rounded-xl bg-surface-container-highest/60 border border-surface-variant text-on-surface placeholder:text-outline focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all" />
        </div>
        <button type="submit" class="w-full py-3.5 mt-2 rounded-full bg-primary-container text-on-primary-container font-label-md text-sm font-bold uppercase tracking-wider shadow-[0_0_24px_rgba(255,42,85,0.6)] hover:shadow-[0_0_36px_rgba(255,42,85,0.95)] hover:scale-[1.02] active:scale-95 transition-all cursor-pointer">
          Initialize Account
        </button>
      </form>

      <div class="mt-6 text-center text-xs text-outline">
        Already have an account? 
        <a href="#" onclick="switchModal('register', 'login')" class="text-secondary-container hover:underline font-bold ml-1">Sign In</a>
      </div>
    </div>
  </div>

  <!-- ==================== JAVASCRIPT LOGIC ==================== -->
  <script src="https://unpkg.com/swiper@8/swiper-bundle.min.js"></script>

  <script>
    /* Backend API Connectivity */
    const getLocalBackend = () => {
      const saved = localStorage.getItem('infinx_server_url');
      if (saved && !saved.startsWith('file:')) return saved.replace(/\/$/, '');
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:8000';
      }
      return 'http://13.202.95.5:8000';
    };

    const API_BASE = (function () {
      if (typeof window !== 'undefined' && window.API_BASE && !window.API_BASE.startsWith('file:')) {
        return window.API_BASE;
      }
      return `${getLocalBackend()}/api`;
    })();

    window.formatMediaUrl = function (url) {
      if (!url) return 'Postes/spyfamS3p.jpg';
      if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
        return url;
      }
      const cleanPath = url.replace(/^[\/]+/, '');
      if (cleanPath.startsWith('uploads/') || cleanPath.startsWith('posters/') || cleanPath.startsWith('banners/')) {
        return `${getLocalBackend()}/${cleanPath}`;
      }
      return `${getLocalBackend()}/uploads/${cleanPath}`;
    };

    const getAuthHeader = () => {
      const token = localStorage.getItem('infinx_token');
      return token ? { 'Authorization': `Bearer ${token}` } : {};
    };

    const isLoggedIn = () => !!localStorage.getItem('infinx_token');

    let allShowsCache = [];
    let globalCategoriesData = [];
    let userWatchlist = [];
    let heroSwiperInstance = null;
    let searchDebounceTimeout = null;

    /* Category Metadata & Icons */
    const CATEGORY_MAP = {
      'anime': { name: 'Anime Series', icon: 'fa-play-circle', color: '#00eefc' },
      'anime-series': { name: 'Anime Series', icon: 'fa-play-circle', color: '#00eefc' },
      'action': { name: 'Action & Sci-Fi', icon: 'fa-fire', color: '#ff2a55' },
      'hollywood': { name: 'Hollywood Movies', icon: 'fa-film', color: '#a078ff' },
      'hollywood-movies': { name: 'Hollywood Movies', icon: 'fa-film', color: '#a078ff' },
      'web-series': { name: 'Web Series', icon: 'fa-tv', color: '#00eefc' },
      'kids': { name: 'Kids & Family', icon: 'fa-child', color: '#ffb2b8' },
      'kids-family': { name: 'Kids & Family', icon: 'fa-child', color: '#ffb2b8' },
      'horror': { name: 'Horror & Thriller', icon: 'fa-ghost', color: '#ff506e' },
      'comedy': { name: 'Comedy', icon: 'fa-laugh-beam', color: '#7df4ff' },
      'drama': { name: 'Drama', icon: 'fa-theater-masks', color: '#d0bcff' },
      'adventure': { name: 'Adventure', icon: 'fa-compass', color: '#00eefc' },
      'animation': { name: 'Animation', icon: 'fa-magic', color: '#ff758f' },
      'fantasy': { name: 'Fantasy', icon: 'fa-dragon', color: '#a078ff' },
      'sci-fi': { name: 'Sci-Fi', icon: 'fa-atom', color: '#00eefc' },
      'thriller': { name: 'Thriller', icon: 'fa-bolt', color: '#ff2a55' }
    };

    /* ==================== 1. HERO SPOTLIGHT CAROUSEL (Real Server Shows) ==================== */
    async function loadCarousel() {
      const wrapper = document.getElementById('carouselWrapper');
      if (!wrapper) return;

      try {
        let slideDelay = 6000;
        try {
          const settingsRes = await fetch(`${API_BASE}/settings`);
          if (settingsRes.ok) {
            const settingsData = await settingsRes.json();
            if (settingsData.bannerSlideTime) slideDelay = settingsData.bannerSlideTime;
          }
        } catch (err) { }

        const res = await fetch(`${API_BASE}/shows/carousel`);
        let carouselShows = [];
        if (res.ok) {
          carouselShows = await res.json();
        }

        // If fewer than 2 shows, supplement with top rated shows from database
        if (!carouselShows || carouselShows.length < 2) {
          try {
            const allRes = await fetch(`${API_BASE}/shows`);
            if (allRes.ok) {
              const all = await allRes.json();
              carouselShows = all.slice(0, 5);
            }
          } catch (e) { }
        }

        if (!carouselShows || carouselShows.length === 0) {
          wrapper.innerHTML = `
            <div class="swiper-slide relative w-full h-[600px] flex items-center justify-center bg-surface-container-lowest">
              <p class="text-outline">No featured shows available on the server.</p>
            </div>
          `;
          return;
        }

        let slidesHtml = '';
        carouselShows.forEach((show, idx) => {
          const playLink = show.episodes && show.episodes.length > 0
            ? `/watch?id=${show.episodes[0].id}`
            : `/watch?id=${show.id}`;
          
          const rawBanner = show.banner || show.poster;
          const mediaUrl = rawBanner ? window.formatMediaUrl(rawBanner) : 'Postes/spyfamS3p.jpg';
          const isVideo = rawBanner && (rawBanner.toLowerCase().endsWith('.mp4') || rawBanner.toLowerCase().endsWith('.webm') || rawBanner.toLowerCase().endsWith('.mkv') || rawBanner.toLowerCase().endsWith('.mov'));
          
          const categoryNames = show.categories && show.categories.length > 0
            ? show.categories.map(c => c.category ? c.category.name : c).join(' • ')
            : 'Theatre Cinema';

          const epCount = show.episodes ? show.episodes.length : 1;
          const ratingVal = show.rating ? show.rating.toFixed(1) : '9.5';
          const showDesc = show.description || 'Experience raw high-fidelity cinema mastered directly from Tokyo studio production pipelines with zero re-compression.';

          // Split title to give cyberpunk accent glow on last word
          const words = (show.title || 'Infinx Feature').split(' ');
          const firstPart = words.slice(0, -1).join(' ');
          const lastWord = words[words.length - 1];

          slidesHtml += `
            <div class="swiper-slide relative w-full overflow-hidden">
              <div class="relative w-full aspect-[16/10] sm:aspect-[21/9] lg:aspect-auto min-h-[380px] sm:min-h-[460px] lg:h-[840px] flex items-end overflow-hidden ${!isVideo ? 'bg-cover bg-center' : 'bg-surface-container-lowest'}" ${!isVideo ? `style="background-image: url('${mediaUrl}')"` : ''}>
                
                ${isVideo ? `
                  <video class="absolute inset-0 w-full h-full object-cover pointer-events-none" autoplay loop muted playsinline>
                    <source src="${mediaUrl}" type="video/mp4">
                  </video>
                ` : ''}

                <!-- Dynamic Ambient Pulsing Cyber Light Layer -->
                <div class="absolute inset-0 cyber-ambient-light pointer-events-none mix-blend-screen opacity-90"></div>

                <!-- Deep Multistage Scrim Overlays for Pure AMOLED Blend -->
                <div class="absolute inset-0 bg-gradient-to-r from-surface-container-lowest via-surface-container-lowest/80 to-transparent"></div>
                <div class="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/40 to-transparent"></div>
                <div class="hidden lg:block absolute inset-0 bg-gradient-to-b from-surface-container-lowest/90 via-transparent to-transparent h-48"></div>

                <!-- Hero Content Plate -->
                <div class="relative z-10 w-full p-space-md sm:p-space-lg lg:p-0 lg:max-w-7xl lg:mx-auto lg:px-gutter lg:pb-24 lg:pt-32 flex flex-col justify-end gap-space-xs lg:gap-space-md">
                  
                  <!-- Master Metatags / Live Badges -->
                  <div class="flex flex-wrap items-center gap-space-xs">
                    <span class="inline-flex items-center gap-1.5 px-space-sm py-1 rounded-full bg-secondary-container/15 text-secondary-container shadow-[0_0_16px_rgba(0,238,252,0.35)] font-label-sm text-label-sm uppercase tracking-wider animate-pulse">
                      <span class="w-1.5 h-1.5 rounded-full bg-secondary-container animate-ping"></span>
                      #${idx + 1} Featured Release
                    </span>
                    <span class="px-2.5 py-1 rounded bg-surface-container-high/90 text-on-surface font-label-sm text-label-sm tracking-widest uppercase">
                      Simulcast
                    </span>
                    <span class="px-2 py-1 rounded bg-surface-container-high/90 text-primary font-label-sm text-label-sm tracking-widest uppercase font-bold">
                      4K HDR
                    </span>
                    <span class="hidden sm:inline-block px-2 py-1 rounded bg-surface-container-high/90 text-tertiary font-label-sm text-label-sm tracking-widest uppercase font-bold">
                      Dolby Atmos
                    </span>
                    <div class="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-surface-container-high/90 text-secondary">
                      <span class="material-symbols-outlined text-[14px]" style="font-variation-settings: 'FILL' 1;">star</span>
                      <span class="font-label-sm text-label-sm font-bold">${ratingVal}</span>
                    </div>
                  </div>

                  <!-- Editorial Title Presentation with Glowing Neon Bloom -->
                  <div class="flex flex-col">
                    <span class="font-label-md text-label-md text-secondary-container tracking-[0.3em] uppercase drop-shadow-[0_0_8px_rgba(0,238,252,0.4)] hidden lg:block">
                      Tokyo Broadcast Master • 60 FPS
                    </span>
                    <h1 class="font-headline-lg-mobile sm:font-headline-lg lg:font-display-hero text-headline-lg-mobile sm:text-headline-lg lg:text-display-hero text-on-surface drop-shadow-[0_8px_32px_rgba(0,0,0,0.9)] tracking-tight leading-tight">
                      ${firstPart} <span class="text-primary-container drop-shadow-[0_0_24px_rgba(255,42,85,0.6)] neon-bloom-flicker inline-block">${lastWord}</span>
                    </h1>
                  </div>

                  <!-- Series Metadata line -->
                  <div class="flex flex-wrap items-center gap-x-space-sm gap-y-1 font-label-sm lg:font-label-lg text-label-sm lg:text-label-lg text-outline">
                    <span class="text-secondary-fixed font-bold">${epCount > 1 ? `EPISODES: ${epCount}` : 'FULL FEATURE'}</span>
                    <span>•</span>
                    <span class="text-on-surface-variant font-medium">${categoryNames}</span>
                    <span>•</span>
                    <span class="px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface text-[9px] font-bold">SUB/DUB</span>
                    <span class="text-primary-fixed">• TV-MA</span>
                  </div>

                  <!-- Synopsis Snippet -->
                  <p class="hidden lg:block font-body-lg text-body-lg text-on-surface-variant max-w-xl line-clamp-3 leading-relaxed">
                    ${showDesc}
                  </p>

                  <!-- Dual Primary CTAs & Transport Action -->
                  <div class="flex items-center gap-space-sm sm:gap-space-md pt-space-xs">
                    <!-- Watch Now Button with Pink Sheen -->
                    <a href="${playLink}" onclick="return window.requireAuthPlay(event, '${playLink}')" class="relative inline-flex items-center gap-space-xs sm:gap-space-sm px-5 sm:px-7 py-2.5 sm:py-3.5 rounded-full bg-primary-container text-on-primary-container font-label-md sm:font-label-lg text-label-md sm:text-label-lg shadow-[0_0_28px_rgba(255,42,85,0.5)] hover:shadow-[0_0_42px_rgba(255,42,85,0.95)] hover:scale-105 active:scale-95 sheen-effect overflow-hidden spring-motion group cursor-pointer">
                      <span class="material-symbols-outlined text-[20px] sm:text-[22px] group-hover:scale-110 spring-motion" style="font-variation-settings: 'FILL' 1;">play_arrow</span>
                      <span class="tracking-wider uppercase font-bold relative z-10">Watch Now</span>
                    </a>

                    <!-- Frosted Glass Add to Watchlist -->
                    <button onclick="toggleWatchlist(this, ${show.id})" class="inline-flex items-center gap-space-xs px-4 sm:px-6 py-2.5 sm:py-3.5 rounded-full bg-surface-container-high/80 text-on-surface border border-transparent hover:border-secondary-container/50 hover:text-secondary-container hover:bg-surface-container-highest hover:shadow-[0_0_24px_rgba(0,238,252,0.35)] hover:scale-105 active:scale-95 spring-motion font-label-md sm:font-label-lg text-label-md sm:text-label-lg backdrop-blur-xl shadow-lg cursor-pointer group">
                      <span class="material-symbols-outlined text-[18px] sm:text-[20px] group-hover:scale-110 spring-motion">bookmark_add</span>
                      <span class="tracking-wide hidden xs:inline">Watchlist</span>
                    </button>

                    <!-- Details Trigger -->
                    <button onclick="window.openShowDetails(${show.id})" class="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-surface-container-low/90 text-on-surface hover:text-secondary hover:bg-surface-container-high hover:scale-110 hover:shadow-[0_0_18px_rgba(0,238,252,0.4)] spring-motion cursor-pointer shadow-md group" title="Show Details">
                      <span class="material-symbols-outlined text-[20px] sm:text-[22px] group-hover:rotate-12 spring-motion">theaters</span>
                    </button>
                  </div>

                </div>
              </div>
            </div>
          `;
        });

        wrapper.innerHTML = slidesHtml;

        // Initialize Swiper Hero
        if (heroSwiperInstance) heroSwiperInstance.destroy(true, true);
        heroSwiperInstance = new Swiper('.hero-slider', {
          loop: carouselShows.length > 1,
          autoplay: carouselShows.length > 1 ? { delay: slideDelay, disableOnInteraction: false } : false,
          pagination: {
            el: '.swiper-pagination',
            clickable: true
          },
          navigation: {
            nextEl: '.swiper-btn-next',
            prevEl: '.swiper-btn-prev'
          },
          effect: 'fade',
          fadeEffect: { crossFade: true },
          speed: 800
        });

      } catch (err) {
        console.error('Error loading carousel:', err);
      }
    }

    /* ==================== 2. TOP 10 MASTERPIECES TODAY (Real Shows from DB) ==================== */
    async function loadTop10Masterpieces() {
      const grid = document.getElementById('top10Grid');
      if (!grid) return;

      try {
        if (!allShowsCache || allShowsCache.length === 0) {
          const res = await fetch(`${API_BASE}/shows`);
          if (res.ok) allShowsCache = await res.json();
        }

        // Sort by highest rating descending
        const topShows = [...allShowsCache]
          .sort((a, b) => (b.rating || 0) - (a.rating || 0))
          .slice(0, 10);

        if (!topShows || topShows.length === 0) {
          grid.innerHTML = '<div class="w-full py-8 text-center text-outline">No shows in database.</div>';
          return;
        }

        let html = '';
        topShows.forEach((show, index) => {
          const rank = index + 1;
          const posterUrl = window.formatMediaUrl(show.poster);
          const ratingVal = show.rating ? show.rating.toFixed(1) : '9.0';
          const cats = show.categories && show.categories.length > 0
            ? show.categories.map(c => c.category ? c.category.name : c).join(' / ')
            : 'Master Series';

          let rankBadge = 'HD';
          if (rank === 1) rankBadge = '#1 TOP';
          else if (show.type === 'movie' || (show.categories && show.categories.some(c => (c.category?.name || c).includes('Movie')))) rankBadge = 'MOVIE';
          else if (rank <= 3) rankBadge = 'HOT';
          else if (show.badge) rankBadge = show.badge;

          html += `
            <div class="relative flex items-center lg:items-end group cursor-pointer pt-2 lg:pt-12 w-[140px] sm:w-[170px] lg:w-full shrink-0 snap-start pl-6 lg:pl-0" onclick="window.openShowDetails(${show.id})">
              <!-- Giant Numerals Behind Poster -->
              <span class="absolute -left-1 lg:-left-6 top-1/2 -translate-y-1/2 lg:top-auto lg:translate-y-0 lg:-top-2 text-[88px] lg:text-[140px] leading-none font-black font-display-hero-mobile lg:font-display-hero text-surface-container-highest/60 lg:text-surface-container-highest/40 select-none pointer-events-none drop-shadow-[0_0_12px_rgba(0,238,252,0.25)] group-hover:text-secondary-container group-hover:opacity-75 group-hover:drop-shadow-[0_0_24px_rgba(0,238,252,0.8)] spring-motion">
                ${rank}
              </span>
              <div class="relative z-10 w-[140px] lg:w-full rounded-xl overflow-hidden bg-surface-container shadow-xl group spring-motion group-hover:-translate-y-2.5 group-hover:shadow-[0_16px_36px_rgba(0,238,252,0.35)] group-hover:ring-1 group-hover:ring-secondary-container/50">
                <div class="relative w-full aspect-[2/3] bg-surface-container-lowest overflow-hidden">
                  <img class="w-full h-full object-cover group-hover:scale-105 transition-all duration-300" src="${posterUrl}" alt="${show.title}" loading="lazy" onerror="this.onerror=null; this.src='Postes/spyfamS3p.jpg';" />
                  <div class="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-transparent to-transparent"></div>
                  <span class="absolute top-space-xs left-space-xs px-1.5 py-0.5 rounded bg-primary-container text-on-primary-container font-label-sm text-[10px] font-bold">${rankBadge}</span>
                  <span class="absolute bottom-space-xs right-space-xs px-1.5 py-0.5 rounded bg-surface-container-lowest/80 text-secondary-fixed text-[10px] font-label-sm flex items-center gap-0.5">
                    <span class="material-symbols-outlined text-[12px] text-primary" style="font-variation-settings: 'FILL' 1;">star</span>${ratingVal}
                  </span>
                </div>
                <div class="p-space-xs flex flex-col">
                  <p class="font-label-md text-label-md font-bold text-on-surface truncate group-hover:text-secondary-container transition-colors">${show.title}</p>
                  <span class="font-body-sm text-[11px] text-on-surface-variant/70 truncate">${cats}</span>
                </div>
              </div>
            </div>
          `;
        });

        grid.innerHTML = html;
      } catch (err) {
        console.error('Error loading top 10:', err);
      }
    }

    /* ==================== 3. SEASONAL SIMULCASTS (Real Anime from Server) ==================== */
    async function loadSeasonalSimulcasts() {
      const container = document.getElementById('simulcastContainer');
      if (!container) return;

      try {
        if (!allShowsCache || allShowsCache.length === 0) {
          const res = await fetch(`${API_BASE}/shows`);
          if (res.ok) allShowsCache = await res.json();
        }

        // Filter anime series or shows in Anime Series category
        let animeShows = allShowsCache.filter(s => {
          if (s.categories && s.categories.some(c => (c.category?.name || c).toLowerCase().includes('anime'))) return true;
          return s.title.toLowerCase().includes('chainsaw') || s.title.toLowerCase().includes('piece') || s.title.toLowerCase().includes('dandadan') || s.title.toLowerCase().includes('stone');
        });

        if (animeShows.length === 0) {
          animeShows = allShowsCache.slice(0, 4);
        }

        const days = ['Every Friday', 'Every Saturday', 'Every Sunday', 'Every Monday', 'Every Thursday'];
        const times = ['23:30 JST', '01:00 JST', 'Tomorrow 21:00', 'Sunday 18:30'];

        // Mobile View: 2:3 Vertical Cards Snap Carousel
        let mobileHtml = `
          <div class="flex lg:hidden gap-space-md overflow-x-auto no-scrollbar px-gutter-mobile snap-x snap-mandatory">
        `;
        animeShows.forEach((show, idx) => {
          const posterUrl = window.formatMediaUrl(show.poster);
          const dayTag = days[idx % days.length];
          const ratingVal = show.rating ? show.rating.toFixed(1) : '9.4';
          const epCount = show.episodes ? show.episodes.length : 1;

          mobileHtml += `
            <div class="w-[145px] shrink-0 snap-start flex flex-col rounded-xl overflow-hidden bg-surface-container-low shadow-lg group cursor-pointer" onclick="window.openShowDetails(${show.id})">
              <div class="relative w-full aspect-[2/3] bg-surface-container-lowest">
                <img class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" src="${posterUrl}" alt="${show.title}" loading="lazy" onerror="this.onerror=null; this.src='Postes/spyfamS3p.jpg';" />
                <div class="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-transparent to-transparent"></div>
                <div class="absolute top-space-xs left-space-xs flex flex-col gap-1">
                  <span class="px-1.5 py-0.5 rounded bg-primary-container text-on-primary-container font-label-sm text-[9px] font-bold">EP ${epCount}</span>
                  <span class="px-1.5 py-0.5 rounded bg-surface-container-lowest/90 text-secondary-fixed font-label-sm text-[9px]">SUB/DUB</span>
                </div>
                <span class="absolute bottom-space-xs right-space-xs px-1 rounded bg-surface-container-lowest/80 text-secondary-fixed text-[10px] font-label-sm flex items-center gap-0.5">
                  <span class="material-symbols-outlined text-[12px] text-primary" style="font-variation-settings: 'FILL' 1;">star</span>${ratingVal}
                </span>
              </div>
              <div class="p-space-xs flex flex-col gap-0.5">
                <h3 class="font-label-md text-label-md font-bold text-on-surface truncate">${show.title}</h3>
                <span class="font-body-sm text-[11px] text-on-surface-variant/70">Tokyo Broadcast</span>
                <span class="px-1.5 py-0.5 mt-0.5 rounded-full bg-surface-container text-secondary-fixed font-label-sm text-[9px] w-fit">${dayTag}</span>
              </div>
            </div>
          `;
        });
        mobileHtml += `</div>`;

        // Desktop View: 16:9 Grid Schedule
        let desktopHtml = `
          <div class="hidden lg:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-md px-gutter">
        `;
        animeShows.slice(0, 4).forEach((show, idx) => {
          const bannerUrl = window.formatMediaUrl(show.banner || show.poster);
          const timeTag = times[idx % times.length];
          const dayTag = days[idx % days.length];
          const epCount = show.episodes ? show.episodes.length : 1;

          desktopHtml += `
            <div class="p-space-md rounded-xl bg-surface-container-low border border-transparent hover:border-secondary-container/40 hover:bg-surface-container spring-motion hover:-translate-y-2 hover:shadow-[0_12px_28px_rgba(0,238,252,0.2)] flex flex-col gap-space-sm group cursor-pointer shadow-lg hover-bell" onclick="window.openShowDetails(${show.id})">
              <div class="relative w-full aspect-video rounded-lg overflow-hidden bg-surface-container-lowest">
                <img class="w-full h-full object-cover spring-motion group-hover:scale-105" src="${bannerUrl}" alt="${show.title}" loading="lazy" onerror="this.onerror=null; this.src='Postes/spyfamS3.jpg';" />
                <div class="absolute inset-0 bg-gradient-to-t from-surface-container-lowest/80 via-transparent to-transparent"></div>
                <span class="absolute top-2 left-2 px-2 py-0.5 rounded bg-surface-container-lowest/90 text-secondary-container font-label-sm text-label-sm font-bold">
                  ${timeTag}
                </span>
                <span class="absolute bottom-2 left-2 font-label-sm text-label-sm text-on-surface font-bold">
                  Episode ${epCount} Airing
                </span>
              </div>
              <div class="flex flex-col">
                <div class="flex items-center justify-between">
                  <span class="font-label-sm text-label-sm text-primary-fixed uppercase tracking-wider font-bold">${dayTag}</span>
                  <button class="text-outline hover:text-secondary-container transition-colors" title="Add reminder">
                    <span class="material-symbols-outlined text-[18px] bell-icon inline-block">alarm_add</span>
                  </button>
                </div>
                <span class="font-headline-sm text-headline-sm font-bold text-on-surface truncate group-hover:text-secondary-container transition-colors mt-0.5">${show.title}</span>
                <span class="font-body-sm text-body-sm text-outline mt-0.5">Simulcast • Dolby Atmos</span>
              </div>
            </div>
          `;
        });
        desktopHtml += `</div>`;

        container.innerHTML = mobileHtml + desktopHtml;
      } catch (err) {
        console.error('Error loading simulcasts:', err);
      }
    }

    /* ==================== 4. CONTINUE WATCHING (Real User History) ==================== */
    async function loadContinueWatching() {
      const container = document.getElementById('continueWatchingSection');
      const grid = document.getElementById('continueWatchingGrid');
      if (!container || !grid) return;

      try {
        let serverHistory = [];
        const token = localStorage.getItem('infinx_token');
        if (token) {
          try {
            const res = await fetch(`${API_BASE}/user/history`, { headers: getAuthHeader() });
            if (res.ok) serverHistory = await res.json();
          } catch (e) { }
        }

        let localHistory = [];
        try {
          const raw = localStorage.getItem('@infinx_continue_watching');
          if (raw) localHistory = JSON.parse(raw);
          if (!Array.isArray(localHistory)) localHistory = [];
        } catch (e) { localHistory = []; }

        const mergedMap = new Map();
        localHistory.forEach(item => {
          if (!item) return;
          const key = `item-${item.showId || item.id || item.episodeId}`;
          mergedMap.set(key, item);
        });
        serverHistory.forEach(item => {
          if (!item) return;
          const key = `item-${item.episode?.show?.id || item.episodeId || item.showId}`;
          if (!mergedMap.has(key)) mergedMap.set(key, item);
        });

        const allItems = Array.from(mergedMap.values());

        if (allItems.length > 0) {
          container.classList.remove('hidden');
          const countBadge = document.getElementById('continueWatchingCount');
          if (countBadge) countBadge.textContent = `${allItems.length} In-Flight`;

          let html = '';
          allItems.slice(0, 8).forEach(item => {
            const duration = item.duration || 1400;
            const progress = item.progress || 300;
            const percent = item.percent !== undefined ? item.percent : Math.min(100, Math.max(10, Math.round((progress / duration) * 100)));
            const minsLeft = Math.max(1, Math.round((duration - progress) / 60));

            const title = item.title || item.episode?.show?.title || 'Anime Episode';
            const epTitle = item.episodeTitle || item.episode?.title || `Episode ${item.episodeNumber || 1}`;
            const poster = window.formatMediaUrl(item.poster || item.episode?.show?.poster || item.banner);
            const playUrl = item.episodeId ? `/watch?id=${item.episodeId}` : (item.showId ? `/watch?id=${item.showId}` : '/anime.html');

            html += `
              <div class="group relative flex flex-col rounded-xl overflow-hidden bg-surface-container-low border border-transparent hover:border-primary-container/40 shadow-xl hover:shadow-[0_14px_30px_rgba(255,42,85,0.25)] hover:-translate-y-2 spring-motion cursor-pointer w-[260px] lg:w-full shrink-0 snap-start" onclick="window.location.href='${playUrl}'">
                <div class="relative w-full aspect-video overflow-hidden bg-surface-container-lowest">
                  <img class="w-full h-full object-cover spring-motion group-hover:scale-105" src="${poster}" alt="${title}" loading="lazy" onerror="this.onerror=null; this.src='Postes/spyfamS3.jpg';" />
                  <div class="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/20 to-transparent"></div>
                  
                  <!-- Hover Play Button -->
                  <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-surface-container-lowest/50 backdrop-blur-xs">
                    <div class="w-12 h-12 rounded-full bg-primary-container/90 text-on-primary-container flex items-center justify-center shadow-[0_0_20px_#ff2a55] transform group-hover:scale-110 spring-motion">
                      <span class="material-symbols-outlined text-[24px]" style="font-variation-settings: 'FILL' 1;">play_arrow</span>
                    </div>
                  </div>

                  <span class="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-surface-container-lowest/80 text-outline font-label-sm text-label-sm backdrop-blur-md">
                    ${minsLeft}m left
                  </span>
                  <span class="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-surface-container-lowest/90 text-secondary font-label-sm text-label-sm uppercase font-bold">
                    4K 60
                  </span>
                </div>

                <!-- Progress Track -->
                <div class="w-full h-1 bg-surface-variant relative overflow-hidden">
                  <div class="h-full bg-gradient-to-r from-primary-container to-secondary-container shadow-[0_0_12px_#ff2a55] group-hover:brightness-125 spring-motion" style="width: ${percent}%;"></div>
                </div>

                <div class="p-space-md flex flex-col gap-0.5">
                  <span class="font-headline-sm text-headline-sm font-bold text-on-surface truncate group-hover:text-secondary-container transition-colors">${title}</span>
                  <div class="flex items-center justify-between text-outline font-label-sm text-label-sm mt-0.5">
                    <span class="text-on-surface-variant truncate">${epTitle}</span>
                    <span class="shrink-0 ml-2">${percent}% Seen</span>
                  </div>
                </div>
              </div>
            `;
          });
          grid.innerHTML = html;
        } else {
          // No watch history: keep section hidden so no fake items appear
          container.classList.add('hidden');
        }
      } catch (err) {
        console.error('Error loading continue watching:', err);
      }
    }

    /* ==================== 5. DYNAMIC CATEGORY CATALOG RAILS (Real Server Data) ==================== */
    async function loadCategories() {
      const container = document.getElementById('homeDynamicSections');
      if (!container) return;

      try {
        const res = await fetch(`${API_BASE}/shows/categories`);
        if (res.ok) {
          globalCategoriesData = await res.json();
          renderQuickPills();
          renderDynamicHomeSections();
        }
      } catch (err) {
        console.error('Error loading categories:', err);
      }
    }

    function renderQuickPills() {
      const pillsContainer = document.getElementById('genreQuickPills');
      if (!pillsContainer || !globalCategoriesData) return;

      let pillsHtml = `
        <button onclick="filterCatalogBy('all')" class="cat-pill px-4 py-2 rounded-full bg-secondary-container text-on-secondary-container font-label-md text-label-md uppercase tracking-wider shadow-[0_0_16px_rgba(0,238,252,0.35)] shrink-0 cursor-pointer spring-motion">
          All Master Catalog
        </button>
      `;

      globalCategoriesData.forEach(cat => {
        if (cat.shows && cat.shows.length > 0) {
          const info = CATEGORY_MAP[cat.slug] || { name: cat.name };
          pillsHtml += `
            <a href="#section-${cat.slug}" class="cat-pill px-4 py-2 rounded-full bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high hover:border hover:border-secondary-container/40 hover:scale-105 active:scale-95 font-label-md text-label-md uppercase tracking-wider shrink-0 spring-motion cursor-pointer">
              ${info.name} (${cat.shows.length})
            </a>
          `;
        }
      });

      pillsContainer.innerHTML = pillsHtml;
    }

    function renderDynamicHomeSections() {
      const container = document.getElementById('homeDynamicSections');
      if (!container || !globalCategoriesData) return;

      let sectionsHtml = '';

      globalCategoriesData.forEach(cat => {
        const shows = cat.shows || [];
        if (shows.length > 0) {
          const info = CATEGORY_MAP[cat.slug] || { name: cat.name, icon: 'fa-layer-group', color: '#00eefc' };
          
          let cardsHtml = '';
          shows.slice(0, 6).forEach(show => {
            const posterUrl = window.formatMediaUrl(show.poster);
            const playLink = show.episodes && show.episodes.length > 0
              ? `/watch?id=${show.episodes[0].id}`
              : `/watch?id=${show.id}`;
            const ratingVal = show.rating ? show.rating.toFixed(1) : '9.0';
            const isFav = userWatchlist.includes(show.id) ? 'text-primary' : 'text-outline hover:text-primary';

            cardsHtml += `
              <div class="group relative flex flex-col rounded-xl overflow-hidden bg-surface-container-low border border-transparent hover:border-secondary-container/40 shadow-xl hover:shadow-[0_14px_30px_rgba(0,238,252,0.25)] hover:-translate-y-2 spring-motion cursor-pointer" onclick="if(!event.target.closest('button, a')) window.openShowDetails(${show.id})">
                <div class="relative w-full aspect-[2/3] bg-surface-container-lowest overflow-hidden">
                  <img class="w-full h-full object-cover spring-motion group-hover:scale-105" src="${posterUrl}" alt="${show.title}" loading="lazy" onerror="this.onerror=null; this.src='Postes/spyfamS3p.jpg';" />
                  <div class="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-transparent to-transparent"></div>
                  
                  <span class="absolute top-2 left-2 px-2 py-0.5 rounded bg-surface-container-lowest/90 text-secondary font-label-sm text-[10px] uppercase font-bold">
                    ${show.badge || '4K HDR'}
                  </span>
                  
                  <div class="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                    <span class="px-2 py-0.5 rounded bg-surface-container-lowest/80 text-secondary-fixed font-label-sm text-xs font-bold backdrop-blur-md flex items-center gap-1">
                      <span class="material-symbols-outlined text-[13px] text-primary" style="font-variation-settings: 'FILL' 1;">star</span>${ratingVal}
                    </span>
                    <button onclick="toggleWatchlist(this, ${show.id})" class="p-1.5 rounded-full bg-surface-container-lowest/80 ${isFav} hover:scale-110 spring-motion" title="Watchlist">
                      <span class="material-symbols-outlined text-[16px]">bookmark</span>
                    </button>
                  </div>
                </div>

                <div class="p-3 bg-surface-container-low flex flex-col gap-1">
                  <span class="font-headline-sm text-sm font-bold text-on-surface truncate group-hover:text-secondary-container transition-colors">${show.title}</span>
                  <div class="flex items-center justify-between text-outline text-xs">
                    <span>${show.year || '2024'}</span>
                    <a href="${playLink}" onclick="return window.requireAuthPlay(event, '${playLink}')" class="text-primary hover:underline font-bold flex items-center gap-0.5">
                      <span class="material-symbols-outlined text-[14px]">play_arrow</span> Watch
                    </a>
                  </div>
                </div>
              </div>
            `;
          });

          sectionsHtml += `
            <section class="w-full max-w-7xl mx-auto px-gutter-mobile lg:px-gutter pt-space-xl" id="section-${cat.slug}">
              <div class="flex items-center justify-between mb-space-md">
                <div class="flex items-center gap-space-xs">
                  <span class="material-symbols-outlined text-secondary-container text-[22px] drop-shadow-[0_0_8px_rgba(0,238,252,0.5)]">movie</span>
                  <h2 class="font-headline-sm font-bold text-on-surface">${info.name}</h2>
                  <span class="font-label-sm text-xs text-outline ml-2">(${shows.length} Available)</span>
                </div>
                <a href="view.html#${cat.slug}" class="font-label-sm text-sm text-secondary-fixed hover:text-secondary flex items-center gap-0.5">
                  <span>View All</span>
                  <span class="material-symbols-outlined text-[14px]">chevron_right</span>
                </a>
              </div>
              <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-space-md">
                ${cardsHtml}
              </div>
            </section>
          `;
        }
      });

      container.innerHTML = sectionsHtml;
    }

    /* ==================== 6. SEARCH LOGIC (Live Autocomplete) ==================== */
    function initSearch() {
      const desktopInput = document.getElementById('searchInput');
      const desktopDropdown = document.getElementById('liveSearchDropdown');
      const mobileInput = document.getElementById('mobileSearchInlineInput');
      const mobilePanel = document.getElementById('mobileSearchInlinePanel');
      const clearBtn = document.getElementById('clearMobileSearchBtn');

      function setupSearch(inputEl, dropdownEl) {
        if (!inputEl || !dropdownEl) return;

        inputEl.addEventListener('input', () => {
          const val = inputEl.value.trim();
          if (clearBtn) clearBtn.style.opacity = val.length > 0 ? '1' : '0';
          clearTimeout(searchDebounceTimeout);
          searchDebounceTimeout = setTimeout(() => {
            performLiveSearch(val, dropdownEl);
          }, 220);
        });

        inputEl.addEventListener('keyup', (e) => {
          if (e.key === 'Enter') {
            const val = inputEl.value.trim();
            if (val) window.location.href = `view.html#search?q=${encodeURIComponent(val)}`;
          }
        });

        document.addEventListener('click', (e) => {
          if (!inputEl.contains(e.target) && !dropdownEl.contains(e.target)) {
            dropdownEl.classList.remove('active');
          }
        });
      }

      setupSearch(desktopInput, desktopDropdown);
      setupSearch(mobileInput, mobilePanel);

      if (clearBtn && mobileInput) {
        clearBtn.addEventListener('click', () => {
          mobileInput.value = '';
          clearBtn.style.opacity = '0';
          if (mobilePanel) mobilePanel.classList.remove('active');
        });
      }

      // Quick Find Mobile Header Button
      const mobileHeaderBtn = document.getElementById('mobileHeaderSearchBtn');
      if (mobileHeaderBtn && mobileInput) {
        mobileHeaderBtn.addEventListener('click', () => {
          mobileInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(() => mobileInput.focus(), 300);
        });
      }

      // ⌘K hotkey
      document.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
          e.preventDefault();
          if (desktopInput) {
            desktopInput.focus();
            desktopInput.select();
          }
        }
      });
    }

    async function performLiveSearch(term, dropdownEl) {
      if (!term || term.length < 2) {
        dropdownEl.classList.remove('active');
        dropdownEl.innerHTML = '';
        return;
      }

      try {
        let results = [];
        const res = await fetch(`${API_BASE}/shows/search?q=${encodeURIComponent(term)}`);
        if (res.ok) {
          results = await res.json();
        } else if (allShowsCache && allShowsCache.length > 0) {
          results = allShowsCache.filter(s => s.title.toLowerCase().includes(term.toLowerCase()));
        }

        if (!results || results.length === 0) {
          dropdownEl.innerHTML = `
            <div class="p-4 text-center text-xs text-outline">
              No shows matching "<span class="text-on-surface font-semibold">${term}</span>"
            </div>
          `;
          dropdownEl.classList.add('active');
          return;
        }

        let html = '';
        results.slice(0, 6).forEach(show => {
          const poster = window.formatMediaUrl(show.poster);
          const ratingVal = show.rating ? show.rating.toFixed(1) : '9.0';
          html += `
            <div class="live-search-item" onclick="window.openShowDetails(${show.id})">
              <img src="${poster}" class="w-10 h-14 rounded object-cover bg-surface-container" onerror="this.src='Postes/spyfamS3p.jpg';" />
              <div class="flex flex-col flex-1 overflow-hidden">
                <span class="font-label-md text-sm text-on-surface font-bold truncate">${show.title}</span>
                <span class="text-xs text-outline truncate">${show.year || '2024'} • Rating: ★ ${ratingVal}</span>
              </div>
              <span class="material-symbols-outlined text-[16px] text-secondary-container">play_circle</span>
            </div>
          `;
        });

        html += `
          <div class="p-2.5 text-center border-t border-surface-variant/40">
            <a href="view.html#search?q=${encodeURIComponent(term)}" class="text-xs text-secondary-fixed hover:underline font-bold">
              View all results for "${term}" →
            </a>
          </div>
        `;

        dropdownEl.innerHTML = html;
        dropdownEl.classList.add('active');
      } catch (e) {
        console.error('Search error:', e);
      }
    }

    window.quickSearchTerm = function (term) {
      const desktopInput = document.getElementById('searchInput');
      const mobileInput = document.getElementById('mobileSearchInlineInput');
      if (desktopInput && window.innerWidth >= 1024) {
        desktopInput.value = term;
        desktopInput.focus();
        performLiveSearch(term, document.getElementById('liveSearchDropdown'));
      } else if (mobileInput) {
        mobileInput.value = term;
        mobileInput.focus();
        performLiveSearch(term, document.getElementById('mobileSearchInlinePanel'));
      }
    };

    window.filterCatalogBy = function (slug) {
      if (slug === 'all') {
        const sec = document.getElementById('homeDynamicSections');
        if (sec) sec.scrollIntoView({ behavior: 'smooth' });
      } else {
        const target = document.getElementById(`section-${slug}`);
        if (target) target.scrollIntoView({ behavior: 'smooth' });
      }
    };

    /* ==================== 7. WATCHLIST & AUTH ==================== */
    async function loadWatchlist() {
      if (!isLoggedIn()) { userWatchlist = []; return; }
      try {
        const res = await fetch(`${API_BASE}/user/watchlist`, { headers: getAuthHeader() });
        if (res.ok) {
          const list = await res.json();
          userWatchlist = list.map(item => item.showId || item.id);
        }
      } catch (e) { }
    }

    window.toggleWatchlist = async function (btn, showId) {
      if (!isLoggedIn()) {
        openModal('login');
        return;
      }
      try {
        const isFav = userWatchlist.includes(showId);
        const method = isFav ? 'DELETE' : 'POST';
        const url = `${API_BASE}/user/watchlist${isFav ? `/${showId}` : ''}`;
        const body = !isFav ? JSON.stringify({ showId }) : null;

        const res = await fetch(url, {
          method,
          headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
          body
        });

        if (res.ok) {
          if (isFav) {
            userWatchlist = userWatchlist.filter(id => id !== showId);
            if (btn) btn.classList.remove('text-primary');
          } else {
            userWatchlist.push(showId);
            if (btn) btn.classList.add('text-primary');
          }
        }
      } catch (e) {
        console.error('Watchlist toggle error:', e);
      }
    };

    function updateAuthUI() {
      const authHeader = document.getElementById('authHeader');
      const drawerAuth = document.getElementById('drawerAuthSection');
      const user = JSON.parse(localStorage.getItem('infinx_user') || '{}');
      const token = localStorage.getItem('infinx_token');

      if (token && user.email) {
        const initial = (user.name || user.email || 'O')[0].toUpperCase();
        const isAdmin = user.role === 'admin';

        if (authHeader) {
          authHeader.innerHTML = `
            <div class="flex items-center gap-2">
              ${isAdmin ? `
                <a href="admin.html" class="px-2.5 py-1 rounded-full bg-secondary-container/15 text-secondary-container font-label-sm text-xs font-bold border border-secondary-container/30 hover:bg-secondary-container/25 transition-all">
                  Studio Admin
                </a>
              ` : ''}
              <a href="profile.html" class="relative flex items-center justify-center p-[2px] rounded-full bg-gradient-to-tr from-primary-container via-secondary-container to-tertiary-container shadow-[0_0_12px_rgba(255,42,85,0.4)] hover:scale-105 spring-motion cursor-pointer" title="Otaku Passport">
                <div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-xs uppercase">
                  ${initial}
                </div>
              </a>
              <button onclick="handleLogout()" class="p-1.5 rounded-full text-outline hover:text-primary transition-colors ml-1" title="Sign Out">
                <span class="material-symbols-outlined text-[18px]">logout</span>
              </button>
            </div>
          `;
        }

        if (drawerAuth) {
          drawerAuth.innerHTML = `
            <div class="flex flex-col gap-2">
              <div class="flex items-center gap-3 p-2 rounded-xl bg-surface-container">
                <div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-xs">
                  ${initial}
                </div>
                <div class="flex flex-col overflow-hidden">
                  <span class="text-xs font-bold text-on-surface truncate">${user.name || user.email}</span>
                  <span class="text-[10px] text-outline truncate">${isAdmin ? 'Studio Director' : 'VIP Member'}</span>
                </div>
              </div>
              <button onclick="handleLogout()" class="w-full py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs text-primary font-bold flex items-center justify-center gap-2">
                <span class="material-symbols-outlined text-[16px]">logout</span> Sign Out
              </button>
            </div>
          `;
        }
      } else {
        if (authHeader) {
          authHeader.innerHTML = `
            <button class="px-3.5 py-1.5 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-sm uppercase tracking-wider font-bold transition-all border border-surface-variant text-xs cursor-pointer" onclick="openModal('login')">
              Sign In
            </button>
          `;
        }
        if (drawerAuth) {
          drawerAuth.innerHTML = `
            <div class="flex flex-col gap-2">
              <button onclick="closeMobileMenu(); openModal('login')" class="w-full py-2.5 rounded-xl bg-primary-container text-on-primary-container font-label-md text-xs font-bold uppercase tracking-wider shadow-md">
                Sign In
              </button>
              <button onclick="closeMobileMenu(); openModal('register')" class="w-full py-2.5 rounded-xl bg-surface-container text-on-surface font-label-md text-xs font-semibold hover:bg-surface-container-high transition-colors">
                Create Account
              </button>
            </div>
          `;
        }
      }
    }

    window.handleLogout = function () {
      localStorage.removeItem('infinx_token');
      localStorage.removeItem('infinx_user');
      updateAuthUI();
      userWatchlist = [];
      window.location.reload();
    };

    window.requireAuthPlay = function (e, playUrl) {
      if (!isLoggedIn()) {
        if (e) e.preventDefault();
        sessionStorage.setItem('infinx_post_login_redirect', playUrl);
        openModal('login');
        return false;
      }
      return true;
    };

    /* ==================== 8. MODAL HELPERS ==================== */
    window.openModal = function (type) {
      const modal = document.getElementById(`${type}Modal`);
      if (modal) modal.classList.add('active');
    };

    window.closeModal = function (type) {
      const modal = document.getElementById(`${type}Modal`);
      if (modal) modal.classList.remove('active');
    };

    window.switchModal = function (closeType, openType) {
      closeModal(closeType);
      setTimeout(() => openModal(openType), 120);
    };

    /* Mobile Drawer Helpers */
    function openMobileMenu() {
      const drawer = document.getElementById('mobileDrawer');
      const overlay = document.getElementById('mobileDrawerOverlay');
      if (drawer) drawer.classList.add('active');
      if (overlay) overlay.classList.add('active');
    }

    function closeMobileMenu() {
      const drawer = document.getElementById('mobileDrawer');
      const overlay = document.getElementById('mobileDrawerOverlay');
      if (drawer) drawer.classList.remove('active');
      if (overlay) overlay.classList.remove('active');
    }

    window.closeMobileMenu = closeMobileMenu;

    window.scrollToPublicChat = function (e) {
      if (e) e.preventDefault();
      const sec = document.getElementById('publicLiveChatSection');
      if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    /* Form submissions */
    document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail')?.value.trim();
      const password = document.getElementById('loginPassword')?.value;

      try {
        const res = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (res.ok && data.token) {
          localStorage.setItem('infinx_token', data.token);
          localStorage.setItem('infinx_user', JSON.stringify(data.user || { email }));
          closeModal('login');
          updateAuthUI();
          loadWatchlist();
          loadContinueWatching();
          const redirect = sessionStorage.getItem('infinx_post_login_redirect');
          if (redirect) {
            sessionStorage.removeItem('infinx_post_login_redirect');
            window.location.href = redirect;
          }
        } else {
          alert(data.error || 'Invalid credentials. Please verify your passport details.');
        }
      } catch (err) {
        alert('Authentication server unavailable. Please try again.');
      }
    });

    document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('registerEmail')?.value.trim();
      const password = document.getElementById('registerPassword')?.value;

      try {
        const res = await fetch(`${API_BASE}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (res.ok && data.token) {
          localStorage.setItem('infinx_token', data.token);
          localStorage.setItem('infinx_user', JSON.stringify(data.user || { email }));
          closeModal('register');
          updateAuthUI();
          loadWatchlist();
        } else {
          alert(data.error || 'Registration failed.');
        }
      } catch (err) {
        alert('Server unreachable during registration.');
      }
    });

    /* ==================== INITIALIZATION ==================== */
    document.addEventListener('DOMContentLoaded', async () => {
      updateAuthUI();
      initSearch();

      document.getElementById('mobileMenuBtn')?.addEventListener('click', openMobileMenu);
      document.getElementById('closeDrawerBtn')?.addEventListener('click', closeMobileMenu);
      document.getElementById('mobileDrawerOverlay')?.addEventListener('click', closeMobileMenu);

      await loadWatchlist();
      await loadCarousel();
      await loadTop10Masterpieces();
      await loadSeasonalSimulcasts();
      await loadContinueWatching();
      await loadCategories();
    });
  </script>

  <!-- External System Scripts -->
  <script src="/show-details-modal.js"></script>
  <script src="welcome.js"></script>
  <script src="/socket.io/socket.io.js"></script>
  <script src="public-chat.js?v=2.2"></script>
</body>

</html>
'''
    target_path = 'd:/Dev/frontend/index.html'
    with open(target_path, 'w', encoding='utf-8') as f:
        f.write(html_content)
    print(f"Successfully wrote {len(html_content)} bytes to {target_path}")

if __name__ == '__main__':
    build_real_home()
