<h1 align="center">Dramova</h1>

<p align="center">
  Platform streaming drama pendek & serial modern
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15.3-black?style=flat-square&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4.1-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/HLS.js-Streaming-E34F26?style=flat-square&logo=html5&logoColor=white" alt="HLS.js" />
  <img src="https://img.shields.io/badge/GSAP-Animations-88CE02?style=flat-square&logo=greensock&logoColor=white" alt="GSAP" />
  <img src="https://img.shields.io/badge/PWA-Ready-5A0FC8?style=flat-square&logo=pwa&logoColor=white" alt="PWA" />
  <img src="https://img.shields.io/badge/Turbopack-Enabled-000?style=flat-square&logo=vercel&logoColor=white" alt="Turbopack" />
  <img src="https://img.shields.io/badge/Deploy-Vercel-000?style=flat-square&logo=vercel&logoColor=white" alt="Vercel" />
</p>

---

## About

Dramova adalah platform streaming drama pendek dan serial yang dibangun dengan arsitektur hybrid. Next.js digunakan sebagai shell untuk routing, SSR, dan API proxy, sementara seluruh interaktivitas UI menggunakan vanilla JavaScript. Pendekatan ini menghasilkan performa ringan, zero React runtime overhead saat playback video, dan pengalaman mendekati native app.

## Features

- **Multi-Platform** - Agregasi konten dari GoodShort, DramaBite, DramaBox, DramaNova, dan KDrama
- **Progressive Web App** - Install ke home screen, offline support via Service Worker
- **HLS Streaming** - Adaptive bitrate video playback dengan optimasi jaringan otomatis
- **Shorts Feed** - TikTok-style vertical video feed di mobile
- **Search & Discover** - Jelajahi dan cari drama dari berbagai sumber
- **Library** - Riwayat tontonan & favorit tersimpan di localStorage
- **Smooth Animations** - GSAP-powered transitions dan micro-interactions
- **Pull to Refresh** - Gesture refresh seperti native app
- **Dark Theme** - Tema gelap default yang nyaman untuk menonton
- **Secure Proxy** - Media stream diproxy dengan HMAC signature

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router + Turbopack) |
| UI Shell | React 19 + TypeScript |
| Interactivity | Vanilla JavaScript (ES Modules) |
| Styling | Tailwind CSS 4 |
| Video | HLS.js (Adaptive Streaming) |
| Animations | GSAP |
| State | localStorage + Custom Events |
| PWA | Service Worker + Web Manifest |
| Deploy | Vercel |

## Project Structure

```
dramova/
├── public/
│   ├── css/app.css              # Stylesheet utama
│   ├── js/                      # Client-side vanilla JS modules
│   │   ├── api.js               # API client
│   │   ├── state.js             # Global state & localStorage
│   │   ├── ui.js                # Shared UI components
│   │   ├── watch.js             # Video player (HLS, gestures)
│   │   ├── shorts-feed.js       # Vertical video feed
│   │   └── ...                  # Module lainnya
│   ├── img/                     # Logo, icons, favicon
│   ├── sw.js                    # Service Worker
│   └── manifest.webmanifest     # PWA manifest
│
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── layout.tsx           # Root layout
│   │   ├── page.tsx             # Home (/)
│   │   ├── shorts/              # /shorts
│   │   ├── series/              # /series
│   │   ├── discover/            # /discover
│   │   ├── search/              # /search
│   │   ├── history/             # /history
│   │   └── api/                 # API route handlers (proxy)
│   ├── components/              # React components (layout only)
│   ├── lib/                     # Utilities
│   └── styles/                  # Global styles
│
├── next.config.ts
├── tsconfig.json
└── package.json
```

## Architecture

```
┌─────────────────────────────────────────────────┐
│                   Browser                        │
├─────────────────────────────────────────────────┤
│  Vanilla JS (UI, Video, State, Animations)      │
├─────────────────────────────────────────────────┤
│  Next.js Shell (SSR, Routing, API Proxy)        │
├─────────────────────────────────────────────────┤
│  API Routes (/api/[platform]/[...path])         │
├─────────────────────────────────────────────────┤
│  FastAPI Backend (Content Aggregation)          │
└─────────────────────────────────────────────────┘
```

Alasan menggunakan arsitektur hybrid:

- Zero React runtime overhead untuk video playback
- Page transitions instan (cached by Service Worker)
- State management sederhana (localStorage, tanpa React state)
- Bundle size minimal

## Getting Started

### Prerequisites

- Node.js 18+
- npm atau yarn
- Backend API running (FastAPI)

### Installation

```bash
git clone https://github.com/your-username/dramova.git
cd dramova
npm install
cp .env.example .env.local
```

### Development

```bash
npm run dev
```

Buka `http://localhost:3000` di browser.

### Production

```bash
npm run build
npm start
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `API_BASE_URL` | URL backend FastAPI | `http://localhost:5000` |
