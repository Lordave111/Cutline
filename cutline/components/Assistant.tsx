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
          <svg viewBox="0 0 100 100" role="img" aria-label="Painter robot mascot">
            <defs>
              <linearGradient id="palShell" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#f8ffe8"/><stop offset=".42" stopColor="#d8ff76"/><stop offset="1" stopColor="#78bd3e"/></linearGradient>
              <linearGradient id="suit" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#344a46"/><stop offset=".55" stopColor="#182b29"/><stop offset="1" stopColor="#0b1716"/></linearGradient>
              <linearGradient id="face" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#f0f6dc"/><stop offset="1" stopColor="#9bbd83"/></linearGradient>
              <linearGradient id="metal" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#f5ffd2"/><stop offset="1" stopColor="#82ba48"/></linearGradient>
              <linearGradient id="brush" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#f9d28c"/><stop offset="1" stopColor="#a96b39"/></linearGradient>
            </defs>
            <ellipse cx="49" cy="93" rx="27" ry="4.5" fill="#9cff62" opacity=".2"/>
            {/* tailored artist jacket and legs */}
            <path d="M37 68L33 84Q33 88 38 88H46L49 73M63 68L67 84Q67 88 62 88H54L51 73" fill="url(#suit)" stroke="#9acb62" strokeWidth="1.7"/>
            <path d="M28 54Q39 48 50 50Q62 48 72 55L77 74Q77 79 71 80H29Q23 79 23 74Z" fill="url(#suit)" stroke="#b4e66b" strokeWidth="2"/>
            <path d="M39 53L50 65L61 53L57 78H43Z" fill="#e9f4d5" opacity=".95"/>
            <path d="M47 64L53 64L55 77L50 81L45 77Z" fill="#d5ff62"/>
            <path d="M28 57L17 67Q14 71 18 75L23 76L38 65M72 57L83 67Q86 71 82 75L77 76L62 65" fill="none" stroke="url(#metal)" strokeWidth="7" strokeLinecap="round"/>
            <circle cx="18" cy="76" r="4.5" fill="#dfff9c"/><circle cx="82" cy="76" r="4.5" fill="#dfff9c"/>
            {/* palette-shaped crown/head shell */}
            <path d="M17 30Q12 17 25 11Q34 5 46 9Q59 3 72 12Q87 18 83 34Q82 45 72 51Q61 59 43 56Q25 57 17 45Q11 38 17 30Z" fill="url(#palShell)" stroke="#f3ffd7" strokeWidth="2.2"/>
            {/* paint wells around the palette rim */}
            <path d="M24 23Q30 15 39 19Q45 22 41 29Q36 35 28 31Q23 29 24 23Z" fill="#ff6b75" stroke="#fff1d4" strokeWidth="1.4"/>
            <circle cx="66" cy="19" r="6.5" fill="#56c8ff" stroke="#efffd1" strokeWidth="1.4"/>
            <circle cx="77" cy="35" r="5.5" fill="#a879f7" stroke="#efffd1" strokeWidth="1.4"/>
            <circle cx="25" cy="43" r="5" fill="#ffbd4b" stroke="#fff1d4" strokeWidth="1.4"/>
            {/* human-like robotic face */}
            <path d="M34 27Q50 20 67 28Q74 33 72 43L68 50Q61 56 50 55Q38 55 31 49L28 41Q28 32 34 27Z" fill="url(#face)" stroke="#63894d" strokeWidth="1.8"/>
            <path d="M34 33Q40 27 46 32M54 32Q61 27 67 33" fill="none" stroke="#526b49" strokeWidth="3.2" strokeLinecap="round"/>
            <rect x="35" y="35" width="11" height="8" rx="4" fill="#172d2a"/><rect x="54" y="35" width="11" height="8" rx="4" fill="#172d2a"/>
            <circle cx="41" cy="39" r="2.2" fill="#d5ff62"/><circle cx="59" cy="39" r="2.2" fill="#d5ff62"/>
            <path d="M48 39L46 46Q50 48 53 46" fill="none" stroke="#78946a" strokeWidth="1.6" strokeLinecap="round"/>
            <path d="M42 49Q50 53 58 49" fill="none" stroke="#3e5d43" strokeWidth="2" strokeLinecap="round"/>
            {/* ear pieces and artist brush */}
            <rect x="15" y="34" width="6" height="12" rx="3" fill="#9ed75b" stroke="#f1ffd0" strokeWidth="1"/>
            <rect x="79" y="34" width="6" height="12" rx="3" fill="#9ed75b" stroke="#f1ffd0" strokeWidth="1"/>
            <path d="M78 62L91 28" stroke="url(#brush)" strokeWidth="4.5" strokeLinecap="round"/>
            <path d="M87 29Q89 16 97 12Q98 24 92 33Z" fill="#e6f5c8" stroke="#fff2d2" strokeWidth="1.4"/>
            <path d="M78 60L82 64" stroke="#fff0bd" strokeWidth="2" strokeLinecap="round"/>
            <path d="M12 13L15 7L18 13L15 19Z" fill="#fff6c6"/><path d="M86 7L89 2L92 7L89 12Z" fill="#a8f7ff"/>
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
