"use client";

import { useRef, useState } from "react";
import type { FormEvent } from "react";

type Message = { role: "user" | "model"; text: string };

const suggestions = [
  "Give me a clean product-photo edit recipe",
  "Write a background prompt for a luxury skincare advert",
  "Suggest settings for a warm, cinematic portrait",
];

export default function Assistant({ embedded = false }: { embedded?: boolean }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "model", text: "Hi! I'm Cutline AI. Tell me what you're editing and I'll help with settings, backgrounds, captions and creative ideas." },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [panelOpen, setPanelOpen] = useState(embedded);
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
      {!embedded && <button className="assistant-edge-launcher" type="button" aria-label="Open Cutline AI assistant" onPointerDown={startFloatDrag} onPointerMove={moveFloat} onPointerUp={endFloatDrag} onPointerCancel={endFloatDrag} onClick={() => { if (!didDrag.current) setPanelOpen((open) => !open); }} style={floatPos ? { left: floatPos.x, top: floatPos.y, right: "auto", bottom: "auto" } : undefined} aria-expanded={panelOpen}>
        <span className="assistant-avatar-art" aria-hidden="true"><svg viewBox="0 0 48 48" fill="none"><path d="M24 3.5 28.6 17l13.9 7-13.9 4.6L24 42.5l-4.6-13.9L5.5 24l13.9-7L24 3.5Z" fill="url(#cutlineAiGradient)" stroke="white" strokeOpacity=".82" strokeWidth="1.2"/><path d="m36.5 4 1.7 5.1 5.1 1.7-5.1 1.7-1.7 5.1-1.7-5.1-5.1-1.7 5.1-1.7L36.5 4Z" fill="#fff"/><circle cx="24" cy="24" r="4.2" fill="#10172b"/><defs><linearGradient id="cutlineAiGradient" x1="9" y1="6" x2="39" y2="43" gradientUnits="userSpaceOnUse"><stop stopColor="#B9A5FF"/><stop offset=".52" stopColor="#6E7BFF"/><stop offset="1" stopColor="#39C6E8"/></linearGradient></defs></svg></span><span className="assistant-edge-label">CUTLINE AI</span><span className="assistant-edge-pulse" />
      </button>}
      {panelOpen && <section className={embedded ? "ai-assistant assistant-embedded-panel" : "ai-assistant assistant-floating-panel"} id="cutline-ai" aria-labelledby="assistant-title" role="dialog" aria-modal="false">
      <div className="assistant-heading">
        <button type="button" className="assistant-panel-close" onClick={() => setPanelOpen(false)} aria-label="Close Cutline AI">×</button>
        <div className="assistant-heading-copy"><p className="tag">YOUR CREATIVE COPILOT</p><h2 id="assistant-title">Cutline AI</h2><p className="mute">Ideas, editing advice and prompts — right inside your studio.</p></div>
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
        <button className="go assistant-send" type="submit" disabled={busy || !input.trim()} aria-label={busy ? "Sending message" : "Send message"}>{busy ? <span className="assistant-send-spinner" /> : <><span>Send</span><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 10 17 3l-4.5 14-2.2-5-7.3-2Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/><path d="m10.3 12 3.1-3.1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg></>}</button>
      </form>
      <p className="assistant-note">AI responses can be inaccurate. Don't share private or sensitive information.</p>
      </section>}
    </>
  );
}
