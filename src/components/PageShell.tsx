import Topbar from "./Topbar";
import BottomNav from "./BottomNav";
import Sheets from "./Sheets";
import Footer from "./Footer";

export default function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Topbar />
      <main id="mainContent" className="app-main mx-auto w-full max-w-[1280px] px-4 pt-4 pb-12">
        {children}
      </main>
      <Footer />
      <BottomNav />
      <Sheets />
      <button id="backToTop" aria-label="Kembali ke atas" className="no-ripple" data-tooltip="Ke atas" suppressHydrationWarning>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
      </button>
    </>
  );
}
