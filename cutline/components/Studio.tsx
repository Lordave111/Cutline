"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { SignInButton, useAuth } from "@clerk/nextjs";
import { COST, CURRENCY, PACKS } from "@/lib/pricing";
import Editor, { type Bg } from "./Editor";
import Assistant from "./Assistant";

const MAX_SIDE = 1800;
type Mode = "cutout" | "color" | "gradient" | "image" | "ai";
const MODES: [Mode, string][] = [["cutout", "Transparent"], ["color", "Color"], ["gradient", "Gradient"], ["image", "My image"], ["ai", "AI prompt"]];

async function shrink(file: File): Promise<File> {
  const bmp = await createImageBitmap(file);
  const s = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s);
  const x = c.getContext("2d")!;
  x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height);
  x.drawImage(bmp, 0, 0, c.width, c.height);
  const blob = await new Promise<Blob>((r) => c.toBlob((b) => r(b!), "image/jpeg", 0.88));
  return new File([blob], "photo.jpg", { type: "image/jpeg" });
}

async function call(url: string, body: FormData, onLeft: (n: number) => void): Promise<Blob> {
  const r = await fetch(url, { method: "POST", body });
  if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(j.error || "Request failed. Try a smaller image."); }
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
  const [prompt, setPrompt] = useState("");
  const [cutBlob, setCutBlob] = useState<Blob | null>(null);
  const [flatBlob, setFlatBlob] = useState<Blob | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [credits, setCredits] = useState<number | null>(null);
  const cutSrc = useRef<File | null>(null);

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
    setError("");
    const r = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pack }) });
    const j = await r.json().catch(() => ({}));
    if (r.ok && j.url) location.href = j.url; else setError(j.error || "Could not start checkout.");
  }

  async function pick(f?: File) {
    if (!f) return;
    setError(""); setCutBlob(null); setFlatBlob(null); cutSrc.current = null;
    try { const s = await shrink(f); setFile(s); setPreview(URL.createObjectURL(s)); }
    catch { setError("Could not read that image."); }
  }

  async function run() {
    if (!file) return;
    setBusy(true); setError("");
    try {
      const f = new FormData(); f.append("image", file);
      if (mode === "ai") { f.append("prompt", prompt); setFlatBlob(await call("/api/background", f, setCredits)); }
      else { setCutBlob(await call("/api/cutout", f, setCredits)); cutSrc.current = file; }
    } catch (e) { setError(e instanceof Error ? e.message : "Something went wrong."); }
    finally { setBusy(false); }
  }

  const bg: Bg = useMemo(() => {
    if (mode === "color") return { kind: "color", color };
    if (mode === "gradient") return { kind: "gradient", color, color2 };
    if (mode === "image" && bgFile) return { kind: "image", image: bgFile };
    return { kind: "none" };
  }, [mode, color, color2, bgFile]);

  const base = mode === "ai" ? flatBlob : cutBlob;
  const ready = mode !== "ai" && !!cutBlob && cutSrc.current === file; // cut-out done: switching backgrounds is free and instant

  return (
    <section className="studio" id="studio">
      <div className="bar">
        {isSignedIn ? (
          <>
            <span>CREDITS <b>{credits ?? "…"}</b></span>
            <span className="mute">Cut-out {COST.cutout} · AI background {COST.ai} · editing is free</span>
          </>
        ) : (
          <SignInButton mode="modal"><button className="go">Sign in for free credits</button></SignInButton>
        )}
      </div>
      {isSignedIn && (
        <div className="packs">
          {Object.entries(PACKS).map(([id, p]) => (
            <button key={id} onClick={() => buy(id)}>
              <b>{p.label}</b><span>{p.credits} credits</span><span>{CURRENCY === "NGN" ? "₦" : "$"}{p.price[CURRENCY].toLocaleString()}</span>
            </button>
          ))}
        </div>
      )}

      <label className="drop">
        <input type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files?.[0])} />
        {file ? "Change photo" : "Drop a photo or tap to upload"}
      </label>

      <div className="tabs" role="tablist">
        {MODES.map(([m, label]) => (
          <button key={m} role="tab" aria-selected={mode === m} className={mode === m ? "on" : ""} onClick={() => setMode(m)}>{label}</button>
        ))}
      </div>

      {(mode === "color" || mode === "gradient") && (
        <div className="chips">
          <input aria-label="Color" type="color" value={color} onChange={(e) => setColor(e.target.value)} />
          {mode === "gradient" && <input aria-label="Second color" type="color" value={color2} onChange={(e) => setColor2(e.target.value)} />}
        </div>
      )}
      {mode === "image" && <input aria-label="Background image" type="file" accept="image/*" onChange={(e) => setBgFile(e.target.files?.[0] ?? null)} />}
      {mode === "ai" && <input aria-label="Describe the background" placeholder="e.g. sunlit marble kitchen counter" maxLength={200} value={prompt} onChange={(e) => setPrompt(e.target.value)} />}

      <button className="go" onClick={run} disabled={!file || busy || !isSignedIn || ready}>
        {busy ? "Processing…" : mode === "ai" ? `Generate background (${COST.ai} credits)` : ready ? "Cut-out ready: edit below" : `Remove background (${COST.cutout} credit)`}
      </button>
      {error && <p className="err" role="alert">{error}</p>}

      {preview && !base && <figure><figcaption>INPUT</figcaption><img src={preview} alt="Original" /></figure>}
      {base && <Editor base={base} flat={mode === "ai"} bg={bg} />}
      <Assistant />
    </section>
  );
}
