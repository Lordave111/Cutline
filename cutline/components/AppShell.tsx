"use client";

import { useEffect, useState } from "react";

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }> };

export default function AppShell() {
  const [installPrompt, setInstallPrompt] = useState<InstallPrompt | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setInstalled(standalone);
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPrompt);
    };
    const onInstalled = () => { setInstalled(true); setInstallPrompt(null); };
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
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") setInstallPrompt(null);
  }

  return (
    <>
      {installPrompt && !installed && (
        <button className="install-app-button" type="button" onClick={() => void install()}>
          <span aria-hidden="true">↓</span> Install Cutline
        </button>
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
