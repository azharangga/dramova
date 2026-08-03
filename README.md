<h1 align="center">Dramova</h1>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-v16-black?style=flat-square&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-v19-61DAFB?style=flat-square&logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-v5.8-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Supabase-Database-3ECF8E?style=flat-square&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/HLS.js-Streaming-E34F26?style=flat-square&logo=html5&logoColor=white" alt="HLS.js" />
  <img src="https://img.shields.io/badge/PWA-Ready-5A0FC8?style=flat-square&logo=pwa&logoColor=white" alt="PWA" />
</p>

---

## Deskripsi Proyek

Dramova adalah platform streaming film, movie, dan serial modern yang dibangun dengan arsitektur hybrid. Platform ini memadukan kekuatan Next.js sebagai shell untuk routing, Server-Side Rendering (SSR), autentikasi, dan API Proxy, dengan interaktivitas UI berbasis Vanilla JavaScript (ES Modules). Arsitektur ini dirancang untuk meminimalkan runtime overhead saat playback video, mempercepat transisi halaman, dan memberikan pengalaman pengguna yang responsif mendekati aplikasi native. Aplikasi ini mengintegrasikan Supabase untuk manajemen sesi pengguna (Authentication) dan fitur sinkronisasi real-time (Watch Party), serta menggunakan Cloudflare Turnstile untuk keamanan verifikasi bot pada form autentikasi.

---

## Fitur Utama

- Agregasi Konten Multi-Platform: Mengintegrasikan berbagai sumber konten populer dalam satu antarmuka terpadu.
- Watch Party: Fitur menonton bersama secara real-time dengan sinkronisasi kontrol video (play, pause, seek) dan chat room yang ditenagai oleh Supabase Realtime.
- Streaming Adaptif HLS: Pemutaran video menggunakan protokol HLS (HTTP Live Streaming) dengan penyesuaian bitrate otomatis berdasarkan kondisi jaringan pengguna.
- Progressive Web App (PWA): Mendukung instalasi aplikasi langsung ke layar utama perangkat (home screen) dengan dukungan offline caching melalui Service Worker.
- Feed Video Vertikal (Shorts): Tampilan video pendek vertikal bergaya media sosial modern untuk penjelajahan konten yang cepat.
- Manajemen Riwayat dan Favorit: Fitur penyimpanan riwayat tontonan dan daftar favorit pengguna yang tersimpan di penyimpanan lokal serta disinkronkan ke akun pengguna.
- Animasi Halus: Transisi antarmuka dan interaksi mikro yang responsif menggunakan integrasi GSAP.
- API Proxy Aman: Keamanan lalu lintas media stream dengan proxy Next.js Route Handlers dan verifikasi tanda tangan HMAC.

---

## Struktur Direktori

Berikut adalah struktur folder utama dari proyek Dramova secara mendetail:

```
dramova/
├── public/                                # Statis & Client-side Script (Vanilla JS)
│   ├── css/
│   │   └── app.css                        # Stylesheet utama aplikasi
│   ├── js/                                # Vanilla JS ES Modules untuk logika client-side
│   │   ├── api.js                         # Interface klien API untuk request ke backend
│   │   ├── detail.js                      # Logika tampilan detail film/serial
│   │   ├── discover.js                    # Logika pencarian & kategori pada halaman discover
│   │   ├── index.js                       # Entry point JS untuk halaman utama (home)
│   │   ├── library.js                     # Logika pengelolaan watchlist & riwayat lokal
│   │   ├── motion.js                      # Logika animasi menggunakan GSAP
│   │   ├── movie.js                       # Logika streaming & antarmuka halaman movie
│   │   ├── party.js                       # Sinkronisasi real-time & chat untuk Watch Party
│   │   ├── party-landing.js               # Logika antarmuka landing page Watch Party
│   │   ├── prefetch.js                    # Mekanisme prefetch halaman untuk transisi instan
│   │   ├── pull-refresh.js                # Implementasi gesture pull-to-refresh
│   │   ├── pwa.js                         # Integrasi manifest & registrasi Service Worker PWA
│   │   ├── search.js                      # Logika fitur pencarian global
│   │   ├── serial.js                      # Logika pemutar & daftar episode serial
│   │   ├── shorts.js                      # Logika pemutar video shorts vertical
│   │   ├── shorts-feed.js                 # Feed video vertical ala TikTok
│   │   ├── state.js                       # Global state management & sinkronisasi localStorage
│   │   ├── toast.js                       # Komponen feedback visual toast non-React
│   │   ├── ui.js                          # Shared UI elements & helpers
│   │   ├── video-optimize.js              # Utilitas optimalisasi video player
│   │   └── watch.js                       # Logika inti video player HLS, gesture & progress tracking
│   ├── img/                               # Logo, ikon aplikasi, favicon, & PWA assets
│   ├── sw.js                              # Service Worker untuk custom caching & offline support
│   └── manifest.webmanifest               # Manifest untuk konfigurasi PWA (Progressive Web App)
├── src/                                   # Source Code Aplikasi (Next.js & React Shell)
│   ├── app/                               # Next.js App Router (Routing & API Endpoints)
│   │   ├── api/                           # Endpoint API proxy backend
│   │   │   ├── activity/                  # API log aktivitas user
│   │   │   ├── auth/                      # API handling otentikasi & session
│   │   │   ├── media/                     # API Proxy streaming video aman (HMAC signing)
│   │   │   ├── movie/                     # API data film
│   │   │   ├── party/                     # API pengelolaan party room
│   │   │   ├── proxy/                     # API proxy umum ke backend
│   │   │   ├── serial/                    # API data serial & episode
│   │   │   └── shorts/                    # API data video shorts
│   │   ├── account/                       # Halaman pengaturan akun
│   │   ├── discover/                      # Halaman jelajah konten
│   │   ├── history/                       # Halaman riwayat tontonan
│   │   ├── login/                         # Halaman login user
│   │   ├── movie/                         # Halaman streaming movie
│   │   ├── party/                         # Halaman Watch Party room
│   │   ├── profile/                       # Halaman profil user
│   │   ├── register/                      # Halaman pendaftaran akun
│   │   ├── search/                        # Halaman hasil pencarian
│   │   ├── series/                        # Halaman streaming serial
│   │   ├── shorts/                        # Halaman video shorts vertikal
│   │   ├── layout.tsx                     # Root layout aplikasi (global Providers)
│   │   ├── page.tsx                       # Halaman utama (home)
│   │   └── providers.tsx                  # Wrapper ThemeProvider, AuthProvider, & ToastProvider
│   ├── components/                        # React Shell Components (untuk layouting)
│   │   ├── auth/                          # Komponen terkait otentikasi
│   │   │   └── AuthBrandPanel.tsx
│   │   ├── pages/                         # Komponen halaman (Login, Register, Profile)
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   └── ProfilePage.tsx
│   │   ├── party/                         # Komponen UI Watch Party
│   │   │   ├── PartyLanding.tsx
│   │   │   └── PartyRoomView.tsx
│   │   ├── ui/                            # Shadcn UI reusable components (button, dialog, dll)
│   │   ├── BottomNav.tsx                  # Navigasi bawah untuk perangkat mobile
│   │   ├── Topbar.tsx                     # Header navigasi atas untuk desktop/tablet
│   │   ├── MediaSections.tsx              # Section grid & rail slider konten media
│   │   ├── WatchPageView.tsx              # Wrapper layout untuk pemutaran video
│   │   └── ...                            # Komponen structural shell lainnya
│   ├── lib/                               # Utilitas, Helper, & Konfigurasi Supabase
│   │   ├── supabase/                      # Konfigurasi Supabase client & server-side helpers
│   │   ├── auth.tsx                       # React Context & Provider untuk autentikasi user
│   │   ├── party.ts                       # Logic helper untuk Watch Party room
│   │   ├── proxy.ts                       # Proxy streaming media & stream URL builder
│   │   └── secure-media.ts                # logic enkripsi & tanda tangan HMAC untuk URL media
│   └── styles/                            # Konfigurasi style, variables & Tailwind CSS
├── components.json                        # Konfigurasi komponen Shadcn UI
├── next.config.ts                         # Konfigurasi Next.js Compiler & Server Options
├── postcss.config.mjs                     # Konfigurasi PostCSS untuk Tailwind CSS v4
├── tsconfig.json                          # Konfigurasi compiler TypeScript
├── vercel.json                            # Konfigurasi deployment platform Vercel
└── package.json                           # Dependensi pihak ketiga & run scripts
```

---

## Arsitektur Aliran Data

```
┌────────────────────────────────────────────────────────┐
│                        Browser                         │
├────────────────────────────────────────────────────────┤
│  UI & Animasi (Vanilla JS, GSAP, HLS.js, Custom State) │
├────────────────────────────────────────────────────────┤
│  Next.js Shell (Routing, Layout, Auth Providers)       │
├────────────────────────────────────────────────────────┤
│  API Proxy Handler (/api/[platform]/[...path])         │
├────────────────────────────────────────────────────────┤
│  Supabase Realtime (Database, Auth, Watch Party Sync)  │
└────────────────────────────────────────────────────────┘
```

---

## Persyaratan Sistem

Untuk dapat menjalankan proyek ini di lingkungan lokal, pastikan perangkat Anda telah memenuhi spesifikasi berikut:

- Node.js versi 18.0 atau lebih tinggi.
- Package Manager npm (bawaan Node.js) atau yarn.
- Akun Supabase untuk mengonfigurasi database dan real-time engine.
- Kredensial Cloudflare Turnstile untuk fitur keamanan form.

---

## Konfigurasi Environment Variables

Salin berkas contoh konfigurasi lingkungan `.env` di direktori utama proyek, lalu sesuaikan nilainya:

```bash
# Backend API Base URL
API_BASE_URL=your_api_url

# Supabase Configurations
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Cloudflare Turnstile Configurations
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_turnstile_site_key
TURNSTILE_SECRET_KEY=your_turnstile_secret_key
```

---

## Petunjuk Setup dan Instalasi

Ikuti langkah-langkah di bawah ini untuk menyiapkan lingkungan pengembangan lokal Anda:

### 1. Kloning Repositori
```bash
git clone https://github.com/your-username/dramova.git
cd dramova
```

### 2. Instalasi Dependensi
Jalankan perintah berikut untuk menginstal semua pustaka pendukung yang diperlukan:
```bash
npm install
```

---

## Cara Menjalankan Aplikasi

### Development Mode
Untuk menjalankan aplikasi dalam lingkungan pengembangan lokal dengan fitur hot-reloads dan compiler Turbopack:
```bash
npm run dev
```
Setelah berhasil dijalankan, buka peramban dan akses alamat `http://localhost:3000`.

### Production Mode
Untuk membangun (build) aplikasi dan menjalankannya dengan optimasi performa produksi:
```bash
# Melakukan build proyek
npm run build

# Menjalankan aplikasi hasil build
npm run start
```

### Linting
Untuk memvalidasi kode program terhadap aturan penulisan kode (linter):
```bash
npm run lint
```

---

## Kontributor

Proyek Dramova ini dirancang dan dikembangkan oleh:

**Azharangga Kusuma**
