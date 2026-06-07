import SectionHeader from "@/components/SectionHeader";
import { PosterSkeletonList } from "@/components/Skeletons";
import type { ReactNode } from "react";

type MediaSectionProps = {
  id: string;
  railId: string;
  title: string;
  titleI18n: string;
  subtitle: string;
  subtitleI18n: string;
  action?: ReactNode;
};

export function MediaRailSection({
  id,
  railId,
  title,
  titleI18n,
  subtitle,
  subtitleI18n,
  action,
}: MediaSectionProps) {
  return (
    <section className="section-block carousel-section" id={id}>
      <SectionHeader
        title={title}
        titleI18n={titleI18n}
        subtitle={subtitle}
        subtitleI18n={subtitleI18n}
        action={action}
      />
      <div className="carousel-rail-wrap">
        <PosterSkeletonList id={railId} kind="rail" count={8} />
      </div>
    </section>
  );
}

export function MediaGridSection({
  id,
  gridId,
  title,
  titleI18n,
  subtitle,
  subtitleI18n,
  loadMoreMinHeight = false,
}: Omit<MediaSectionProps, "railId" | "action"> & {
  gridId: string;
  loadMoreMinHeight?: boolean;
}) {
  return (
    <section className="section-block" id={id}>
      <SectionHeader
        title={title}
        titleI18n={titleI18n}
        subtitle={subtitle}
        subtitleI18n={subtitleI18n}
      />
      <PosterSkeletonList id={gridId} kind="grid" count={12} />
      <div className="mt-8 flex justify-center">
        <button
          id="loadMoreBtn"
          hidden
          className={`inline-flex ${
            loadMoreMinHeight ? "min-h-11 " : ""
          }items-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold transition ${
            loadMoreMinHeight ? "hover:opacity-90 " : ""
          }active:scale-95`}
          style={{
            borderRadius: "9999px",
            border: "1px solid var(--border-muted)",
            background: "var(--bg-raised)",
            color: "var(--text-primary)",
            letterSpacing: "1.4px",
            textTransform: "uppercase",
          }}
        >
          <i data-lucide="chevron-down" className="h-4 w-4" />
          <span data-i18n="common.load_more">Muat lebih banyak</span>
        </button>
      </div>
    </section>
  );
}
