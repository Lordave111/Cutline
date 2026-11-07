"use client";

import { useRef, useState } from "react";
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
  const [floatPos, setFloatPos] = useState<{ x: number; y: number } | null>(null);
  const dragStart = useRef<{ x: number; y: number; left: number; top: number } | null>(null);
  const didDrag = useRef(false);
  function startFloatDrag(event: React.PointerEvent<HTMLButtonElement>) {
    if (event.button !== 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    dragStart.current = { x: event.clientX, y: event.clientY, left: rect.left, top: rect.top };
    didDrag.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function moveFloat(event: React.PointerEvent<HTMLButtonElement>) {
    if (!dragStart.current) return;
    const dx = event.clientX - dragStart.current.x;
    const dy = event.clientY - dragStart.current.y;
    if (Math.abs(dx) + Math.abs(dy) > 6) didDrag.current = true;
    if (!didDrag.current) return;
    const width = event.currentTarget.offsetWidth;
    const height = event.currentTarget.offsetHeight;
    setFloatPos({ x: Math.max(8, Math.min(window.innerWidth - width - 8, dragStart.current.left + dx)), y: Math.max(8, Math.min(window.innerHeight - height - 8, dragStart.current.top + dy)) });
  }
  function endFloatDrag() { dragStart.current = null; }

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
      <button className="assistant-edge-launcher" type="button" aria-label="Open Cutline AI assistant" onPointerDown={startFloatDrag} onPointerMove={moveFloat} onPointerUp={endFloatDrag} onPointerCancel={endFloatDrag} onClick={() => { if (!didDrag.current) setPanelOpen((open) => !open); }} style={floatPos ? { left: floatPos.x, top: floatPos.y, right: "auto", bottom: "auto" } : undefined} aria-expanded={panelOpen}>
        <span className="assistant-avatar-art" aria-hidden="true">
          <svg viewBox="0 0 80 80" role="img">
            <defs><linearGradient id="botMetal" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f4ffd0"/><stop offset=".55" stopColor="#d5ff62"/><stop offset="1" stopColor="#70c936"/></linearGradient><linearGradient id="botGlass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#243a32"/><stop offset="1" stopColor="#0a1512"/></linearGradient></defs>
            <path d="M40 4V12" stroke="#d5ff62" strokeWidth="3" strokeLinecap="round"/><circle cx="40" cy="4" r="4" fill="#f6ffb7"/>
            <path d="M17 29Q17 13 40 13Q63 13 63 29V52Q63 64 51 64H29Q17 64 17 52Z" fill="url(#botMetal)" stroke="#efffa0" strokeWidth="2"/>
            <rect x="22" y="25" width="36" height="26" rx="10" fill="url(#botGlass)" stroke="#64864a" strokeWidth="1.5"/>
            <ellipse cx="32" cy="37" rx="3.5" ry="4.5" fill="#d5ff62"/><ellipse cx="48" cy="37" rx="3.5" ry="4.5" fill="#d5ff62"/><path d="M34 45Q40 49 46 45" stroke="#d5ff62" strokeWidth="2" fill="none" strokeLinecap="round"/>
            <path d="M17 34H11Q7 34 7 40V43Q7 47 12 47H17M63 34H69Q73 34 73 40V43Q73 47 68 47H63" fill="none" stroke="#b7ed5a" strokeWidth="4" strokeLinecap="round"/>
            <path d="M28 63L24 70M52 63L56 70M24 70H56" stroke="#d5ff62" strokeWidth="4" strokeLinecap="round"/>
            <path d="M56 15L66 7L68 20L58 24Z" fill="#f0a94e" stroke="#fff0bd" strokeWidth="1.5"/><path d="M63 8L70 3M68 3L73 8" stroke="#fff0bd" strokeWidth="2" strokeLinecap="round"/>
            <path d="M13 18L16 12L19 18L16 24Z" fill="#fff6b7"/>
          </svg>
        </span><span className="assistant-edge-pulse" />
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
