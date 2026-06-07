type Tab = {
  id: string;
  label: string;
};

type CatalogTabsProps = {
  tabs: Tab[];
  label: string;
  dataAttribute: "data-serial-tab" | "data-movie-tab";
  idPrefix?: string;
};

export function CatalogTabs({
  tabs,
  label,
  dataAttribute,
  idPrefix,
}: CatalogTabsProps) {
  return (
    <div
      className="serial-category-tabs mt-6 flex gap-2 overflow-x-auto no-scrollbar pb-0.5"
      role="tablist"
      aria-label={label}
    >
      {tabs.map((tab, index) => (
        <button
          key={tab.id}
          id={idPrefix ? `${idPrefix}${tab.id[0].toUpperCase()}${tab.id.slice(1)}` : undefined}
          role="tab"
          aria-selected={index === 0 ? "true" : "false"}
          {...{ [dataAttribute]: tab.id }}
          className="serial-tab-btn inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition active:scale-95"
          style={{
            background: index === 0 ? "var(--accent)" : "var(--bg-raised)",
            color:
              index === 0
                ? "var(--accent-control-text)"
                : "var(--text-secondary)",
            border:
              index === 0
                ? "1px solid transparent"
                : "1px solid var(--border-muted)",
            letterSpacing: "0.5px",
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

type CatalogSearchControlsProps = {
  prefix: "serial" | "movie";
  placeholder: string;
  placeholderI18n: string;
};

export function CatalogSearchControls({
  prefix,
  placeholder,
  placeholderI18n,
}: CatalogSearchControlsProps) {
  const capitalized = `${prefix[0].toUpperCase()}${prefix.slice(1)}`;

  return (
    <div className="serial-search-controls mt-4 grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2">
      <form
        id={`${prefix}SearchForm`}
        autoComplete="off"
        className="flex h-12 min-w-0 items-center gap-2 px-4 transition"
        style={{
          borderRadius: "9999px",
          background: "var(--bg-raised)",
          boxShadow: "var(--inset-border)",
        }}
      >
        <i
          data-lucide="search"
          className="h-4 w-4 shrink-0"
          style={{ color: "var(--text-secondary)" }}
        />
        <input
          id={`${prefix}SearchInput`}
          type="search"
          placeholder={placeholder}
          data-i18n-placeholder={placeholderI18n}
          className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none"
          style={{ color: "var(--text-primary)" }}
        />
        <button
          id={`${prefix}SearchClear`}
          type="button"
          hidden
          aria-label="Hapus pencarian"
          className="grid h-8 w-8 shrink-0 place-items-center transition active:scale-90"
          style={{ borderRadius: "50%", color: "var(--text-secondary)" }}
        >
          <i data-lucide="x" className="h-4 w-4" />
        </button>
      </form>
      <button
        id={`${prefix}YearFilter`}
        type="button"
        aria-label="Filter tahun"
        className="grid h-11 w-11 shrink-0 place-items-center transition active:scale-95"
        style={{
          borderRadius: "9999px",
          border: "1px solid var(--border-muted)",
          background: "var(--bg-raised)",
          color: "var(--text-secondary)",
        }}
      >
        <i data-lucide="calendar" className="h-4 w-4 shrink-0" />
        <span id={`${prefix}YearLabel`} className="sr-only">
          Semua Tahun
        </span>
      </button>
      <button
        id={`${prefix}FilterReset`}
        type="button"
        hidden
        aria-label="Reset filter"
        className="grid h-11 w-11 shrink-0 place-items-center transition active:scale-95"
        style={{
          borderRadius: "9999px",
          border: "1px solid var(--border-muted)",
          background: "var(--bg-raised)",
          color: "var(--text-secondary)",
        }}
      >
        <i data-lucide="rotate-ccw" className="h-4 w-4" />
      </button>
    </div>
  );
}
