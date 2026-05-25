export default function Sheets() {
  return (
    <>
      <div id="sheetBackdrop" className="hidden fixed inset-0 z-[80] bg-black/60" style={{ backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}></div>
      <aside id="sheet" role="dialog" aria-modal="true" aria-labelledby="sheetTitle" className="sheet-translate fixed inset-x-0 bottom-0 z-[81] flex max-h-[80vh] flex-col overflow-hidden rounded-t-2xl pb-[env(safe-area-inset-bottom)]" style={{ background: "var(--sheet-bg)", borderTop: "1px solid var(--border-color)", boxShadow: "var(--shadow-heavy)" }}>
        <div className="mx-auto mt-3 mb-1 h-1 w-10 rounded-full" style={{ background: "var(--border-muted)" }}></div>
        <div className="flex items-center justify-between px-5 py-3">
          <h3 id="sheetTitle" className="text-base font-bold" style={{ color: "var(--text-primary)" }} data-i18n="common.choose">Pilih</h3>
          <button id="sheetCloseBtn" aria-label="Tutup" className="grid h-8 w-8 place-items-center transition active:scale-90" style={{ borderRadius: "50%", background: "var(--bg-raised)", color: "var(--text-secondary)" }} suppressHydrationWarning><i data-lucide="x" className="h-4 w-4"></i></button>
        </div>
        <div className="overflow-y-auto px-5 pb-6"><div id="sheetList" className="flex flex-col gap-1.5"></div></div>
      </aside>
    </>
  );
}
