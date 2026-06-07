import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Dramova · Movie dan Serial",
  description:
    "Platform streaming modern untuk menikmati berbagai cerita menarik, mulai dari movie hingga serial favorit, dalam pengalaman menonton yang nyaman, ringan, dan immersive.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/img/favicon.png",
    apple: "/img/icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#0f0f0f",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" data-theme="dark" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        {/* Tailwind CDN for runtime utility classes used by vanilla JS */}
        <script src="https://cdn.tailwindcss.com" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
          tailwind.config = {
            darkMode: ['class', '[data-theme="dark"]'],
            theme: {
              extend: {
                colors: {
                  base:'#0f0f0f',surface:'#161616',raised:'#1c1c1c',
                  card:'#222222',border:'#282828',muted:'#3a3a3a',
                  green:'#2BA641','green-dark':'#238A36',silver:'#a0a0a0',
                  'near-white':'#f1f1f1',negative:'#ff6b6b',warning:'#ffb347',info:'#5ba4f5',
                },
                fontFamily:{sans:['Inter','system-ui','sans-serif']},
                borderRadius:{pill:'500px','full-pill':'9999px'},
                boxShadow:{heavy:'rgba(0,0,0,0.6) 0px 12px 32px',medium:'rgba(0,0,0,0.35) 0px 6px 16px'},
                keyframes:{
                  shimmer:{'0%':{backgroundPosition:'200% 0'},'100%':{backgroundPosition:'-200% 0'}},
                  fadeIn:{'0%':{opacity:0,transform:'translateY(8px)'},'100%':{opacity:1,transform:'translateY(0)'}},
                  slideUp:{'0%':{transform:'translateY(100%)'},'100%':{transform:'translateY(0)'}},
                  pop:{'0%':{transform:'scale(.92)',opacity:0},'100%':{transform:'scale(1)',opacity:1}},
                  spinSlow:{to:{transform:'rotate(360deg)'}},
                },
                animation:{
                  shimmer:'shimmer 1.4s infinite linear',
                  'fade-in':'fadeIn 0.35s ease-out',
                  'slide-up':'slideUp 0.32s cubic-bezier(.32,.72,.4,1)',
                  pop:'pop 0.25s ease-out',
                  'spin-slow':'spinSlow 1s linear infinite',
                },
              },
            },
          };
        `,
          }}
        />
        {/* GSAP */}
        <Script
          src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"
          strategy="beforeInteractive"
        />
        {/* Original app CSS — preserves all custom styles exactly */}
        <link rel="stylesheet" href="/css/app.css" />
        {/* Lucide icons — loaded by core-loader */}
        {/* HLS.js — async (bukan defer) supaya bisa ready lebih awal untuk shorts feed */}
        <script
          src="https://cdn.jsdelivr.net/npm/hls.js@1.5.13/dist/hls.min.js"
          async
        />
        {/* Apply theme BEFORE render to avoid flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
          (function(){try{var t=JSON.parse(localStorage.getItem('dramsi.theme')||'"dark"');if(t==='light'){document.documentElement.classList.add('light');document.documentElement.setAttribute('data-theme','light');var m=document.querySelector('meta[name="theme-color"]');if(m)m.content='#f5f5f7';}}catch(_){}})();
        `,
          }}
        />
        <style
          dangerouslySetInnerHTML={{
            __html: `
          body{background-color:var(--bg-base);color:var(--text-primary);font-family:'Inter',system-ui,sans-serif;font-size:16px;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;min-height:100vh;padding-bottom:calc(64px + env(safe-area-inset-bottom));transition:background-color .25s ease,color .25s ease;}
          @media(min-width:768px){body{padding-bottom:0;}}
        `,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <div id="pullRefreshIndicator" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
        </div>

        {children}

        {/* Load core scripts sequentially after hydration, then init UI */}
        <Script id="core-loader" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: `
          (function(){
            var scripts=['https://unpkg.com/lucide@latest/dist/umd/lucide.min.js','/js/api.js','/js/state.js','/js/toast.js','/js/ui.js','/js/video-optimize.js','/js/motion.js','/js/pull-refresh.js','/js/pwa.js'];
            var i=0;
            function loadNext(){
              if(i>=scripts.length){onAllLoaded();return;}
              var s=document.createElement('script');
              s.src=scripts[i];
              s.onload=function(){i++;loadNext();};
              s.onerror=function(){i++;loadNext();};
              document.body.appendChild(s);
            }
            function onAllLoaded(){
              // Signal that core is ready
              window.__DRAMOVA_READY=true;
              document.dispatchEvent(new Event('dramova:ready'));
              // Pre-fetch catalog semua platform di background
              var pf=document.createElement('script');pf.src='/js/prefetch.js';document.body.appendChild(pf);
              // Define refreshIcons globally
              window.refreshIcons=function(){window.lucide?.createIcons?.();};
              // Refresh icons
              window.refreshIcons();
              // Sync tooltips
              var isDesktop=window.matchMedia('(min-width:768px)').matches;
              document.querySelectorAll('button,a,[role="button"]').forEach(function(el){var l=(el.getAttribute('aria-label')||'').trim();var t=(el.textContent||'').replace(/\\s+/g,' ').trim();var h=!!el.querySelector('svg,[data-lucide]');var o=h&&(!t||t===l);if(isDesktop&&l&&o)el.dataset.tooltip=l;else if(el.dataset.tooltip===l)delete el.dataset.tooltip;});
              // Copyright year
              var cy=document.getElementById('copyrightYear');if(cy)cy.textContent=String(new Date().getFullYear());
              // Back to top
              var btt=document.getElementById('backToTop');if(btt){var v=false,ht=null;window.addEventListener('scroll',function(){var s=window.scrollY>400;if(s&&!v){v=true;btt.classList.remove('hiding');btt.classList.add('visible');}else if(!s&&v){v=false;btt.classList.add('hiding');clearTimeout(ht);ht=setTimeout(function(){btt.classList.remove('visible','hiding');},260);}},{passive:true});btt.addEventListener('click',function(){window.scrollTo({top:0,behavior:'smooth'});});}
              // Theme toggle
              var tb=document.getElementById('themeToggleBtn');if(tb){function si(){var d=document.documentElement.getAttribute('data-theme')!=='light';tb.setAttribute('aria-label',window.DramSi?.t?.(d?'theme.light':'theme.dark')||(d?'Aktifkan mode terang':'Aktifkan mode gelap'));}tb.addEventListener('click',function(){window.DramSi?.toggleTheme?.();si();});document.addEventListener('theme:changed',si);si();}
              // Lang changed
              document.addEventListener('lang:changed',function(){window.lucide?.createIcons?.();});
              window.addEventListener('resize',function(){window.lucide?.createIcons?.();});
              // Force full page reload on navigation
              document.addEventListener('click',function(e){var link=e.target.closest('a[href]');if(!link)return;var href=link.getAttribute('href');if(!href||href.startsWith('http')||href.startsWith('#')||href.startsWith('javascript'))return;if(e.metaKey||e.ctrlKey||e.shiftKey)return;if(link.target==='_blank')return;e.preventDefault();window.location.href=href;},true);
            }
            loadNext();
          })();
        `}} />

      </body>
    </html>
  );
}
