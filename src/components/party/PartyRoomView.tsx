import PageScript from "@/components/PageScript";

interface PartyRoomViewProps {
  roomId: string;
}

export default function PartyRoomView({ roomId }: PartyRoomViewProps) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  return (
    <section
      id="partyRoomRoot"
      className="party-room-root"
      data-room-id={roomId}
      data-supabase-url={supabaseUrl}
      data-supabase-key={supabaseAnonKey}
    >
      {/* Top Bar */}
      <header className="party-room-header">
        <div className="party-header-left">
          <a href="/party" className="party-back-btn" aria-label="Kembali">
            <i data-lucide="chevron-left" className="h-5 w-5"></i>
          </a>
          <div className="party-header-info">
            <h1 id="partyRoomTitle" className="party-room-title">Memuat room...</h1>
            <div className="party-room-meta">
              <span id="partyRoomCode" className="party-code-badge">
                <i data-lucide="hash" className="h-3 w-3"></i>
                <span>------</span>
              </span>
              <span id="partyHeaderEpisode" className="party-code-badge" style={{ display: 'none' }}>
                <i data-lucide="film" className="h-3 w-3"></i>
                <span>Ep --</span>
              </span>
              <span id="partySyncStatus" className="party-sync-indicator party-sync-connecting">
                <span className="party-sync-dot"></span>
                <span>Menghubungkan...</span>
              </span>
              <span id="partyCountdown" className="party-countdown" style={{ display: 'none' }}>
                <i data-lucide="clock" className="h-3 w-3"></i>
                <span id="partyCountdownText">--:--</span>
              </span>
            </div>
          </div>
        </div>
        <div className="party-header-right">
          <button id="btnToggleSidebarDesktop" className="party-sidebar-toggle-desktop" aria-label="Sembunyikan sidebar" data-tooltip="Sidebar" data-tooltip-pos="bottom">
            <i data-lucide="panel-right" className="h-5 w-5"></i>
          </button>
          <button id="btnInvite" className="party-icon-btn party-header-action" aria-label="Undang teman" data-tooltip="Undang teman" data-tooltip-pos="bottom">
            <i data-lucide="user-plus" className="h-5 w-5"></i>
          </button>
          <button id="btnLeaveRoom" className="party-icon-btn party-header-action party-btn-danger" aria-label="Keluar" data-tooltip="Keluar" data-tooltip-pos="bottom">
            <i data-lucide="log-out" className="h-5 w-5"></i>
          </button>
        </div>
      </header>

      {/* Main Content Grid */}
      <div className="party-room-grid" id="partyRoomGrid">
        {/* Video Player Column */}
        <div className="party-player-col">
          <div id="partyPlayerWrap" className="party-player-wrap">
            <div id="partyPlayerInner" className="party-player-inner aspect-video">
              <video id="partyVideo" playsInline preload="auto" className="party-video"></video>
              <button id="partyCenterPlayBtn" aria-label="Putar" className="party-center-play">
                <i data-lucide="play" className="h-9 w-9"></i>
              </button>
              <div id="partyPlayerOverlay" className="party-loading-overlay">
                <div className="h-10 w-10 rounded-full border-[3px] border-white/15 border-t-[#2BA641] animate-spin-slow"></div>
                <p id="partyOverlayText" className="party-loading-text text-sm">Memuat video...</p>
              </div>
              <div id="partySeekFeedback" className="watch-seek-feedback" aria-hidden="true"></div>

              {/* Buffering overlay (distinct from loading — shows during network stalls) */}
              <div id="partyBufferingOverlay" className="party-buffering-overlay">
                <div className="party-buffering-spinner">
                  <div className="party-buffering-ring"></div>
                </div>
                <span className="party-buffering-label">Memuat...</span>
              </div>

              {/* Sync overlay indicator */}
              <div id="partySyncOverlay" className="party-sync-overlay" style={{ display: "none" }}>
                <div className="party-sync-toast">
                  <i data-lucide="radio" className="h-4 w-4"></i>
                  <span id="partySyncMessage">Sinkronisasi...</span>
                </div>
              </div>

              {/* Player Controls */}
              <div id="partyControls" className="party-controls">
                <div className="party-controls-gradient"></div>
                <div className="party-seek-row">
                  <span id="partyCurrentTime">0:00</span>
                  <input id="partySeekBar" aria-label="Geser video" className="party-seek" type="range" min="0" max="1000" step="1" defaultValue="0" />
                  <span id="partyDuration">0:00</span>
                </div>
                <div className="party-control-row">
                  <div className="party-control-group">
                    <button id="partyPlayPauseBtn" aria-label="Putar atau jeda" className="party-icon-btn" data-tooltip="Putar / Jeda" data-tooltip-pos="top">
                      <i data-lucide="play" className="h-5 w-5"></i>
                    </button>
                    <button id="partyRewindBtn" aria-label="Mundur 10 detik" className="party-icon-btn" data-tooltip="-10 detik" data-tooltip-pos="top">
                      <i data-lucide="rotate-ccw" className="h-5 w-5"></i>
                    </button>
                    <button id="partyForwardBtn" aria-label="Maju 10 detik" className="party-icon-btn" data-tooltip="+10 detik" data-tooltip-pos="top">
                      <i data-lucide="rotate-cw" className="h-5 w-5"></i>
                    </button>
                    <div className="party-volume">
                      <button id="partyMuteBtn" aria-label="Bisukan" className="party-icon-btn" data-tooltip="Bisukan" data-tooltip-pos="top">
                        <i data-lucide="volume-2" className="h-5 w-5"></i>
                      </button>
                      <input id="partyVolumeBar" aria-label="Volume" className="party-volume-range" type="range" min="0" max="1" step="0.01" defaultValue="1" />
                    </div>
                  </div>
                  <div className="party-control-group">
                    <button id="partySpeedBtn" aria-label="Kecepatan" className="party-text-btn" data-tooltip="Kecepatan" data-tooltip-pos="top">1x</button>
                    <button id="partyFullscreenBtn" aria-label="Layar penuh" className="party-icon-btn" data-tooltip="Layar penuh" data-tooltip-pos="top">
                      <i data-lucide="maximize" className="h-5 w-5"></i>
                    </button>
                  </div>
                </div>
                <div id="partySpeedMenu" className="party-speed-menu" hidden>
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                    <button key={rate} data-rate={rate}>{rate}x</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Reopen sidebar button (desktop, when collapsed) */}
          <button id="btnReopenSidebar" className="party-sidebar-reopen" aria-label="Tampilkan sidebar">
            <i data-lucide="panel-right-open" className="h-5 w-5"></i>
          </button>
        </div>

        {/* Sidebar: Participants + Chat */}
        <aside id="partySidebar" className="party-sidebar">
          {/* Mobile sidebar tabs */}
          <div id="sidebarTabs" className="party-sidebar-tabs">
            <button className="sidebar-tab is-active" data-tab="participants">
              <i data-lucide="users" className="h-4 w-4"></i>
              <span>Peserta</span>
              <span id="participantCountTab" className="sidebar-tab-badge">0</span>
            </button>
            <button className="sidebar-tab" data-tab="chat">
              <i data-lucide="message-square" className="h-4 w-4"></i>
              <span>Chat</span>
              <span id="chatUnreadBadge" className="sidebar-tab-badge" hidden>0</span>
            </button>
            <button className="sidebar-tab" data-tab="episodes" id="tabEpisodeBtn" style={{ display: 'none' }}>
              <i data-lucide="film" className="h-4 w-4"></i>
              <span>Episode</span>
            </button>
          </div>

          {/* Participants Panel */}
          <div id="participantsPanel" className="party-panel party-participants-panel is-active" data-tab-content="participants">
            <div className="party-panel-header" style={{ display: 'none' }}>
              <h3 className="party-panel-title">
                <i data-lucide="users" className="h-4 w-4"></i>
                <span>Peserta</span>
              </h3>
              <span id="participantCount" className="party-count-badge">0</span>
            </div>
            <div id="participantsList" className="party-participants-list">
              {/* Rendered by party.js */}
            </div>
          </div>

          {/* Chat Panel */}
          <div id="chatPanel" className="party-panel party-chat-panel" data-tab-content="chat">
            <div className="party-panel-header" style={{ display: 'none' }}>
              <h3 className="party-panel-title">
                <i data-lucide="message-circle" className="h-4 w-4"></i>
                <span>Chat</span>
              </h3>
            </div>
            <div id="chatMessages" className="party-chat-messages">
              <div className="party-chat-empty">
                <i data-lucide="message-square" className="h-8 w-8"></i>
                <p>Belum ada pesan. Mulai obrolan!</p>
              </div>
            </div>
            <div className="party-chat-input-row">
              <input
                id="chatInput"
                type="text"
                placeholder="Ketik pesan..."
                className="party-chat-input"
                maxLength={500}
                autoComplete="off"
              />
              <button id="btnSendChat" className="party-btn party-btn-sm party-btn-primary" aria-label="Kirim">
                <i data-lucide="send" className="h-4 w-4"></i>
              </button>
            </div>
          </div>

          {/* Episodes Panel */}
          <div id="episodesPanel" className="party-panel party-episodes-panel" data-tab-content="episodes">
            <div className="party-panel-header" style={{ display: 'none' }}>
              <h3 className="party-panel-title">
                <i data-lucide="film" className="h-4 w-4"></i>
                <span>Pilih Episode</span>
              </h3>
              <span id="partyEpisodeText" className="text-xs text-white/50">Memuat...</span>
            </div>
            <div id="partyEpList" className="party-ep-grid p-4">
              {/* Populated dynamically */}
            </div>
          </div>
        </aside>
      </div>

      {/* Invite Modal */}
      <div id="inviteModal" className="party-modal-backdrop" aria-hidden="true">
        <div className="party-modal party-modal-sm" role="dialog" aria-modal="true">
          <div className="party-modal-header">
            <h3 className="party-modal-title">Undang Teman</h3>
            <button id="btnCloseInvite" className="party-icon-btn" aria-label="Tutup">
              <i data-lucide="x" className="h-5 w-5"></i>
            </button>
          </div>
          <div className="party-modal-body">
            <div className="party-invite-section">
              {/* Room Code (permanent, also used as invite) */}
              <p className="party-invite-label">Kode Room</p>
              <div className="party-invite-code-display">
                <span id="inviteRoomCode" className="party-invite-code">------</span>
                <button id="btnCopyCode" className="party-btn party-btn-sm party-btn-ghost" aria-label="Salin kode">
                  <i data-lucide="copy" className="h-4 w-4"></i>
                </button>
              </div>

              {/* Invite Link (uses room code directly) */}
              <p className="party-invite-label" style={{ marginTop: '0.75rem' }}>
                Link Undangan
              </p>
              <div className="party-invite-link-row">
                <input id="inviteLinkInput" type="text" className="party-form-input party-invite-link-input" readOnly />
                <button id="btnCopyLink" className="party-btn party-btn-sm party-btn-secondary">
                  <i data-lucide="link" className="h-3 w-3"></i>
                  <span>Salin</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Leave Confirmation Modal */}
      <div id="leaveModal" className="party-modal-backdrop" style={{ display: "none" }}>
        <div className="party-modal party-modal-sm" role="dialog" aria-modal="true">
          <div className="party-modal-header">
            <h3 className="party-modal-title">Keluar dari Room</h3>
          </div>
          <div className="party-modal-body">
            <p>Apakah Anda yakin ingin keluar dari room nonton bareng ini?</p>
          </div>
          <div className="party-modal-footer">
            <button id="btnCancelLeave" className="party-btn party-btn-ghost">Batal</button>
            <button id="btnConfirmLeave" className="party-btn party-btn-danger">Keluar</button>
          </div>
        </div>
      </div>

      {/* Mobile sidebar toggle */}
      <button id="btnToggleSidebar" className="party-sidebar-toggle" aria-label="Buka sidebar">
        <i data-lucide="message-circle" className="h-5 w-5"></i>
        <span id="sidebarToggleBadge" className="sidebar-toggle-badge" style={{ display: "none" }}>0</span>
      </button>

      {/* Room Expired Popup */}
      <div id="partyExpiredOverlay" className="party-expired-overlay" style={{ display: 'none' }}>
        <div className="party-expired-card">
          <div className="party-expired-icon">
            <i data-lucide="timer-off" className="h-12 w-12"></i>
          </div>
          <h2 className="party-expired-title">Waktu Room Habis</h2>
          <p className="party-expired-desc">Room nonton bareng ini telah berakhir. Anda akan dialihkan ke halaman party.</p>
          <p id="partyExpiredCountdown" className="party-expired-countdown">Mengalihkan dalam <strong>5</strong> detik...</p>
        </div>
      </div>

      <PageScript id="page-party-room" src="/js/party.js" />
    </section>
  );
}
