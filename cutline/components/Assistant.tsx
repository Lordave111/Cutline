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
    <section className="ai-assistant" aria-labelledby="assistant-title">
      <div className="assistant-heading">
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
    </section>
  );
}
