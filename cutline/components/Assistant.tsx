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
          <svg viewBox="0 0 100 100" role="img">
            <defs>
              <linearGradient id="paletteHead" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fffbdc"/><stop offset=".48" stopColor="#d9ff72"/><stop offset="1" stopColor="#83cf39"/></linearGradient>
              <linearGradient id="botBody" x1="0" y1="0" x2="0.9" y2="1"><stop stopColor="#f5ffd8"/><stop offset=".45" stopColor="#c9ef72"/><stop offset="1" stopColor="#649e38"/></linearGradient>
              <linearGradient id="botVisor" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#263c39"/><stop offset="1" stopColor="#081412"/></linearGradient>
              <linearGradient id="brushWood" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#ffe7a0"/><stop offset="1" stopColor="#c47b39"/></linearGradient>
            </defs>
            <ellipse cx="50" cy="91" rx="27" ry="5" fill="#8dff52" opacity=".22"/>
            <path d="M35 64L29 80Q28 84 33 85H45L49 71M65 64L71 80Q72 84 67 85H55L51 71" fill="url(#botBody)" stroke="#efffb4" strokeWidth="2"/>
            <path d="M32 44Q50 39 68 44L75 65Q76 73 67 76H33Q24 73 25 65Z" fill="url(#botBody)" stroke="#efffb4" strokeWidth="2"/>
            <path d="M31 52L19 61Q15 65 19 69L24 70L39 60M69 52L81 61Q85 65 81 69L76 70L61 60" fill="none" stroke="#b8e95e" strokeWidth="7" strokeLinecap="round"/>
            <circle cx="18" cy="70" r="5" fill="#eaffb0"/><circle cx="82" cy="70" r="5" fill="#eaffb0"/>
            <path d="M18 30Q14 13 31 10Q42 4 55 9Q75 5 82 22Q91 38 76 51Q64 61 43 57Q23 58 16 45Q10 37 18 30Z" fill="url(#paletteHead)" stroke="#f4ffd0" strokeWidth="2.5"/>
            <path d="M26 24Q34 17 44 20Q51 23 48 30Q45 36 36 34Q27 33 26 24Z" fill="#ff5b73" stroke="#fff0d0" strokeWidth="1.5"/>
            <circle cx="65" cy="21" r="7" fill="#55c9ff" stroke="#eaffd0" strokeWidth="1.5"/>
            <circle cx="76" cy="36" r="6" fill="#a56cff" stroke="#eaffd0" strokeWidth="1.5"/>
            <circle cx="27" cy="43" r="5.5" fill="#ffbf45" stroke="#fff0d0" strokeWidth="1.5"/>
            <path d="M35 31Q50 25 67 32Q73 35 72 44Q70 52 59 53H41Q29 52 29 43Q29 35 35 31Z" fill="url(#botVisor)" stroke="#668b4d" strokeWidth="1.8"/>
            <ellipse cx="43" cy="41" rx="4" ry="5" fill="#d5ff62"/><ellipse cx="59" cy="41" rx="4" ry="5" fill="#d5ff62"/>
            <path d="M44 48Q51 53 58 48" fill="none" stroke="#d5ff62" strokeWidth="2.3" strokeLinecap="round"/>
            <path d="M78 57L91 29" stroke="url(#brushWood)" strokeWidth="5" strokeLinecap="round"/>
            <path d="M88 27Q91 14 98 12Q98 25 92 32Z" fill="#ff78a8" stroke="#ffe4c0" strokeWidth="1.5"/>
            <path d="M76 60L81 64" stroke="#fff2b7" strokeWidth="2" strokeLinecap="round"/>
            <path d="M11 13L14 7L17 13L14 19Z" fill="#fff5bd"/><path d="M86 7L89 2L92 7L89 12Z" fill="#a8f7ff"/>
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
