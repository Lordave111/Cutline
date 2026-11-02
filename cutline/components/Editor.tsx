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
};
type NumKey = "scale" | "offX" | "offY" | "shadow" | "bgBlur" | "brightness" | "contrast" | "saturation" | "quality" | "captionSize" | "captionY" | "vignette";

const DEFAULTS: S = {
  aspect: "orig", scale: 100, offX: 0, offY: 0, shadow: 0, bgBlur: 0,
  brightness: 100, contrast: 100, saturation: 100, rotate: 0, flip: false,
  format: "png", quality: 0.92, maxSide: 0,
  caption: "", captionColor: "#ffffff", captionSize: 54, captionY: 82, vignette: 0,
};

async function render(c: HTMLCanvasElement, base: Blob, flat: boolean, bg: Bg, s: S) {
  const fg = await createImageBitmap(base);
  const bi = bg.kind === "image" ? await createImageBitmap(bg.image) : null; // load everything before drawing
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
    const g = x.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, bg.color); g.addColorStop(1, bg.color2);
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

  if (canFilter && (s.brightness !== 100 || s.contrast !== 100 || s.saturation !== 100)) {
    const t = document.createElement("canvas");
    t.width = c.width; t.height = c.height;
    t.getContext("2d")!.drawImage(c, 0, 0);
    x.clearRect(0, 0, c.width, c.height);
    x.filter = `brightness(${s.brightness}%) contrast(${s.contrast}%) saturate(${s.saturation}%)`;
    x.drawImage(t, 0, 0);
    x.filter = "none";
  }
  if (s.vignette > 0) {
    const g = x.createRadialGradient(c.width / 2, c.height / 2, c.width * 0.18, c.width / 2, c.height / 2, c.width * 0.72);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(0,0,0," + (s.vignette / 100) + ")");
    x.fillStyle = g;
    x.fillRect(0, 0, c.width, c.height);
  }
  if (s.caption.trim()) {
    x.save();
    x.textAlign = "center";
    x.textBaseline = "middle";
    x.font = "800 " + s.captionSize + "px system-ui, sans-serif";
    x.lineJoin = "round";
    x.shadowColor = "rgba(0,0,0,.65)";
    x.shadowBlur = Math.max(3, s.captionSize * 0.12);
    x.strokeStyle = "rgba(0,0,0,.55)";
    x.lineWidth = Math.max(2, s.captionSize * 0.06);
    const label = s.caption.slice(0, 90);
    x.strokeText(label, c.width / 2, c.height * s.captionY / 100, c.width * 0.88);
    x.fillStyle = s.captionColor;
    x.fillText(label, c.width / 2, c.height * s.captionY / 100, c.width * 0.88);
    x.restore();
  }
}

async function exportImage(c: HTMLCanvasElement, s: S): Promise<Blob> {
  const k = s.maxSide ? Math.min(1, s.maxSide / Math.max(c.width, c.height)) : 1;
  const o = document.createElement("canvas");
  o.width = Math.round(c.width * k); o.height = Math.round(c.height * k);
  const x = o.getContext("2d")!;
  if (s.format !== "png") { x.fillStyle = "#fff"; x.fillRect(0, 0, o.width, o.height); } // JPEG/WebP-safe white behind transparency
  x.drawImage(c, 0, 0, o.width, o.height);
  return new Promise((r) => o.toBlob((b) => r(b!), `image/${s.format}`, s.quality));
}

export default function Editor({ base, flat, bg }: { base: Blob; flat: boolean; bg: Bg }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [s, setS] = useState<S>(DEFAULTS);
  const set = (k: keyof S, v: string | number | boolean) => setS((p) => ({ ...p, [k]: v }));

  useEffect(() => { if (ref.current) render(ref.current, base, flat, bg, s); }, [base, flat, bg, s]);

  async function download() {
    const blob = await exportImage(ref.current!, s);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `cutline.${s.format === "jpeg" ? "jpg" : s.format}`;
    a.click();
  }

  const Range = ({ label, k, min, max, step = 1 }: { label: string; k: NumKey; min: number; max: number; step?: number }) => (
    <label className="rng">
      <span>{label} <b>{s[k]}</b></span>
      <input type="range" min={min} max={max} step={step} value={s[k]} onChange={(e) => set(k, Number(e.target.value))} />
    </label>
  );

  return (
    <div className="editor">
      <div className="checker"><canvas ref={ref} /></div>
      <div className="ctrls">
        <details open>
          <summary>Frame</summary>
          <div className="chips">
            {["orig", "1:1", "4:5", "16:9", "9:16"].map((a) => (
              <button key={a} className={s.aspect === a ? "on" : ""} onClick={() => set("aspect", a)}>{a === "orig" ? "Original" : a}</button>
            ))}
          </div>
          <div className="chips">
            <button onClick={() => set("rotate", (s.rotate + 90) % 360)}>Rotate 90°</button>
            <button className={s.flip ? "on" : ""} onClick={() => set("flip", !s.flip)}>Flip</button>
          </div>
        </details>
        {!flat && (
          <details open>
            <summary>Subject</summary>
            <Range label="Size" k="scale" min={40} max={160} />
            <Range label="Left / right" k="offX" min={-50} max={50} />
            <Range label="Up / down" k="offY" min={-50} max={50} />
            <Range label="Shadow" k="shadow" min={0} max={100} />
          </details>
        )}
        {bg.kind === "image" && (
          <details open><summary>Background</summary><Range label="Blur" k="bgBlur" min={0} max={30} /></details>
        )}
        <details>
          <summary>Quick looks</summary>
          <div className="chips">
            <button onClick={() => setS((p) => ({ ...p, brightness: 100, contrast: 100, saturation: 100 }))}>Original</button>
            <button onClick={() => setS((p) => ({ ...p, brightness: 104, contrast: 112, saturation: 138 }))}>Vivid</button>
            <button onClick={() => setS((p) => ({ ...p, brightness: 103, contrast: 118, saturation: 0 }))}>B&amp;W</button>
            <button onClick={() => setS((p) => ({ ...p, brightness: 105, contrast: 105, saturation: 118 }))}>Warm</button>
            <button onClick={() => setS((p) => ({ ...p, brightness: 98, contrast: 108, saturation: 112 }))}>Cool</button>
          </div>
        </details>
        <details>
          <summary>Look</summary>
          <Range label="Brightness" k="brightness" min={50} max={150} />
          <Range label="Contrast" k="contrast" min={50} max={150} />
          <Range label="Saturation" k="saturation" min={0} max={200} />
          <Range label="Vignette" k="vignette" min={0} max={85} />
        </details>
        <details>
          <summary>Text overlay</summary>
          <input aria-label="Overlay text" placeholder="Add a title or caption…" maxLength={90} value={s.caption} onChange={(e) => set("caption", e.target.value)} />
          <div className="chips">
            <label className="rng">Text color <input aria-label="Text color" type="color" value={s.captionColor} onChange={(e) => set("captionColor", e.target.value)} /></label>
          </div>
          <Range label="Text size" k="captionSize" min={18} max={120} />
          <Range label="Vertical position" k="captionY" min={5} max={95} />
        </details>
        <details>
          <summary>Export</summary>
          <select aria-label="Format" value={s.format} onChange={(e) => set("format", e.target.value)}>
            <option value="png">PNG (transparent)</option><option value="jpeg">JPG</option><option value="webp">WebP</option>
          </select>
          <select aria-label="Size" value={s.maxSide} onChange={(e) => set("maxSide", Number(e.target.value))}>
            <option value={0}>Full size</option><option value={2048}>Up to 2048 px</option><option value={1080}>Up to 1080 px</option>
          </select>
          {s.format !== "png" && <Range label="Quality" k="quality" min={0.5} max={1} step={0.01} />}
        </details>
        <button className="go" onClick={download}>Download</button>
        <button className="chip" onClick={() => setS(DEFAULTS)}>Reset edits</button>
      </div>
    </div>
  );
}
