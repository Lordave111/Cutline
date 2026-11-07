"use client";

import { useState } from "react";
import type { FormEvent } from "react";

type Message = { role: "user" | "model"; text: string };

const suggestions = [
  "Give me a clean product-photo edit recipe",
  "Write a background prompt for a luxury skincare advert",
  "Suggest settings for a warm, cinematic portrait",
];

export default function Assistant() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "model", text: "Hi! I'm Cutline AI. Tell me what you're editing and I'll help with settings, backgrounds, captions and creative ideas." },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);

  async function send(text = input) {
    const value = text.trim();
    if (!value || busy) return;
    const next: Message[] = [...messages, { role: "user", text: value }];
    setMessages(next);
    setInput("");
    setError("");
    setBusy(true);
    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.slice(-10).map(({ role, text }) => ({ role, text })) }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "The assistant couldn't respond. Try again.");
      setMessages((current) => [...current, { role: "model", text: data.reply }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    void send();
  }

  return (
    <>
      <button className="assistant-edge-launcher" type="button" aria-label="Open Cutline AI assistant" onClick={() => setPanelOpen((open) => !open)} aria-expanded={panelOpen}>
        <span className="assistant-avatar-art" aria-hidden="true">
          <svg viewBox="0 0 64 64" role="img">
            <defs><linearGradient id="designerGlow" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#efffa0"/><stop offset="1" stopColor="#a5ed42"/></linearGradient></defs>
            <circle cx="32" cy="32" r="30" fill="#111a15"/>
            <path d="M12 25Q17 5 36 9Q49 11 53 25L47 29H17Z" fill="url(#designerGlow)"/>
            <path d="M18 28Q20 17 32 17Q45 17 47 30L45 43Q41 53 32 53Q22 52 18 42Z" fill="#e9b58d"/>
            <path d="M18 30Q21 15 34 17Q45 18 48 31L43 27L39 22Q31 29 19 28Z" fill="#18211a"/>
            <path d="M25 35h3M37 35h3" stroke="#263027" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M28 43Q32 46 36 43" fill="none" stroke="#9b594a" strokeWidth="2" strokeLinecap="round"/>
            <path d="M12 61Q14 48 25 47L32 53L39 47Q51 49 53 61" fill="#d5ff62"/>
            <path d="M8 17L11 12L14 17L11 22Z" fill="#fff6b7"/>
          </svg>
        </span><span className="assistant-edge-label">{panelOpen ? "CLOSE" : "DESIGN AI"}</span><span className="assistant-edge-pulse" />
      </button>
      {panelOpen && <section className="ai-assistant assistant-floating-panel" id="cutline-ai" aria-labelledby="assistant-title" role="dialog" aria-modal="false">
      <div className="assistant-heading">
        <button type="button" className="assistant-panel-close" onClick={() => setPanelOpen(false)} aria-label="Close Cutline AI">×</button>
        <div><p className="tag">YOUR CREATIVE COPILOT</p><h2 id="assistant-title">Cutline AI</h2><p className="mute">Ideas, editing advice and prompts — right inside your studio.</p></div>
        <span className="ai-status">● AI READY</span>
      </div>
      <div className="assistant-suggestions">
        {suggestions.map((item) => <button type="button" key={item} onClick={() => void send(item)} disabled={busy}>{item}</button>)}
      </div>
      <div className="assistant-chat" aria-live="polite">
        {messages.slice(-8).map((message, index) => (
          <div className={`assistant-message ${message.role === "user" ? "from-user" : "from-ai"}`} key={index}>
            <span>{message.role === "user" ? "YOU" : "CUTLINE AI"}</span>
            <p>{message.text}</p>
          </div>
        ))}
        {busy && <p className="assistant-thinking">Cutline AI is thinking…</p>}
      </div>
      {error && <p className="err" role="alert">{error}</p>}
      <form className="assistant-form" onSubmit={submit}>
        <input aria-label="Ask Cutline AI" value={input} onChange={(e) => setInput(e.target.value)} maxLength={1500} placeholder="Ask for an edit, prompt or creative idea…" />
        <button className="go" type="submit" disabled={busy || !input.trim()}>{busy ? "…" : "Send ↗"}</button>
      </form>
      <p className="assistant-note">AI responses can be inaccurate. Don't share private or sensitive information.</p>
      </section>}
    </>
  );
}
