"use client";

import { useEffect, useState } from "react";

type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export default function AppShell() {
  const [installPrompt, setInstallPrompt] = useState<InstallPrompt | null>(null);
  const [installed, setInstalled] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

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
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install() {
    if (!installPrompt) {
      setHelpOpen(true);
      return;
    }
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setInstallPrompt(null);
      setInstalled(true);
    }
  }

  return (
    <>
      {!installed && (
        <button className="install-app-button" type="button" onClick={() => void install()}>
          <span aria-hidden="true">↓</span> Install app
        </button>
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
            <p>Chrome is currently offering the home-screen option instead of its automatic install prompt. You can still add Cutline and open it from its own icon.</p>
            <ol>
              <li>Tap the <strong>⋮ menu</strong> in Chrome.</li>
              <li>Choose <strong>Install app</strong> if it appears, or <strong>Add to Home screen</strong>.</li>
              <li>Confirm, then launch Cutline from your home screen.</li>
            </ol>
            <button className="install-help-done" type="button" onClick={() => setHelpOpen(false)}>Got it</button>
          </section>
        </div>
      )}

      <nav className="mobile-app-nav" aria-label="App navigation">
        <a href="#top" aria-label="Home"><span>⌂</span><small>Home</small></a>
        <a href="#studio" aria-label="Studio"><span>▧</span><small>Studio</small></a>
        <a href="#features" aria-label="Tools"><span>✳</span><small>Tools</small></a>
        <a href="#workflow" aria-label="Workflow"><span>◷</span><small>Guide</small></a>
      </nav>
    </>
  );
}
