import PageScript from "@/components/PageScript";

function DetailEpisodeSkeletons() {
  return (
    <>
      {Array.from({ length: 12 }).map((_, index) => (
        <div key={index} className="detail-ep-skeleton skeleton" />
      ))}
    </>
  );
}

export default function DetailScaffold() {
  return (
    <>
      <section className="detail-page">
        <div className="detail-backdrop" aria-hidden="true">
          <img id="detailBackdrop" src="" alt="" className="detail-backdrop-img" />
        </div>
        <div className="detail-layout">
          <div className="detail-poster-col">
            <div className="detail-poster-wrap skeleton">
              <img
                id="detailCover"
                src=""
                alt=""
                className="detail-poster-img"
                style={{ display: "none" }}
              />
            </div>
          </div>
          <div className="detail-info-col">
            <div className="detail-meta-row" id="detailMetaRow">
              <span className="detail-tag-skeleton skeleton" />
              <span className="detail-tag-skeleton skeleton" />
            </div>
            <div id="detailTitleSkeleton" className="detail-title-skeleton">
              <div className="skeleton" style={{ height: "26px", width: "70%", borderRadius: "6px" }} />
              <div className="skeleton" style={{ height: "26px", width: "40%", borderRadius: "6px", marginTop: "8px" }} />
            </div>
            <h1 id="detailTitle" className="detail-title" style={{ display: "none" }} />
            <div id="detailSynopsisSkeleton" className="detail-synopsis-skeleton">
              <div className="skeleton" style={{ height: "12px", width: "100%", borderRadius: "4px" }} />
              <div className="skeleton" style={{ height: "12px", width: "95%", borderRadius: "4px", marginTop: "7px" }} />
              <div className="skeleton" style={{ height: "12px", width: "80%", borderRadius: "4px", marginTop: "7px" }} />
              <div className="skeleton" style={{ height: "12px", width: "60%", borderRadius: "4px", marginTop: "7px" }} />
            </div>
            <p id="detailSynopsis" className="detail-synopsis" style={{ display: "none" }} />
            <button id="detailSynopsisToggle" type="button" hidden className="detail-more-btn">
              <span data-i18n="common.read_more">Selengkapnya</span>
            </button>
            <div
              className="detail-actions"
              id="detailActions"
              style={{ opacity: 0, pointerEvents: "none" }}
            >
              <a id="detailWatchBtn" href="#" className="detail-play-btn">
                <i data-lucide="play" className="h-5 w-5 fill-current" />
                <span data-i18n="detail.watch_now">Tonton Sekarang</span>
              </a>
              <button
                id="detailFavoriteBtn"
                type="button"
                aria-label="Favoritkan"
                className="detail-action-icon"
              >
                <i data-lucide="heart" className="h-5 w-5" />
              </button>
              <button
                id="detailShareBtn"
                type="button"
                aria-label="Bagikan"
                className="detail-action-icon"
              >
                <i data-lucide="share-2" className="h-5 w-5" />
              </button>
            </div>
            <div id="detailCast" hidden className="detail-cast-section" />
            <div id="detailInfo" hidden className="detail-info-row" />
          </div>
        </div>
        <div className="detail-episodes-section">
          <div className="detail-episodes-head">
            <h2 className="detail-episodes-title" data-i18n="player.episodes">
              Episode
            </h2>
            <span id="detailEpCountLabel" className="detail-episodes-count" />
          </div>
          <div id="detailEpisodeGrid" className="detail-ep-grid">
            <DetailEpisodeSkeletons />
          </div>
        </div>
      </section>
      <PageScript id="page-detail" src="/js/detail.js" />
    </>
  );
}
