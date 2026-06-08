import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
        <Button
          key={tab.id}
          id={idPrefix ? `${idPrefix}${tab.id[0].toUpperCase()}${tab.id.slice(1)}` : undefined}
          role="tab"
          aria-selected={index === 0 ? "true" : "false"}
          {...{ [dataAttribute]: tab.id }}
          variant={index === 0 ? "default" : "outline"}
          size="default"
          className="serial-tab-btn shrink-0 tracking-[0.5px]"
          style={{
            letterSpacing: "0.5px",
          }}
        >
          {tab.label}
        </Button>
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
        <Input
          id={`${prefix}SearchInput`}
          type="search"
          placeholder={placeholder}
          data-i18n-placeholder={placeholderI18n}
          className="h-auto min-w-0 flex-1 border-0 bg-transparent px-0 py-0 text-sm font-semibold shadow-none focus-visible:ring-0"
          style={{ color: "var(--text-primary)" }}
        />
        <Button
          id={`${prefix}SearchClear`}
          type="button"
          hidden
          aria-label="Hapus pencarian"
          variant="ghost"
          size="icon-sm"
          className="shrink-0"
        >
          <i data-lucide="x" className="h-4 w-4" />
        </Button>
      </form>
      <Button
        id={`${prefix}YearFilter`}
        type="button"
        aria-label="Filter tahun"
        variant="outline"
        size="icon-lg"
        className="shrink-0"
      >
        <i data-lucide="calendar" className="h-4 w-4 shrink-0" />
        <span id={`${prefix}YearLabel`} className="sr-only">
          Semua Tahun
        </span>
      </Button>
      <Button
        id={`${prefix}FilterReset`}
        type="button"
        hidden
        aria-label="Reset filter"
        variant="outline"
        size="icon-lg"
        className="shrink-0"
      >
        <i data-lucide="rotate-ccw" className="h-4 w-4" />
      </Button>
    </div>
  );
}
