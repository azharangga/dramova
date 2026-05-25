import Script from "next/script";
import PageShell from "@/components/PageShell";

export default function HistoryPage() {
  return (
    <PageShell>
      <div className="page-header">
        <p className="page-kicker" data-i18n="library.kicker">Riwayat</p>
        <h1 className="page-title" data-i18n="library.title">Riwayat</h1>
        <p className="page-subtitle" data-i18n="library.sub">Kelola tontonan terakhir dan drama favorit dalam satu tempat agar mudah melanjutkan episode berikutnya.</p>
      </div>

      <div id="continueWatchingSection" className="hidden mt-5"></div>

      <div className="mt-7 flex flex-wrap items-center gap-2">
        <button data-tab="recent" className="lib-chip is-active px-4 py-1.5 text-xs font-bold transition border" style={{ borderRadius: "9999px", letterSpacing: "1.4px", textTransform: "uppercase" }}><span data-i18n="library.recent">Baru Ditonton</span></button>
        <button data-tab="favorite" className="lib-chip px-4 py-1.5 text-xs font-bold transition border" style={{ borderRadius: "9999px", letterSpacing: "1.4px", textTransform: "uppercase", background: "var(--bg-raised)", color: "var(--text-secondary)", borderColor: "var(--border-muted)" }}><span data-i18n="library.favorite">Favorit</span></button>
        <button id="clearLibBtn" hidden className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition active:scale-95" style={{ borderRadius: "9999px", border: "1px solid var(--border-muted)", background: "var(--bg-raised)", color: "var(--text-secondary)", letterSpacing: "1.4px", textTransform: "uppercase" }}><i data-lucide="trash-2" className="h-3.5 w-3.5"></i><span>Hapus</span></button>
      </div>

      <section className="mt-7">
        <div id="libraryGrid" className="content-grid grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6"></div>
        <div id="libraryEmpty" hidden className="mt-16 flex flex-col items-center justify-center text-center">
          <div className="grid h-20 w-20 place-items-center rounded-2xl mb-5" style={{ background: "var(--bg-raised)", color: "var(--border-muted)", boxShadow: "var(--shadow-medium)" }}><i data-lucide="film" className="h-9 w-9"></i></div>
          <p className="text-base font-bold" style={{ color: "var(--text-primary)" }} data-i18n="library.empty_title">Belum ada riwayat.</p>
          <p className="mt-1.5 text-sm" style={{ color: "var(--text-secondary)" }} data-i18n="library.empty_sub">Mulai tonton drama pertamamu di Beranda.</p>
          <a href="/" className="mt-6 inline-flex items-center gap-2 px-6 py-3 text-sm font-bold transition hover:opacity-90 active:scale-95" style={{ borderRadius: "9999px", background: "var(--accent-control-bg)", color: "var(--accent-control-text)", border: "1px solid var(--accent-control-border)", letterSpacing: "1.4px", textTransform: "uppercase" }}><i data-lucide="home" className="h-4 w-4"></i><span data-i18n="nav.home">Buka Beranda</span></a>
        </div>
      </section>

      <section id="pwaInstallCard" className="mt-12 hidden">
        <div className="flex items-center gap-4 rounded-xl px-4 py-4 sm:px-5" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-soft)" }}>
          <div className="grid h-10 w-10 shrink-0 place-items-center" style={{ borderRadius: "10px", background: "var(--bg-raised)", color: "var(--accent)", border: "1px solid var(--border-muted)" }}><i data-lucide="download" className="h-4 w-4"></i></div>
          <div className="min-w-0 flex-1"><p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Install Dramova</p><p className="mt-0.5 text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>Buka lebih cepat dari layar utama.</p></div>
          <button id="pwaInstallBtn" className="shrink-0 inline-flex h-9 items-center gap-2 px-4 text-xs font-bold transition hover:opacity-90 active:scale-95" style={{ borderRadius: "9999px", background: "var(--text-primary)", color: "var(--bg-base)", letterSpacing: "1px", textTransform: "uppercase", whiteSpace: "nowrap" }}><span>Install</span></button>
        </div>
      </section>

      <Script id="page-library" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: `
        function _load(){var s=document.createElement('script');s.src='/js/library.js';document.body.appendChild(s);}
        if(window.__DRAMOVA_READY)_load();else document.addEventListener('dramova:ready',_load,{once:true});
      `}} />
      <script dangerouslySetInnerHTML={{ __html: `
        (function(){var D=window.DramSi;var section=document.getElementById('continueWatchingSection');if(!section||!D)return;function renderContinue(){var history=D.getHistory().slice(0,8);if(!history.length){section.classList.add('hidden');return;}section.classList.remove('hidden');section.innerHTML='<div class="carousel-panel rounded-2xl p-4" style="background:var(--bg-surface);box-shadow:var(--shadow-medium);"><div class="mb-3 flex items-center justify-between"><h2 class="text-base font-bold" style="color:var(--text-primary);">'+D.t('library.continue_watching')+'</h2></div><div class="carousel-rail-wrap"><div class="no-scrollbar snap-rail grid grid-flow-col auto-cols-[110px] gap-2.5 overflow-x-auto py-1">'+history.map(function(it){var bg=document.documentElement.getAttribute('data-theme')==='light'?'e8e8e8/888888':'1f1f1f/b3b3b3';var ph='https://placehold.co/220x330/'+bg+'?text='+encodeURIComponent((it.title||'').slice(0,12));var img=it.cover||ph;return '<a href="'+D.watchUrl(it.platform,it.id)+'" class="poster-card group relative block snap-start"><div class="relative aspect-[2/3] overflow-hidden" style="border-radius:6px;background:var(--bg-raised);"><img src="'+img+'" alt="'+(it.title||'')+'" loading="lazy" onerror="this.src=\\''+ph+'\\'" class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" /><span class="pointer-events-none absolute inset-0" style="background:linear-gradient(180deg,transparent 50%,rgba(0,0,0,0.65) 100%);"></span></div><div class="px-0.5 pt-1.5"><p class="text-xs font-bold line-clamp-2 leading-snug" style="color:var(--text-primary);">'+(it.title||'—')+'</p></div></a>';}).join('')+'</div></div></div>';window.refreshIcons?.();}renderContinue();document.addEventListener('library:updated',renderContinue);})();
        (function(){var card=document.getElementById('pwaInstallCard');var btn=document.getElementById('pwaInstallBtn');if(!card||!btn)return;function showCard(){card.classList.remove('hidden');btn.addEventListener('click',function(){window.DramSi?.pwa?.triggerInstall?.();});}if(window.DramSi?.pwa?.isInstallable?.()){showCard();}else{document.addEventListener('pwa:installable',showCard,{once:true});}document.addEventListener('pwa:installed',function(){card.style.opacity='0';card.style.transition='opacity 0.3s ease';setTimeout(function(){card.remove();},300);});})();
      `}} />
    </PageShell>
  );
}
