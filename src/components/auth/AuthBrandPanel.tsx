import Link from "next/link";

export function AuthBrandPanel() {
  return (
    <aside className="auth-brand-panel">
      <div className="auth-brand-noise" aria-hidden="true" />
      <Link href="/" className="auth-brand-logo" aria-label="Dramova">
        <img src="/img/logo.png" alt="Dramova" />
      </Link>
      <div className="auth-brand-copy">
        <h1>Nikmati cerita favoritmu dalam pengalaman streaming yang nyaman dan tanpa batas.</h1>
      </div>
      <div className="auth-brand-foot">
        <span />
        <p>Platform Streaming Drama</p>
      </div>
    </aside>
  );
}
