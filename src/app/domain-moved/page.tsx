"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Check,
  Copy,
  Globe,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

const NEW_DOMAIN = "dramova.app";
const NEW_DOMAIN_URL = `${NEW_DOMAIN}`;

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.45, ease: EASE },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.88 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: EASE },
  },
};

export default function DomainMovedPage() {
  const [copied, setCopied] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [isDark, setIsDark] = useState(true);

  // Sync theme state with document on mount
  useEffect(() => {
    const syncTheme = () => {
      setIsDark(document.documentElement.getAttribute("data-theme") !== "light");
    };
    syncTheme();
    document.addEventListener("theme:changed", syncTheme);
    return () => document.removeEventListener("theme:changed", syncTheme);
  }, []);

  const handleToggleTheme = useCallback(() => {
    const root = document.documentElement;
    const next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
    localStorage.setItem("dramova.theme", JSON.stringify(next));
    root.setAttribute("data-theme", next);
    root.classList.toggle("light", next === "light");
    document.dispatchEvent(new CustomEvent("theme:changed", { detail: next }));
    setIsDark(next !== "light");
  }, []);

  const handleCopyDomain = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(NEW_DOMAIN);
    } catch {
      // Fallback for older browsers
      const el = document.createElement("input");
      el.value = NEW_DOMAIN;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const handleRedirect = useCallback(() => {
    setRedirecting(true);
    window.location.href = NEW_DOMAIN_URL;
  }, []);

  return (
    <>
      {/* Theme toggle — outside main to avoid flex/transform stacking context */}
      <button
        type="button"
        onClick={handleToggleTheme}
        aria-label={isDark ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
        className="grid h-10 w-10 place-items-center rounded-full border transition-all hover:opacity-80 active:scale-90"
        style={{
          position: "fixed",
          top: 16,
          right: 16,
          zIndex: 50,
          borderColor: "var(--border-muted)",
          background: "var(--bg-raised)",
          color: "var(--text-primary)",
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {isDark ? (
            <motion.span
              key="sun"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-center"
            >
              <Sun className="h-4 w-4" />
            </motion.span>
          ) : (
            <motion.span
              key="moon"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-center"
            >
              <Moon className="h-4 w-4" />
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <main className="min-h-screen flex items-center justify-center px-4 py-12 bg-[var(--bg-base)]">
        {/* Ambient gradient blobs */}
        <div
          className="pointer-events-none fixed inset-0 overflow-hidden"
          aria-hidden="true"
        >
          <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-[var(--accent)] opacity-[0.04] blur-[120px]" />
          <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-[var(--accent)] opacity-[0.05] blur-[100px]" />
        </div>

      <motion.div
        className="relative z-10 flex w-full max-w-lg flex-col items-center gap-8 text-center"
        initial="hidden"
        animate="visible"
      >
        {/* Migration badge */}
        <motion.div custom={0} variants={fadeUp}>
          <Badge
            variant="secondary"
            className="gap-1.5 px-3 py-1.5 text-xs font-semibold border border-[var(--border-color)]"
          >
            <AlertTriangle className="h-3 w-3 text-[var(--warning)]" />
            Pemberitahuan Migrasi Domain
          </Badge>
        </motion.div>

        {/* Logo */}
        <motion.div custom={1} variants={fadeUp} className="flex flex-col items-center gap-4">
          <motion.div variants={scaleIn}>
            <img
              src="/img/logo.png"
              alt="DRAMOVA"
              className="h-14 w-auto drop-shadow-[0_4px_24px_rgba(43,166,65,0.3)]"
            />
          </motion.div>
        </motion.div>

        {/* Title */}
        <motion.h1
          custom={2}
          variants={fadeUp}
          className="text-3xl md:text-4xl font-black leading-tight tracking-tight text-[var(--text-primary)]"
        >
          Kini Kami Telah Berpindah
          <br />
          <span className="text-[var(--accent)]">ke Domain yang Baru</span>
        </motion.h1>

        {/* Description */}
        <motion.p
          custom={3}
          variants={fadeUp}
          className="max-w-md text-[var(--text-secondary)] leading-relaxed text-sm md:text-base"
        >
          Seluruh layanan DRAMOVA kini tersedia secara eksklusif melalui domain
          kami yang baru. Dapatkan pengalaman streaming yang lebih cepat,
          aman, dan stabil di{" "}
          <a
            href={NEW_DOMAIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[var(--accent)] hover:underline underline-offset-2"
          >
            {NEW_DOMAIN_URL}
          </a>
          .
        </motion.p>

        {/* Domain card */}
        <motion.div custom={4} variants={fadeUp} className="w-full">
          <Card className="border-[var(--border-color)] bg-[var(--bg-surface)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Globe className="h-4 w-4 text-[var(--accent)]" />
                Domain Baru DRAMOVA
              </CardTitle>
              {/*<CardDescription className="text-[var(--text-tertiary)]">
                Satu-satunya alamat yang digunakan ke depannya
              </CardDescription>*/}
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-base)] px-4 py-3">
                <code className="flex-1 text-left text-sm font-mono font-semibold text-[var(--accent)]">
                  {NEW_DOMAIN}
                </code>
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={handleCopyDomain}
                  aria-label={copied ? "Tersalin" : "Salin domain"}
                  className="shrink-0"
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {copied ? (
                      <motion.span
                        key="check"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="flex h-full w-full items-center justify-center"
                      >
                        <Check className="h-4 w-4 text-[var(--accent)]" />
                      </motion.span>
                    ) : (
                      <motion.span
                        key="copy"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="flex h-full w-full items-center justify-center"
                      >
                        <Copy className="h-4 w-4" />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* CTA buttons */}
        <motion.div
          custom={5}
          variants={fadeUp}
          className="flex w-full flex-col gap-3"
        >
          {/* Primary CTA */}
          <motion.div
            animate={{
              boxShadow: [
                "0 0 0 0 rgba(43, 166, 65, 0)",
                "0 0 20px 6px rgba(43, 166, 65, 0.35)",
                "0 0 0 0 rgba(43, 166, 65, 0)",
              ],
            }}
            transition={{
              duration: 2.4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="rounded-full"
          >
            <Button
              size="lg"
              className="w-full gap-2 text-base"
              onClick={handleRedirect}
              disabled={redirecting}
            >
              {redirecting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Mengalihkan…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Kunjungi {NEW_DOMAIN}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </motion.div>

        </motion.div>

        {/* Bookmark notice */}
        <motion.div custom={6} variants={fadeUp} className="w-full">
          <div className="flex items-start gap-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-raised)] px-4 py-3 text-left">
            <div className="mt-0.5 shrink-0 rounded-full bg-[var(--accent-muted)] p-1.5">
              <ShieldCheck className="h-4 w-4 text-[var(--accent)]" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                Perbarui Bookmark Anda
              </p>
              <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                Hapus bookmark lama yang mengarah ke{" "}
                <span className="font-mono text-[var(--negative)]">
                  dramova.vercel.app
                </span>{" "}
                dan ganti dengan alamat yang baru{" "}
                <span className="font-mono text-[var(--accent)]">
                  {NEW_DOMAIN}
                </span>
                . Domain lama ini akan dinonaktifkan dan tidak
                akan lagi menerima pembaruan konten maupun fitur.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Official domain statement */}
        <motion.div custom={7} variants={fadeUp}>
          <div className="rounded-lg border border-[var(--accent-muted)] bg-[color-mix(in_srgb,var(--accent-muted)_30%,transparent)] px-5 py-4">
            <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
              <span className="font-semibold text-[var(--accent)]">
                {NEW_DOMAIN_URL}
              </span>{" "}
              adalah satu-satunya domain yang digunakan ke
              depannya. Pastikan Anda selalu mengakses DRAMOVA melalui alamat
              ini untuk mendapatkan layanan yang aman, terkini, dan lengkap.
              Domain lain yang mengatasnamakan DRAMOVA tidak berafiliasi dengan
              kami.
            </p>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.p
          custom={8}
          variants={fadeUp}
          className="text-xs text-[var(--text-tertiary)]"
        >
          © {new Date().getFullYear()} DRAMOVA. All rights reserved.
        </motion.p>
      </motion.div>
    </main>
    </>
  );
}
