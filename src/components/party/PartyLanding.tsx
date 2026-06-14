import PageShell from "@/components/PageShell";
import PageScript from "@/components/PageScript";
import PageHeader from "@/components/PageHeader";

export default function PartyLanding() {
  return (
    <PageShell>
      <PageHeader
        kicker="Nonton Bareng"
        kickerI18n="party.kicker"
        title="Watch Party"
        titleI18n="party.title"
        subtitle="Tonton serial atau movie bersama teman secara real-time. Buat room, bagikan kode, dan nikmati pengalaman menonton bareng."
        subtitleI18n="party.subtitle"
      />

      {/* Action Cards */}
      <div className="party-action-grid">
        {/* Create Room Card */}
        <div className="party-action-card party-create-card">
          <div className="party-action-icon">
            <i data-lucide="plus-circle" className="h-7 w-7"></i>
          </div>
          <h2 className="party-action-title">Buat Room Baru</h2>
          <p className="party-action-desc">
            Mulai sesi nonton bareng dengan memilih serial atau movie, lalu bagikan kode room ke teman-temanmu.
          </p>
          <button id="btnCreateRoom" className="party-btn party-btn-primary">
            <i data-lucide="plus" className="h-4 w-4"></i>
            <span>Buat Room</span>
          </button>
        </div>

        {/* Join Room Card */}
        <div className="party-action-card party-join-card">
          <div className="party-action-icon">
            <i data-lucide="users" className="h-7 w-7"></i>
          </div>
          <h2 className="party-action-title">Gabung Room</h2>
          <p className="party-action-desc">
            Masukkan kode 6 digit yang dibagikan teman untuk bergabung dalam sesi nonton bareng.
          </p>
          <div className="party-join-form">
            <div id="otpInputWrap" className="party-otp-input-wrap">
              {Array.from({ length: 6 }).map((_, i) => (
                <input
                  key={i}
                  type="text"
                  inputMode="text"
                  maxLength={1}
                  autoComplete="off"
                  spellCheck={false}
                  className="party-otp-box"
                  data-otp-idx={i}
                  aria-label={`Digit ${i + 1}`}
                />
              ))}
            </div>
            {/* Hidden input to hold combined code for form compat */}
            <input id="inputRoomCode" type="hidden" />
            <button id="btnJoinRoom" className="party-btn party-btn-secondary">
              <i data-lucide="log-in" className="h-4 w-4"></i>
              <span>Gabung</span>
            </button>
          </div>
        </div>
      </div>

      {/* Active Rooms Section */}
      <div className="party-rooms-section">
        <div className="party-section-header">
          <h2 className="party-section-title">
            <i data-lucide="radio" className="h-5 w-5"></i>
            <span>Room Aktif Saya</span>
          </h2>
          <button id="btnRefreshRooms" className="party-icon-btn" aria-label="Refresh">
            <i data-lucide="refresh-cw" className="h-4 w-4"></i>
          </button>
        </div>

        <div id="partyRoomsLoading" className="party-rooms-loading">
          <div className="party-skeleton-grid">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="party-room-skeleton">
                <div className="skeleton" style={{ height: "20px", width: "70%", borderRadius: "4px" }}></div>
                <div className="skeleton" style={{ height: "14px", width: "45%", borderRadius: "4px", marginTop: "8px" }}></div>
                <div className="skeleton" style={{ height: "14px", width: "30%", borderRadius: "4px", marginTop: "6px" }}></div>
              </div>
            ))}
          </div>
        </div>

        <div id="partyRoomsEmpty" className="party-rooms-empty" style={{ display: "none" }}>
          <i data-lucide="tv-2" className="h-12 w-12 party-empty-icon"></i>
          <p className="party-empty-text">Belum ada room aktif</p>
          <p className="party-empty-hint">Buat room baru atau gabung dengan kode dari teman</p>
        </div>

        <div id="partyRoomsList" className="party-rooms-list" style={{ display: "none" }}>
          {/* Rooms will be rendered here by party-landing.js */}
        </div>
      </div>

      {/* ═══ Create Room Wizard Modal ═══ */}
      <div id="createRoomModal" className="party-modal-backdrop" style={{ display: "none" }}>
        <div className="party-modal party-wizard-modal" role="dialog" aria-modal="true" aria-labelledby="wizardTitle">
          {/* Header */}
          <div className="party-modal-header">
            <div className="wizard-header-left">
              <button id="btnWizardBack" className="party-icon-btn wizard-back-btn" aria-label="Kembali" style={{ display: "none" }}>
                <i data-lucide="arrow-left" className="h-5 w-5"></i>
              </button>
              <h3 id="wizardTitle" className="party-modal-title">Buat Room Nonton Bareng</h3>
            </div>
            <button id="btnCloseCreateModal" className="party-icon-btn" aria-label="Tutup" data-tooltip="Tutup" data-tooltip-pos="left">
              <i data-lucide="x" className="h-5 w-5"></i>
            </button>
          </div>

          {/* Step Indicator */}
          <div className="wizard-steps-bar">
            <div className="wizard-step-dot is-active" data-step="1"><span>1</span><label>Tipe</label></div>
            <div className="wizard-step-line"></div>
            <div className="wizard-step-dot" data-step="2"><span>2</span><label>Platform</label></div>
            <div className="wizard-step-line"></div>
            <div className="wizard-step-dot" data-step="3"><span>3</span><label>Konten</label></div>
            <div className="wizard-step-line"></div>
            <div className="wizard-step-dot" data-step="4"><span>4</span><label>Episode</label></div>
            <div className="wizard-step-line"></div>
            <div className="wizard-step-dot" data-step="5"><span>5</span><label>Atur</label></div>
          </div>

          <div className="party-modal-body wizard-body">

            {/* ── Step 1: Content Type ── */}
            <div className="wizard-step" data-step="1">
              <p className="wizard-step-desc">Pilih jenis tontonan yang ingin ditonton bareng.</p>
              <div className="wizard-type-grid">
                <button className="wizard-type-card" data-type="series">
                  <div className="wizard-type-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></svg>
                  </div>
                  <div className="wizard-type-info">
                    <strong>Serial</strong>
                    <p className="wizard-type-hint">K-Drama, C-Drama, J-Drama, Thai Drama, Variety Show</p>
                  </div>
                </button>
                <button className="wizard-type-card" data-type="movie">
                  <div className="wizard-type-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
                  </div>
                  <div className="wizard-type-info">
                    <strong>Movie</strong>
                    <p className="wizard-type-hint">K-Movie, C-Movie, J-Movie, Thai Movie</p>
                  </div>
                </button>
              </div>
            </div>

            {/* ── Step 2: Platform ── */}
            <div className="wizard-step" data-step="2" style={{ display: "none" }}>
              <p className="wizard-step-desc">Pilih platform sumber tontonan.</p>
              <div id="wizardPlatformGrid" className="wizard-platform-grid">
                {/* Rendered by JS based on content type */}
              </div>
            </div>

            {/* ── Step 3: Pick Content ── */}
            <div className="wizard-step" data-step="3" style={{ display: "none" }}>
              <div className="wizard-search-bar">
                <div className="wizard-search-input-wrap">
                  <svg className="wizard-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  <input id="wizardSearchInput" type="text" className="party-form-input wizard-search-input" placeholder="Cari judul serialatau movie..." autoComplete="off" />
                  <button id="wizardSearchClear" className="wizard-search-clear" style={{ display: "none" }} aria-label="Hapus">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              </div>
              <div id="wizardContentStatus" className="wizard-content-status">
                <div className="wizard-loading-dots"><span></span><span></span><span></span></div>
                <span>Memuat konten...</span>
              </div>
              <div id="wizardContentGrid" className="wizard-content-grid">
                {/* Content cards rendered by JS */}
              </div>
            </div>

            {/* ── Step 4: Pick Episode (Serial only) ── */}
            <div className="wizard-step" data-step="4" style={{ display: "none" }}>
              <div id="wizardSelectedContent" className="wizard-selected-content">
                {/* Shows selected content info */}
              </div>
              <p className="wizard-step-desc">Pilih episode awal untuk mulai menonton bareng.</p>
              <div id="wizardEpisodeGrid" className="wizard-episode-grid">
                {/* Episode buttons rendered by JS */}
              </div>
            </div>

            {/* ── Step 5: Room Settings ── */}
            <div className="wizard-step" data-step="5" style={{ display: "none" }}>
              <div id="wizardSummaryCard" className="wizard-summary-card">
                {/* Shows selected content summary */}
              </div>
              <div className="party-form-group">
                <label htmlFor="wizardRoomTitle" className="party-form-label">Judul Room</label>
                <input
                  id="wizardRoomTitle"
                  type="text"
                  placeholder="Contoh: Nonton Crash Landing on You"
                  className="party-form-input"
                  maxLength={120}
                />
              </div>
              <div className="party-form-group">
                <label className="party-form-label">Durasi Room</label>
                <div id="wizardDurationGrid" className="wizard-duration-grid">
                  <button className="wizard-duration-chip" data-hours="-1">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4"/><path d="m6.34 6.34 2.83 2.83"/><path d="M2 12h4"/><path d="m6.34 17.66 2.83-2.83"/><path d="M12 22v-4"/><path d="m17.66 17.66-2.83-2.83"/><path d="M22 12h-4"/><path d="m17.66 6.34-2.83 2.83"/></svg>
                    <span>Unlimited</span>
                  </button>
                  <button className="wizard-duration-chip" data-hours="1"><span>1 Jam</span></button>
                  <button className="wizard-duration-chip" data-hours="2"><span>2 Jam</span></button>
                  <button className="wizard-duration-chip" data-hours="3"><span>3 Jam</span></button>
                  <button className="wizard-duration-chip" data-hours="6"><span>6 Jam</span></button>
                  <button className="wizard-duration-chip is-active" data-hours="24"><span>24 Jam</span></button>
                  <button className="wizard-duration-chip" data-hours="custom"><span>Custom</span></button>
                </div>
                <div id="wizardCustomDurationWrap" className="wizard-custom-duration-wrap" style={{ display: 'none' }}>
                  <div className="wizard-time-picker">
                    <div className="time-picker-group">
                      <label className="time-picker-label">Jam</label>
                      <div className="time-picker-stepper">
                        <button type="button" className="time-picker-btn" data-action="hours-dec" aria-label="Kurangi jam">−</button>
                        <input id="wizardCustomHours" type="number" min="0" max="168" defaultValue="1" className="time-picker-input" />
                        <button type="button" className="time-picker-btn" data-action="hours-inc" aria-label="Tambah jam">+</button>
                      </div>
                    </div>
                    <span className="time-picker-separator">:</span>
                    <div className="time-picker-group">
                      <label className="time-picker-label">Menit</label>
                      <div className="time-picker-stepper">
                        <button type="button" className="time-picker-btn" data-action="minutes-dec" aria-label="Kurangi menit">−</button>
                        <input id="wizardCustomMinutes" type="number" min="0" max="59" step="5" defaultValue="0" className="time-picker-input" />
                        <button type="button" className="time-picker-btn" data-action="minutes-inc" aria-label="Tambah menit">+</button>
                      </div>
                    </div>
                  </div>
                  <p id="wizardDurationPreview" className="wizard-duration-preview">Total: 1 jam</p>
                </div>
              </div>
              <div className="party-form-row">
                <div className="party-form-group party-form-group-half">
                  <label htmlFor="wizardMaxParticipants" className="party-form-label">Maks Peserta</label>
                  <input
                    id="wizardMaxParticipants"
                    type="number"
                    min="2"
                    max="5"
                    defaultValue="5"
                    className="party-form-input"
                  />
                  <span id="wizardMaxParticipantsHint" className="wizard-field-hint" style={{ display: 'none' }}>Maksimum 5 peserta</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="party-modal-footer wizard-footer">
            <button id="btnWizardBackBottom" className="party-btn party-btn-secondary" style={{ display: "none" }}>
              <i data-lucide="arrow-left" className="h-4 w-4"></i>
              <span>Kembali</span>
            </button>
            <button id="btnWizardNext" className="party-btn party-btn-primary" style={{ display: "none" }}>
              <span>Selanjutnya</span>
              <i data-lucide="arrow-right" className="h-4 w-4"></i>
            </button>
            <button id="btnSubmitCreate" className="party-btn party-btn-primary" style={{ display: "none" }}>
              <i data-lucide="sparkles" className="h-4 w-4"></i>
              <span>Buat Room</span>
            </button>
          </div>
        </div>
      </div>
      <PageScript id="page-party-landing" src="/js/party-landing.js" />
    </PageShell>
  );
}
