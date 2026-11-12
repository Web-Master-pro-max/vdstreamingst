import os

html_content = '''<!DOCTYPE html>
<html class="dark" lang="en">

<head>
  <meta charset="utf-8" />
  <meta content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover" name="viewport" />
  <meta content="web_standard" name="shell-type" />
  <meta name="theme-color" content="#ff0055" />
  <title>Infinx Anime - Theatre Grade OLED Anime Streaming</title>
  <link rel="icon" type="image/x-icon" href="/favicon.ico">

  <!-- Swiper CSS -->
  <link rel="stylesheet" href="https://unpkg.com/swiper@8/swiper-bundle.min.css" />

  <!-- Material Symbols Outlined -->
  <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet" />
  <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />

  <!-- Google Fonts: Outfit & Inter -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=Outfit:wght@100..900&display=swap" rel="stylesheet" />

  <!-- Font Awesome -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

  <!-- Core System Styles -->
  <link rel="stylesheet" href="welcome.css">
  <link rel="stylesheet" href="public-chat.css?v=2.2">

  <!-- Tailwind CSS CDN with plugins -->
  <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
  <script id="tailwind-config">
    tailwind.config = {
      darkMode: "class",
      theme: {
        extend: {
          colors: {
            "on-surface-variant": "#e8bcbe",
            "on-tertiary": "#3c0091",
            "on-surface": "#e2e2e2",
            "tertiary-fixed-dim": "#d0bcff",
            "surface-dim": "#131313",
            "secondary-fixed": "#7df4ff",
            "secondary": "#d3fbff",
            "secondary-container": "#00eefc",
            "primary-fixed": "#ffdadb",
            "tertiary": "#d0bcff",
            "tertiary-fixed": "#e9ddff",
            "on-tertiary-fixed-variant": "#5516be",
            "error-container": "#93000a",
            "secondary-fixed-dim": "#00dbe9",
            "on-tertiary-container": "#340080",
            "surface-container-lowest": "#0e0e0e",
            "tertiary-container": "#a078ff",
            "error": "#ffb4ab",
            "primary-container": "#ff506e",
            "inverse-primary": "#be003d",
            "surface-tint": "#ffb2b8",
            "on-secondary-container": "#00686f",
            "surface-container-low": "#1b1b1b",
            "surface-bright": "#393939",
            "background": "#131313",
            "on-tertiary-fixed": "#23005c",
            "inverse-surface": "#e2e2e2",
            "surface-variant": "#353535",
            "on-primary-fixed": "#40000f",
            "primary-fixed-dim": "#ffb2b8",
            "on-primary-container": "#5b0018",
            "on-secondary-fixed-variant": "#004f54",
            "on-background": "#e2e2e2",
            "primary": "#ffb2b8",
            "on-error-container": "#ffdad6",
            "surface-container-high": "#2a2a2a",
            "surface-container": "#1f1f1f",
            "surface-container-highest": "#353535",
            "inverse-on-surface": "#303030",
            "on-primary-fixed-variant": "#91002d",
            "on-secondary-fixed": "#002022",
            "on-primary": "#67001d",
            "outline-variant": "#5e3e41",
            "on-secondary": "#00363a",
            "outline": "#ae8789",
            "surface": "#131313",
            "on-error": "#690005"
          },
          borderRadius: {
            "DEFAULT": "0.25rem",
            "lg": "0.5rem",
            "xl": "0.75rem",
            "2xl": "1rem",
            "full": "9999px"
          },
          spacing: {
            "space-lg": "1.5rem",
            "margin": "3rem",
            "space-xs": "0.25rem",
            "space-xl": "2.5rem",
            "space-md": "1rem",
            "margin-mobile": "1rem",
            "gutter-mobile": "0.75rem",
            "space-sm": "0.5rem",
            "gutter": "1.5rem"
          },
          fontFamily: {
            "label-md": ["Inter", "sans-serif"],
            "body-md": ["Inter", "sans-serif"],
            "headline-lg": ["Outfit", "sans-serif"],
            "display-hero-mobile": ["Outfit", "sans-serif"],
            "display-hero": ["Outfit", "sans-serif"],
            "body-sm": ["Inter", "sans-serif"],
            "label-sm": ["Inter", "sans-serif"],
            "headline-lg-mobile": ["Outfit", "sans-serif"],
            "label-lg": ["Inter", "sans-serif"],
            "body-lg": ["Inter", "sans-serif"],
            "headline-md": ["Outfit", "sans-serif"],
            "headline-sm": ["Outfit", "sans-serif"]
          },
          fontSize: {
            "label-md": ["12px", { "lineHeight": "16px", "letterSpacing": "0.04em", "fontWeight": "600" }],
            "body-md": ["14px", { "lineHeight": "22px", "fontWeight": "400" }],
            "headline-lg": ["32px", { "lineHeight": "40px", "letterSpacing": "-0.015em", "fontWeight": "700" }],
            "display-hero-mobile": ["36px", { "lineHeight": "44px", "letterSpacing": "-0.01em", "fontWeight": "800" }],
            "display-hero": ["64px", { "lineHeight": "72px", "letterSpacing": "-0.02em", "fontWeight": "800" }],
            "body-sm": ["12px", { "lineHeight": "18px", "fontWeight": "400" }],
            "label-sm": ["10px", { "lineHeight": "14px", "letterSpacing": "0.08em", "fontWeight": "700" }],
            "headline-lg-mobile": ["24px", { "lineHeight": "32px", "letterSpacing": "-0.01em", "fontWeight": "700" }],
            "label-lg": ["14px", { "lineHeight": "18px", "letterSpacing": "0.02em", "fontWeight": "600" }],
            "body-lg": ["16px", { "lineHeight": "26px", "fontWeight": "400" }],
            "headline-md": ["22px", { "lineHeight": "28px", "fontWeight": "600" }],
            "headline-sm": ["18px", { "lineHeight": "24px", "fontWeight": "600" }]
          }
        }
      }
    };
  </script>

  <!-- Cyberpunk Visual Effects & Animation Styles -->
  <style>
    @layer base {
      html, body {
        margin: 0;
        padding: 0;
        background-color: #0e0e0e;
        color: #e2e2e2;
        overflow-x: hidden;
      }
      body {
        overscroll-behavior: none;
      }
      .pb-safe {
        padding-bottom: env(safe-area-inset-bottom, 0px);
      }
      .pt-safe {
        padding-top: env(safe-area-inset-top, 0px);
      }
    }

    ::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    ::-webkit-scrollbar-track {
      background: #0e0e0e;
    }
    ::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.15);
      border-radius: 9999px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: #00eefc;
    }
    .no-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .no-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }

    /* Dynamic Keyframes & Cyber Motion */
    @keyframes cyberAmbient {
      0%, 100% {
        background: radial-gradient(circle at 30% 65%, rgba(0, 238, 252, 0.22) 0%, rgba(255, 80, 110, 0.08) 45%, transparent 75%);
      }
      50% {
        background: radial-gradient(circle at 45% 55%, rgba(255, 80, 110, 0.24) 0%, rgba(0, 238, 252, 0.1) 50%, transparent 80%);
      }
    }

    @keyframes neonBloom {
      0%, 100% {
        text-shadow: 0 0 16px rgba(255, 80, 110, 0.75), 0 0 35px rgba(255, 80, 110, 0.45);
        opacity: 1;
      }
      48% {
        text-shadow: 0 0 22px rgba(255, 80, 110, 0.95), 0 0 45px rgba(255, 80, 110, 0.6);
        opacity: 0.98;
      }
      50% {
        text-shadow: 0 0 6px rgba(255, 80, 110, 0.3);
        opacity: 0.9;
      }
      52% {
        text-shadow: 0 0 26px rgba(255, 80, 110, 1), 0 0 50px rgba(255, 80, 110, 0.7);
        opacity: 1;
      }
    }

    @keyframes liveSheen {
      0% {
        transform: translateX(-150%) skewX(-20deg);
      }
      25%, 100% {
        transform: translateX(250%) skewX(-20deg);
      }
    }

    @keyframes bellWobble {
      0%, 100% { transform: rotate(0); }
      20% { transform: rotate(14deg); }
      40% { transform: rotate(-12deg); }
      60% { transform: rotate(8deg); }
      80% { transform: rotate(-5deg); }
    }

    @keyframes vipPulse {
      0%, 100% {
        box-shadow: 0 0 10px rgba(255, 80, 110, 0.35), inset 0 0 8px rgba(0, 238, 252, 0.2);
        border-color: rgba(255, 80, 110, 0.5);
      }
      50% {
        box-shadow: 0 0 18px rgba(0, 238, 252, 0.6), inset 0 0 12px rgba(255, 80, 110, 0.4);
        border-color: rgba(0, 238, 252, 0.7);
      }
    }

    @keyframes gradientBorderGlow {
      0%, 100% {
        border-color: rgba(0, 238, 252, 0.4);
        box-shadow: 0 0 35px rgba(0, 238, 252, 0.15), inset 0 0 25px rgba(0, 238, 252, 0.08);
      }
      50% {
        border-color: rgba(255, 80, 110, 0.45);
        box-shadow: 0 0 45px rgba(255, 80, 110, 0.2), inset 0 0 30px rgba(255, 80, 110, 0.1);
      }
    }

    .cyber-ambient-light {
      animation: cyberAmbient 6s ease-in-out infinite;
    }

    .neon-bloom-flicker {
      animation: neonBloom 4s ease-in-out infinite;
    }

    .vip-pulse-border {
      animation: vipPulse 3.5s ease-in-out infinite;
    }

    .guild-card-glow {
      animation: gradientBorderGlow 5s ease-in-out infinite;
    }

    .sheen-effect {
      position: relative;
      overflow: hidden;
    }

    .sheen-effect::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 45%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.45), transparent);
      animation: liveSheen 4.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
      pointer-events: none;
    }

    .hover-bell:hover .bell-icon {
      animation: bellWobble 0.65s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
    }

    .spring-motion {
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    /* Modal dialog styling */
    .infinx-modal {
      position: fixed;
      inset: 0;
      z-index: 9999;
      background: rgba(4, 4, 10, 0.85);
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

    /* User Avatar Aura Frames */
    .user-avatar {
      width: 36px;
      height: 36px;
      border-radius: 9999px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 14px;
      overflow: hidden;
      position: relative;
      background: #1b1b1b;
      color: #00eefc;
      border: 2px solid rgba(0, 238, 252, 0.6);
      box-shadow: 0 0 12px rgba(0, 238, 252, 0.35);
    }
    .user-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .user-avatar.aura-neon {
      border-color: #ff506e;
      box-shadow: 0 0 16px rgba(255, 80, 110, 0.6);
    }
    .user-avatar.aura-cyber {
      border-color: #00eefc;
      box-shadow: 0 0 16px rgba(0, 238, 252, 0.6);
    }
    .user-avatar.aura-gold {
      border-color: #ffd700;
      box-shadow: 0 0 16px rgba(255, 215, 0, 0.6);
    }

    /* Swiper Hero Customizations */
    .hero-slider .swiper-slide {
      opacity: 0 !important;
      transition: opacity 0.8s ease-in-out;
    }
    .hero-slider .swiper-slide-active {
      opacity: 1 !important;
    }
    .swiper-pagination-bullet {
      width: 10px;
      height: 6px;
      border-radius: 9999px;
      background: #353535;
      opacity: 1;
      transition: all 0.3s ease;
    }
    .swiper-pagination-bullet-active {
      width: 32px;
      background: #00eefc;
      box-shadow: 0 0 12px rgba(0, 238, 252, 0.8);
    }

    /* Live Search Dropdown */
    .live-search-dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      margin-top: 8px;
      background: rgba(14, 14, 14, 0.96);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.9), 0 0 25px rgba(0, 238, 252, 0.15);
      z-index: 100;
      overflow: hidden;
      display: none;
    }
    .live-search-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 14px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      cursor: pointer;
      transition: background 0.2s ease;
    }
    .live-search-item:hover {
      background: rgba(0, 238, 252, 0.08);
    }
    .live-search-thumb {
      width: 42px;
      height: 56px;
      border-radius: 6px;
      object-fit: cover;
      flex-shrink: 0;
      background: #1b1b1b;
    }

    /* Mobile Drawer */
    .mobile-drawer-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(8px);
      z-index: 998;
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
      bottom: 0;
      right: 0;
      width: min(340px, 86vw);
      background: #0e0e0e;
      border-left: 1px solid rgba(255, 255, 255, 0.08);
      z-index: 999;
      transform: translateX(100%);
      transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex;
      flex-direction: column;
      box-shadow: -10px 0 35px rgba(0, 0, 0, 0.85);
    }
    .mobile-drawer.active {
      transform: translateX(0);
    }

    @media (prefers-reduced-motion: reduce) {
      .cyber-ambient-light,
      .neon-bloom-flicker,
      .vip-pulse-border,
      .guild-card-glow,
      .sheen-effect::after,
      .animate-ping,
      .animate-pulse {
        animation: none !important;
      }
      .spring-motion {
        transition: none !important;
      }
    }
  </style>
</head>

<body class="bg-surface-container-lowest font-body-md text-on-surface antialiased selection:bg-primary-container selection:text-on-primary-container min-h-screen">

  <!-- ==================== HEADER (Desktop & Mobile Unified) ==================== -->
  <header class="fixed top-0 left-0 right-0 z-50 w-full bg-surface-container-lowest/80 backdrop-blur-2xl shadow-[0_4px_30px_rgba(0,0,0,0.8)] border-b border-surface-variant/30">
    <div class="h-16 lg:h-20 w-full px-4 lg:px-gutter flex items-center justify-between gap-space-md">
      
      <!-- Brand Logo & Navigation Links -->
      <div class="flex items-center gap-space-lg flex-shrink-0">
        <!-- Logo -->
        <a class="flex items-center gap-space-sm group" href="index.html">
          <div class="relative flex items-center justify-center w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-surface-container-high/80 shadow-[0_0_16px_rgba(0,238,252,0.35)] group-hover:shadow-[0_0_24px_rgba(0,238,252,0.65)] group-hover:border group-hover:border-secondary-container/40 spring-motion">
            <svg class="w-5 h-5 lg:w-6 lg:h-6 transform -rotate-12 group-hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M18.178 8c-1.38 0-2.61.644-3.414 1.645C13.606 8.167 11.758 7 9.5 7 5.91 7 3 9.91 3 13.5S5.91 20 9.5 20c2.258 0 4.106-1.167 5.264-2.645C15.568 18.356 16.798 19 18.178 19 20.84 19 23 16.84 23 14.178c0-2.662-2.16-4.178-4.822-4.178zm-8.678 9.5c-2.206 0-4-1.794-4-4s1.794-4 4-4c1.862 0 3.398 1.282 3.824 3.013a5.55 5.55 0 0 1 0 1.974c-.426 1.731-1.962 3.013-3.824 3.013zm8.678-1c-1.396 0-2.533-.946-2.85-2.23a4.015 4.015 0 0 1 0-1.54c.317-1.284 1.454-2.23 2.85-2.23 1.556 0 2.822 1.266 2.822 2.822 0 1.556-1.266 2.822-2.822 2.822z" fill="#00eefc"></path>
              <circle cx="9.5" cy="13.5" fill="#ff506e" r="1.5"></circle>
            </svg>
          </div>
          <div class="flex flex-col">
            <span class="font-headline-sm text-[16px] lg:text-headline-sm tracking-wider font-extrabold text-secondary-container drop-shadow-[0_0_12px_rgba(0,238,252,0.6)]">
              INFINX<span class="text-primary-container drop-shadow-[0_0_12px_rgba(255,80,110,0.6)] ml-1">ANIME</span>
            </span>
            <span class="font-label-sm text-[8px] lg:text-label-sm tracking-widest uppercase text-outline hidden sm:block">CINEMA LABS</span>
          </div>
        </a>

        <!-- Desktop Nav Ribbon -->
        <nav class="hidden xl:flex items-center gap-space-xs p-1 rounded-full bg-surface-container-lowest/60 backdrop-blur-md">
          <a class="relative px-space-md py-space-xs font-label-lg transition-all duration-300 bg-secondary-container/15 text-secondary-container shadow-[0_0_16px_rgba(0,238,252,0.25)] rounded-full group" href="index.html">
            <span>Home</span>
            <span class="absolute -bottom-1 left-3 right-3 h-[2px] bg-secondary-container rounded-full shadow-[0_0_8px_#00eefc]"></span>
          </a>
          <a class="relative px-space-md py-space-xs rounded-full font-label-lg text-label-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all duration-200 group" href="anime.html">
            <span>Anime</span>
            <span class="absolute -bottom-1 left-4 right-4 h-[2px] bg-secondary-container/0 group-hover:bg-secondary-container/80 group-hover:shadow-[0_0_8px_#00eefc] rounded-full transition-all duration-300"></span>
          </a>
          <a class="relative px-space-md py-space-xs rounded-full font-label-lg text-label-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all duration-200 group" href="#simulcastsSection">
            <span>Simulcasts</span>
            <span class="absolute -bottom-1 left-4 right-4 h-[2px] bg-secondary-container/0 group-hover:bg-secondary-container/80 group-hover:shadow-[0_0_8px_#00eefc] rounded-full transition-all duration-300"></span>
          </a>
          
          <!-- Genres Dropdown -->
          <div class="relative group/dropdown">
            <button class="relative px-space-md py-space-xs rounded-full font-label-lg text-label-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all duration-200 flex items-center gap-1">
              <span>Genres</span>
              <span class="material-symbols-outlined text-[16px] group-hover/dropdown:rotate-180 transition-transform">expand_more</span>
            </button>
            <div class="absolute top-full left-0 mt-2 w-64 p-3 rounded-2xl bg-surface-container-lowest/95 backdrop-blur-2xl border border-surface-variant/40 shadow-2xl opacity-0 pointer-events-none group-hover/dropdown:opacity-100 group-hover/dropdown:pointer-events-auto transition-all z-50">
              <div class="grid grid-cols-2 gap-1 text-xs">
                <a href="view.html#action" class="px-2.5 py-1.5 rounded-lg text-on-surface-variant hover:text-secondary-container hover:bg-surface-container-high flex items-center gap-1.5 transition-colors"><i class="fas fa-fire text-primary-container"></i> Action</a>
                <a href="view.html#adventure" class="px-2.5 py-1.5 rounded-lg text-on-surface-variant hover:text-secondary-container hover:bg-surface-container-high flex items-center gap-1.5 transition-colors"><i class="fas fa-compass text-secondary-container"></i> Adventure</a>
                <a href="view.html#sci-fi" class="px-2.5 py-1.5 rounded-lg text-on-surface-variant hover:text-secondary-container hover:bg-surface-container-high flex items-center gap-1.5 transition-colors"><i class="fas fa-atom text-tertiary-container"></i> Sci-Fi</a>
                <a href="view.html#fantasy" class="px-2.5 py-1.5 rounded-lg text-on-surface-variant hover:text-secondary-container hover:bg-surface-container-high flex items-center gap-1.5 transition-colors"><i class="fas fa-dragon text-secondary"></i> Fantasy</a>
                <a href="view.html#thriller" class="px-2.5 py-1.5 rounded-lg text-on-surface-variant hover:text-secondary-container hover:bg-surface-container-high flex items-center gap-1.5 transition-colors"><i class="fas fa-bolt text-primary"></i> Thriller</a>
                <a href="view.html#romance" class="px-2.5 py-1.5 rounded-lg text-on-surface-variant hover:text-secondary-container hover:bg-surface-container-high flex items-center gap-1.5 transition-colors"><i class="fas fa-heart text-primary-container"></i> Romance</a>
                <a href="view.html#comedy" class="px-2.5 py-1.5 rounded-lg text-on-surface-variant hover:text-secondary-container hover:bg-surface-container-high flex items-center gap-1.5 transition-colors"><i class="fas fa-laugh text-yellow-400"></i> Comedy</a>
                <a href="view.html#horror" class="px-2.5 py-1.5 rounded-lg text-on-surface-variant hover:text-secondary-container hover:bg-surface-container-high flex items-center gap-1.5 transition-colors"><i class="fas fa-ghost text-purple-400"></i> Horror</a>
              </div>
            </div>
          </div>

          <!-- Categories Dropdown -->
          <div class="relative group/dropdown">
            <button class="relative px-space-md py-space-xs rounded-full font-label-lg text-label-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all duration-200 flex items-center gap-1">
              <span>Categories</span>
              <span class="material-symbols-outlined text-[16px] group-hover/dropdown:rotate-180 transition-transform">expand_more</span>
            </button>
            <div class="absolute top-full left-0 mt-2 w-56 p-2 rounded-2xl bg-surface-container-lowest/95 backdrop-blur-2xl border border-surface-variant/40 shadow-2xl opacity-0 pointer-events-none group-hover/dropdown:opacity-100 group-hover/dropdown:pointer-events-auto transition-all z-50">
              <a href="view.html#south-hindi-dubbed" class="px-3 py-2 rounded-xl text-on-surface-variant hover:text-secondary-container hover:bg-surface-container-high flex items-center gap-2 transition-colors text-xs font-semibold"><i class="fas fa-language text-orange-400"></i> South Hindi Dubbed</a>
              <a href="view.html#hollywood" class="px-3 py-2 rounded-xl text-on-surface-variant hover:text-secondary-container hover:bg-surface-container-high flex items-center gap-2 transition-colors text-xs font-semibold"><i class="fas fa-film text-purple-400"></i> Hollywood Movies</a>
              <a href="view.html#bollywood" class="px-3 py-2 rounded-xl text-on-surface-variant hover:text-secondary-container hover:bg-surface-container-high flex items-center gap-2 transition-colors text-xs font-semibold"><i class="fas fa-clapperboard text-red-400"></i> Bollywood Movies</a>
              <a href="view.html#web-series" class="px-3 py-2 rounded-xl text-on-surface-variant hover:text-secondary-container hover:bg-surface-container-high flex items-center gap-2 transition-colors text-xs font-semibold"><i class="fas fa-tv text-emerald-400"></i> Web Series</a>
              <a href="view.html#kids" class="px-3 py-2 rounded-xl text-on-surface-variant hover:text-secondary-container hover:bg-surface-container-high flex items-center gap-2 transition-colors text-xs font-semibold"><i class="fas fa-child text-yellow-400"></i> Kids & Family</a>
              <a href="view.html#kdrama" class="px-3 py-2 rounded-xl text-on-surface-variant hover:text-secondary-container hover:bg-surface-container-high flex items-center gap-2 transition-colors text-xs font-semibold"><i class="fas fa-video text-amber-500"></i> Korean Drama</a>
            </div>
          </div>

          <a class="relative px-space-md py-space-xs rounded-full font-label-lg text-label-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all duration-200 group" href="view.html#watchlist">
            <span>Watchlist</span>
          </a>
          <a class="relative px-space-md py-space-xs rounded-full font-label-lg text-label-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all duration-200 group flex items-center gap-1.5" href="#publicLiveChatSection" onclick="window.scrollToPublicChat(event)">
            <span class="material-symbols-outlined text-[16px] text-secondary-container">chat</span>
            <span>Live Chat</span>
            <span class="px-1.5 py-0.5 rounded-full bg-secondary-container/20 text-secondary-container text-[9px] font-bold shadow-[0_0_8px_rgba(0,238,252,0.4)]">LIVE</span>
          </a>
        </nav>
      </div>

      <!-- Desktop Search Bar with Live Dropdown -->
      <div class="flex-1 max-w-md mx-space-md hidden md:block">
        <div class="relative flex items-center w-full">
          <span class="material-symbols-outlined absolute left-3.5 text-outline text-[20px] pointer-events-none">search</span>
          <input id="searchInput" class="w-full pl-11 pr-14 py-2 bg-surface-container-low/90 backdrop-blur-xl rounded-full font-body-sm text-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-1 focus:ring-secondary-container focus:shadow-[0_0_20px_rgba(0,238,252,0.3)] transition-all border border-surface-variant/40" placeholder="Search anime, studios, 4K releases..." type="text" autocomplete="off" />
          <div class="absolute right-3 px-2 py-0.5 rounded bg-surface-container-highest/80 font-label-sm text-[10px] text-on-surface-variant shadow-inner pointer-events-none">⌘K</div>
          <!-- Live Auto-Suggest Dropdown Box -->
          <div id="liveSearchDropdown" class="live-search-dropdown"></div>
        </div>
      </div>

      <!-- Right Action Items (VIP Pass, Bell, Auth Header, Hamburger) -->
      <div class="flex items-center gap-2 sm:gap-space-md flex-shrink-0">
        <!-- VIP Pass Button -->
        <a class="relative hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-low border border-primary/30 text-primary vip-pulse-border hover:bg-primary-container hover:text-on-primary-container transition-all duration-300 group cursor-pointer" href="profile.html">
          <span class="material-symbols-outlined text-[16px] text-primary group-hover:text-on-primary-container group-hover:scale-110 spring-motion">local_fire_department</span>
          <span class="font-label-sm text-label-sm tracking-wider uppercase font-bold bg-gradient-to-r from-primary-fixed via-primary to-secondary-container bg-clip-text group-hover:text-on-primary-container">VIP PASS</span>
        </a>

        <!-- Notification Bell -->
        <button class="relative p-2 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container hover-bell transition-all cursor-pointer hidden md:flex items-center justify-center" aria-label="Notifications">
          <span class="material-symbols-outlined text-[22px] bell-icon inline-block">notifications</span>
          <span class="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary-container shadow-[0_0_8px_#ff506e] animate-pulse"></span>
        </button>

        <!-- Dynamic Authentication Header Section -->
        <div id="authHeader" class="flex items-center">
          <button class="px-4 py-1.5 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-sm uppercase tracking-wider font-bold transition-all border border-surface-variant" onclick="openModal('login')">
            Login
          </button>
        </div>

        <!-- Mobile Search Quick Button -->
        <button id="mobileHeaderSearchBtn" class="md:hidden p-2 rounded-full bg-surface-container-high/80 text-on-surface-variant hover:text-secondary-container transition-colors" aria-label="Search">
          <span class="material-symbols-outlined text-[20px]">search</span>
        </button>

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

    <!-- Drawer Profile Card -->
    <div id="drawerAuthHeader" class="py-4 border-b border-surface-variant/30">
      <!-- Injected dynamically via updateAuthHeader() -->
    </div>

    <!-- Drawer Nav List -->
    <nav class="flex flex-col gap-1 py-4 font-label-md">
      <a href="index.html" class="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-secondary-container/15 text-secondary-container font-bold"><span class="material-symbols-outlined text-[20px]">home</span> Home</a>
      <a href="anime.html" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"><span class="material-symbols-outlined text-[20px]">tv</span> Anime Catalog</a>
      <a href="view.html#watchlist" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"><span class="material-symbols-outlined text-[20px]">bookmark</span> Watchlist</a>
      <a href="view.html#history" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"><span class="material-symbols-outlined text-[20px]">history</span> History Hub</a>
      <a href="#publicLiveChatSection" onclick="closeMobileMenu(); window.scrollToPublicChat(event)" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"><span class="material-symbols-outlined text-[20px] text-secondary-container">chat</span> Live Chat Room</a>
      <a href="download.html" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"><span class="material-symbols-outlined text-[20px]">download_for_offline</span> Get App</a>
    </nav>

    <!-- Drawer Genres & Categories Accordion -->
    <div class="py-2 border-t border-surface-variant/30">
      <span class="text-[11px] font-bold text-outline uppercase tracking-wider block mb-2 px-3">Catalog Quick Jump</span>
      <div class="grid grid-cols-2 gap-1.5 text-xs">
        <a href="view.html#action" class="px-3 py-2 rounded-lg bg-surface-container-low text-on-surface-variant hover:text-secondary-container">Action</a>
        <a href="view.html#adventure" class="px-3 py-2 rounded-lg bg-surface-container-low text-on-surface-variant hover:text-secondary-container">Adventure</a>
        <a href="view.html#sci-fi" class="px-3 py-2 rounded-lg bg-surface-container-low text-on-surface-variant hover:text-secondary-container">Sci-Fi</a>
        <a href="view.html#fantasy" class="px-3 py-2 rounded-lg bg-surface-container-low text-on-surface-variant hover:text-secondary-container">Fantasy</a>
        <a href="view.html#hollywood" class="px-3 py-2 rounded-lg bg-surface-container-low text-on-surface-variant hover:text-secondary-container">Hollywood</a>
        <a href="view.html#south-hindi-dubbed" class="px-3 py-2 rounded-lg bg-surface-container-low text-on-surface-variant hover:text-secondary-container">South Dub</a>
      </div>
    </div>
  </aside>

  <!-- ==================== MAIN CONTENT ==================== -->
  <main class="w-full pt-16 lg:pt-20 bg-surface-container-lowest min-h-screen">
    <div class="flex flex-col w-full text-on-surface select-none pb-28 lg:pb-space-xl">

      <!-- ==================== MOBILE TOP SEARCH & TRENDING SECTION (Pixel-Perfect from Mobile Stitch) ==================== -->
      <section class="block md:hidden px-4 pt-3 pb-2" id="mobileSearchSection">
        <div class="relative w-full">
          <div class="relative flex items-center w-full rounded-full bg-surface-container/80 backdrop-blur-xl shadow-lg border border-surface-variant/50 focus-within:ring-1 focus-within:ring-secondary-container focus-within:shadow-[0_0_20px_rgba(0,238,252,0.35)]">
            <span class="material-symbols-outlined text-secondary-container pl-3.5 text-[20px]">search</span>
            <input id="mobileSearchInlineInput" class="w-full bg-transparent py-2.5 pl-2.5 pr-10 font-body-md text-sm text-on-surface placeholder:text-outline focus:outline-none" placeholder="Search anime, movies, creators..." type="text" autocomplete="off" />
            <button id="mobileClearInlineBtn" class="absolute right-3 w-6 h-6 rounded-full flex items-center justify-center text-outline hover:text-on-surface opacity-0 pointer-events-none transition-opacity">
              <span class="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
          <!-- Mobile Dropdown Suggestion -->
          <div id="mobileSearchInlinePanel" class="live-search-dropdown"></div>
        </div>

        <!-- Micro Trending Filter Pills (Stitch Parity) -->
        <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-2.5">
          <span class="font-label-sm text-[10px] uppercase tracking-wider text-outline shrink-0 font-bold">Hot:</span>
          <button onclick="quickSearchTerm('Solo Leveling')" class="px-2.5 py-1 rounded-full bg-secondary-container/15 text-secondary-fixed font-label-sm text-[11px] whitespace-nowrap shadow-[0_0_8px_rgba(0,238,252,0.25)] border border-secondary-container/30">Solo Leveling</button>
          <button onclick="quickSearchTerm('Chainsaw Man')" class="px-2.5 py-1 rounded-full bg-surface-container-high/80 text-on-surface-variant font-label-sm text-[11px] whitespace-nowrap hover:text-on-surface">Chainsaw Man S2</button>
          <button onclick="quickSearchTerm('Bleach')" class="px-2.5 py-1 rounded-full bg-surface-container-high/80 text-on-surface-variant font-label-sm text-[11px] whitespace-nowrap hover:text-on-surface">Bleach TYBW</button>
          <button onclick="quickSearchTerm('Kaiju No. 8')" class="px-2.5 py-1 rounded-full bg-surface-container-high/80 text-on-surface-variant font-label-sm text-[11px] whitespace-nowrap hover:text-on-surface">Kaiju No. 8</button>
        </div>
      </section>

      <!-- ==================== HERO SPOTLIGHT CAROUSEL (Cinematic 21:9 Desktop + Rounded Mobile Card) ==================== -->
      <section class="relative w-full -mt-0 lg:-mt-20 overflow-hidden bg-surface-container-lowest px-0 lg:px-0" id="home">
        
        <!-- Mobile padding wrapper for rounded hero card effect matching Stitch mobile -->
        <div class="px-4 lg:px-0 pb-2 lg:pb-0">
          <div class="hero-slider swiper w-full rounded-2xl lg:rounded-none overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.9)] lg:shadow-none">
            <div class="swiper-wrapper" id="carouselWrapper">
              
              <!-- Default / Flagship Hero Slide: NEO CYBER ZERO (Exact Stitch Master Visual) -->
              <div class="swiper-slide relative w-full">
                <div class="relative w-full h-[520px] sm:h-[640px] lg:h-[840px] bg-cover bg-center transition-all duration-700" style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuBFyb8e7F-GCyBquoWhpy19-Gq8g_B1ViXOGlCeigjTP7MYtSLl7wxAleJjdtzAvGA5c2qU0ddnlsUCqACPgbVthLDHUzJv5pYo2i1Uc0MWxoENHzgY7qG3Dbzf5wBDC0cy9oTryEKgaF7hK4fhjW86hHagXexUVHey0K00JTYHAduPxnJDcvTd-TDdhvRTt81QgwffGYWzSsEt0OeutWvzHi5R0DvSzLGQbtSq4-ftyUVQQWLb68AB5w')">
                  
                  <!-- Dynamic Ambient Pulsing Cyber Light Layer -->
                  <div class="absolute inset-0 cyber-ambient-light pointer-events-none mix-blend-screen opacity-90"></div>
                  
                  <!-- Deep Multistage Scrim Overlays for Pure AMOLED Blend -->
                  <div class="absolute inset-0 bg-gradient-to-r from-surface-container-lowest via-surface-container-lowest/80 to-transparent"></div>
                  <div class="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/40 to-transparent"></div>
                  <div class="absolute inset-0 bg-gradient-to-b from-surface-container-lowest/90 via-transparent to-transparent h-32 lg:h-48"></div>

                  <!-- Hero Content Plate -->
                  <div class="relative z-10 w-full h-full max-w-7xl mx-auto px-4 lg:px-gutter flex flex-col justify-end pb-8 sm:pb-16 lg:pb-24 pt-20 lg:pt-32">
                    <div class="flex flex-col max-w-2xl gap-2 sm:gap-space-md">
                      
                      <!-- Metatags / Master Badges -->
                      <div class="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container/15 text-secondary-container shadow-[0_0_16px_rgba(0,238,252,0.35)] font-label-sm text-[10px] uppercase tracking-wider animate-pulse hover:bg-secondary-container/25 transition-colors border border-secondary-container/30">
                          <span class="w-1.5 h-1.5 rounded-full bg-secondary-container animate-ping"></span>
                          #1 Trending Finale
                        </span>
                        <span class="px-2.5 py-1 rounded bg-surface-container-high/90 text-on-surface font-label-sm text-[10px] tracking-widest uppercase hover:bg-surface-container-highest transition-colors">
                          Simulcast
                        </span>
                        <span class="px-2 py-1 rounded bg-surface-container-high/90 text-primary font-label-sm text-[10px] tracking-widest uppercase font-bold hover:shadow-[0_0_12px_rgba(255,80,110,0.4)] transition-all">
                          4K HDR
                        </span>
                        <span class="px-2 py-1 rounded bg-surface-container-high/90 text-tertiary font-label-sm text-[10px] tracking-widest uppercase font-bold hidden sm:inline-block">
                          Dolby Vision • Atmos
                        </span>
                        <div class="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-surface-container-high/90 text-secondary hover:text-white transition-colors">
                          <span class="material-symbols-outlined text-[14px]" style="font-variation-settings: 'FILL' 1;">star</span>
                          <span class="font-label-sm text-[11px] font-bold">9.87</span>
                        </div>
                      </div>

                      <!-- Title Presentation with Editorial Drop Shadow -->
                      <div class="flex flex-col">
                        <span class="font-label-md text-[11px] sm:text-xs text-secondary-container tracking-[0.3em] uppercase drop-shadow-[0_0_8px_rgba(0,238,252,0.4)]">Tokyo Broadcast Master • 60 FPS</span>
                        <h1 class="font-display-hero text-2xl sm:text-4xl lg:text-display-hero text-on-surface drop-shadow-[0_8px_32px_rgba(0,0,0,0.9)] tracking-tight leading-tight">
                          NEO: CYBER <span class="text-primary-container drop-shadow-[0_0_24px_rgba(255,80,110,0.6)] neon-bloom-flicker inline-block">ZERO</span>
                        </h1>
                      </div>

                      <!-- Series Metadata line -->
                      <div class="flex flex-wrap items-center gap-2 font-label-md text-xs sm:text-label-lg text-outline">
                        <span class="text-secondary-fixed font-bold">EPISODE 12 FINALE</span>
                        <span>•</span>
                        <span>Studio MAVIS Lab</span>
                        <span>•</span>
                        <span>Cyberpunk / Sci-Fi</span>
                        <span>•</span>
                        <span class="text-primary-fixed">TV-MA</span>
                      </div>

                      <!-- Synopsis snippet -->
                      <p class="font-body-md text-xs sm:text-body-lg text-on-surface-variant max-w-xl line-clamp-2 sm:line-clamp-3 leading-relaxed">
                        In the submerged labyrinth of Sector 9, unit Zero disconnects from the omni-grid to confront the sentient phantom orchestrating the Shibuya blackout. The zero-hour convergence begins now.
                      </p>

                      <!-- Dual Primary CTAs & Transport Action -->
                      <div class="flex items-center gap-2.5 sm:gap-3 pt-2">
                        <a href="/anime.html" class="flex-1 sm:flex-initial relative inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-3 sm:py-3.5 rounded-full bg-primary-container text-on-primary-container font-label-lg text-xs sm:text-label-lg shadow-[0_0_28px_rgba(255,80,110,0.5)] hover:shadow-[0_0_42px_rgba(255,80,110,0.95)] hover:scale-105 active:scale-95 sheen-effect overflow-hidden spring-motion group cursor-pointer" onclick="return window.requireAuthPlay(event, '/watch?id=195516&ep=1')">
                          <span class="material-symbols-outlined text-[20px] sm:text-[22px] group-hover:scale-110 spring-motion" style="font-variation-settings: 'FILL' 1;">play_arrow</span>
                          <span class="tracking-wider uppercase font-bold relative z-10">Watch Ep 12</span>
                        </a>
                        <button onclick="toggleWatchlist(this, 61)" class="inline-flex items-center justify-center gap-1.5 px-4 sm:px-6 py-3 sm:py-3.5 rounded-full bg-surface-container-high/80 text-on-surface border border-transparent hover:border-secondary-container/50 hover:text-secondary-container hover:bg-surface-container-highest hover:shadow-[0_0_24px_rgba(0,238,252,0.35)] hover:scale-105 active:scale-95 spring-motion font-label-lg text-xs sm:text-label-lg backdrop-blur-xl shadow-lg cursor-pointer group">
                          <span class="material-symbols-outlined text-[18px] sm:text-[20px] group-hover:scale-110 spring-motion">add</span>
                          <span class="tracking-wide hidden xs:inline">Watchlist</span>
                        </button>
                        <button onclick="window.openShowDetails && window.openShowDetails(61)" class="inline-flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-surface-container-low/90 text-on-surface hover:text-secondary hover:bg-surface-container-high hover:scale-110 hover:shadow-[0_0_18px_rgba(0,238,252,0.4)] spring-motion cursor-pointer shadow-md group shrink-0" title="Show Details">
                          <span class="material-symbols-outlined text-[20px] sm:text-[22px] group-hover:rotate-12 spring-motion">theaters</span>
                        </button>
                      </div>
                    </div>

                    <!-- Spotlight Indicators & Horizontal Deck Controls -->
                    <div class="flex items-center justify-between w-full pt-6 sm:pt-10">
                      <div class="swiper-pagination flex items-center gap-1.5"></div>
                      <div class="hidden sm:flex items-center gap-2">
                        <button class="hero-prev-btn w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-surface-container-high/80 flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-bright hover:scale-110 active:scale-95 spring-motion cursor-pointer">
                          <span class="material-symbols-outlined text-[18px] sm:text-[20px]">chevron_left</span>
                        </button>
                        <button class="hero-next-btn w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-surface-container-high/80 flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-bright hover:scale-110 active:scale-95 spring-motion cursor-pointer">
                          <span class="material-symbols-outlined text-[18px] sm:text-[20px]">chevron_right</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      <!-- ==================== QUICK FILTER CATEGORY PILLS (Floating Glass Ribbon) ==================== -->
      <section class="w-full max-w-7xl mx-auto px-4 lg:px-gutter py-space-md">
        <div class="flex items-center gap-space-xs overflow-x-auto pb-space-xs no-scrollbar" id="quickFilterRibbon">
          <button onclick="filterCatalogBy('all')" class="cat-pill active px-4 py-2 rounded-full bg-secondary-container text-on-secondary-fixed font-label-md text-xs lg:text-label-md uppercase tracking-wider shadow-[0_0_16px_rgba(0,238,252,0.35)] shrink-0 cursor-pointer hover:scale-105 active:scale-95 spring-motion font-bold">
            All Master Catalog
          </button>
          <button onclick="filterCatalogBy('simulcasts')" class="cat-pill px-4 py-2 rounded-full bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high hover:border hover:border-secondary-container/40 hover:scale-105 active:scale-95 font-label-md text-xs lg:text-label-md uppercase tracking-wider shrink-0 spring-motion cursor-pointer">
            Simulcasts
          </button>
          <button onclick="filterCatalogBy('action')" class="cat-pill px-4 py-2 rounded-full bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high hover:border hover:border-secondary-container/40 hover:scale-105 active:scale-95 font-label-md text-xs lg:text-label-md uppercase tracking-wider shrink-0 spring-motion cursor-pointer">
            Action &amp; Sci-Fi
          </button>
          <button onclick="filterCatalogBy('anime')" class="cat-pill px-4 py-2 rounded-full bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high hover:border hover:border-secondary-container/40 hover:scale-105 active:scale-95 font-label-md text-xs lg:text-label-md uppercase tracking-wider shrink-0 spring-motion cursor-pointer">
            Anime Masters
          </button>
          <button onclick="filterCatalogBy('fantasy')" class="cat-pill px-4 py-2 rounded-full bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high hover:border hover:border-secondary-container/40 hover:scale-105 active:scale-95 font-label-md text-xs lg:text-label-md uppercase tracking-wider shrink-0 spring-motion cursor-pointer">
            Dark Fantasy
          </button>
          <button onclick="filterCatalogBy('hollywood')" class="cat-pill px-4 py-2 rounded-full bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high hover:border hover:border-secondary-container/40 hover:scale-105 active:scale-95 font-label-md text-xs lg:text-label-md uppercase tracking-wider shrink-0 spring-motion cursor-pointer">
            Hollywood 4K
          </button>
          <button onclick="filterCatalogBy('web-series')" class="cat-pill px-4 py-2 rounded-full bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high hover:border hover:border-secondary-container/40 hover:scale-105 active:scale-95 font-label-md text-xs lg:text-label-md uppercase tracking-wider shrink-0 spring-motion cursor-pointer">
            Web Series
          </button>
          <button onclick="filterCatalogBy('south-hindi-dubbed')" class="cat-pill px-4 py-2 rounded-full bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high hover:border hover:border-secondary-container/40 hover:scale-105 active:scale-95 font-label-md text-xs lg:text-label-md uppercase tracking-wider shrink-0 spring-motion cursor-pointer">
            South Dubbed
          </button>
        </div>
      </section>

      <!-- ==================== CONTINUE WATCHING ROW (16:9 Cards with Horizontal Snap on Mobile) ==================== -->
      <section class="w-full max-w-7xl mx-auto pt-space-lg" id="continueWatchingSection">
        <div class="flex items-center justify-between mb-space-md px-4 lg:px-gutter">
          <div class="flex items-center gap-space-sm">
            <span class="material-symbols-outlined text-secondary-container text-[22px] drop-shadow-[0_0_8px_rgba(0,238,252,0.5)]">history_toggle_off</span>
            <h2 class="font-headline-md text-lg lg:text-headline-md tracking-tight font-bold text-on-surface">Continue Watching</h2>
            <span id="continueWatchingCount" class="font-label-sm text-[11px] text-outline px-2 py-0.5 rounded bg-surface-container-low">4 In-Flight</span>
          </div>
          <a class="font-label-md text-xs sm:text-label-md text-secondary-container hover:text-secondary flex items-center gap-0.5 transition-colors group" href="view.html#history">
            <span>View All</span>
            <span class="material-symbols-outlined text-[16px] group-hover:translate-x-1 spring-motion">chevron_right</span>
          </a>
        </div>

        <!-- 16:9 Grid on Desktop & Horizontal Snap Scroll Carousel on Mobile -->
        <div class="flex lg:grid lg:grid-cols-4 gap-space-md overflow-x-auto lg:overflow-visible no-scrollbar px-4 lg:px-gutter snap-x snap-mandatory" id="continueWatchingGrid">
          <!-- Populated dynamically via loadContinueWatching() with curated fallback parity -->
        </div>
      </section>

      <!-- ==================== TOP 10 RANKED SIGNATURE ROW (Giant Numerals + 2:3 Posters) ==================== -->
      <section class="w-full max-w-7xl mx-auto pt-space-xl" id="top10Section">
        <div class="flex items-end justify-between mb-space-lg px-4 lg:px-gutter">
          <div class="flex flex-col">
            <div class="flex items-center gap-space-xs font-label-sm text-xs text-secondary-container uppercase tracking-widest font-bold">
              <span class="material-symbols-outlined text-[16px] animate-pulse">equalizer</span>
              <span>Tokyo &amp; Global Metrics</span>
            </div>
            <h2 class="font-headline-lg text-2xl lg:text-headline-lg tracking-tight font-extrabold text-on-surface mt-1">
              Top 10 Masterpieces Today
            </h2>
          </div>
          <div class="flex items-center gap-2">
            <span class="font-label-sm text-xs text-outline uppercase tracking-wider hidden sm:inline">Live Bitrate Feed</span>
            <span class="font-label-sm text-xs text-primary-fixed uppercase tracking-wider sm:hidden font-bold">Global Top</span>
            <span class="w-2 h-2 rounded-full bg-secondary-container shadow-[0_0_8px_#00eefc] animate-ping"></span>
          </div>
        </div>

        <!-- 5-Col Grid on Desktop & Horizontal Snap Scroll on Mobile -->
        <div class="flex lg:grid lg:grid-cols-5 gap-space-lg lg:gap-space-md overflow-x-auto lg:overflow-visible no-scrollbar px-4 lg:px-gutter snap-x snap-mandatory pt-space-xs" id="top10Grid">
          
          <!-- Rank 1 -->
          <div class="relative flex items-end group cursor-pointer pt-12 w-[140px] sm:w-[170px] lg:w-full shrink-0 snap-start pl-6 lg:pl-0" onclick="window.openShowDetails ? window.openShowDetails({ id: 'lunar-195516', anilistId: 195516, title: 'SL: Ragnarok', isLunar: true }) : null">
            <span class="absolute -left-2 lg:-left-6 -top-2 font-display-hero text-[88px] lg:text-[140px] leading-none font-black text-surface-container-highest/40 select-none pointer-events-none group-hover:text-secondary-container group-hover:opacity-75 group-hover:drop-shadow-[0_0_24px_rgba(0,238,252,0.8)] spring-motion">1</span>
            <div class="relative z-10 w-full flex flex-col rounded-xl overflow-hidden bg-surface-container shadow-2xl spring-motion group-hover:-translate-y-2.5 group-hover:shadow-[0_16px_36px_rgba(0,238,252,0.35)] group-hover:ring-1 group-hover:ring-secondary-container/50">
              <div class="relative aspect-[2/3] w-full overflow-hidden bg-surface-container-lowest">
                <img class="w-full h-full object-cover spring-motion group-hover:scale-105" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD3jO3XlNq1WvOt2r3bYShsisWXGRPX_miaenUdaiySxkVGN53I56j2hBWtkq7kyOa1qvxkpaBwJVx32xh5tqVOkUKT3WK_1KzQ-ZeNiTca7mJBYw6Yvnqgqh4BTStuScWU9JUJhfwGdWy8PuHfoVRivs4Cre37tE-p00qy9fvuD5dPb09OtY3EL41w25dy_7NfU8zRB9qOzS5_lRmVKi4rwjGtS7xvS6LxI42k8FGSErrjkrf7LNLb7w" alt="Solo Leveling Ragnarok" loading="lazy" />
                <div class="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-transparent to-transparent"></div>
                <span class="absolute top-2 left-2 px-2 py-0.5 rounded bg-primary-container text-on-primary-container font-label-sm text-[10px] font-extrabold shadow-md">#1 TOP</span>
                <div class="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                  <span class="px-2 py-0.5 rounded bg-surface-container-lowest/80 text-secondary font-label-sm text-[10px] font-bold backdrop-blur-md">★ 9.94</span>
                  <div class="flex items-center gap-1">
                    <span class="px-1.5 py-0.5 rounded bg-surface-container-high/90 text-on-surface font-label-sm text-[9px] font-bold">SUB</span>
                    <span class="px-1.5 py-0.5 rounded bg-surface-container-high/90 text-on-surface-variant font-label-sm text-[9px] font-bold">DUB</span>
                  </div>
                </div>
              </div>
              <div class="p-3 bg-surface-container-low flex flex-col">
                <span class="font-headline-sm text-sm lg:text-headline-sm font-bold truncate group-hover:text-secondary-container transition-colors">SL: Ragnarok</span>
                <span class="font-body-sm text-[11px] text-outline truncate">Studio A-1 Pictures • 4K</span>
              </div>
            </div>
          </div>

          <!-- Rank 2 -->
          <div class="relative flex items-end group cursor-pointer pt-12 w-[140px] sm:w-[170px] lg:w-full shrink-0 snap-start pl-6 lg:pl-0" onclick="window.openShowDetails ? window.openShowDetails({ id: 'lunar-10153', anilistId: 10153, title: 'Infinity Castle Arc', isLunar: true }) : null">
            <span class="absolute -left-2 lg:-left-6 -top-2 font-display-hero text-[88px] lg:text-[140px] leading-none font-black text-surface-container-highest/40 select-none pointer-events-none group-hover:text-primary-container group-hover:opacity-75 group-hover:drop-shadow-[0_0_24px_rgba(255,80,110,0.8)] spring-motion">2</span>
            <div class="relative z-10 w-full flex flex-col rounded-xl overflow-hidden bg-surface-container shadow-2xl spring-motion group-hover:-translate-y-2.5 group-hover:shadow-[0_16px_36px_rgba(255,80,110,0.35)] group-hover:ring-1 group-hover:ring-primary-container/50">
              <div class="relative aspect-[2/3] w-full overflow-hidden bg-surface-container-lowest">
                <img class="w-full h-full object-cover spring-motion group-hover:scale-105" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCl6EP_2QWD3zTkJrmJQU1WrXHW24i-xHQjFwfpdy5_G9MZOYmYjKRP1q4STsLg397I8gABo_XNl_LKigXEoBwjRNsUe_5vq4GqvelxXfEwBPr040Si_IAshZKviXpI8c8RYqhCKvzLR_XHppqYmciWgZIGtGFEJLlsY7e_HYpG-S4k-ML3afogCGlhBHkIkTMsOv0_B9tIelXC1dzhOBBdD7Je6GcJ_hcsBAYc1-HPOcoB4r3_FZTTaw" alt="Infinity Castle Arc" loading="lazy" />
                <div class="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-transparent to-transparent"></div>
                <span class="absolute top-2 left-2 px-2 py-0.5 rounded bg-surface-container-lowest/90 text-secondary font-label-sm text-[10px] font-bold">CINEMA CUT</span>
                <div class="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                  <span class="px-2 py-0.5 rounded bg-surface-container-lowest/80 text-secondary font-label-sm text-[10px] font-bold backdrop-blur-md">★ 9.91</span>
                  <div class="flex items-center gap-1">
                    <span class="px-1.5 py-0.5 rounded bg-surface-container-high/90 text-on-surface font-label-sm text-[9px] font-bold">SUB</span>
                    <span class="px-1.5 py-0.5 rounded bg-surface-container-high/90 text-on-surface-variant font-label-sm text-[9px] font-bold">DUB</span>
                  </div>
                </div>
              </div>
              <div class="p-3 bg-surface-container-low flex flex-col">
                <span class="font-headline-sm text-sm lg:text-headline-sm font-bold truncate group-hover:text-primary-container transition-colors">Infinity Castle Arc</span>
                <span class="font-body-sm text-[11px] text-outline truncate">ufotable • Dolby Vision</span>
              </div>
            </div>
          </div>

          <!-- Rank 3 -->
          <div class="relative flex items-end group cursor-pointer pt-12 w-[140px] sm:w-[170px] lg:w-full shrink-0 snap-start pl-6 lg:pl-0" onclick="window.openShowDetails ? window.openShowDetails({ id: 'lunar-113415', anilistId: 113415, title: 'Jujutsu Kaisen', isLunar: true }) : null">
            <span class="absolute -left-2 lg:-left-6 -top-2 font-display-hero text-[88px] lg:text-[140px] leading-none font-black text-surface-container-highest/40 select-none pointer-events-none group-hover:text-tertiary-container group-hover:opacity-75 group-hover:drop-shadow-[0_0_24px_rgba(160,120,255,0.8)] spring-motion">3</span>
            <div class="relative z-10 w-full flex flex-col rounded-xl overflow-hidden bg-surface-container shadow-2xl spring-motion group-hover:-translate-y-2.5 group-hover:shadow-[0_16px_36px_rgba(160,120,255,0.35)] group-hover:ring-1 group-hover:ring-tertiary-container/50">
              <div class="relative aspect-[2/3] w-full overflow-hidden bg-surface-container-lowest">
                <img class="w-full h-full object-cover spring-motion group-hover:scale-105" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCQaukTd9A0wJCdAW_C3z9o5ipkjWfb4Ty4AZGnnQUgkCrYnNY_gudO98Ar_xEAul8XwPamNjxcu-C7W6WhlhtVYks-Go7FZAwLNirGlHw1-epfzsP6mx2Zugp5WIzwX-IIWQSATDQLkxBBlFb9SmqZchpVVGzTPpRW-658WNaQUUz3Wzd83XiHaJNf7cAlBnIdkopIpGDn9ettHBXksxa-fOrMGcN0cnTJW9cFqiPZX-VGnH9fHHF96w" alt="Jujutsu Kaisen" loading="lazy" />
                <div class="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-transparent to-transparent"></div>
                <span class="absolute top-2 left-2 px-2 py-0.5 rounded bg-surface-container-lowest/90 text-tertiary font-label-sm text-[10px] font-bold">DOLBY ATMOS</span>
                <div class="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                  <span class="px-2 py-0.5 rounded bg-surface-container-lowest/80 text-secondary font-label-sm text-[10px] font-bold backdrop-blur-md">★ 9.89</span>
                  <div class="flex items-center gap-1">
                    <span class="px-1.5 py-0.5 rounded bg-surface-container-high/90 text-on-surface font-label-sm text-[9px] font-bold">SUB</span>
                  </div>
                </div>
              </div>
              <div class="p-3 bg-surface-container-low flex flex-col">
                <span class="font-headline-sm text-sm lg:text-headline-sm font-bold truncate group-hover:text-tertiary transition-colors">Jujutsu Kaisen</span>
                <span class="font-body-sm text-[11px] text-outline truncate">MAPPA • Pure OLED Cut</span>
              </div>
            </div>
          </div>

          <!-- Rank 4 -->
          <div class="relative flex items-end group cursor-pointer pt-12 w-[140px] sm:w-[170px] lg:w-full shrink-0 snap-start pl-6 lg:pl-0" onclick="window.openShowDetails ? window.openShowDetails({ id: 'lunar-154408', anilistId: 154408, title: 'Bleach: TYBW', isLunar: true }) : null">
            <span class="absolute -left-2 lg:-left-6 -top-2 font-display-hero text-[88px] lg:text-[140px] leading-none font-black text-surface-container-highest/40 select-none pointer-events-none group-hover:text-secondary-container group-hover:opacity-75 group-hover:drop-shadow-[0_0_24px_rgba(0,238,252,0.8)] spring-motion">4</span>
            <div class="relative z-10 w-full flex flex-col rounded-xl overflow-hidden bg-surface-container shadow-2xl spring-motion group-hover:-translate-y-2.5 group-hover:shadow-[0_16px_36px_rgba(0,238,252,0.35)] group-hover:ring-1 group-hover:ring-secondary-container/50">
              <div class="relative aspect-[2/3] w-full overflow-hidden bg-surface-container-lowest">
                <img class="w-full h-full object-cover spring-motion group-hover:scale-105" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCuDZZgjxekR1oYktbjb5LxTY74Ysf9vlmzKLbu0Porf7vt5pkS1sCpJwTrpsXslLVAqZqRjoEuLag6RDwCCWRtCFDY3QhATH_jmJy1V58d9KYqrLfEhqeZRMhfmRt7g07K9ezQ8lSLMtJ0njuhrfIi2MHKFKDdBDaw0qtya8w4v-foml5xVzkgF9pigjnU25KCmbBxKmVu27KBvPuO7tam10kfJvL2m5_DSx4iANtdhvWuj44zMPMCzw" alt="Bleach: TYBW" loading="lazy" />
                <div class="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-transparent to-transparent"></div>
                <span class="absolute top-2 left-2 px-2 py-0.5 rounded bg-surface-container-lowest/90 text-secondary font-label-sm text-[10px] font-bold">PART 3</span>
                <div class="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                  <span class="px-2 py-0.5 rounded bg-surface-container-lowest/80 text-secondary font-label-sm text-[10px] font-bold backdrop-blur-md">★ 9.85</span>
                  <div class="flex items-center gap-1">
                    <span class="px-1.5 py-0.5 rounded bg-surface-container-high/90 text-on-surface font-label-sm text-[9px] font-bold">SUB</span>
                    <span class="px-1.5 py-0.5 rounded bg-surface-container-high/90 text-on-surface-variant font-label-sm text-[9px] font-bold">DUB</span>
                  </div>
                </div>
              </div>
              <div class="p-3 bg-surface-container-low flex flex-col">
                <span class="font-headline-sm text-sm lg:text-headline-sm font-bold truncate group-hover:text-secondary-container transition-colors">Bleach: TYBW</span>
                <span class="font-body-sm text-[11px] text-outline truncate">Studio Pierrot • HDR10+</span>
              </div>
            </div>
          </div>

          <!-- Rank 5 -->
          <div class="relative flex items-end group cursor-pointer pt-12 w-[140px] sm:w-[170px] lg:w-full shrink-0 snap-start pl-6 lg:pl-0" onclick="window.openShowDetails ? window.openShowDetails({ id: 'lunar-16498', anilistId: 16498, title: 'Attack on Titan', isLunar: true }) : null">
            <span class="absolute -left-2 lg:-left-6 -top-2 font-display-hero text-[88px] lg:text-[140px] leading-none font-black text-surface-container-highest/40 select-none pointer-events-none group-hover:text-primary-container group-hover:opacity-75 group-hover:drop-shadow-[0_0_24px_rgba(255,80,110,0.8)] spring-motion">5</span>
            <div class="relative z-10 w-full flex flex-col rounded-xl overflow-hidden bg-surface-container shadow-2xl spring-motion group-hover:-translate-y-2.5 group-hover:shadow-[0_16px_36px_rgba(255,80,110,0.35)] group-hover:ring-1 group-hover:ring-primary-container/50">
              <div class="relative aspect-[2/3] w-full overflow-hidden bg-surface-container-lowest">
                <img class="w-full h-full object-cover spring-motion group-hover:scale-105" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBio-uZXlmsqu2R2SfQ0dLIr9Nxg2RJLRWhqekmwDrT05JDSbABV5VshFdJgpSodyozz-XyfAK-dC-5EL3vY_tiI9CrqTj4q6bTrGhbIWZaqOdhIYwjWQgIw_D3lEV6yxlbNPv4HeU3HlCYKOywSo2KRYVwo8x_MX15AEtjt2N7CY2furJyAKzOMvxH2wfSY4qrf7TszrLQMBsUm1wKcHFONAlJxKbZtRBXh3cJDa7Dq7LggrH08nOLyA" alt="Attack on Titan" loading="lazy" />
                <div class="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-transparent to-transparent"></div>
                <span class="absolute top-2 left-2 px-2 py-0.5 rounded bg-surface-container-lowest/90 text-primary-fixed font-label-sm text-[10px] font-bold">REMASTER</span>
                <div class="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                  <span class="px-2 py-0.5 rounded bg-surface-container-lowest/80 text-secondary font-label-sm text-[10px] font-bold backdrop-blur-md">★ 9.83</span>
                  <div class="flex items-center gap-1">
                    <span class="px-1.5 py-0.5 rounded bg-surface-container-high/90 text-on-surface font-label-sm text-[9px] font-bold">SUB</span>
                    <span class="px-1.5 py-0.5 rounded bg-surface-container-high/90 text-on-surface-variant font-label-sm text-[9px] font-bold">DUB</span>
                  </div>
                </div>
              </div>
              <div class="p-3 bg-surface-container-low flex flex-col">
                <span class="font-headline-sm text-sm lg:text-headline-sm font-bold truncate group-hover:text-primary-container transition-colors">Attack on Titan</span>
                <span class="font-body-sm text-[11px] text-outline truncate">WIT / MAPPA Final Master</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      <!-- ==================== FEATURED ANIME BROADCASTS (LUNARX SECTION) ==================== -->
      <section class="w-full max-w-7xl mx-auto pt-space-xl" id="lunarAnimeSection">
        <!-- Rendered dynamically via loadLunarTrending() -->
      </section>

      <!-- ==================== WEEKLY SIMULCAST SCHEDULE SECTION ==================== -->
      <section class="w-full max-w-7xl mx-auto pt-space-xl" id="simulcastsSection">
        <div class="flex flex-col md:flex-row md:items-end justify-between mb-space-lg gap-space-sm px-4 lg:px-gutter">
          <div class="flex flex-col">
            <div class="flex items-center gap-space-xs font-label-sm text-xs text-primary-container uppercase tracking-widest font-bold">
              <span class="w-2 h-2 rounded-full bg-primary-container animate-pulse"></span>
              <span>Tokyo Simultaneous Broadcasts</span>
            </div>
            <h2 class="font-headline-lg text-2xl lg:text-headline-lg tracking-tight font-extrabold text-on-surface mt-1">
              Weekly Simulcast Schedule
            </h2>
          </div>
          <!-- Schedule Day Selector -->
          <div class="flex items-center gap-1 bg-surface-container-low p-1 rounded-full overflow-x-auto no-scrollbar">
            <button class="px-3.5 py-1 rounded-full bg-surface-container-highest text-secondary-container font-label-md text-xs cursor-pointer hover:scale-105 spring-motion font-bold">Today</button>
            <button class="px-3 py-1 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high font-label-md text-xs cursor-pointer spring-motion">Fri</button>
            <button class="px-3 py-1 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high font-label-md text-xs cursor-pointer spring-motion">Sat</button>
            <button class="px-3 py-1 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high font-label-md text-xs cursor-pointer spring-motion">Sun</button>
            <button class="px-3 py-1 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high font-label-md text-xs cursor-pointer spring-motion">Mon</button>
          </div>
        </div>

        <!-- 4-Col Grid on Desktop & Horizontal Snap Scroll on Mobile -->
        <div class="flex lg:grid lg:grid-cols-4 gap-space-md overflow-x-auto lg:overflow-visible no-scrollbar px-4 lg:px-gutter snap-x snap-mandatory">
          <!-- Show 1 -->
          <div class="w-[260px] lg:w-auto shrink-0 snap-start p-space-md rounded-xl bg-surface-container-low border border-transparent hover:border-secondary-container/40 hover:bg-surface-container spring-motion hover:-translate-y-2 hover:shadow-[0_12px_28px_rgba(0,238,252,0.2)] flex flex-col gap-space-sm group cursor-pointer shadow-lg hover-bell" onclick="window.location.href='anime.html'">
            <div class="relative w-full aspect-video rounded-lg overflow-hidden bg-surface-container-lowest">
              <img class="w-full h-full object-cover spring-motion group-hover:scale-105" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCQD2j_VNPYTYv3l6K7Xtlai9nODQ-svZQkRVeB4gsrvmwYuAxTI9EL7gc4OFEwKGbJeUqzqEKepvf0WR-j4iDPQW27anZsVBOZldAd_sa6abVKtLHIUseSQBiDQgdyg5EdLMCVTx8LDuwoisQiWdbLatxWawxkAJceN4VAuZMlxg_7PVHBXc47wOmQPnuXyimim1U5AovxOzftKW4YtI92BlIxxjXIihrXtd1FqAsRJdCTSJcEkyBl9Q" alt="Armored Core: V-Genesis" loading="lazy" />
              <div class="absolute inset-0 bg-gradient-to-t from-surface-container-lowest/80 via-transparent to-transparent"></div>
              <span class="absolute top-2 left-2 px-2 py-0.5 rounded bg-surface-container-lowest/90 text-secondary-container font-label-sm text-[10px] font-bold">23:30 JST</span>
              <span class="absolute bottom-2 left-2 font-label-sm text-[11px] text-on-surface font-bold">Episode 9 Airing</span>
            </div>
            <div class="flex flex-col">
              <div class="flex items-center justify-between">
                <span class="font-label-sm text-[10px] text-primary-fixed uppercase tracking-wider font-bold">Every Friday</span>
                <button class="text-outline hover:text-secondary-container transition-colors" title="Set Airing Reminder">
                  <span class="material-symbols-outlined text-[18px] bell-icon inline-block">alarm_add</span>
                </button>
              </div>
              <span class="font-headline-sm text-base font-bold text-on-surface truncate group-hover:text-secondary-container transition-colors mt-0.5">Armored Core: V-Genesis</span>
              <span class="font-body-sm text-xs text-outline mt-0.5">Mecha • Military Action • 4K</span>
            </div>
          </div>

          <!-- Show 2 -->
          <div class="w-[260px] lg:w-auto shrink-0 snap-start p-space-md rounded-xl bg-surface-container-low border border-transparent hover:border-primary-container/40 hover:bg-surface-container spring-motion hover:-translate-y-2 hover:shadow-[0_12px_28px_rgba(255,80,110,0.2)] flex flex-col gap-space-sm group cursor-pointer shadow-lg hover-bell" onclick="window.location.href='anime.html'">
            <div class="relative w-full aspect-video rounded-lg overflow-hidden bg-surface-container-lowest">
              <img class="w-full h-full object-cover spring-motion group-hover:scale-105" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDUGbJM7qDuzVh0m3SKAN7fnjGsDAUHPaQIQ-2Ms9XseDK5dZrryw2aCnrdd71E7QNOWNrMPmaTk-RX1OB5SBNwSmenIsSqjVIZM4YAafgM-TCu8KVpWcrSyT1prKH28AfH95BicQMHew2GJBe75U7j9i09_H0VIa4FWA1x2IQbhi66NL68RpZcRmhB7w1eKPdZflonilHJbEyF7gpEPoCGYJf76UmDBSwQq2X49t5S44nXf9tSRFHiOg" alt="Tokyo Hex Code" loading="lazy" />
              <div class="absolute inset-0 bg-gradient-to-t from-surface-container-lowest/80 via-transparent to-transparent"></div>
              <span class="absolute top-2 left-2 px-2 py-0.5 rounded bg-surface-container-lowest/90 text-secondary-container font-label-sm text-[10px] font-bold">01:00 JST</span>
              <span class="absolute bottom-2 left-2 font-label-sm text-[11px] text-on-surface font-bold">Episode 6 Airing</span>
            </div>
            <div class="flex flex-col">
              <div class="flex items-center justify-between">
                <span class="font-label-sm text-[10px] text-primary-fixed uppercase tracking-wider font-bold">Every Friday</span>
                <button class="text-outline hover:text-secondary-container transition-colors" title="Set Airing Reminder">
                  <span class="material-symbols-outlined text-[18px] bell-icon inline-block">alarm_add</span>
                </button>
              </div>
              <span class="font-headline-sm text-base font-bold text-on-surface truncate group-hover:text-secondary-container transition-colors mt-0.5">Tokyo Hex Code</span>
              <span class="font-body-sm text-xs text-outline mt-0.5">Thriller • Cyber Espionage</span>
            </div>
          </div>

          <!-- Show 3 -->
          <div class="w-[260px] lg:w-auto shrink-0 snap-start p-space-md rounded-xl bg-surface-container-low border border-transparent hover:border-secondary-container/40 hover:bg-surface-container spring-motion hover:-translate-y-2 hover:shadow-[0_12px_28px_rgba(0,238,252,0.2)] flex flex-col gap-space-sm group cursor-pointer shadow-lg hover-bell" onclick="window.location.href='anime.html'">
            <div class="relative w-full aspect-video rounded-lg overflow-hidden bg-surface-container-lowest">
              <img class="w-full h-full object-cover spring-motion group-hover:scale-105" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCGN6K-wlhg_8sIv2PQVsAkZOdJwZLYGSGqcLVpQxJtnaprcFHMqvmTi8dfpyNnPZBw8P7i4f5Po7BO_3tX17wAkpx46cxBdDWj6MOPt_dnwDKQJLak_ZdEllGm2TVAXCFmKmmKIpuk6xnK2LqcLn9i2vw47yP6G7-R4x1CLDVDZi8B6pmYR_SysVa0KR5OnRar3x7L63V7I-iq6ahd-Tdtpt8ax-lKmEFpZVjfegmqMlyUjsAP7fFz-A" alt="Ghost Protocol 2099" loading="lazy" />
              <div class="absolute inset-0 bg-gradient-to-t from-surface-container-lowest/80 via-transparent to-transparent"></div>
              <span class="absolute top-2 left-2 px-2 py-0.5 rounded bg-surface-container-lowest/90 text-secondary-container font-label-sm text-[10px] font-bold">Tomorrow 21:00</span>
              <span class="absolute bottom-2 left-2 font-label-sm text-[11px] text-on-surface font-bold">Episode 8 Premiere</span>
            </div>
            <div class="flex flex-col">
              <div class="flex items-center justify-between">
                <span class="font-label-sm text-[10px] text-primary-fixed uppercase tracking-wider font-bold">Every Saturday</span>
                <button class="text-outline hover:text-secondary-container transition-colors" title="Set Airing Reminder">
                  <span class="material-symbols-outlined text-[18px] bell-icon inline-block">alarm_add</span>
                </button>
              </div>
              <span class="font-headline-sm text-base font-bold text-on-surface truncate group-hover:text-secondary-container transition-colors mt-0.5">Ghost Protocol 2099</span>
              <span class="font-body-sm text-xs text-outline mt-0.5">Sci-Fi • Stealth Action • Atmos</span>
            </div>
          </div>

          <!-- Show 4 -->
          <div class="w-[260px] lg:w-auto shrink-0 snap-start p-space-md rounded-xl bg-surface-container-low border border-transparent hover:border-tertiary/40 hover:bg-surface-container spring-motion hover:-translate-y-2 hover:shadow-[0_12px_28px_rgba(160,120,255,0.2)] flex flex-col gap-space-sm group cursor-pointer shadow-lg hover-bell" onclick="window.location.href='anime.html'">
            <div class="relative w-full aspect-video rounded-lg overflow-hidden bg-surface-container-lowest">
              <img class="w-full h-full object-cover spring-motion group-hover:scale-105" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBn7NQJTYhTZWUYhP6uOlbVHUCxneysiVHw8EbUSmgw6h91V68dNQjQzoMDqIG0OWPYMhwHp3-DFfAsLvsG2bVdldiF4P2RpfTPI63f08g6P8tCx1KrRshBJ1savDkdqmWeqIPNwUbQ_sVNfH77P3hr6FibcT4RZ9CuBvsEH4LwJ8tRq1yTZtLy05K4ppRwJa4v0Rp1obHfrJs9fSvE0iX5p3QbI3TZrPvekkiphmbVFiOWV-QzmrXj9Q" alt="Neon Tokyo: Eclipse" loading="lazy" />
              <div class="absolute inset-0 bg-gradient-to-t from-surface-container-lowest/80 via-transparent to-transparent"></div>
              <span class="absolute top-2 left-2 px-2 py-0.5 rounded bg-surface-container-lowest/90 text-secondary-container font-label-sm text-[10px] font-bold">Sunday 18:30</span>
              <span class="absolute bottom-2 left-2 font-label-sm text-[11px] text-on-surface font-bold">Episode 11 Airing</span>
            </div>
            <div class="flex flex-col">
              <div class="flex items-center justify-between">
                <span class="font-label-sm text-[10px] text-primary-fixed uppercase tracking-wider font-bold">Every Sunday</span>
                <button class="text-outline hover:text-secondary-container transition-colors" title="Set Airing Reminder">
                  <span class="material-symbols-outlined text-[18px] bell-icon inline-block">alarm_add</span>
                </button>
              </div>
              <span class="font-headline-sm text-base font-bold text-on-surface truncate group-hover:text-secondary-container transition-colors mt-0.5">Neon Tokyo: Eclipse</span>
              <span class="font-body-sm text-xs text-outline mt-0.5">Dark Fantasy • Superpower</span>
            </div>
          </div>
        </div>
      </section>

      <!-- ==================== DYNAMIC DATABASE GENRE & CATEGORY RAILS ==================== -->
      <div id="homeDynamicSections" class="w-full">
        <!-- Loaded dynamically via loadCategories() -->
      </div>

      <!-- ==================== COMMUNITY & VIP CINEMA PROMO (Asymmetric Split Panel) ==================== -->
      <section class="w-full max-w-7xl mx-auto px-4 lg:px-gutter pt-space-xl">
        <div class="relative w-full rounded-2xl overflow-hidden bg-gradient-to-r from-surface-container to-surface-container-low border border-outline-variant/40 guild-card-glow p-6 lg:p-space-xl flex flex-col lg:flex-row items-center justify-between gap-space-xl shadow-2xl">
          <!-- Ambient Glow Behind Panel -->
          <div class="absolute -right-20 -top-20 w-96 h-96 rounded-full bg-secondary-container/10 filter blur-3xl pointer-events-none"></div>
          <div class="absolute -left-20 -bottom-20 w-96 h-96 rounded-full bg-primary-container/10 filter blur-3xl pointer-events-none"></div>
          
          <!-- Left Text Content -->
          <div class="relative z-10 flex flex-col max-w-xl gap-space-sm">
            <div class="inline-flex items-center gap-space-xs px-3 py-1 rounded-full bg-primary-container/15 text-primary font-label-sm text-xs uppercase tracking-widest w-fit border border-primary/20">
              <span class="material-symbols-outlined text-[16px] animate-pulse">verified</span>
              <span>Zero-Compression Theatre Guild</span>
            </div>
            <h3 class="font-headline-lg text-2xl lg:text-headline-lg font-extrabold text-on-surface tracking-tight leading-tight">
              Unlock Pure Bitrate Mastery with <span class="text-secondary-container drop-shadow-[0_0_12px_rgba(0,238,252,0.6)]">INFINX VIP</span>
            </h3>
            <p class="font-body-md text-xs sm:text-body-md text-on-surface-variant leading-relaxed">
              Experience uncompressed 80 Mbps master streams directly from studio render pipelines in Tokyo. Zero artifacting, Dolby Atmos true surround, and early 1-hour premiere access.
            </p>
            <!-- Feature List Metrics -->
            <div class="grid grid-cols-3 gap-space-md pt-space-sm">
              <div class="flex flex-col group cursor-default">
                <span class="font-headline-md text-lg lg:text-headline-md font-bold text-secondary-container group-hover:scale-105 spring-motion origin-left">80 Mbps</span>
                <span class="font-label-sm text-[10px] lg:text-label-sm text-outline">Raw Master Feed</span>
              </div>
              <div class="flex flex-col group cursor-default">
                <span class="font-headline-md text-lg lg:text-headline-md font-bold text-primary group-hover:scale-105 spring-motion origin-left">0 ms</span>
                <span class="font-label-sm text-[10px] lg:text-label-sm text-outline">Stream Buffer Lag</span>
              </div>
              <div class="flex flex-col group cursor-default">
                <span class="font-headline-md text-lg lg:text-headline-md font-bold text-tertiary group-hover:scale-105 spring-motion origin-left">24/7</span>
                <span class="font-label-sm text-[10px] lg:text-label-sm text-outline">Watch Party Lounge</span>
              </div>
            </div>
          </div>

          <!-- Right Interactive VIP Card Deck -->
          <div class="relative z-10 flex flex-col sm:flex-row items-center gap-space-md w-full lg:w-auto shrink-0">
            <!-- VIP Pass Card -->
            <div class="p-space-lg rounded-xl bg-surface-container-highest/60 backdrop-blur-xl border border-primary-container/30 hover:border-primary-container/70 flex flex-col gap-space-md w-full sm:w-72 shadow-xl hover:-translate-y-1.5 hover:shadow-[0_16px_36px_rgba(255,80,110,0.3)] spring-motion">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-space-xs">
                  <span class="material-symbols-outlined text-primary-container text-[22px] animate-pulse">workspace_premium</span>
                  <span class="font-label-md text-xs lg:text-label-md font-bold uppercase tracking-wider">VIP PASS</span>
                </div>
                <span class="font-headline-sm text-base lg:text-headline-sm font-bold text-on-surface">$12.99<span class="font-body-sm text-xs text-outline">/mo</span></span>
              </div>
              <ul class="flex flex-col gap-space-xs font-body-sm text-xs text-on-surface-variant">
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
              <button onclick="if(isLoggedIn()){ window.location.href='profile.html'; } else { openModal('login'); }" class="relative w-full py-2.5 rounded-full bg-primary-container text-on-primary-container font-label-md text-xs lg:text-label-md uppercase tracking-wider font-bold shadow-[0_0_20px_rgba(255,80,110,0.5)] hover:shadow-[0_0_32px_rgba(255,80,110,0.9)] hover:scale-105 active:scale-95 sheen-effect overflow-hidden spring-motion cursor-pointer">
                <span class="relative z-10">Activate VIP Pass</span>
              </button>
            </div>

            <!-- Discord Lounge Card -->
            <div class="p-space-lg rounded-xl bg-surface-container-low border border-transparent hover:border-secondary-container/40 flex flex-col justify-between gap-space-md w-full sm:w-64 shadow-xl hover:-translate-y-1.5 hover:shadow-[0_16px_36px_rgba(0,238,252,0.25)] spring-motion">
              <div class="flex items-center gap-space-xs text-secondary-container">
                <span class="material-symbols-outlined text-[20px]">groups</span>
                <span class="font-label-md text-xs lg:text-label-md font-bold uppercase tracking-wider">Discord Core</span>
              </div>
              <div class="flex flex-col gap-1">
                <span class="font-headline-sm text-lg lg:text-headline-sm font-bold text-on-surface">148,200+</span>
                <span class="font-body-sm text-xs text-outline">Active Cinephiles &amp; Critics</span>
              </div>
              <a class="inline-flex items-center justify-center gap-2 py-2 px-4 rounded-full bg-surface-container-high text-on-surface hover:text-secondary-container hover:bg-surface-container-highest hover:scale-105 active:scale-95 spring-motion font-label-md text-xs" href="https://discord.com" target="_blank" rel="noopener">
                <span>Join Broadcast Core</span>
                <span class="material-symbols-outlined text-[16px]">open_in_new</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      <!-- ==================== PUBLIC LIVE CHAT EMBED SECTION ==================== -->
      <section class="w-full max-w-7xl mx-auto px-4 lg:px-gutter pt-space-xl" id="publicLiveChatSection">
        <div class="w-full rounded-2xl bg-surface-container-low border border-surface-variant/40 p-4 lg:p-6 shadow-2xl">
          <div class="flex items-center justify-between pb-3 border-b border-surface-variant/30 mb-4">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-[22px] text-secondary-container animate-pulse">forum</span>
              <h3 class="font-headline-md text-lg lg:text-headline-md font-bold text-on-surface">Live Community Watch Lounge</h3>
              <span class="px-2 py-0.5 rounded-full bg-primary-container/20 text-primary font-label-sm text-[10px] font-bold">ONLINE</span>
            </div>
            <span class="font-label-sm text-xs text-outline hidden sm:block">Global Stream Chat</span>
          </div>
          <!-- Integrated container for public-chat.js -->
          <div id="publicChatEmbedContainer" class="w-full min-h-[360px]"></div>
        </div>
      </section>

    </div>
  </main>

  <!-- ==================== DESKTOP FOOTER (Pixel-Perfect from Desktop Stitch) ==================== -->
  <footer class="hidden lg:block w-full bg-surface-container-lowest shadow-[0_-8px_32px_rgba(0,0,0,0.9)] border-t border-surface-variant/30">
    <div class="w-full max-w-7xl mx-auto px-gutter py-space-xl">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-space-xl">
        <div class="lg:col-span-2 flex flex-col gap-space-md">
          <div class="flex items-center gap-space-sm group cursor-pointer" onclick="window.scrollTo({top:0, behavior:'smooth'})">
            <div class="flex items-center justify-center w-8 h-8 rounded-lg bg-surface-container shadow-[0_0_12px_rgba(0,238,252,0.3)] group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(0,238,252,0.6)] spring-motion">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M18.178 8c-1.38 0-2.61.644-3.414 1.645C13.606 8.167 11.758 7 9.5 7 5.91 7 3 9.91 3 13.5S5.91 20 9.5 20c2.258 0 4.106-1.167 5.264-2.645C15.568 18.356 16.798 19 18.178 19 20.84 19 23 16.84 23 14.178c0-2.662-2.16-4.178-4.822-4.178z" fill="#00eefc"></path>
              </svg>
            </div>
            <span class="font-headline-sm text-headline-sm font-extrabold tracking-wide text-secondary-container">
              INFINX<span class="text-primary-container ml-1">ANIME</span>
            </span>
          </div>
          <p class="font-body-md text-xs sm:text-body-md text-outline max-w-sm">
            Theatre Grade OLED Anime Streaming. Pure AMOLED zero-floor masterings, uncompressed audio bitrate, and simultaneous Tokyo transmissions.
          </p>
          <div class="flex items-center gap-space-xs mt-space-xs">
            <div class="px-2.5 py-1 rounded bg-surface-container-low font-label-sm text-[10px] text-secondary tracking-widest uppercase shadow-[0_0_8px_rgba(0,238,252,0.2)] hover:border hover:border-secondary transition-colors cursor-default">4K UHD</div>
            <div class="px-2.5 py-1 rounded bg-surface-container-low font-label-sm text-[10px] text-primary-fixed tracking-widest uppercase shadow-[0_0_8px_rgba(255,80,110,0.2)] hover:border hover:border-primary transition-colors cursor-default">HDR10+</div>
            <div class="px-2.5 py-1 rounded bg-surface-container-low font-label-sm text-[10px] text-tertiary tracking-widest uppercase shadow-[0_0_8px_rgba(160,120,255,0.2)] hover:border hover:border-tertiary transition-colors cursor-default">ATMOS</div>
          </div>
        </div>

        <div class="flex flex-col gap-space-sm">
          <span class="font-label-lg text-xs lg:text-label-lg text-on-surface tracking-wider uppercase font-bold">Browse</span>
          <ul class="flex flex-col gap-space-xs font-body-sm text-xs sm:text-body-sm text-outline">
            <li class="hover:text-secondary-container hover:translate-x-1 spring-motion"><a href="anime.html">Top Airing Masterpieces</a></li>
            <li class="hover:text-secondary-container hover:translate-x-1 spring-motion"><a href="anime.html#simulcasts">New Season Releases</a></li>
            <li class="hover:text-secondary-container hover:translate-x-1 spring-motion"><a href="view.html#south-hindi-dubbed">Dual-Audio Dubbed</a></li>
            <li class="hover:text-secondary-container hover:translate-x-1 spring-motion"><a href="view.html#hollywood">Dolby Vision Features</a></li>
            <li class="hover:text-secondary-container hover:translate-x-1 spring-motion"><a href="view.html#action">Classic Remasters</a></li>
          </ul>
        </div>

        <div class="flex flex-col gap-space-sm">
          <span class="font-label-lg text-xs lg:text-label-lg text-on-surface tracking-wider uppercase font-bold">Community</span>
          <ul class="flex flex-col gap-space-xs font-body-sm text-xs sm:text-body-sm text-outline">
            <li class="hover:text-secondary-container hover:translate-x-1 spring-motion"><a href="https://discord.com" target="_blank" rel="noopener">Infinx Discord Core</a></li>
            <li class="hover:text-secondary-container hover:translate-x-1 spring-motion"><a href="#publicLiveChatSection" onclick="window.scrollToPublicChat(event)">Live Watch Parties</a></li>
            <li class="hover:text-secondary-container hover:translate-x-1 spring-motion"><a href="download.html">Mobile APK App</a></li>
            <li class="hover:text-secondary-container hover:translate-x-1 spring-motion"><a href="profile.html">Otaku Passport</a></li>
          </ul>
        </div>

        <div class="flex flex-col gap-space-sm">
          <span class="font-label-lg text-xs lg:text-label-lg text-on-surface tracking-wider uppercase font-bold">Legal &amp; System</span>
          <ul class="flex flex-col gap-space-xs font-body-sm text-xs sm:text-body-sm text-outline">
            <li class="hover:text-secondary-container hover:translate-x-1 spring-motion"><a href="#">License Agreements</a></li>
            <li class="hover:text-secondary-container hover:translate-x-1 spring-motion"><a href="#">Privacy Protocols</a></li>
            <li class="hover:text-secondary-container hover:translate-x-1 spring-motion"><a href="#">Device Compatibility</a></li>
            <li class="hover:text-secondary-container hover:translate-x-1 spring-motion"><a href="#">DRM Calibration</a></li>
          </ul>
        </div>
      </div>

      <div class="mt-space-xl pt-space-lg flex flex-col md:flex-row items-center justify-between gap-space-md border-t border-surface-variant/30">
        <span class="font-body-sm text-xs text-outline text-center md:text-left">
          &copy; 2026 INFINX ANIME BROADCAST CORP. ALL RIGHTS RESERVED. ZERO RE-COMPRESSION STANDARD.
        </span>
        <div class="flex items-center gap-space-md">
          <span class="relative flex h-2.5 w-2.5">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary-container opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-secondary-container shadow-[0_0_10px_#00eefc]"></span>
          </span>
          <span class="font-label-sm text-[10px] text-on-surface-variant uppercase tracking-widest">All Tokyo Feeds Nominal</span>
        </div>
      </div>
    </div>
  </footer>

  <!-- ==================== MOBILE GLASSMORPHIC FOOTER (Pixel-Perfect from Mobile Stitch) ==================== -->
  <footer class="block lg:hidden mt-space-md mx-4 mb-24 p-space-md rounded-2xl bg-surface-container-lowest/80 backdrop-blur-2xl shadow-[0_10px_30px_rgba(0,0,0,0.7)] border border-surface-variant/30 flex flex-col gap-space-md">
    <!-- Community & Social Banner -->
    <div class="flex items-center justify-between p-space-sm rounded-xl bg-surface-container/60 border border-surface-variant/30">
      <div class="flex items-center gap-space-sm">
        <div class="w-10 h-10 rounded-full bg-tertiary-container/30 text-tertiary-fixed flex items-center justify-center shadow-[0_0_12px_rgba(160,120,255,0.4)]">
          <span class="material-symbols-outlined text-[20px]">forum</span>
        </div>
        <div class="flex flex-col">
          <span class="font-label-md text-sm font-bold text-on-surface">Infinx Discord HQ</span>
          <span class="font-body-sm text-xs text-on-surface-variant/70">Join 340k+ Anime fans</span>
        </div>
      </div>
      <a href="https://discord.com" target="_blank" rel="noopener" class="px-space-md py-1.5 rounded-full bg-tertiary text-on-tertiary font-label-sm text-xs font-bold shadow-md hover:scale-105 active:scale-95 transition-all">
        Join
      </a>
    </div>

    <!-- Quick Navigation Links -->
    <div class="grid grid-cols-2 gap-space-sm font-label-sm text-xs text-on-surface-variant">
      <div class="flex flex-col gap-1.5">
        <span class="font-bold text-on-surface uppercase tracking-wider text-[11px]">Stream</span>
        <a class="hover:text-secondary-fixed transition-colors" href="anime.html#simulcasts">Simulcast Calendar</a>
        <a class="hover:text-secondary-fixed transition-colors" href="anime.html">4K HDR Cinema</a>
        <a class="hover:text-secondary-fixed transition-colors" href="download.html">Offline Downloads</a>
        <a class="hover:text-secondary-fixed transition-colors" href="view.html#watchlist">Watchlist Hub</a>
      </div>
      <div class="flex flex-col gap-1.5">
        <span class="font-bold text-on-surface uppercase tracking-wider text-[11px]">Company</span>
        <a class="hover:text-secondary-fixed transition-colors" href="#">Privacy Policy</a>
        <a class="hover:text-secondary-fixed transition-colors" href="#">Terms of Service</a>
        <a class="hover:text-secondary-fixed transition-colors" href="#">DMCA Notice</a>
        <a class="hover:text-secondary-fixed transition-colors" href="#">Support &amp; Help</a>
      </div>
    </div>

    <!-- Divider Bar -->
    <div class="w-full h-[1px] bg-surface-variant/40"></div>

    <!-- Copyright & Disclaimer -->
    <div class="flex flex-col items-center text-center gap-1">
      <div class="flex items-center gap-1 text-primary-container font-bold font-label-sm text-xs">
        <span class="material-symbols-outlined text-[16px]">bolt</span>
        <span>THEATRE GRADE OLED STREAMING</span>
      </div>
      <p class="font-body-sm text-[11px] text-on-surface-variant/60 leading-normal">
        &copy; 2026 INFINX ANIME CORP. ALL RIGHTS RESERVED.
      </p>
    </div>
  </footer>

  <!-- ==================== MOBILE FLOATING BOTTOM TAB BAR (Exact Stitch Parity: 5 Tabs) ==================== -->
  <nav class="fixed bottom-0 left-0 right-0 z-50 pb-safe pointer-events-none lg:hidden">
    <div class="px-gutter-mobile pb-space-sm pt-space-xs max-w-lg mx-auto pointer-events-auto">
      <div class="flex items-center justify-around h-16 rounded-full bg-surface-container-lowest/85 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] border border-surface-variant/40 px-space-xs">
        <a class="flex flex-col items-center justify-center min-w-[48px] min-h-[44px] px-3 rounded-full transition-all text-secondary-fixed bg-surface-variant/70 shadow-[0_0_16px_rgba(0,238,252,0.3)]" href="index.html">
          <span class="material-symbols-outlined text-[20px]">home</span>
          <span class="font-label-sm text-[10px]">Home</span>
        </a>
        <a class="flex flex-col items-center justify-center min-w-[48px] min-h-[44px] px-3 rounded-full text-on-surface-variant transition-all hover:text-on-surface" href="anime.html">
          <span class="material-symbols-outlined text-[20px]">explore</span>
          <span class="font-label-sm text-[10px]">Browse</span>
        </a>
        <a class="flex flex-col items-center justify-center min-w-[48px] min-h-[44px] px-3 rounded-full text-on-surface-variant transition-all hover:text-on-surface" href="view.html#watchlist">
          <span class="material-symbols-outlined text-[20px]">bookmark</span>
          <span class="font-label-sm text-[10px]">Watchlist</span>
        </a>
        <a class="flex flex-col items-center justify-center min-w-[48px] min-h-[44px] px-3 rounded-full text-on-surface-variant transition-all hover:text-on-surface" href="download.html">
          <span class="material-symbols-outlined text-[20px]">download_for_offline</span>
          <span class="font-label-sm text-[10px]">Downloads</span>
        </a>
        <a class="flex flex-col items-center justify-center min-w-[48px] min-h-[44px] px-3 rounded-full text-on-surface-variant transition-all hover:text-on-surface" href="profile.html">
          <span class="material-symbols-outlined text-[20px]">person</span>
          <span class="font-label-sm text-[10px]">Profile</span>
        </a>
      </div>
    </div>
  </nav>

  <!-- ==================== SIGN IN MODAL ==================== -->
  <div class="infinx-modal" id="loginModal">
    <div class="relative w-full max-w-md p-6 sm:p-8 rounded-2xl bg-surface-container-low border border-surface-variant shadow-[0_25px_60px_rgba(0,0,0,0.9)] text-on-surface">
      <button class="absolute top-4 right-4 text-outline hover:text-on-surface p-1" onclick="closeModal('login')">
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
        <button type="submit" class="w-full py-3.5 mt-2 rounded-full bg-primary-container text-on-primary-container font-label-md text-sm font-bold uppercase tracking-wider shadow-[0_0_24px_rgba(255,80,110,0.6)] hover:shadow-[0_0_36px_rgba(255,80,110,0.95)] hover:scale-[1.02] active:scale-95 transition-all">
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
  <div class="infinx-modal" id="registerModal">
    <div class="relative w-full max-w-md p-6 sm:p-8 rounded-2xl bg-surface-container-low border border-surface-variant shadow-[0_25px_60px_rgba(0,0,0,0.9)] text-on-surface">
      <button class="absolute top-4 right-4 text-outline hover:text-on-surface p-1" onclick="closeModal('register')">
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
        <button type="submit" class="w-full py-3.5 mt-2 rounded-full bg-primary-container text-on-primary-container font-label-md text-sm font-bold uppercase tracking-wider shadow-[0_0_24px_rgba(255,80,110,0.6)] hover:shadow-[0_0_36px_rgba(255,80,110,0.95)] hover:scale-[1.02] active:scale-95 transition-all">
          Initialize Account
        </button>
      </form>

      <div class="mt-6 text-center text-xs text-outline">
        Already have an account? 
        <a href="#" onclick="switchModal('register', 'login')" class="text-secondary-container hover:underline font-bold ml-1">Sign In</a>
      </div>
    </div>
  </div>

  <!-- ==================== SCRIPTS ==================== -->
  <script src="https://unpkg.com/swiper@8/swiper-bundle.min.js"></script>

  <script>
    /* Backend API Connectivity */
    const getLocalBackend = () => {
      const saved = localStorage.getItem('infinx_server_url');
      if (saved && !saved.startsWith('file:')) return saved.replace(/\\/$/, '');
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:8000';
      }
      return 'http://13.202.95.5:8000';
    };
    const DEFAULT_BACKEND = getLocalBackend();
    const isHttps = window.location.protocol === 'https:';
    const hasCustomServer = !!localStorage.getItem('infinx_server_url');
    const SERVER_ORIGIN = (isHttps && !hasCustomServer)
      ? ''
      : ((window.location.protocol === 'file:' || window.location.origin === 'null' || (!window.location.origin.includes(':8000') && !isHttps))
        ? DEFAULT_BACKEND
        : '');
    const API_BASE = `${SERVER_ORIGIN}/api`;

    window.formatMediaUrl = function (url) {
      const fallback = 'Postes/spyfamS3p.jpg';
      if (!url) return fallback;
      if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
      return url.startsWith('/') ? `${SERVER_ORIGIN}${url}` : `${SERVER_ORIGIN}/${url}`;
    };

    let userWatchlist = [];
    let globalLunarData = null;
    let currentLunarTab = 'popularThisSeason';
    let globalCategoriesData = [];
    let swiperHeroInstance = null;

    /* Curated Fallback Data for Continue Watching (Stitch Parity) */
    const CURATED_CONTINUE_WATCHING = [
      {
        title: "Chainsaw Man",
        episode: 'S1 • Ep 8 "Gun Devil"',
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBdDC2-kXQJHY0k58L2SGnu_nvkvsIE1vdXj8hxf27A0LHmxx3ZuQsAdyDOEiIxwhpIuRQ0QCdDhMuqLJLrAi8jprYw7n8YMBFmoBH3-4ZZgfkQK1dZZdBOub0BID3uxD9kPX6tjpL7LFs2QNmza6XHj5Zt8SxUW_i1tAMYj2rp4edw4VQWAb14GT8nO5haJ_O2En8rvaObpsZ4X1mQAWPPaI8g3pOkz2T0RH-e2yG8AzWRkY--YZaNSw",
        durationTag: "14m left",
        resTag: "4K 60",
        percent: 68,
        url: "/anime.html"
      },
      {
        title: "Edgerunners",
        episode: 'Ep 4 "Lucky You"',
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCXCrf-muBE5EZDDSrN44rb3-3ugl_tZDK5_r6RiLXM2WUEj9pnM8Y1cO7WquhCmTZkdrv4WA0qzXEBdS7PZNVMkoZy_Ml-n65W7d3T9HzO3uO9J0BW5WNORYRfF8y78l3BGJOqGIg0pzK9fCpeCPQCYkwWS94IZkzMztz__ZAf0AsqSHy43dkB2eQEvmODJjto1KEWDEgcBdooxMOVw0ui_DJmYAVLGrHYNnDPzpPH2eJH3OgswtCYkw",
        durationTag: "8m left",
        resTag: "HDR10",
        percent: 82,
        url: "/anime.html"
      },
      {
        title: "Solo Leveling",
        episode: 'S1 • Ep 11 "The Knight"',
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuD1TwEIlhIrsPQa1YB5CPBXykmA2w672jgqmA4yTRJjHK_ZFYvPPbZK0jcNWhi60zUClf-LD_S3nk_1ZY2qN44PaPwX4Ci8XyPk7T7z4lkSPOJwNi-XunCRG5gZ7AnUWGzHp3-oqf0GEL92UmyqJ9h9wTo8SdVgV-88po8LJ5HGc0eOr15EzP2rm0zyCBcHQFwGVDERvSuKObMDZAnMbXT4EWZtHNGpBna1YNUypOCyFTI1NF51hL5Srg",
        durationTag: "19m left",
        resTag: "DOLBY",
        percent: 28,
        url: "/anime.html"
      },
      {
        title: "Kaiju No. 8",
        episode: 'S1 • Ep 10 "Rebellion"',
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuB-ts7ooF1h9EYDGtg2xc7OmzvVJ8SJOoHcLxbir8nCiCDLv4rQWOUDYyV1m0Ay6wJP25pgJaPMa_Q56SGTHH6J7Fuu1nCulMDwiTQP3sWj20doXJn8hFGLAJIOb8MRJeFOhsOjg-tqSh-mss4ZqEiucSZTWOYbzuuCUS_5xCRiQvWa4QuYTbl9bGWTff3VTuxnS3ZVP6vYCUnR46poG6rYzHnAbOjrlfQIlAn_PH6H3lvBsRFW4oBEbg",
        durationTag: "4m left",
        resTag: "4K UHD",
        percent: 90,
        url: "/anime.html"
      }
    ];

    /* Category Metadata & Accent Mapping */
    const CATEGORY_MAP = {
      'south-hindi-dubbed': { name: 'South Hindi Dubbed', icon: 'fa-language', color: '#ff793f' },
      'hollywood': { name: 'Hollywood Movies', icon: 'fa-film', color: '#9c27b0' },
      'bollywood': { name: 'Bollywood Movies', icon: 'fa-clapperboard', color: '#ff5252' },
      'anime': { name: 'Anime Series', icon: 'fa-play-circle', color: '#00eefc' },
      'web-series': { name: 'Web Series', icon: 'fa-tv', color: '#2ecc71' },
      'kids': { name: 'Kids & Family', icon: 'fa-child', color: '#f1c40f' },
      'kdrama': { name: 'Korean Drama', icon: 'fa-video', color: '#e67e22' },
      'action': { name: 'Action', icon: 'fa-fire', color: '#ff506e' },
      'adventure': { name: 'Adventure', icon: 'fa-compass', color: '#00eefc' },
      'animation': { name: 'Animation', icon: 'fa-magic', color: '#a078ff' },
      'comedy': { name: 'Comedy', icon: 'fa-laugh-beam', color: '#f1c40f' },
      'crime': { name: 'Crime', icon: 'fa-user-ninja', color: '#7df4ff' },
      'drama': { name: 'Drama', icon: 'fa-theater-masks', color: '#ffb2b8' },
      'fantasy': { name: 'Fantasy', icon: 'fa-dragon', color: '#a078ff' },
      'historical': { name: 'Historical', icon: 'fa-landmark', color: '#d35400' },
      'horror': { name: 'Horror', icon: 'fa-ghost', color: '#8e44ad' },
      'mystery': { name: 'Mystery', icon: 'fa-user-secret', color: '#00eefc' },
      'political': { name: 'Political', icon: 'fa-building-columns', color: '#7f8c8d' },
      'romance': { name: 'Romance', icon: 'fa-heart', color: '#ff506e' },
      'sci-fi': { name: 'Sci-Fi', icon: 'fa-atom', color: '#00eefc' },
      'thriller': { name: 'Thriller', icon: 'fa-bolt', color: '#ff506e' }
    };

    /* App Initialization */
    document.addEventListener('DOMContentLoaded', function () {
      initApp();

      // Check URL query parameters (e.g. login=true)
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('login') === 'true' && !isLoggedIn()) {
        setTimeout(() => openModal('login'), 300);
      }

      // Mobile Menu Drawer Triggers
      const mobileMenuBtn = document.getElementById('mobileMenuBtn');
      const mobileDrawer = document.getElementById('mobileDrawer');
      const mobileDrawerOverlay = document.getElementById('mobileDrawerOverlay');
      const closeDrawerBtn = document.getElementById('closeDrawerBtn');

      function openMobileMenu() {
        if (mobileDrawer) mobileDrawer.classList.add('active');
        if (mobileDrawerOverlay) mobileDrawerOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
      }

      window.closeMobileMenu = function () {
        if (mobileDrawer) mobileDrawer.classList.remove('active');
        if (mobileDrawerOverlay) mobileDrawerOverlay.classList.remove('active');
        document.body.style.overflow = '';
      };

      if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', openMobileMenu);
      if (closeDrawerBtn) closeDrawerBtn.addEventListener('click', closeMobileMenu);
      if (mobileDrawerOverlay) mobileDrawerOverlay.addEventListener('click', closeMobileMenu);

      // Desktop Search Logic
      const searchInput = document.getElementById('searchInput');
      const liveDropdown = document.getElementById('liveSearchDropdown');
      let searchDebounceTimeout = null;

      if (searchInput && liveDropdown) {
        searchInput.addEventListener('input', function () {
          clearTimeout(searchDebounceTimeout);
          const term = this.value.trim();
          searchDebounceTimeout = setTimeout(() => {
            performLiveSearch(term, liveDropdown);
          }, 220);
        });

        searchInput.addEventListener('keyup', function (e) {
          if (e.key === 'Enter') {
            const term = this.value.trim();
            if (term) {
              liveDropdown.style.display = 'none';
              window.location.href = `view.html#search?q=${encodeURIComponent(term)}`;
            }
          }
        });

        document.addEventListener('click', function (e) {
          if (!searchInput.contains(e.target) && !liveDropdown.contains(e.target)) {
            liveDropdown.style.display = 'none';
          }
        });

        searchInput.addEventListener('focus', function () {
          if (this.value.trim().length >= 2) {
            liveDropdown.style.display = 'block';
          }
        });
      }

      // Mobile Inline Search Input Logic
      const mobileSearchInput = document.getElementById('mobileSearchInlineInput');
      const mobileSearchPanel = document.getElementById('mobileSearchInlinePanel');
      const mobileClearBtn = document.getElementById('mobileClearInlineBtn');
      const mobileHeaderSearchBtn = document.getElementById('mobileHeaderSearchBtn');

      if (mobileHeaderSearchBtn && mobileSearchInput) {
        mobileHeaderSearchBtn.addEventListener('click', () => {
          mobileSearchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(() => mobileSearchInput.focus(), 300);
        });
      }

      if (mobileSearchInput && mobileSearchPanel) {
        mobileSearchInput.addEventListener('input', function () {
          const val = this.value.trim();
          if (mobileClearBtn) {
            if (val) {
              mobileClearBtn.classList.remove('opacity-0', 'pointer-events-none');
              mobileClearBtn.classList.add('opacity-100', 'pointer-events-auto');
            } else {
              mobileClearBtn.classList.add('opacity-0', 'pointer-events-none');
              mobileClearBtn.classList.remove('opacity-100', 'pointer-events-auto');
            }
          }
          clearTimeout(searchDebounceTimeout);
          searchDebounceTimeout = setTimeout(() => {
            performLiveSearch(val, mobileSearchPanel);
          }, 220);
        });

        mobileSearchInput.addEventListener('keyup', function (e) {
          if (e.key === 'Enter') {
            const term = this.value.trim();
            if (term) {
              mobileSearchPanel.style.display = 'none';
              window.location.href = `view.html#search?q=${encodeURIComponent(term)}`;
            }
          }
        });

        if (mobileClearBtn) {
          mobileClearBtn.addEventListener('click', () => {
            mobileSearchInput.value = '';
            mobileClearBtn.classList.add('opacity-0', 'pointer-events-none');
            mobileSearchPanel.style.display = 'none';
            mobileSearchInput.focus();
          });
        }

        document.addEventListener('click', function (e) {
          if (!mobileSearchInput.contains(e.target) && !mobileSearchPanel.contains(e.target) && (!mobileClearBtn || !mobileClearBtn.contains(e.target))) {
            mobileSearchPanel.style.display = 'none';
          }
        });
      }

      // Auth form submissions
      const loginForm = document.getElementById('loginForm');
      if (loginForm) loginForm.addEventListener('submit', handleLogin);
      const registerForm = document.getElementById('registerForm');
      if (registerForm) registerForm.addEventListener('submit', handleRegister);
    });

    /* Quick Search helper for pills */
    window.quickSearchTerm = function (term) {
      const searchInput = document.getElementById('searchInput') || document.getElementById('mobileSearchInlineInput');
      if (searchInput) searchInput.value = term;
      window.location.href = `view.html#search?q=${encodeURIComponent(term)}`;
    };

    /* Live Search Async Function */
    async function performLiveSearch(query, targetContainer) {
      if (!query || query.length < 2) {
        targetContainer.innerHTML = '';
        targetContainer.style.display = 'none';
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/shows/search?q=${encodeURIComponent(query)}`);
        if (!res.ok) return;
        const results = await res.json();

        if (!results || results.length === 0) {
          targetContainer.innerHTML = `
            <div style="padding: 16px; text-align: center; color: #ae8789; font-size: 13px;">
              No matching anime or shows found for "${query}"
            </div>
          `;
          targetContainer.style.display = 'block';
          return;
        }

        const itemsHtml = results.slice(0, 6).map(item => {
          const posterUrl = (item.poster && (item.poster.startsWith('http://') || item.poster.startsWith('https://')))
            ? item.poster
            : window.formatMediaUrl(item.poster);
          const isAnime = item.isLunar || (typeof item.id === 'string' && item.id.startsWith('lunar-')) || item.anilistId;
          const badge = isAnime ? 'Anime' : (item.badge || 'HD');
          const anilistId = item.anilistId || (typeof item.id === 'string' ? item.id.replace('lunar-', '') : item.id);
          const safeTitle = (item.title || '').replace(/'/g, "\\\\'");
          const safePoster = (item.poster || '').replace(/'/g, "\\\\'");
          const safeBanner = (item.banner || '').replace(/'/g, "\\\\'");

          return `
            <div class="live-search-item" onclick="if(window.openShowDetails) window.openShowDetails({ id: '${item.id}', anilistId: ${anilistId || 'null'}, title: '${safeTitle}', poster: '${safePoster}', banner: '${safeBanner}', isLunar: ${isAnime ? 'true' : 'false'} })">
              <img src="${posterUrl}" alt="${item.title}" class="live-search-thumb" onerror="this.src='Postes/spyfamS3p.jpg';">
              <div class="flex flex-col overflow-hidden">
                <div class="font-bold text-sm text-on-surface truncate">${item.title}</div>
                <div class="flex items-center gap-2 text-xs text-outline mt-0.5">
                  <span class="text-secondary flex items-center gap-0.5"><span class="material-symbols-outlined text-[12px]" style="font-variation-settings: 'FILL' 1;">star</span> ${item.rating || '4.9'}</span>
                  <span>•</span>
                  <span>${item.year || '2025'}</span>
                  <span class="px-1.5 py-0.2 rounded bg-surface-container-high text-[10px] text-primary-container font-bold">${badge}</span>
                </div>
              </div>
            </div>
          `;
        }).join('');

        const viewAllUrl = `view.html#search?q=${encodeURIComponent(query)}`;
        targetContainer.innerHTML = `
          ${itemsHtml}
          <div class="p-3 text-center text-xs font-bold text-secondary-container bg-surface-container/60 hover:bg-surface-container cursor-pointer transition-colors flex items-center justify-center gap-1" onclick="window.location.href='${viewAllUrl}'">
            <span>View all results for "${query}"</span>
            <span class="material-symbols-outlined text-[14px]">arrow_forward</span>
          </div>
        `;
        targetContainer.style.display = 'block';
      } catch (err) {
        console.warn('Live search error:', err);
      }
    }

    /* Core App Data Loader */
    async function initApp() {
      updateAuthHeader();
      syncFreshUserProfile();
      loadContinueWatching();
      await loadCarousel();
      await loadLunarTrending();
      await loadCategories();

      if (isLoggedIn()) {
        loadWatchlist();
      }
    }

    function isLoggedIn() {
      return !!localStorage.getItem('infinx_token');
    }

    function getAuthHeader() {
      const token = localStorage.getItem('infinx_token');
      return token ? { 'Authorization': `Bearer ${token}` } : {};
    }

    /* Synchronize Profile & Rank */
    async function syncFreshUserProfile() {
      const token = localStorage.getItem('infinx_token');
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE}/user/profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const profile = await res.json();
          if (profile) {
            localStorage.setItem('infinx_user', JSON.stringify(profile));
            if (profile.username) localStorage.setItem('infinx_username', profile.username);
            if (profile.email) localStorage.setItem('infinx_user_email', profile.email);
            if (profile.role) localStorage.setItem('infinx_user_role', profile.role);
            if (profile.avatarUrl) localStorage.setItem('infinx_avatar', profile.avatarUrl);
            if (profile.avatarFrame) localStorage.setItem('infinx_avatar_frame', profile.avatarFrame);
            if (profile.accentColor) localStorage.setItem('infinx_accent_color', profile.accentColor);
            if (profile.vipRank) localStorage.setItem('infinx_vip_rank', profile.vipRank);
            if (profile.level) localStorage.setItem('infinx_level', String(profile.level));
            updateAuthHeader();
          }
        }
      } catch (e) {
        console.warn('Failed to sync user profile:', e);
      }
    }

    /* Update Auth in Header & Drawer */
    function updateAuthHeader() {
      const headerDiv = document.getElementById('authHeader');
      const drawerDiv = document.getElementById('drawerAuthHeader');

      if (isLoggedIn()) {
        const email = localStorage.getItem('infinx_user_email') || 'User';
        const role = localStorage.getItem('infinx_user_role');
        const userRaw = localStorage.getItem('infinx_user');
        let user = null;
        try { if (userRaw) user = JSON.parse(userRaw); } catch (e) { }

        const username = localStorage.getItem('infinx_username') || (user && user.username) || email.split('@')[0];
        const displayName = username.charAt(0).toUpperCase() + username.slice(1);
        const rawAvatar = localStorage.getItem('infinx_avatar') || (user && user.avatarUrl);
        let avatarUrl = null;
        if (rawAvatar && typeof rawAvatar === 'string') {
          const trimmed = rawAvatar.trim();
          if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
            avatarUrl = trimmed;
          } else if (trimmed.startsWith('assets/') || trimmed.startsWith('uploads/') || trimmed.startsWith('Postes/')) {
            avatarUrl = '/' + trimmed;
          } else if (trimmed.startsWith('/assets/') || trimmed.startsWith('/uploads/') || trimmed.startsWith('/Postes/')) {
            avatarUrl = trimmed;
          } else if (trimmed.startsWith('av-') || trimmed.endsWith('.png') || trimmed.endsWith('.jpg') || trimmed.endsWith('.jpeg')) {
            avatarUrl = `/assets/avatars/${trimmed.replace(/^\\/+/, '')}`;
          } else {
            avatarUrl = trimmed;
          }
        }
        const avatarFrame = localStorage.getItem('infinx_avatar_frame') || (user && user.avatarFrame) || 'cyber';
        const initial = (displayName || email || 'U')[0].toUpperCase();

        const adminLink = role === 'ADMIN'
          ? `<a href="/admin.html" class="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary-container/20 text-secondary font-label-sm text-xs font-bold border border-secondary/30 hover:bg-secondary-container/30 transition-all"><span class="material-symbols-outlined text-[14px]">admin_panel_settings</span> Admin</a>`
          : '';

        const avatarImgHtml = avatarUrl
          ? `<div class="user-avatar aura-${avatarFrame}" title="${displayName} (${email})"><img src="${avatarUrl}" alt="${displayName}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" /><span style="display:none;">${initial}</span></div>`
          : `<div class="user-avatar aura-${avatarFrame}" title="${displayName} (${email})">${initial}</div>`;

        if (headerDiv) {
          headerDiv.innerHTML = `
            <div class="flex items-center gap-2 sm:gap-3">
              ${adminLink}
              <a href="/profile.html" class="flex items-center gap-2 group cursor-pointer" title="View Otaku Profile (${displayName})">
                ${avatarImgHtml}
                <span class="font-label-md text-xs sm:text-sm font-bold text-on-surface group-hover:text-secondary-container transition-colors hidden md:inline-block">${displayName}</span>
              </a>
              <button onclick="handleLogout(event)" class="p-1.5 rounded-full text-outline hover:text-primary-container transition-colors" title="Sign Out">
                <span class="material-symbols-outlined text-[20px]">logout</span>
              </button>
            </div>
          `;
        }

        if (drawerDiv) {
          drawerDiv.innerHTML = `
            <a href="/profile.html" class="flex items-center gap-3 p-3 rounded-xl bg-surface-container-high/60 border border-surface-variant/40 hover:border-secondary-container/40 transition-all mb-2">
              <div class="user-avatar aura-${avatarFrame} w-11 h-11 text-base">${avatarUrl ? `<img src="${avatarUrl}" alt="${displayName}" />` : initial}</div>
              <div class="flex flex-col overflow-hidden">
                <span class="font-headline-sm text-sm font-bold text-on-surface truncate">${displayName}</span>
                <span class="font-body-sm text-[11px] text-outline truncate">${email}</span>
                <span class="font-label-sm text-[9px] text-secondary font-bold uppercase tracking-wider">Otaku Level ${localStorage.getItem('infinx_level') || '1'}</span>
              </div>
            </a>
            ${role === 'ADMIN' ? `<a href="/admin.html" class="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-secondary-container hover:bg-surface-container-high mb-1"><span class="material-symbols-outlined text-[16px]">admin_panel_settings</span> Admin Studio Dashboard</a>` : ''}
            <button onclick="handleLogout(event)" class="w-full py-2.5 mt-2 rounded-xl bg-surface-container-high text-xs font-bold text-outline hover:text-primary transition-all flex items-center justify-center gap-2">
              <span class="material-symbols-outlined text-[16px]">logout</span> Log Out
            </button>
          `;
        }
      } else {
        if (headerDiv) {
          headerDiv.innerHTML = `
            <button onclick="openModal('login')" class="px-4 py-1.5 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-sm uppercase tracking-wider font-bold transition-all border border-surface-variant shadow-sm hover:border-secondary-container/40 hover:text-secondary-container cursor-pointer text-xs">
              Login
            </button>
          `;
        }
        if (drawerDiv) {
          drawerDiv.innerHTML = `
            <div class="flex flex-col gap-2">
              <button onclick="closeMobileMenu(); openModal('login')" class="w-full py-2.5 rounded-full bg-primary-container text-on-primary-container font-label-md text-xs font-bold uppercase tracking-wider shadow-[0_0_16px_rgba(255,80,110,0.5)]">
                Login
              </button>
              <button onclick="closeMobileMenu(); openModal('register')" class="w-full py-2 rounded-full bg-surface-container-high text-on-surface font-label-md text-xs font-bold uppercase tracking-wider hover:bg-surface-container-highest">
                Sign Up
              </button>
            </div>
          `;
        }
      }
    }

    /* Carousel Loader with Swiper Parity */
    async function loadCarousel() {
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
        if (!res.ok) return;
        const data = await res.json();
        const wrapper = document.getElementById('carouselWrapper');

        if (data && data.length > 0 && wrapper) {
          // Prepend or format flagship slide + db items with exact cyberpunk cinema styling
          let html = `
            <div class="swiper-slide relative w-full">
              <div class="relative w-full h-[520px] sm:h-[640px] lg:h-[840px] bg-cover bg-center transition-all duration-700" style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuBFyb8e7F-GCyBquoWhpy19-Gq8g_B1ViXOGlCeigjTP7MYtSLl7wxAleJjdtzAvGA5c2qU0ddnlsUCqACPgbVthLDHUzJv5pYo2i1Uc0MWxoENHzgY7qG3Dbzf5wBDC0cy9oTryEKgaF7hK4fhjW86hHagXexUVHey0K00JTYHAduPxnJDcvTd-TDdhvRTt81QgwffGYWzSsEt0OeutWvzHi5R0DvSzLGQbtSq4-ftyUVQQWLb68AB5w')">
                <div class="absolute inset-0 cyber-ambient-light pointer-events-none mix-blend-screen opacity-90"></div>
                <div class="absolute inset-0 bg-gradient-to-r from-surface-container-lowest via-surface-container-lowest/80 to-transparent"></div>
                <div class="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/40 to-transparent"></div>
                <div class="absolute inset-0 bg-gradient-to-b from-surface-container-lowest/90 via-transparent to-transparent h-32 lg:h-48"></div>

                <div class="relative z-10 w-full h-full max-w-7xl mx-auto px-4 lg:px-gutter flex flex-col justify-end pb-8 sm:pb-16 lg:pb-24 pt-20 lg:pt-32">
                  <div class="flex flex-col max-w-2xl gap-2 sm:gap-space-md">
                    <div class="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container/15 text-secondary-container shadow-[0_0_16px_rgba(0,238,252,0.35)] font-label-sm text-[10px] uppercase tracking-wider animate-pulse border border-secondary-container/30">
                        <span class="w-1.5 h-1.5 rounded-full bg-secondary-container animate-ping"></span>
                        #1 Trending Finale
                      </span>
                      <span class="px-2.5 py-1 rounded bg-surface-container-high/90 text-on-surface font-label-sm text-[10px] tracking-widest uppercase">Simulcast</span>
                      <span class="px-2 py-1 rounded bg-surface-container-high/90 text-primary font-label-sm text-[10px] tracking-widest uppercase font-bold">4K HDR</span>
                      <span class="px-2 py-1 rounded bg-surface-container-high/90 text-tertiary font-label-sm text-[10px] tracking-widest uppercase font-bold hidden sm:inline-block">Dolby Vision • Atmos</span>
                      <div class="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-surface-container-high/90 text-secondary">
                        <span class="material-symbols-outlined text-[14px]" style="font-variation-settings: 'FILL' 1;">star</span>
                        <span class="font-label-sm text-[11px] font-bold">9.87</span>
                      </div>
                    </div>

                    <div class="flex flex-col">
                      <span class="font-label-md text-[11px] sm:text-xs text-secondary-container tracking-[0.3em] uppercase drop-shadow-[0_0_8px_rgba(0,238,252,0.4)]">Tokyo Broadcast Master • 60 FPS</span>
                      <h1 class="font-display-hero text-2xl sm:text-4xl lg:text-display-hero text-on-surface drop-shadow-[0_8px_32px_rgba(0,0,0,0.9)] tracking-tight leading-tight">
                        NEO: CYBER <span class="text-primary-container drop-shadow-[0_0_24px_rgba(255,80,110,0.6)] neon-bloom-flicker inline-block">ZERO</span>
                      </h1>
                    </div>

                    <div class="flex flex-wrap items-center gap-2 font-label-md text-xs sm:text-label-lg text-outline">
                      <span class="text-secondary-fixed font-bold">EPISODE 12 FINALE</span>
                      <span>•</span>
                      <span>Studio MAVIS Lab</span>
                      <span>•</span>
                      <span>Cyberpunk / Sci-Fi</span>
                      <span>•</span>
                      <span class="text-primary-fixed">TV-MA</span>
                    </div>

                    <p class="font-body-md text-xs sm:text-body-lg text-on-surface-variant max-w-xl line-clamp-2 sm:line-clamp-3 leading-relaxed">
                      In the submerged labyrinth of Sector 9, unit Zero disconnects from the omni-grid to confront the sentient phantom orchestrating the Shibuya blackout. The zero-hour convergence begins now.
                    </p>

                    <div class="flex items-center gap-2.5 sm:gap-3 pt-2">
                      <a href="/anime.html" class="flex-1 sm:flex-initial relative inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-3 sm:py-3.5 rounded-full bg-primary-container text-on-primary-container font-label-lg text-xs sm:text-label-lg shadow-[0_0_28px_rgba(255,80,110,0.5)] hover:shadow-[0_0_42px_rgba(255,80,110,0.95)] hover:scale-105 active:scale-95 sheen-effect overflow-hidden spring-motion group cursor-pointer" onclick="return window.requireAuthPlay(event, '/watch?id=195516&ep=1')">
                        <span class="material-symbols-outlined text-[20px] sm:text-[22px] group-hover:scale-110 spring-motion" style="font-variation-settings: 'FILL' 1;">play_arrow</span>
                        <span class="tracking-wider uppercase font-bold relative z-10">Watch Ep 12</span>
                      </a>
                      <button onclick="toggleWatchlist(this, 61)" class="inline-flex items-center justify-center gap-1.5 px-4 sm:px-6 py-3 sm:py-3.5 rounded-full bg-surface-container-high/80 text-on-surface border border-transparent hover:border-secondary-container/50 hover:text-secondary-container hover:bg-surface-container-highest hover:shadow-[0_0_24px_rgba(0,238,252,0.35)] hover:scale-105 active:scale-95 spring-motion font-label-lg text-xs sm:text-label-lg backdrop-blur-xl shadow-lg cursor-pointer group">
                        <span class="material-symbols-outlined text-[18px] sm:text-[20px] group-hover:scale-110 spring-motion">add</span>
                        <span class="tracking-wide hidden xs:inline">Watchlist</span>
                      </button>
                      <button onclick="window.openShowDetails && window.openShowDetails(61)" class="inline-flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-surface-container-low/90 text-on-surface hover:text-secondary hover:bg-surface-container-high hover:scale-110 hover:shadow-[0_0_18px_rgba(0,238,252,0.4)] spring-motion cursor-pointer shadow-md group shrink-0" title="Show Details">
                        <span class="material-symbols-outlined text-[20px] sm:text-[22px] group-hover:rotate-12 spring-motion">theaters</span>
                      </button>
                    </div>
                  </div>

                  <div class="flex items-center justify-between w-full pt-6 sm:pt-10">
                    <div class="swiper-pagination flex items-center gap-1.5"></div>
                    <div class="hidden sm:flex items-center gap-2">
                      <button class="hero-prev-btn w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-surface-container-high/80 flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-bright hover:scale-110 active:scale-95 spring-motion cursor-pointer">
                        <span class="material-symbols-outlined text-[18px] sm:text-[20px]">chevron_left</span>
                      </button>
                      <button class="hero-next-btn w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-surface-container-high/80 flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-bright hover:scale-110 active:scale-95 spring-motion cursor-pointer">
                        <span class="material-symbols-outlined text-[18px] sm:text-[20px]">chevron_right</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          `;

          data.forEach(show => {
            const playLink = show.episodes && show.episodes.length > 0
              ? `/watch?id=${show.episodes[0].id}`
              : '#';
            const rawBanner = show.banner || show.poster;
            const bannerImg = rawBanner ? encodeURI(rawBanner) : 'Postes/infinit-cas11.jpg';
            const isVideo = rawBanner && (rawBanner.toLowerCase().endsWith('.mp4') || rawBanner.toLowerCase().endsWith('.webm') || rawBanner.toLowerCase().endsWith('.mkv') || rawBanner.toLowerCase().endsWith('.mov'));
            const rating = show.rating ? Number(show.rating).toFixed(1) : '9.8';
            const genres = (show.categories && show.categories.length > 0)
              ? show.categories.map(c => c.category?.name || c.name).filter(Boolean).join(' • ')
              : 'Anime • 4K HDR';

            html += `
              <div class="swiper-slide relative w-full">
                <div class="relative w-full h-[520px] sm:h-[640px] lg:h-[840px] bg-cover bg-center transition-all duration-700" style="${isVideo ? '' : `background-image: url('${bannerImg}');`}">
                  ${isVideo ? `
                    <video class="absolute inset-0 w-full h-full object-cover" autoplay loop muted playsinline>
                      <source src="${bannerImg}" type="video/mp4">
                    </video>
                  ` : ''}
                  
                  <div class="absolute inset-0 cyber-ambient-light pointer-events-none mix-blend-screen opacity-90"></div>
                  <div class="absolute inset-0 bg-gradient-to-r from-surface-container-lowest via-surface-container-lowest/80 to-transparent"></div>
                  <div class="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/40 to-transparent"></div>
                  <div class="absolute inset-0 bg-gradient-to-b from-surface-container-lowest/90 via-transparent to-transparent h-32 lg:h-48"></div>

                  <div class="relative z-10 w-full h-full max-w-7xl mx-auto px-4 lg:px-gutter flex flex-col justify-end pb-8 sm:pb-16 lg:pb-24 pt-20 lg:pt-32">
                    <div class="flex flex-col max-w-2xl gap-2 sm:gap-space-md">
                      
                      <div class="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container/15 text-secondary-container shadow-[0_0_16px_rgba(0,238,252,0.35)] font-label-sm text-[10px] uppercase tracking-wider animate-pulse border border-secondary-container/30">
                          <span class="w-1.5 h-1.5 rounded-full bg-secondary-container animate-ping"></span>
                          Featured Masterpiece
                        </span>
                        <span class="px-2.5 py-1 rounded bg-surface-container-high/90 text-on-surface font-label-sm text-[10px] tracking-widest uppercase">
                          ${show.type || 'Series'}
                        </span>
                        <span class="px-2 py-1 rounded bg-surface-container-high/90 text-primary font-label-sm text-[10px] tracking-widest uppercase font-bold">
                          ${show.badge || '4K HDR'}
                        </span>
                        <div class="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-surface-container-high/90 text-secondary">
                          <span class="material-symbols-outlined text-[14px]" style="font-variation-settings: 'FILL' 1;">star</span>
                          <span class="font-label-sm text-[11px] font-bold">${rating}</span>
                        </div>
                      </div>

                      <div class="flex flex-col">
                        <span class="font-label-md text-[11px] sm:text-xs text-secondary-container tracking-[0.3em] uppercase drop-shadow-[0_0_8px_rgba(0,238,252,0.4)]">Tokyo Master Pipeline • Pure OLED</span>
                        <h1 class="font-display-hero text-2xl sm:text-4xl lg:text-display-hero text-on-surface drop-shadow-[0_8px_32px_rgba(0,0,0,0.9)] tracking-tight leading-tight">
                          ${show.title}
                        </h1>
                      </div>

                      <div class="flex flex-wrap items-center gap-2 font-label-md text-xs sm:text-label-lg text-outline">
                        <span class="text-secondary-fixed font-bold">${show.year || '2025'}</span>
                        <span>•</span>
                        <span>${genres}</span>
                        <span>•</span>
                        <span class="text-primary-fixed">${show.runtime || 'HD Cinema'}</span>
                      </div>

                      <p class="font-body-md text-xs sm:text-body-lg text-on-surface-variant max-w-xl line-clamp-2 sm:line-clamp-3 leading-relaxed">
                        ${show.description || 'Watch high-definition master anime streams with zero artifacts, crystal clear multichannel audio and simultaneous Tokyo broadcasts.'}
                      </p>

                      <div class="flex items-center gap-2.5 sm:gap-3 pt-2">
                        <a href="${playLink}" class="flex-1 sm:flex-initial relative inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-3 sm:py-3.5 rounded-full bg-primary-container text-on-primary-container font-label-lg text-xs sm:text-label-lg shadow-[0_0_28px_rgba(255,80,110,0.5)] hover:shadow-[0_0_42px_rgba(255,80,110,0.95)] hover:scale-105 active:scale-95 sheen-effect overflow-hidden spring-motion group cursor-pointer" onclick="return window.requireAuthPlay(event, '${playLink}')">
                          <span class="material-symbols-outlined text-[20px] sm:text-[22px] group-hover:scale-110 spring-motion" style="font-variation-settings: 'FILL' 1;">play_arrow</span>
                          <span class="tracking-wider uppercase font-bold relative z-10">Watch Now</span>
                        </a>
                        <button onclick="toggleWatchlist(this, ${show.id})" class="inline-flex items-center justify-center gap-1.5 px-4 sm:px-6 py-3 sm:py-3.5 rounded-full bg-surface-container-high/80 text-on-surface border border-transparent hover:border-secondary-container/50 hover:text-secondary-container hover:bg-surface-container-highest hover:shadow-[0_0_24px_rgba(0,238,252,0.35)] hover:scale-105 active:scale-95 spring-motion font-label-lg text-xs sm:text-label-lg backdrop-blur-xl shadow-lg cursor-pointer group">
                          <span class="material-symbols-outlined text-[18px] sm:text-[20px] group-hover:scale-110 spring-motion">add</span>
                          <span class="tracking-wide hidden xs:inline">Watchlist</span>
                        </button>
                        <button onclick="window.openShowDetails && window.openShowDetails(${show.id})" class="inline-flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-surface-container-low/90 text-on-surface hover:text-secondary hover:bg-surface-container-high hover:scale-110 hover:shadow-[0_0_18px_rgba(0,238,252,0.4)] spring-motion cursor-pointer shadow-md group shrink-0" title="Show Details">
                          <span class="material-symbols-outlined text-[20px] sm:text-[22px] group-hover:rotate-12 spring-motion">theaters</span>
                        </button>
                      </div>
                    </div>

                    <div class="flex items-center justify-between w-full pt-6 sm:pt-10">
                      <div class="swiper-pagination flex items-center gap-1.5"></div>
                      <div class="hidden sm:flex items-center gap-2">
                        <button class="hero-prev-btn w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-surface-container-high/80 flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-bright hover:scale-110 active:scale-95 spring-motion cursor-pointer">
                          <span class="material-symbols-outlined text-[18px] sm:text-[20px]">chevron_left</span>
                        </button>
                        <button class="hero-next-btn w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-surface-container-high/80 flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-bright hover:scale-110 active:scale-95 spring-motion cursor-pointer">
                          <span class="material-symbols-outlined text-[18px] sm:text-[20px]">chevron_right</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            `;
          });

          wrapper.innerHTML = html;
        }

        // Initialize / Update Swiper Hero Slider
        if (swiperHeroInstance) swiperHeroInstance.destroy(true, true);
        swiperHeroInstance = new Swiper('.hero-slider', {
          loop: true,
          autoplay: { delay: slideDelay, disableOnInteraction: false },
          pagination: { el: '.swiper-pagination', clickable: true },
          navigation: { nextEl: '.hero-next-btn', prevEl: '.hero-prev-btn' },
          effect: 'fade',
          fadeEffect: { crossFade: true },
          speed: 800
        });

      } catch (e) {
        console.error('Error fetching carousel:', e);
      }
    }

    /* Continue Watching Component (Unified Server + Local Storage + Curated Parity) */
    async function loadContinueWatching() {
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
          const key = item.isLunar ? `lunar-${item.lunarId || item.anilistId}` : `show-${item.showId || item.id}`;
          mergedMap.set(key, { ...item, source: 'local' });
        });

        serverHistory.forEach(item => {
          if (!item) return;
          const isLunar = !!(item.isLunar || (item.episode?.show?.isLunar));
          const anilistId = item.lunarId || item.episode?.show?.anilistId;
          const key = isLunar ? `lunar-${anilistId}` : `show-${item.episode?.show?.id || item.episodeId}`;

          if (!mergedMap.has(key)) {
            mergedMap.set(key, item);
          } else {
            const existing = mergedMap.get(key);
            const existingTime = existing.lastWatchedAt || (existing.watchedAt ? new Date(existing.watchedAt).getTime() : 0);
            const serverTime = item.watchedAt ? new Date(item.watchedAt).getTime() : 0;
            if (serverTime > existingTime) {
              mergedMap.set(key, item);
            }
          }
        });

        const allItems = Array.from(mergedMap.values());
        const grid = document.getElementById('continueWatchingGrid');
        const countBadge = document.getElementById('continueWatchingCount');

        if (!grid) return;

        if (allItems.length > 0) {
          if (countBadge) countBadge.textContent = `${allItems.length} In-Flight`;

          let html = '';
          allItems.slice(0, 4).forEach(item => {
            const isLunar = !!(item.isLunar || (item.episode?.show?.isLunar) || item.lunarId);
            const duration = item.duration || 1;
            const progress = item.progress || 0;
            const percent = item.percent !== undefined ? item.percent : Math.min(100, Math.max(0, (progress / duration) * 100));
            const roundedPercent = Math.round(percent);

            let showTitle = '';
            let posterUrl = '';
            let epNum = 1;
            let resumeUrl = '';

            if (isLunar) {
              const anilistId = item.lunarId || item.anilistId || item.episode?.show?.anilistId;
              epNum = item.episodeNumber || item.episode?.episodeNumber || 1;
              showTitle = item.title || item.showTitle || item.episode?.show?.title || 'Anime Series';
              posterUrl = item.poster || item.episode?.show?.poster || 'Postes/spyfamS3p.jpg';
              const seekParam = progress > 5 ? `&t=${Math.floor(progress)}` : '';
              resumeUrl = `/watch?id=${anilistId}&ep=${epNum}${seekParam}`;
            } else {
              if (!item.episode || !item.episode.show) return;
              const show = item.episode.show;
              showTitle = show.title;
              posterUrl = window.formatMediaUrl(show.poster);
              epNum = item.episode.episodeNumber;
              const seekParam = progress > 5 ? `&t=${Math.floor(progress)}` : '';
              resumeUrl = `/watch?id=${item.episodeId}${seekParam}`;
            }

            html += `
              <div class="w-[260px] lg:w-auto shrink-0 snap-start group relative flex flex-col rounded-xl overflow-hidden bg-surface-container-low border border-transparent hover:border-primary-container/40 shadow-xl hover:shadow-[0_14px_30px_rgba(255,80,110,0.25)] hover:-translate-y-2 spring-motion cursor-pointer" onclick="window.location.href='${resumeUrl}'">
                <div class="relative w-full aspect-video overflow-hidden bg-surface-container-lowest">
                  <img class="w-full h-full object-cover spring-motion group-hover:scale-105" src="${posterUrl}" alt="${showTitle}" onerror="this.onerror=null; this.src='Postes/spyfamS3p.jpg';" />
                  <div class="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/20 to-transparent"></div>
                  
                  <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-surface-container-lowest/50 backdrop-blur-xs">
                    <div class="w-12 h-12 rounded-full bg-primary-container/90 text-on-primary-container flex items-center justify-center shadow-[0_0_20px_#ff506e] transform group-hover:scale-110 spring-motion">
                      <span class="material-symbols-outlined text-[24px]" style="font-variation-settings: 'FILL' 1;">play_arrow</span>
                    </div>
                  </div>
                  
                  <span class="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-surface-container-lowest/80 text-outline font-label-sm text-[10px] backdrop-blur-md">
                    ${roundedPercent}% seen
                  </span>
                  <span class="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-surface-container-lowest/90 text-secondary font-label-sm text-[10px] uppercase font-bold">
                    ${isLunar ? '1080P' : '4K UHD'}
                  </span>
                </div>

                <div class="w-full h-1 bg-surface-variant relative overflow-hidden">
                  <div class="h-full bg-gradient-to-r from-primary-container to-secondary-container shadow-[0_0_12px_#ff506e] group-hover:brightness-125 spring-motion" style="width: ${percent}%;"></div>
                </div>

                <div class="p-space-md flex flex-col gap-0.5">
                  <span class="font-headline-sm text-sm lg:text-headline-sm font-bold text-on-surface truncate group-hover:text-secondary-container transition-colors">${showTitle}</span>
                  <div class="flex items-center justify-between text-outline font-label-sm text-xs mt-0.5">
                    <span class="text-on-surface-variant">Episode ${epNum}</span>
                    <span>Resume</span>
                  </div>
                </div>
              </div>
            `;
          });
          grid.innerHTML = html;
        } else {
          // Render the 4 Curated High-Fidelity Cards from Stitch Parity
          if (countBadge) countBadge.textContent = '4 In-Flight';
          let fallbackHtml = '';
          CURATED_CONTINUE_WATCHING.forEach(item => {
            fallbackHtml += `
              <div class="w-[260px] lg:w-auto shrink-0 snap-start group relative flex flex-col rounded-xl overflow-hidden bg-surface-container-low border border-transparent hover:border-primary-container/40 shadow-xl hover:shadow-[0_14px_30px_rgba(255,80,110,0.25)] hover:-translate-y-2 spring-motion cursor-pointer" onclick="window.location.href='${item.url}'">
                <div class="relative w-full aspect-video overflow-hidden bg-surface-container-lowest">
                  <img class="w-full h-full object-cover spring-motion group-hover:scale-105" src="${item.image}" alt="${item.title}" onerror="this.onerror=null; this.src='Postes/spyfamS3p.jpg';" />
                  <div class="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/20 to-transparent"></div>
                  
                  <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-surface-container-lowest/50 backdrop-blur-xs">
                    <div class="w-12 h-12 rounded-full bg-primary-container/90 text-on-primary-container flex items-center justify-center shadow-[0_0_20px_#ff506e] transform group-hover:scale-110 spring-motion">
                      <span class="material-symbols-outlined text-[24px]" style="font-variation-settings: 'FILL' 1;">play_arrow</span>
                    </div>
                  </div>
                  
                  <span class="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-surface-container-lowest/80 text-outline font-label-sm text-[10px] backdrop-blur-md">
                    ${item.durationTag}
                  </span>
                  <span class="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-surface-container-lowest/90 text-secondary font-label-sm text-[10px] uppercase font-bold">
                    ${item.resTag}
                  </span>
                </div>

                <div class="w-full h-1 bg-surface-variant relative overflow-hidden">
                  <div class="h-full bg-gradient-to-r from-primary-container to-secondary-container shadow-[0_0_12px_#ff506e] group-hover:brightness-125 spring-motion" style="width: ${item.percent}%;"></div>
                </div>

                <div class="p-space-md flex flex-col gap-0.5">
                  <span class="font-headline-sm text-sm lg:text-headline-sm font-bold text-on-surface truncate group-hover:text-secondary-container transition-colors">${item.title}</span>
                  <div class="flex items-center justify-between text-outline font-label-sm text-xs mt-0.5">
                    <span class="text-on-surface-variant">${item.episode}</span>
                    <span>${item.percent}% Seen</span>
                  </div>
                </div>
              </div>
            `;
          });
          grid.innerHTML = fallbackHtml;
        }
      } catch (e) {
        console.error('Error loading continue watching:', e);
      }
    }

    /* Lunar Trending / Popular Anime */
    async function loadLunarTrending() {
      const container = document.getElementById('lunarAnimeSection');
      if (!container) return;

      try {
        const res = await fetch(`${API_BASE}/lunarx/trending`);
        if (!res.ok) return;
        const data = await res.json();
        globalLunarData = data;
        renderLunarSection();
      } catch (err) {
        console.warn('Lunar trending fetch failed:', err);
      }
    }

    function switchLunarTab(tabName) {
      currentLunarTab = tabName;
      renderLunarSection();
    }

    function renderLunarSection() {
      const container = document.getElementById('lunarAnimeSection');
      if (!container || !globalLunarData) return;

      const list = globalLunarData[currentLunarTab] || [];
      if (list.length === 0) return;

      const cardsHtml = list.slice(0, 10).map(show => {
        const playUrl = `/watch?id=${show.anilistId}&ep=1`;
        const posterUrl = show.poster || 'Postes/spyfamS3p.jpg';
        const safeTitle = (show.title || '').replace(/'/g, "\\\\'");
        const safePoster = (show.poster || '').replace(/'/g, "\\\\'");
        const safeBanner = (show.banner || '').replace(/'/g, "\\\\'");

        return `
          <div class="w-[140px] sm:w-[170px] lg:w-auto shrink-0 snap-start group relative flex flex-col rounded-xl overflow-hidden bg-surface-container-low border border-transparent hover:border-secondary-container/40 shadow-xl hover:-translate-y-2 hover:shadow-[0_16px_32px_rgba(0,238,252,0.25)] spring-motion cursor-pointer" onclick="window.openShowDetails({ id: 'lunar-${show.anilistId}', anilistId: ${show.anilistId}, title: '${safeTitle}', poster: '${safePoster}', banner: '${safeBanner}', isLunar: true })">
            <div class="relative aspect-[2/3] w-full overflow-hidden bg-surface-container-lowest">
              <img src="${posterUrl}" alt="${show.title}" loading="lazy" class="w-full h-full object-cover spring-motion group-hover:scale-105" onerror="this.onerror=null; this.src='Postes/spyfamS3p.jpg';" />
              <div class="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-transparent to-transparent"></div>
              
              <span class="absolute top-2 left-2 px-2 py-0.5 rounded bg-surface-container-lowest/90 text-secondary font-label-sm text-[10px] font-bold border border-secondary-container/20">
                1080P ULTRA
              </span>
              
              <div class="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                <span class="px-2 py-0.5 rounded bg-surface-container-lowest/80 text-secondary font-label-sm text-[10px] font-bold backdrop-blur-md">
                  ★ 4.9
                </span>
                <span class="px-1.5 py-0.5 rounded bg-surface-container-high/90 text-on-surface font-label-sm text-[9px] font-bold">SUB</span>
              </div>

              <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-surface-container-lowest/40 backdrop-blur-xs">
                <div class="w-11 h-11 rounded-full bg-secondary-container text-on-secondary-fixed flex items-center justify-center shadow-[0_0_20px_rgba(0,238,252,0.8)] group-hover:scale-110 spring-motion" onclick="event.stopPropagation(); return window.requireAuthPlay(event, '${playUrl}')">
                  <span class="material-symbols-outlined text-[24px]" style="font-variation-settings: 'FILL' 1;">play_arrow</span>
                </div>
              </div>
            </div>

            <div class="p-3 bg-surface-container-low flex flex-col gap-0.5">
              <span class="font-headline-sm text-sm font-bold text-on-surface truncate group-hover:text-secondary-container transition-colors">${show.title}</span>
              <div class="flex items-center justify-between text-outline font-label-sm text-[11px] mt-0.5">
                <span>${show.year || 'Anime Series'}</span>
                <span class="text-secondary">Simulcast</span>
              </div>
            </div>
          </div>
        `;
      }).join('');

      container.innerHTML = `
        <div class="flex flex-col md:flex-row md:items-end justify-between mb-space-lg gap-space-sm px-4 lg:px-gutter">
          <div class="flex flex-col">
            <div class="flex items-center gap-2 font-label-sm text-xs text-secondary-container uppercase tracking-widest font-bold">
              <span class="material-symbols-outlined text-[16px] text-primary-container animate-pulse">local_fire_department</span>
              <span>Featured Anime Masterpieces</span>
            </div>
            <h2 class="font-headline-lg text-2xl lg:text-headline-lg tracking-tight font-extrabold text-on-surface mt-1">
              Top Tier Anime Broadcasts
            </h2>
          </div>
          
          <div class="flex items-center gap-1.5 bg-surface-container-low p-1 rounded-full overflow-x-auto no-scrollbar">
            <button class="px-3.5 py-1.5 rounded-full font-label-md text-xs cursor-pointer spring-motion ${currentLunarTab === 'popularThisSeason' ? 'bg-secondary-container text-on-secondary-fixed font-bold shadow-[0_0_12px_rgba(0,238,252,0.35)]' : 'text-on-surface-variant hover:text-on-surface'}" onclick="switchLunarTab('popularThisSeason')">Popular Season</button>
            <button class="px-3.5 py-1.5 rounded-full font-label-md text-xs cursor-pointer spring-motion ${currentLunarTab === 'trendingNow' ? 'bg-secondary-container text-on-secondary-fixed font-bold shadow-[0_0_12px_rgba(0,238,252,0.35)]' : 'text-on-surface-variant hover:text-on-surface'}" onclick="switchLunarTab('trendingNow')">Trending Now</button>
            <button class="px-3.5 py-1.5 rounded-full font-label-md text-xs cursor-pointer spring-motion ${currentLunarTab === 'upcomingNextSeason' ? 'bg-secondary-container text-on-secondary-fixed font-bold shadow-[0_0_12px_rgba(0,238,252,0.35)]' : 'text-on-surface-variant hover:text-on-surface'}" onclick="switchLunarTab('upcomingNextSeason')">Upcoming</button>
            <a href="anime.html" class="px-3 py-1.5 text-xs font-bold text-secondary-container hover:text-secondary flex items-center gap-0.5 ml-2">Browse All <span class="material-symbols-outlined text-[14px]">arrow_forward</span></a>
          </div>
        </div>

        <div class="flex lg:grid lg:grid-cols-5 gap-space-md overflow-x-auto lg:overflow-visible no-scrollbar px-4 lg:px-gutter snap-x snap-mandatory">
          ${cardsHtml}
        </div>
      `;
    }

    /* Database Categories and Content Rails */
    async function loadCategories() {
      const container = document.getElementById('homeDynamicSections');
      if (!container) return;

      try {
        const res = await fetch(`${API_BASE}/shows/categories`);
        if (res.ok) {
          globalCategoriesData = await res.json();
          renderDynamicHomeSections();
        }
      } catch (e) {
        console.error('Error fetching categories:', e);
      }
    }

    function renderDynamicHomeSections() {
      const container = document.getElementById('homeDynamicSections');
      if (!container || !globalCategoriesData || globalCategoriesData.length === 0) return;

      let sectionsHtml = '';

      globalCategoriesData.forEach(cat => {
        const shows = cat.shows || [];
        if (shows.length > 0) {
          const info = CATEGORY_MAP[cat.slug] || { name: cat.name, icon: 'fa-layer-group', color: '#ff506e' };

          let cardsHtml = '';
          shows.slice(0, 5).forEach(show => {
            const isFav = userWatchlist.includes(show.id) ? 'active' : '';
            const heartIcon = userWatchlist.includes(show.id) ? 'favorite' : 'favorite_border';
            const hasEpisodes = show.episodes && show.episodes.length > 0;
            const playUrl = hasEpisodes ? `/watch?id=${show.episodes[0].id}` : '#';

            cardsHtml += `
              <div class="w-[140px] sm:w-[170px] lg:w-auto shrink-0 snap-start group relative flex flex-col rounded-xl overflow-hidden bg-surface-container-low border border-transparent hover:border-secondary-container/40 shadow-xl hover:-translate-y-2 hover:shadow-[0_16px_32px_rgba(0,238,252,0.25)] spring-motion cursor-pointer" onclick="if(!event.target.closest('.action-btn')) window.openShowDetails(${show.id})">
                <div class="relative aspect-[2/3] w-full overflow-hidden bg-surface-container-lowest">
                  <img src="${window.formatMediaUrl(show.poster)}" alt="${show.title}" loading="lazy" class="w-full h-full object-cover spring-motion group-hover:scale-105" onerror="this.onerror=null; this.src='Postes/spyfamS3p.jpg';" />
                  <div class="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-transparent to-transparent"></div>
                  
                  <span class="absolute top-2 left-2 px-2 py-0.5 rounded bg-surface-container-lowest/90 text-primary-container font-label-sm text-[10px] font-bold">
                    ${show.badge || 'HD'}
                  </span>

                  <button class="action-btn absolute top-2 right-2 w-8 h-8 rounded-full bg-surface-container-lowest/80 text-outline hover:text-primary flex items-center justify-center backdrop-blur-md transition-colors ${isFav ? 'text-primary' : ''}" onclick="toggleWatchlist(this, ${show.id})" title="Add to Watchlist">
                    <span class="material-symbols-outlined text-[18px]">${heartIcon}</span>
                  </button>

                  <div class="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                    <span class="px-2 py-0.5 rounded bg-surface-container-lowest/80 text-secondary font-label-sm text-[10px] font-bold backdrop-blur-md">
                      ★ ${show.rating || '4.9'}
                    </span>
                    <div class="flex items-center gap-1">
                      ${show.dubsub ? '<span class="px-1.5 py-0.5 rounded bg-surface-container-high/90 text-on-surface font-label-sm text-[9px] font-bold">SUB/DUB</span>' : '<span class="px-1.5 py-0.5 rounded bg-surface-container-high/90 text-on-surface font-label-sm text-[9px] font-bold">HD</span>'}
                    </div>
                  </div>

                  <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-surface-container-lowest/40 backdrop-blur-xs">
                    <a href="${playUrl}" class="action-btn w-11 h-11 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center shadow-[0_0_20px_#ff506e] group-hover:scale-110 spring-motion" onclick="event.stopPropagation(); return window.requireAuthPlay(event, '${playUrl}')">
                      <span class="material-symbols-outlined text-[24px]" style="font-variation-settings: 'FILL' 1;">play_arrow</span>
                    </a>
                  </div>
                </div>

                <div class="p-3 bg-surface-container-low flex flex-col gap-0.5">
                  <span class="font-headline-sm text-sm font-bold text-on-surface truncate group-hover:text-secondary-container transition-colors">${show.title}</span>
                  <div class="flex items-center justify-between text-outline font-label-sm text-[11px] mt-0.5">
                    <span>${show.year || '2025'}</span>
                    <span>${show.runtime || 'Complete'}</span>
                  </div>
                </div>
              </div>
            `;
          });

          sectionsHtml += `
            <section class="w-full max-w-7xl mx-auto pt-space-xl" id="section-${cat.slug}">
              <div class="flex items-end justify-between mb-space-lg px-4 lg:px-gutter">
                <div class="flex flex-col">
                  <div class="flex items-center gap-2 font-label-sm text-xs uppercase tracking-widest font-bold" style="color: ${info.color};">
                    <i class="fas ${info.icon}"></i>
                    <span>Category Showcase</span>
                  </div>
                  <h2 class="font-headline-lg text-2xl lg:text-headline-lg tracking-tight font-extrabold text-on-surface mt-1">
                    ${info.name}
                  </h2>
                </div>
                <a href="view.html#${cat.slug}" class="font-label-md text-xs lg:text-label-md text-secondary-container hover:text-secondary flex items-center gap-0.5 transition-colors group">
                  <span>View All (${shows.length})</span>
                  <span class="material-symbols-outlined text-[16px] group-hover:translate-x-1 spring-motion">chevron_right</span>
                </a>
              </div>
              
              <div class="flex lg:grid lg:grid-cols-5 gap-space-md overflow-x-auto lg:overflow-visible no-scrollbar px-4 lg:px-gutter snap-x snap-mandatory">
                ${cardsHtml}
              </div>
            </section>
          `;
        }
      });

      container.innerHTML = sectionsHtml;
    }

    /* Filter ribbon navigation */
    window.filterCatalogBy = function (category) {
      document.querySelectorAll('#quickFilterRibbon .cat-pill').forEach(btn => {
        btn.classList.remove('active', 'bg-secondary-container', 'text-on-secondary-fixed', 'shadow-[0_0_16px_rgba(0,238,252,0.35)]', 'font-bold');
        btn.classList.add('bg-surface-container-low', 'text-on-surface-variant');
      });
      if (event && event.currentTarget) {
        event.currentTarget.classList.add('active', 'bg-secondary-container', 'text-on-secondary-fixed', 'shadow-[0_0_16px_rgba(0,238,252,0.35)]', 'font-bold');
        event.currentTarget.classList.remove('bg-surface-container-low', 'text-on-surface-variant');
      }

      if (category === 'all') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (category === 'simulcasts') {
        const el = document.getElementById('simulcastsSection');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        const el = document.getElementById(`section-${category}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          window.location.href = `view.html#${category}`;
        }
      }
    };

    /* Watchlist Operations */
    async function loadWatchlist() {
      try {
        const res = await fetch(`${API_BASE}/user/watchlist`, { headers: getAuthHeader() });
        if (res.status === 401) {
          handleLogout();
          return;
        }
        if (res.ok) {
          const data = await res.json();
          userWatchlist = data.map(show => show.id);
        }
      } catch (e) {
        console.error(e);
      }
    }

    async function toggleWatchlist(btn, showId) {
      if (!isLoggedIn()) {
        openModal('login');
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/user/watchlist`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader()
          },
          body: JSON.stringify({ showId })
        });

        if (res.ok) {
          const data = await res.json();
          if (data.status === 'added') {
            if (btn) btn.classList.add('text-primary');
            userWatchlist.push(showId);
          } else {
            if (btn) btn.classList.remove('text-primary');
            userWatchlist = userWatchlist.filter(id => id !== showId);
          }
          loadWatchlist();
        }
      } catch (e) {
        console.error(e);
      }
    }

    /* Auth Gate for Playback */
    window.requireAuthPlay = function (e, playUrl) {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (!isLoggedIn()) {
        if (playUrl && playUrl !== '#') {
          sessionStorage.setItem('infinx_redirect_after_auth', playUrl);
        }
        openModal('register');
        return false;
      }
      if (playUrl && playUrl !== '#') {
        window.location.href = playUrl;
      }
      return true;
    };

    /* Authentication Handlers */
    async function handleLogin(e) {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;

      try {
        const res = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const data = await res.json();
        if (res.ok) {
          localStorage.setItem('infinx_token', data.token);
          localStorage.setItem('infinx_user_email', data.user.email);
          localStorage.setItem('infinx_user_role', data.user.role);
          if (data.user) {
            localStorage.setItem('infinx_user', JSON.stringify(data.user));
            if (data.user.username) localStorage.setItem('infinx_username', data.user.username);
            if (data.user.avatarUrl) localStorage.setItem('infinx_avatar', data.user.avatarUrl);
            if (data.user.avatarFrame) localStorage.setItem('infinx_avatar_frame', data.user.avatarFrame);
            if (data.user.vipRank) localStorage.setItem('infinx_vip_rank', data.user.vipRank);
            if (data.user.level) localStorage.setItem('infinx_level', String(data.user.level));
          }

          closeModal('login');
          initApp();

          const target = sessionStorage.getItem('infinx_redirect_after_auth');
          if (target) {
            sessionStorage.removeItem('infinx_redirect_after_auth');
            window.location.href = target;
          }
        } else {
          alert(data.error || 'Login failed');
        }
      } catch (err) {
        console.error(err);
        alert('Connection error');
      }
    }

    async function handleRegister(e) {
      e.preventDefault();
      const email = document.getElementById('registerEmail').value;
      const password = document.getElementById('registerPassword').value;

      try {
        const res = await fetch(`${API_BASE}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const data = await res.json();
        if (res.ok) {
          localStorage.setItem('infinx_token', data.token);
          localStorage.setItem('infinx_user_email', data.user.email);
          localStorage.setItem('infinx_user_role', data.user.role);
          if (data.user) {
            localStorage.setItem('infinx_user', JSON.stringify(data.user));
            if (data.user.username) localStorage.setItem('infinx_username', data.user.username);
            if (data.user.avatarUrl) localStorage.setItem('infinx_avatar', data.user.avatarUrl);
            if (data.user.avatarFrame) localStorage.setItem('infinx_avatar_frame', data.user.avatarFrame);
            if (data.user.vipRank) localStorage.setItem('infinx_vip_rank', data.user.vipRank);
            if (data.user.level) localStorage.setItem('infinx_level', String(data.user.level));
          }

          closeModal('register');
          initApp();

          const target = sessionStorage.getItem('infinx_redirect_after_auth');
          if (target) {
            sessionStorage.removeItem('infinx_redirect_after_auth');
            window.location.href = target;
          }
        } else {
          alert(data.error || 'Registration failed');
        }
      } catch (err) {
        console.error(err);
        alert('Connection error');
      }
    }

    function handleLogout(e) {
      if (e) e.stopPropagation();
      localStorage.clear();
      updateAuthHeader();
      userWatchlist = [];
      loadContinueWatching();
    }

    /* Modal Helpers */
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

    /* Public live chat scroll helper */
    window.scrollToPublicChat = function (e) {
      if (e) e.preventDefault();
      const sec = document.getElementById('publicLiveChatSection');
      if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };
  </script>

  <!-- External System Scripts -->
  <script src="/show-details-modal.js"></script>
  <script src="welcome.js"></script>
  <script src="/socket.io/socket.io.js"></script>
  <script src="public-chat.js?v=2.2"></script>
</body>

</html>
'''

with open('frontend/index.html', 'w', encoding='utf-8') as f:
    f.write(html_content.strip() + '\n')
print("frontend/index.html written successfully!")
