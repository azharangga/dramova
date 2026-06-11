import SectionHeader from "@/components/SectionHeader";
import { PosterSkeletonList } from "@/components/Skeletons";
import { Button } from "@/components/ui/button";
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
      <PosterSkeletonList id={gridId} kind="grid" count={16} />
      <div className="mt-8 flex justify-center">
        <Button
          id="loadMoreBtn"
          hidden
          variant="outline"
          size="lg"
          className={loadMoreMinHeight ? "min-h-11 uppercase tracking-[1.4px]" : "uppercase tracking-[1.4px]"}
        >
          <i data-lucide="chevron-down" className="h-4 w-4" />
          <span data-i18n="common.load_more">Muat lebih banyak</span>
        </Button>
      </div>
    </section>
  );
}
