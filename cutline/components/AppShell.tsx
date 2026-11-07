"use client";

import { useEffect, useState } from "react";

type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const DISMISS_KEY = "cutline-install-dismissed-until-v2";
const REMIND_AFTER = 12_000;
const REMIND_DAYS = 7;

export default function AppShell() {
  const [installPrompt, setInstallPrompt] = useState<InstallPrompt | null>(null);
  const [installed, setInstalled] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [promptOpen, setPromptOpen] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setInstalled(standalone);

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPrompt);
    };
    const onInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
      setHelpOpen(false);
      setPromptOpen(false);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    let timer: number | undefined;
    if (!standalone) {
      const dismissedUntil = Number(localStorage.getItem(DISMISS_KEY) || 0);
      if (dismissedUntil < Date.now()) {
        timer = window.setTimeout(() => setPromptOpen(true), REMIND_AFTER);
      }
    }

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }

    return () => {
      if (timer) window.clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install() {
    if (!installPrompt) {
      setPromptOpen(false);
      setHelpOpen(true);
      return;
    }
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setInstallPrompt(null);
      setInstalled(true);
      setPromptOpen(false);
    }
  }

  function remindLater() {
    localStorage.setItem(DISMISS_KEY, String(Date.now() + REMIND_DAYS * 24 * 60 * 60 * 1000));
    setPromptOpen(false);
  }

  return (
    <>
      {promptOpen && !installed && (
        <div className="install-nudge-backdrop" role="presentation" onClick={remindLater}>
          <section className="install-nudge" role="dialog" aria-modal="true" aria-labelledby="install-nudge-title" onClick={(event) => event.stopPropagation()}>
            <button className="install-nudge-close" type="button" onClick={remindLater} aria-label="Not now">×</button>
            <div className="install-nudge-brand"><span className="install-nudge-mark">✦</span><span>CUTLINE <small>CREATIVE STUDIO</small></span></div>
            <p className="install-nudge-kicker">YOUR CREATIVE SPACE, ONE TAP AWAY</p>
            <h2 id="install-nudge-title">Make room for your next big idea.</h2>
            <p className="install-nudge-copy">Add Cutline to your home screen for a cleaner, app-like editing experience whenever inspiration hits.</p>
            <ul className="install-nudge-benefits"><li>↗ Launch straight from your home screen</li><li>✦ A focused, full-screen workspace</li><li>▧ Keep your creative tools close</li></ul>
            <button className="install-nudge-cta" type="button" onClick={() => void install()}>Install Cutline <span>↗</span></button>
            <button className="install-nudge-later" type="button" onClick={remindLater}>Maybe later</button>
          </section>
        </div>
      )}

      {helpOpen && (
        <div className="install-help-backdrop" role="presentation" onClick={() => setHelpOpen(false)}>
          <section
            className="install-help-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="install-help-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button className="install-help-close" type="button" onClick={() => setHelpOpen(false)} aria-label="Close">×</button>
            <span className="install-help-icon" aria-hidden="true">↗</span>
            <p className="install-help-kicker">TAKE CUTLINE WITH YOU</p>
            <h2 id="install-help-title">Add Cutline to your phone</h2>
            <p>Your browser can add Cutline to your home screen. You can then launch it from its own icon.</p>
            <ol>
              <li>Tap the <strong>⋮ menu</strong> in Chrome.</li>
              <li>Choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.</li>
              <li>Confirm, then launch Cutline from your home screen.</li>
            </ol>
            <button className="install-help-done" type="button" onClick={() => setHelpOpen(false)}>Got it</button>
          </section>
        </div>
      )}
    </>
  );
}
