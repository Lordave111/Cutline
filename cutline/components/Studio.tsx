"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { SignInButton, useAuth } from "@clerk/nextjs";
import { COST, CURRENCY, PACKS } from "@/lib/pricing";
import Editor, { type Bg } from "./Editor";
import Assistant from "./Assistant";

const MAX_SIDE = 1800;
type Mode = "cutout" | "color" | "gradient" | "image" | "ai";
const MODES: [Mode, string][] = [["cutout", "Transparent"], ["color", "Color"], ["gradient", "Gradient"], ["image", "My image"], ["ai", "AI prompt"]];

const BACKGROUND_PRESETS = [
  { name: "Passport white", color: "#ffffff", note: "Clean white" },
  { name: "Soft white", color: "#f5f5f2", note: "Warm off-white" },
  { name: "Passport blue", color: "#dcecf7", note: "Pale blue" },
  { name: "Studio grey", color: "#d9dde2", note: "Neutral grey" },
  { name: "Sky blue", color: "#9dc9e8", note: "Soft blue" },
  { name: "Classic red", color: "#c92e3b", note: "Bold red" },
  { name: "Deep navy", color: "#172d4d", note: "Dark blue" },
  { name: "Mint", color: "#cceee0", note: "Soft mint" },
];


async function shrink(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) throw new Error("Choose an image file.");
  if (file.size > 20 * 1024 * 1024) throw new Error("That image is too large. Choose a file under 20 MB.");

  const bmp = await createImageBitmap(file);
  try {
    const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bmp.width * scale));
    canvas.height = Math.max(1, Math.round(bmp.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Your browser could not prepare this image.");
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.88));
    if (!blob) throw new Error("Could not process this image. Try another file.");
    return new File([blob], "photo.jpg", { type: "image/jpeg" });
  } finally {
    bmp.close();
  }
}

async function call(url: string, body: FormData, onLeft: (n: number) => void): Promise<Blob> {
  const r = await fetch(url, { method: "POST", body });
  if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(j.error || "Request failed. Try a smaller image."); }
  const contentType = r.headers.get("content-type") || "";
  if (!contentType.startsWith("image/")) throw new Error("The image service returned an unexpected response. Please try again.");
  const left = r.headers.get("X-Credits-Left");
  if (left) onLeft(Number(left));
  return r.blob();
}

export default function Studio() {
  const { isSignedIn } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [mode, setMode] = useState<Mode>("cutout");
  const [color, setColor] = useState("#0d1117");
  const [color2, setColor2] = useState("#3dffb0");
  const [bgFile, setBgFile] = useState<File | null>(null);
  const [cutBlob, setCutBlob] = useState<Blob | null>(null);
  const [flatBlob, setFlatBlob] = useState<Blob | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [credits, setCredits] = useState<number | null>(null);
  const [buying, setBuying] = useState<string | null>(null);
  const cutSrc = useRef<File | null>(null);
  const previewUrl = useRef("");

  useEffect(() => () => {
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
  }, []);

  useEffect(() => {
    if (!isSignedIn) { setCredits(null); return; }
    let tries = new URLSearchParams(location.search).has("paid") ? 6 : 1; // after payment, wait for the webhook
    const load = async () => {
      const r = await fetch("/api/credits");
      if (r.ok) setCredits((await r.json()).credits);
      if (--tries > 0) setTimeout(load, 2000);
    };
    load();
  }, [isSignedIn]);

  async function buy(pack: string) {
    if (buying) return;
    setError(""); setBuying(pack);
    try {
      const r = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pack }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.url) throw new Error(j.error || "Paystack checkout could not be started. Please try again.");
      window.location.assign(j.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not connect to Paystack. Check your internet and try again.");
      setBuying(null);
    }
  }

  async function pick(f?: File) {
    if (!f) return;
    setError(""); setCutBlob(null); setFlatBlob(null); cutSrc.current = null;
    try {
      const s = await shrink(f);
      const nextUrl = URL.createObjectURL(s);
      if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
      previewUrl.current = nextUrl;
      setFile(s);
      setPreview(nextUrl);
      setBgFile(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read that image.");
    }
  }

  async function useSample(url: string, name: string) {
    setError("");
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Could not load this sample. Try uploading your own photo.");
      const blob = await response.blob();
      await pick(new File([blob], name + ".jpg", { type: blob.type || "image/jpeg" }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load sample image.");
    }
  }

  async function run() {
    if (!file) return;
    setBusy(true); setError("");
    try {
      if (mode === "ai") {
        // Open the original image in the editor. The user paints the exact
        // background area and submits it to the working Cloudflare inpainting route.
        setFlatBlob(file);
      } else {
        const f = new FormData(); f.append("image", file);
        setCutBlob(await call("/api/cutout", f, setCredits)); cutSrc.current = file;
      }
    } catch (e) { setError(e instanceof Error ? e.message : "Something went wrong."); }
    finally { setBusy(false); }
  }

  const bg: Bg = useMemo(() => {
    if (mode === "color") return { kind: "color", color };
    if (mode === "gradient") return { kind: "gradient", color, color2 };
    if (mode === "image" && bgFile) return { kind: "image", image: bgFile };
    return { kind: "none" };
  }, [mode, color, color2, bgFile]);

  // Open the full editor as soon as a photo is selected; processed cut-out/AI results take priority when available.
  const base = mode === "ai" ? (flatBlob ?? file) : (cutBlob ?? file);
  const editorFlat = mode === "ai" || !cutBlob;
  const ready = mode !== "ai" && !!cutBlob && cutSrc.current === file; // cut-out done: switching backgrounds is free and instant

  return (
    <section className="studio">
      <div className="bar">
        {isSignedIn ? (
          <>
            <span>CREDITS <b>{credits ?? "…"}</b></span>
            <span className="mute">Cut-out {COST.cutout} · Cloudflare AI edits use a separate daily allowance</span>
          </>
        ) : (
          <SignInButton mode="modal"><button className="go">Sign in for free credits</button></SignInButton>
        )}
      </div>
      {isSignedIn && (
        <div className="credit-store">
          <div className="credit-store-heading"><b>Get more credits</b><small>Choose a pack to continue to secure Paystack checkout.</small></div>
          <div className="packs">
          {Object.entries(PACKS).map(([id, p]) => (
            <button type="button" key={id} disabled={!!buying} aria-busy={buying === id} onClick={() => void buy(id)}>
              <b>{buying === id ? "Connecting to Paystack…" : buying ? "Please wait…" : p.label}</b><span>{p.credits} credits</span><span>{CURRENCY === "NGN" ? "₦" : "$"}{p.price[CURRENCY].toLocaleString()}</span><small>{buying === id ? "Opening secure checkout" : "Tap to purchase →"}</small>
            </button>
          ))}
          </div>
        </div>
      )}

      <div className="studio-intake-grid">
      <label
        className="drop"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => { event.preventDefault(); void pick(event.dataTransfer.files?.[0]); }}
      >
        <input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => { void pick(e.target.files?.[0]); e.currentTarget.value = ""; }} />
        <span className="drop-icon">＋</span>
        <b>{file ? "Change photo" : "Upload a photo to start creating"}</b>
        <small>{file ? file.name : "Choose a photo · JPG, PNG or WebP"}</small>
      </label>
      <div className="sample-entry">
        <div><b>Want to try Cutline first?</b><small>Explore the editor with a sample photo.</small></div>
        <div className="sample-entry-grid">
          <button type="button" onClick={() => void useSample("https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1200&auto=format&fit=crop&q=85", "portrait-sample")}><img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=70" alt="" /><span>Portrait</span></button>
          <button type="button" onClick={() => void useSample("https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&auto=format&fit=crop&q=85", "landscape-sample")}><img src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=160&auto=format&fit=crop&q=70" alt="" /><span>Landscape</span></button>
          <button type="button" onClick={() => void useSample("https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&auto=format&fit=crop&q=85", "product-sample")}><img src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=160&auto=format&fit=crop&q=70" alt="" /><span>Product</span></button>
        </div>
      </div>
      </div>

      {file && (
        <>
        <div className="tabs" role="tablist">
          {MODES.map(([m, label]) => (
            <button type="button" key={m} role="tab" aria-selected={mode === m} aria-disabled={!file} disabled={!file} className={mode === m ? "on" : ""} onClick={() => setMode(m)}>{label}</button>
          ))}
        </div>
  
        {(mode === "color" || mode === "gradient") && (
          <div className="background-picker">
            <div className="background-picker-heading">
              <b>Ready-made backgrounds</b>
              <small>Choose a clean backdrop, or fine-tune the colour below.</small>
            </div>
            <div className="background-preset-grid">
              {BACKGROUND_PRESETS.map((preset) => (
                <button
                  type="button"
                  key={preset.name}
                  className={mode === "color" && color.toLowerCase() === preset.color ? "selected" : ""}
                  onClick={() => { setMode("color"); setColor(preset.color); }}
                  aria-pressed={mode === "color" && color.toLowerCase() === preset.color}
                >
                  <i style={{ background: preset.color }} />
                  <span><b>{preset.name}</b><small>{preset.note}</small></span>
                </button>
              ))}
            </div>
            <div className="chips">
              <label className="background-custom-label">Custom colour <input aria-label="Custom background colour" type="color" value={color} onChange={(e) => { setMode("color"); setColor(e.target.value); }} /></label>
              {mode === "gradient" && <label className="background-custom-label">Second colour <input aria-label="Second gradient colour" type="color" value={color2} onChange={(e) => setColor2(e.target.value)} /></label>}
            </div>
          </div>
        )}
        {mode === "image" && <label className="background-custom-label">Choose background image <input aria-label="Background image" type="file" accept="image/jpeg,image/png,image/webp" disabled={!file} onChange={async (e) => {
          const selected = e.target.files?.[0];
          e.currentTarget.value = "";
          if (!selected) return;
          try { setBgFile(await shrink(selected)); setError(""); }
          catch (reason) { setError(reason instanceof Error ? reason.message : "Could not read that background image."); }
        }} /></label>}
        {mode === "ai" && <p className="editor-hint">Open the editor, activate the AI mask brush, paint over the background area you want to replace, then describe the new background in the AI image editor.</p>}
  
        <button className="go" onClick={run} disabled={!file || busy || !isSignedIn || ready}>
          {busy ? "Opening editor…" : mode === "ai" ? "Open AI background editor" : ready ? "Cut-out ready: edit below" : `Remove background (${COST.cutout} credit)`}
        </button>
  
        </>
      )}
      {error && <p className="err" role="alert">{error}</p>}

      {preview && !base && <figure><figcaption>INPUT</figcaption><img src={preview} alt="Original" /></figure>}
      {file && base ? <div className="studio-editor-ready"><div className="studio-editor-heading"><div><span className="tool-kicker">PHOTO STUDIO / WORKSPACE</span><h3>Your editing workspace</h3><p>All tools are ready. Changes update the canvas as you work.</p></div><span className="studio-active-status"><i /> ACTIVE</span></div><Editor base={base} flat={editorFlat} bg={bg} /></div> : <div className="studio-locked-workspace" aria-disabled="true"><div className="studio-locked-heading"><span className="tool-kicker">PHOTO STUDIO / WORKSPACE</span><span className="studio-locked-status">LOCKED · NO PHOTO</span></div><h3>Your creative tools, all in one place.</h3><p>Upload a photo to activate the canvas and unlock every editing function.</p><div className="studio-locked-tools"><span>✧ Enhance</span><span>▣ Crop &amp; transform</span><span>◌ Retouch &amp; blur</span><span>T Text &amp; layers</span><span>✦ AI editing</span><span>◈ Filters &amp; colour</span><span>▧ Backgrounds</span><span>↗ Export</span></div><div className="studio-template-preview"><div className="studio-template-title"><b>Design templates</b><small>Ready-made layouts · activate when a photo is uploaded</small></div><div className="studio-template-list"><span><i className="template-swatch swatch-product"/>Product feature</span><span><i className="template-swatch swatch-social"/>Social story</span><span><i className="template-swatch swatch-sale"/>Sale announcement</span><span><i className="template-swatch swatch-editorial"/>Editorial cover</span></div></div></div>}
      {isSignedIn ? <Assistant /> : (
        <div className="ai-assistant">
          <p className="tag">YOUR CREATIVE COPILOT</p>
          <h2>Cutline AI</h2>
          <p className="mute">Sign in to chat with your AI photo-editing assistant.</p>
          <SignInButton mode="modal"><button className="go">Sign in to use AI</button></SignInButton>
        </div>
      )}
    </section>
  );
}
