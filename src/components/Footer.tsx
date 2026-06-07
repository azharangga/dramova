export default function Footer() {
  return (
    <footer id="desktopFooter" className="hidden md:block">
      <div className="mx-auto w-full max-w-[1280px] px-4 py-10">
        <div className="grid items-start gap-10 md:grid-cols-[minmax(0,1.4fr)_minmax(160px,.6fr)_minmax(260px,.8fr)]">
          <div className="pt-0">
            <a href="/" className="inline-flex items-center" aria-label="Dramova">
              <img src="/img/logo.png" alt="Dramova" className="h-6" style={{ width: "auto" }} />
            </a>
            <p className="mt-4 max-w-lg text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }} data-i18n="footer.description">Platform streaming drama modern untuk menikmati berbagai cerita menarik, mulai dari drama pendek hingga serial favorit, dalam pengalaman menonton yang nyaman, ringan, dan immersive.</p>
          </div>
          <nav className="pt-1" aria-label="Navigasi footer">
            <p className="footer-heading" data-i18n="nav.footer">Navigasi</p>
            <div className="mt-4 grid gap-2.5"><a className="footer-link" href="/" data-i18n="nav.home">Beranda</a><a className="footer-link" href="/discover" data-i18n="nav.discover">Jelajahi</a><a className="footer-link" href="/series" data-i18n="nav.serial">Serial</a><a className="footer-link" href="/movie" data-i18n="nav.movie">Movie</a><a className="footer-link" href="/history" data-i18n="nav.history">Riwayat</a></div>
          </nav>
          <div className="pt-1">
            <p className="footer-heading" data-i18n="footer.features">Fitur Utama</p>
            <div className="mt-4 grid gap-3">
              <div className="footer-feature"><i data-lucide="play-circle" className="h-4 w-4"></i><span data-i18n="footer.feature.platforms">Drama pendek dan serial dalam satu tempat</span></div>
              <div className="footer-feature"><i data-lucide="search" className="h-4 w-4"></i><span data-i18n="footer.feature.languages">Cari judul dari berbagai katalog</span></div>
              <div className="footer-feature"><i data-lucide="bookmark" className="h-4 w-4"></i><span data-i18n="footer.feature.history">Lanjutkan tontonan dan simpan favorit</span></div>
            </div>
          </div>
        </div>
        <div className="mt-8 flex items-center justify-between border-t pt-5" style={{ borderColor: "var(--border-color)" }}>
          <p className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>&copy; <span id="copyrightYear">2026</span> <span style={{ color: "var(--text-primary)" }}>Azharangga Kusuma</span>. All rights reserved.</p>
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }} data-i18n="footer.made_with">Dibuat dengan NextJS dan FastAPI.</p>
        </div>
      </div>
    </footer>
  );
}
