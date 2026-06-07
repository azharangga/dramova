type PosterSkeletonListProps = {
  count: number;
  kind: "rail" | "grid";
  id: string;
};

function PosterSkeleton() {
  return (
    <div className="block snap-start">
      <div className="aspect-[2/3] skeleton" style={{ borderRadius: "6px" }} />
      <div className="mt-2 h-3 w-full rounded skeleton" />
      <div className="mt-1.5 h-2.5 w-3/5 rounded skeleton" />
    </div>
  );
}

export function PosterSkeletonList({ count, kind, id }: PosterSkeletonListProps) {
  const className =
    kind === "rail"
      ? "media-rail no-scrollbar snap-rail grid grid-flow-col auto-cols-[140px] overflow-x-auto sm:auto-cols-[160px]"
      : "content-grid grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6";

  return (
    <div id={id} className={className}>
      {Array.from({ length: count }).map((_, index) => (
        <PosterSkeleton key={index} />
      ))}
    </div>
  );
}

export function HeroSkeleton({
  trackId,
  dotsId,
  label,
}: {
  trackId: string;
  dotsId: string;
  label: string;
}) {
  return (
    <section
      className="home-hero relative mt-0 overflow-hidden"
      aria-label={label}
      style={{ background: "var(--bg-surface)" }}
    >
      <div id={trackId} className="hero-track-stack relative w-full">
        <div className="home-hero-skeleton relative block w-full shrink-0 overflow-hidden">
          <div className="home-hero-skeleton-bg absolute inset-0 skeleton" />
          <div className="home-hero-skeleton-shade absolute inset-0" />
          <div className="home-hero-skeleton-copy absolute z-[2]">
            <div className="home-hero-skeleton-badge skeleton" />
            <div className="home-hero-skeleton-title home-hero-skeleton-title-a skeleton" />
            <div className="home-hero-skeleton-title home-hero-skeleton-title-b skeleton" />
            <div className="home-hero-skeleton-meta skeleton" />
            <div className="home-hero-skeleton-line home-hero-skeleton-line-a skeleton" />
            <div className="home-hero-skeleton-line home-hero-skeleton-line-b skeleton" />
            <div className="home-hero-skeleton-cta skeleton" />
          </div>
        </div>
      </div>
      <div
        id={dotsId}
        className="home-hero-dots absolute inset-x-0 z-10 flex justify-center gap-2"
      />
    </section>
  );
}
