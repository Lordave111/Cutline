"use client";
import { useEffect, useRef, useState } from "react";

export type Bg =
  | { kind: "none" }
  | { kind: "color"; color: string }
  | { kind: "gradient"; color: string; color2: string }
  | { kind: "image"; image: File };

type S = {
  aspect: string; scale: number; offX: number; offY: number; shadow: number; bgBlur: number;
  brightness: number; contrast: number; saturation: number; rotate: number; flip: boolean;
  format: string; quality: number; maxSide: number;
  caption: string; captionColor: string; captionSize: number; captionY: number; vignette: number;
  warmth: number; tint: number; fade: number; blur: number;
};
type NumKey = "scale" | "offX" | "offY" | "shadow" | "bgBlur" | "brightness" | "contrast" | "saturation" | "quality" | "captionSize" | "captionY" | "vignette" | "warmth" | "tint" | "fade" | "blur";

const DEFAULTS: S = {
  aspect: "orig", scale: 100, offX: 0, offY: 0, shadow: 0, bgBlur: 0,
  brightness: 100, contrast: 100, saturation: 100, rotate: 0, flip: false,
  format: "png", quality: 0.92, maxSide: 0,
  caption: "", captionColor: "#ffffff", captionSize: 54, captionY: 82, vignette: 0,
  warmth: 0, tint: 0, fade: 0, blur: 0,
};

const PRESETS: { name: string; note: string; swatch: string; values: Partial<S> }[] = [
  { name: "Product clean", note: "Bright, crisp product shots", swatch: "linear-gradient(135deg,#e9e5da,#b8c9c5)", values: { brightness: 108, contrast: 112, saturation: 108, warmth: 4, vignette: 8 } },
  { name: "Portrait glow", note: "Soft warm skin tones", swatch: "linear-gradient(135deg,#f4c9a5,#9b6e66)", values: { brightness: 106, contrast: 105, saturation: 112, warmth: 24, fade: 5, vignette: 12 } },
  { name: "Cinematic", note: "Moody film-inspired colour", swatch: "linear-gradient(135deg,#173c45,#d58a55)", values: { brightness: 94, contrast: 125, saturation: 118, warmth: 14, tint: -8, vignette: 38, fade: 4 } },
  { name: "Matte film", note: "Muted editorial finish", swatch: "linear-gradient(135deg,#b7b4a1,#596b68)", values: { brightness: 103, contrast: 88, saturation: 72, warmth: 8, fade: 18, vignette: 10 } },
  { name: "Monochrome", note: "Classic black and white", swatch: "linear-gradient(135deg,#f4f4f4,#252525)", values: { brightness: 104, contrast: 125, saturation: 0, vignette: 18 } },
  { name: "Vibrant", note: "Punchy social-ready colour", swatch: "linear-gradient(135deg,#ffbf59,#8e57e8)", values: { brightness: 105, contrast: 118, saturation: 155, warmth: 5, vignette: 6 } },
];

async function render(c: HTMLCanvasElement, base: Blob, flat: boolean, bg: Bg, s: S) {
  const fg = await createImageBitmap(base);
  const bi = bg.kind === "image" ? await createImageBitmap(bg.image) : null;
  let W = fg.width, H = fg.height;
  if (s.aspect !== "orig") {
    const [a, b] = s.aspect.split(":").map(Number);
    const long = Math.max(fg.width, fg.height);
    if (a >= b) { W = long; H = Math.round((long * b) / a); } else { H = long; W = Math.round((long * a) / b); }
  }
  const turn = s.rotate % 180 !== 0;
  c.width = turn ? H : W; c.height = turn ? W : H;
  const x = c.getContext("2d")!;
  const canFilter = "filter" in x;
  x.save();
  x.translate(c.width / 2, c.height / 2);
  x.rotate((s.rotate * Math.PI) / 180);
  if (s.flip) x.scale(-1, 1);
  x.translate(-W / 2, -H / 2);
  const cover = (img: ImageBitmap, grow = 0) => {
    const k = Math.max(W / img.width, H / img.height);
    const w = img.width * k + grow * 2, h = img.height * k + grow * 2;
    x.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
  };
  if (bg.kind === "color") { x.fillStyle = bg.color; x.fillRect(0, 0, W, H); }
  if (bg.kind === "gradient") {
    const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, bg.color); g.addColorStop(1, bg.color2);
    x.fillStyle = g; x.fillRect(0, 0, W, H);
  }
  if (bi) { if (canFilter) x.filter = `blur(${s.bgBlur}px)`; cover(bi, s.bgBlur * 2); x.filter = "none"; }
  if (flat) cover(fg);
  else {
    const k = Math.min(W / fg.width, H / fg.height) * (s.scale / 100);
    const w = fg.width * k, h = fg.height * k;
    if (s.shadow) { x.shadowColor = "rgba(0,0,0,.5)"; x.shadowBlur = (s.shadow * W) / 500; x.shadowOffsetY = (s.shadow * W) / 1500; }
    x.drawImage(fg, (W - w) / 2 + (s.offX / 100) * W, (H - h) / 2 + (s.offY / 100) * H, w, h);
  }
  x.restore();

  if (canFilter && (s.brightness !== 100 || s.contrast !== 100 || s.saturation !== 100 || s.warmth || s.tint || s.blur)) {
    const t = document.createElement("canvas"); t.width = c.width; t.height = c.height;
    t.getContext("2d")!.drawImage(c, 0, 0);
    x.clearRect(0, 0, c.width, c.height);
    x.filter = `brightness(${s.brightness}%) contrast(${s.contrast}%) saturate(${s.saturation}%) sepia(${Math.max(0, s.warmth) / 100}) hue-rotate(${s.tint * 1.2 + Math.min(0, s.warmth) * 0.8}deg) blur(${s.blur}px)`;
    x.drawImage(t, 0, 0); x.filter = "none";
  }
  if (s.fade > 0) { x.fillStyle = `rgba(235,225,205,${s.fade / 250})`; x.fillRect(0, 0, c.width, c.height); }
  if (s.vignette > 0) {
    const g = x.createRadialGradient(c.width / 2, c.height / 2, c.width * 0.18, c.width / 2, c.height / 2, c.width * 0.72);
    g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0," + (s.vignette / 100) + ")");
    x.fillStyle = g; x.fillRect(0, 0, c.width, c.height);
  }
  if (s.caption.trim()) {
    x.save(); x.textAlign = "center"; x.textBaseline = "middle";
    x.font = "800 " + s.captionSize + "px system-ui, sans-serif"; x.lineJoin = "round";
    x.shadowColor = "rgba(0,0,0,.65)"; x.shadowBlur = Math.max(3, s.captionSize * 0.12);
    x.strokeStyle = "rgba(0,0,0,.55)"; x.lineWidth = Math.max(2, s.captionSize * 0.06);
    const label = s.caption.slice(0, 90);
    x.strokeText(label, c.width / 2, c.height * s.captionY / 100, c.width * 0.88);
    x.fillStyle = s.captionColor; x.fillText(label, c.width / 2, c.height * s.captionY / 100, c.width * 0.88);
    x.restore();
  }
}

async function exportImage(c: HTMLCanvasElement, s: S): Promise<Blob> {
  const k = s.maxSide ? Math.min(1, s.maxSide / Math.max(c.width, c.height)) : 1;
  const o = document.createElement("canvas"); o.width = Math.round(c.width * k); o.height = Math.round(c.height * k);
  const x = o.getContext("2d")!;
  if (s.format !== "png") { x.fillStyle = "#fff"; x.fillRect(0, 0, o.width, o.height); }
  x.drawImage(c, 0, 0, o.width, o.height);
  return new Promise((r) => o.toBlob((b) => r(b!), `image/${s.format}`, s.quality));
}

export default function Editor({ base, flat, bg }: { base: Blob; flat: boolean; bg: Bg }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [s, setS] = useState<S>(DEFAULTS);
  const [history, setHistory] = useState<S[]>([]);
  const [future, setFuture] = useState<S[]>([]);
  const [showOriginal, setShowOriginal] = useState(false);
  const [sourceBlob, setSourceBlob] = useState<Blob>(base);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState("");
  const set = (k: keyof S, v: string | number | boolean) => { setHistory((h) => [...h.slice(-19), s]); setFuture([]); setS((p) => ({ ...p, [k]: v })); };
  const applyPreset = (values: Partial<S>) => { setHistory((h) => [...h.slice(-19), s]); setFuture([]); setS((p) => ({ ...p, ...values })); };
  const undo = () => { const previous = history[history.length - 1]; if (!previous) return; setFuture((f) => [s, ...f].slice(0, 20)); setS(previous); setHistory((h) => h.slice(0, -1)); };
  const redo = () => { const next = future[0]; if (!next) return; setHistory((h) => [...h, s].slice(-20)); setS(next); setFuture((f) => f.slice(1)); };

  useEffect(() => {
    if (!ref.current) return;
    if (showOriginal) { void render(ref.current, base, flat, { kind: "none" }, DEFAULTS); }
    else { void render(ref.current, sourceBlob, true, { kind: "none" }, s); }
  }, [base, sourceBlob, flat, bg, s, showOriginal]);

  async function download() {
    if (!ref.current) return;
    const blob = await exportImage(ref.current, showOriginal ? DEFAULTS : s);
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `cutline.${s.format === "jpeg" ? "jpg" : s.format}`; a.click();
    URL.revokeObjectURL(a.href);
  }


  async function runAiEdit() {
    if (!ref.current || !aiPrompt.trim() || aiBusy) return;
    setAiBusy(true); setAiError("");
    try {
      const imageBlob = await new Promise<Blob>((resolve, reject) => ref.current!.toBlob((b) => b ? resolve(b) : reject(new Error("Could not prepare image.")), "image/png"));
      if (imageBlob.size > 5 * 1024 * 1024) throw new Error("This image is over 5 MB. Reduce its size in Export settings, then try again.");
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error("Could not read image."));
        reader.readAsDataURL(imageBlob);
      });
      const response = await fetch("/api/image-edit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ imageData: dataUrl.split(",")[1], mimeType: "image/png", prompt: aiPrompt.trim() }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "AI editing failed. Please try again.");
      const edited = await fetch(data.image).then((r) => r.blob());
      setSourceBlob(edited); setS(DEFAULTS); setHistory([]); setFuture([]); setShowOriginal(false); setAiPrompt("");
    } catch (error) { setAiError(error instanceof Error ? error.message : "AI editing failed. Please try again."); }
    finally { setAiBusy(false); }
  }

  const Range = ({ label, k, min, max, step = 1 }: { label: string; k: NumKey; min: number; max: number; step?: number }) => (
    <label className="rng"><span>{label} <b>{s[k]}</b></span>
      <input type="range" min={min} max={max} step={step} value={s[k]} onChange={(e) => set(k, Number(e.target.value))} />
    </label>
  );

  return (
    <div className="editor">
      <div className="editor-stage">
        <div className="editor-stage-head"><span>{showOriginal ? "ORIGINAL PREVIEW" : "LIVE CANVAS"}</span><div><button type="button" className="chip" onClick={undo} disabled={!history.length}>↶ Undo</button><button type="button" className="chip" onClick={redo} disabled={!future.length}>↷ Redo</button><button type="button" className="chip" onClick={() => setShowOriginal((v) => !v)}>{showOriginal ? "Show edit" : "Before"}</button></div></div>
        <div className="checker"><canvas ref={ref} /></div>
        <p className="editor-hint">Changes preview live. Export when your image is ready.</p>
      </div>
      <div className="ctrls">
        <details open><summary>AI image editor</summary>
          <p className="editor-hint">Describe what to add, remove or change. AI returns a new image you can continue editing.</p>
          <textarea aria-label="AI image edit prompt" rows={3} maxLength={700} placeholder="e.g. Remove the clutter in the background and replace it with a clean warm studio backdrop. Keep the subject unchanged." value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} />
          <button className="go" type="button" disabled={aiBusy || !aiPrompt.trim()} onClick={() => void runAiEdit()}>{aiBusy ? "AI is editing…" : "Apply AI edit ✨"}</button>
          {aiError && <p role="alert" className="editor-error">{aiError}</p>}
          <small>AI image edits use your Gemini API key and may incur Google API charges.</small>
        </details>
        <details open><summary>Creative samples &amp; looks</summary>
          <div className="sample-grid">{PRESETS.map((p) => <button type="button" className="sample-card" key={p.name} onClick={() => applyPreset(p.values)}><i style={{ background: p.swatch }} /><b>{p.name}</b><small>{p.note}</small></button>)}</div>
        </details>
        <details open><summary>Frame &amp; transform</summary>
          <div className="chips">{["orig", "1:1", "4:5", "16:9", "9:16"].map((a) => <button type="button" key={a} className={s.aspect === a ? "on" : ""} onClick={() => set("aspect", a)}>{a === "orig" ? "Original" : a}</button>)}</div>
          <div className="chips"><button type="button" onClick={() => set("rotate", (s.rotate + 90) % 360)}>Rotate 90°</button><button type="button" className={s.flip ? "on" : ""} onClick={() => set("flip", !s.flip)}>Flip</button></div>
        </details>
        {!flat && <details open><summary>Subject positioning</summary><Range label="Scale" k="scale" min={40} max={160} /><Range label="Horizontal position" k="offX" min={-50} max={50} /><Range label="Vertical position" k="offY" min={-50} max={50} /><Range label="Drop shadow" k="shadow" min={0} max={100} /></details>}
        {bg.kind === "image" && <details open><summary>Background controls</summary><Range label="Background blur" k="bgBlur" min={0} max={30} /></details>}
        <details open><summary>Light &amp; colour</summary><Range label="Exposure / brightness" k="brightness" min={50} max={150} /><Range label="Contrast" k="contrast" min={50} max={160} /><Range label="Saturation" k="saturation" min={0} max={200} /><Range label="Warmth" k="warmth" min={-50} max={100} /><Range label="Tint" k="tint" min={-60} max={60} /><Range label="Fade" k="fade" min={0} max={60} /><Range label="Soft focus" k="blur" min={0} max={5} step={0.5} /><Range label="Vignette" k="vignette" min={0} max={85} /></details>
        <details><summary>Text &amp; watermark</summary><input aria-label="Overlay text" placeholder="Add a title, label or watermark…" maxLength={90} value={s.caption} onChange={(e) => set("caption", e.target.value)} /><div className="chips"><label className="rng">Text colour <input aria-label="Text colour" type="color" value={s.captionColor} onChange={(e) => set("captionColor", e.target.value)} /></label></div><Range label="Text size" k="captionSize" min={18} max={120} /><Range label="Vertical position" k="captionY" min={5} max={95} /></details>
        <details><summary>Export settings</summary><select aria-label="Format" value={s.format} onChange={(e) => set("format", e.target.value)}><option value="png">PNG (transparent)</option><option value="jpeg">JPG</option><option value="webp">WebP</option></select><select aria-label="Size" value={s.maxSide} onChange={(e) => set("maxSide", Number(e.target.value))}><option value={0}>Full size</option><option value={4096}>Up to 4096 px</option><option value={2048}>Up to 2048 px</option><option value={1080}>Up to 1080 px</option></select>{s.format !== "png" && <Range label="Quality" k="quality" min={0.5} max={1} step={0.01} />}</details>
        <button className="go" type="button" onClick={() => void download()}>Export image ↗</button>
        <button className="chip" type="button" onClick={() => { setHistory((h) => [...h.slice(-19), s]); setFuture([]); setS(DEFAULTS); }}>Reset all edits</button>
      </div>
    </div>
  );
}
