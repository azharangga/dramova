import PageScript from "@/components/PageScript";
import PageShell from "@/components/PageShell";

export default function WatchPageView() {
  return (
    <PageShell>
      <section id="watchRoot" className="watch-root watch-page-grid">
        <div className="player-col">
          <div id="playerWrap" className="player-wrap watch-player-shell">
            <div id="playerInner" className="player-inner watch-player-inner aspect-video">
              <video id="video" playsInline className="watch-video"></video>
              <button id="centerPlayBtn" aria-label="Putar" className="watch-center-play">
                <i data-lucide="play" className="h-9 w-9"></i>
              </button>
              <div id="seekFeedback" className="watch-seek-feedback" aria-hidden="true"></div>
              <div id="playerOverlay" className="watch-loading-overlay">
                <div className="h-10 w-10 rounded-full border-[3px] border-white/15 border-t-[#2BA641] animate-spin-slow"></div>
                <p id="playerOverlayText" className="text-sm">Memuat video...</p>
              </div>
              <div id="watchControls" className="watch-controls">
                <div className="watch-controls-gradient"></div>
                <div className="watch-seek-row">
                  <span id="currentTimeLabel">0:00</span>
                  <input id="seekBar" aria-label="Geser video" className="watch-seek" type="range" min="0" max="1000" step="1" defaultValue="0" />
                  <span id="durationLabel">0:00</span>
                </div>
                <div className="watch-control-row">
                  <div className="watch-control-group">
                    <button id="playPauseBtn" aria-label="Putar atau jeda" data-tooltip="Putar / jeda" className="watch-icon-btn"><i data-lucide="play" className="h-5 w-5"></i></button>
                    <button id="rewindBtn" aria-label="Mundur 10 detik" data-tooltip="Mundur 10 detik" className="watch-icon-btn"><i data-lucide="rotate-ccw" className="h-5 w-5"></i></button>
                    <button id="forwardBtn" aria-label="Maju 10 detik" data-tooltip="Maju 10 detik" className="watch-icon-btn"><i data-lucide="rotate-cw" className="h-5 w-5"></i></button>
                    <div className="watch-volume">
                      <button id="muteBtn" aria-label="Bisukan" data-tooltip="Mute" className="watch-icon-btn"><i data-lucide="volume-2" className="h-5 w-5"></i></button>
                      <input id="volumeBar" aria-label="Volume" className="watch-volume-range" type="range" min="0" max="1" step="0.01" defaultValue="1" />
                    </div>
                    <span id="desktopTimeLabel" className="watch-time-inline">0:00 / 0:00</span>
                  </div>
                  <div className="watch-control-group">
                    <button id="speedBtn" aria-label="Kecepatan" data-tooltip="Kecepatan" className="watch-text-btn">1x</button>
                    <button id="pipBtn" aria-label="Picture in picture" data-tooltip="Picture in picture" className="watch-icon-btn"><i data-lucide="picture-in-picture-2" className="h-5 w-5"></i></button>
                    <button id="fullscreenBtn" aria-label="Layar penuh" data-tooltip="Layar penuh" className="watch-icon-btn"><i data-lucide="maximize" className="h-5 w-5"></i></button>
                  </div>
                </div>
                <div id="speedMenu" className="watch-speed-menu" hidden>
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                    <button key={rate} data-rate={rate}>{rate}x</button>
                  ))}
                </div>
              </div>
              <div id="mobileOverlay" className="md:hidden pointer-events-none absolute inset-0 z-40 transition-opacity duration-300">
                <div className="overlay-auto-hide pointer-events-auto absolute inset-x-0 top-0 flex items-start gap-2 px-3 pb-4 pt-[calc(env(safe-area-inset-top)+10px)]"><a href="/" aria-label="Kembali" className="watch-float-btn"><i data-lucide="chevron-left" className="h-5 w-5"></i></a><div className="min-w-0 flex-1"><h1 id="dramaTitleMobile" className="truncate text-sm font-bold leading-tight text-white drop-shadow">-</h1><p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-white/75 drop-shadow"><span id="platformLabelMobile" className="inline-flex items-center gap-1"><i data-lucide="layers" className="h-3 w-3"></i><span>-</span></span><span className="h-1 w-1 rounded-full bg-white/45"></span><span id="epLabelMobile">-</span></p></div><button id="favoriteBtnMobile" aria-label="Favoritkan" className="watch-float-btn"><i data-lucide="heart" className="h-4 w-4"></i></button></div>
                <div className="mobile-rail-persist pointer-events-auto absolute right-3 top-1/2 z-30 -translate-y-1/2 flex flex-col items-center gap-3"><button id="prevEpBtnMobile" className="watch-rail-btn"><i data-lucide="chevron-up" className="h-5 w-5"></i></button><div className="episode-action-stack relative h-14 w-14 overflow-visible"><button id="openEpSheetBtn" className="watch-episode-btn"><i data-lucide="list-video" className="h-6 w-6"></i></button><span id="epBadgeMobile">-</span></div><button id="nextEpBtnMobile" className="watch-rail-btn"><i data-lucide="chevron-down" className="h-5 w-5"></i></button></div>
                <div id="swipeHint" className="overlay-auto-hide pointer-events-none absolute inset-x-0 bottom-28 flex justify-center"><span>Geser untuk ganti episode</span></div>
              </div>
            </div>
          </div>
          <div className="watch-meta-panel">
            <div className="watch-title-row"><div className="min-w-0 flex-1"><div id="watchTitleSkeleton"><div className="skeleton" style={{ height: "24px", width: "65%", borderRadius: "6px" }}></div><div className="skeleton" style={{ height: "14px", width: "40%", borderRadius: "4px", marginTop: "10px" }}></div></div><h1 id="dramaTitle" style={{ display: "none" }} className="line-clamp-2 text-2xl font-extrabold leading-tight md:text-3xl"></h1><div id="watchMetaRow" style={{ display: "none" }} className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs"><span id="platformLabel" className="inline-flex items-center gap-1"><i data-lucide="layers" className="h-3 w-3"></i><span>-</span></span><span className="watch-dot"></span><span id="epLabel">-</span><span className="watch-dot"></span><span id="totalLabel">-</span></div></div><button id="shareBtn" aria-label="Bagikan" className="detail-action-icon" style={{ opacity: 0, pointerEvents: "none" }}><i data-lucide="share-2" className="h-4 w-4"></i></button><button id="favoriteBtn" aria-label="Favoritkan" className="detail-action-icon" style={{ opacity: 0, pointerEvents: "none" }}><i data-lucide="heart" className="h-4 w-4"></i></button></div>
            <div id="watchNavSkeleton" className="mt-5 flex gap-3"><div className="flex-1 skeleton" style={{ height: "48px", borderRadius: "9999px" }}></div><div className="flex-1 skeleton" style={{ height: "48px", borderRadius: "9999px" }}></div></div>
            <div id="watchNavReal" className="watch-episode-nav" style={{ display: "none" }}><button id="prevEpBtn"><i data-lucide="skip-back" className="h-4 w-4"></i><span>Sebelumnya</span></button><button id="nextEpBtn"><span>Berikutnya</span><i data-lucide="skip-forward" className="h-4 w-4"></i></button></div>
            <div id="watchSynopsisSkeleton" className="mt-5"><div className="skeleton" style={{ height: "12px", width: "100%", borderRadius: "4px" }}></div><div className="skeleton" style={{ height: "12px", width: "92%", borderRadius: "4px", marginTop: "8px" }}></div><div className="skeleton" style={{ height: "12px", width: "75%", borderRadius: "4px", marginTop: "8px" }}></div></div>
            <div id="watchSynopsisReal" className="mt-5" style={{ display: "none" }}><p id="dramaSynopsis" className="text-[15px] leading-7 line-clamp-3"></p><button id="toggleSynopsisBtn" hidden className="mt-1.5 text-xs font-bold transition"><span>Selengkapnya</span></button></div>
            <div id="watchCast" hidden className="detail-cast-section"></div>
            <div id="watchInfo" hidden className="detail-info-row"></div>
          </div>
        </div>
        <aside className="watch-episode-sidebar"><div className="watch-sidebar-head"><h3>Episode</h3><span id="epCount">-</span></div><div className="watch-sidebar-scroll"><div id="epList" className="watch-episode-grid">{Array.from({length:6}).map((_,i)=><div key={i} className="detail-ep-skeleton skeleton"></div>)}</div></div></aside>
      </section>
      <div id="epSheetBackdrop" className="md:hidden hidden fixed inset-0 z-[80] bg-black/60"></div>
      <aside id="epSheet" role="dialog" aria-modal="true" className="md:hidden sheet-translate fixed inset-x-0 bottom-0 z-[81] flex max-h-[78vh] flex-col overflow-hidden rounded-t-2xl pb-[env(safe-area-inset-bottom)]"><div className="sheet-drag-zone mx-auto mt-3 mb-1 h-1 w-10 rounded-full"></div><div className="sheet-drag-zone flex items-center justify-between px-5 py-3"><div><h3 id="epSheetTitle" className="text-base font-bold">Episode</h3><p id="epSheetSub" className="text-xs">-</p></div><button id="epSheetCloseBtn" aria-label="Tutup" className="grid h-8 w-8 place-items-center transition active:scale-90"><i data-lucide="x" className="h-4 w-4"></i></button></div><div id="epSheetScroller" className="overflow-y-auto px-5 py-4"><div id="epListMobile" className="watch-episode-grid"></div></div></aside>
      <PageScript id="page-watch" src="/js/watch.js" />
    </PageShell>
  );
}
