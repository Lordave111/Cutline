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
  cropLeft: number; cropTop: number; cropWidth: number; cropHeight: number;
  hue: number; grain: number; grayscale: number; sepia: number; invert: number;
  borderWidth: number; borderColor: string; flipY: boolean;
};
type MaskStroke = { points: { x: number; y: number }[]; size: number };
type PaintStroke = { points: { x: number; y: number }[]; size: number; color: string; hardness?: number };
type Selection = { kind: "rect" | "lasso"; points: { x: number; y: number }[] };
type DesignLayer = { id: string; name: string; kind: "text" | "shape" | "image"; text: string; color: string; x: number; y: number; size: number; opacity: number; visible: boolean; shape: "rect" | "circle"; src?: string; width?: number; height?: number; locked?: boolean };
type NumKey = "scale" | "rotate" | "offX" | "offY" | "shadow" | "bgBlur" | "brightness" | "contrast" | "saturation" | "quality" | "captionSize" | "captionY" | "vignette" | "warmth" | "tint" | "fade" | "blur" | "cropLeft" | "cropTop" | "cropWidth" | "cropHeight" | "hue" | "grain" | "grayscale" | "sepia" | "invert" | "borderWidth";

const DEFAULTS: S = {
  aspect: "orig", scale: 100, offX: 0, offY: 0, shadow: 0, bgBlur: 0,
  brightness: 100, contrast: 100, saturation: 100, rotate: 0, flip: false,
  format: "png", quality: 0.92, maxSide: 0,
  caption: "", captionColor: "#ffffff", captionSize: 54, captionY: 82, vignette: 0,
  warmth: 0, tint: 0, fade: 0, blur: 0,
  cropLeft: 0, cropTop: 0, cropWidth: 100, cropHeight: 100,
  hue: 0, grain: 0, grayscale: 0, sepia: 0, invert: 0,
  borderWidth: 0, borderColor: "#ffffff", flipY: false,
};

const PRESETS: { name: string; note: string; swatch: string; values: Partial<S> }[] = [
  { name: "Product clean", note: "Bright, crisp product shots", swatch: "linear-gradient(135deg,#e9e5da,#b8c9c5)", values: { brightness: 108, contrast: 112, saturation: 108, warmth: 4, vignette: 8 } },
  { name: "Portrait glow", note: "Soft warm skin tones", swatch: "linear-gradient(135deg,#f4c9a5,#9b6e66)", values: { brightness: 106, contrast: 105, saturation: 112, warmth: 24, fade: 5, vignette: 12 } },
  { name: "Cinematic", note: "Moody film-inspired colour", swatch: "linear-gradient(135deg,#173c45,#d58a55)", values: { brightness: 94, contrast: 125, saturation: 118, warmth: 14, tint: -8, vignette: 38, fade: 4 } },
  { name: "Matte film", note: "Muted editorial finish", swatch: "linear-gradient(135deg,#b7b4a1,#596b68)", values: { brightness: 103, contrast: 88, saturation: 72, warmth: 8, fade: 18, vignette: 10 } },
  { name: "Monochrome", note: "Classic black and white", swatch: "linear-gradient(135deg,#f4f4f4,#252525)", values: { brightness: 104, contrast: 125, saturation: 0, vignette: 18 } },
  { name: "Vibrant", note: "Punchy social-ready colour", swatch: "linear-gradient(135deg,#ffbf59,#8e57e8)", values: { brightness: 105, contrast: 118, saturation: 155, warmth: 5, vignette: 6 } },
  { name: "Golden hour", note: "Warm sunlit highlights", swatch: "linear-gradient(135deg,#f7c978,#a95d39)", values: { brightness: 108, contrast: 108, saturation: 118, warmth: 42, tint: 5, fade: 3 } },
  { name: "Arctic", note: "Cool crisp editorial tones", swatch: "linear-gradient(135deg,#d6e8ed,#587e9d)", values: { brightness: 106, contrast: 116, saturation: 92, warmth: -24, tint: 8, vignette: 10 } },
  { name: "Rose", note: "Soft rosy colour grade", swatch: "linear-gradient(135deg,#f2b9c5,#76506d)", values: { brightness: 105, contrast: 104, saturation: 112, warmth: 12, tint: 22, fade: 7 } },
  { name: "Noir", note: "Deep dramatic monochrome", swatch: "linear-gradient(135deg,#bfc2c6,#15171d)", values: { brightness: 96, contrast: 145, saturation: 0, grayscale: 100, vignette: 32 } },
  { name: "Dream", note: "Airy pastel softness", swatch: "linear-gradient(135deg,#f4d8e8,#9abed1)", values: { brightness: 114, contrast: 88, saturation: 105, warmth: 12, fade: 16, blur: 0.5 } },
  { name: "Emerald", note: "Rich cinematic greens", swatch: "linear-gradient(135deg,#9fc8a7,#163d38)", values: { brightness: 98, contrast: 124, saturation: 126, tint: -14, warmth: -8, vignette: 22 } },
  { name: "Mocha", note: "Understated warm luxury", swatch: "linear-gradient(135deg,#d7b99a,#4e3932)", values: { brightness: 101, contrast: 112, saturation: 82, warmth: 28, sepia: 12, vignette: 16 } },
];

async function render(c: HTMLCanvasElement, base: Blob, flat: boolean, bg: Bg, s: S, layers: DesignLayer[] = [], maskStrokes: MaskStroke[] = [], paintStrokes: PaintStroke[] = [], cloneStrokes: { points: { x: number; y: number }[]; source: { x: number; y: number }; size: number; healing?: boolean }[] = []) {
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
  if (s.flipY) x.scale(1, -1);
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

  if (canFilter && (s.brightness !== 100 || s.contrast !== 100 || s.saturation !== 100 || s.warmth || s.tint || s.blur || s.hue || s.grayscale || s.sepia || s.invert)) {
    const t = document.createElement("canvas"); t.width = c.width; t.height = c.height;
    t.getContext("2d")!.drawImage(c, 0, 0);
    x.clearRect(0, 0, c.width, c.height);
    x.filter = `brightness(${s.brightness}%) contrast(${s.contrast}%) saturate(${s.saturation}%) sepia(${Math.max(0, s.warmth) / 100 + s.sepia / 100}) hue-rotate(${s.hue + s.tint * 1.2 + Math.min(0, s.warmth) * 0.8}deg) grayscale(${s.grayscale}%) invert(${s.invert}%) blur(${s.blur}px)`;
    x.drawImage(t, 0, 0); x.filter = "none";
  }
  if (s.fade > 0) { x.fillStyle = `rgba(235,225,205,${s.fade / 250})`; x.fillRect(0, 0, c.width, c.height); }
  if (s.vignette > 0) {
    const g = x.createRadialGradient(c.width / 2, c.height / 2, c.width * 0.18, c.width / 2, c.height / 2, c.width * 0.72);
    g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0," + (s.vignette / 100) + ")");
    x.fillStyle = g; x.fillRect(0, 0, c.width, c.height);
  }
  if (s.grain > 0) {
    const noise = document.createElement("canvas"); noise.width = Math.max(64, Math.min(256, c.width)); noise.height = Math.max(64, Math.min(256, c.height));
    const nx = noise.getContext("2d")!; const pixels = nx.createImageData(noise.width, noise.height);
    for (let i = 0; i < pixels.data.length; i += 4) { const n = Math.random() * 255; pixels.data[i] = n; pixels.data[i + 1] = n; pixels.data[i + 2] = n; pixels.data[i + 3] = Math.round(s.grain * 1.4); }
    nx.putImageData(pixels, 0, 0); x.save(); x.globalCompositeOperation = "soft-light"; x.drawImage(noise, 0, 0, c.width, c.height); x.restore();
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


  if (cloneStrokes.length) {
    const sample = document.createElement("canvas"); sample.width = c.width; sample.height = c.height;
    sample.getContext("2d")!.drawImage(c, 0, 0);
    const clone = c.getContext("2d")!;
    for (const stroke of cloneStrokes) {
      const radius = Math.max(2, stroke.size / 2);
      for (const p of stroke.points) {
        const dx = p.x * c.width, dy = p.y * c.height;
        const ox = stroke.source.x * c.width + (p.x - stroke.points[0].x) * c.width;
        const oy = stroke.source.y * c.height + (p.y - stroke.points[0].y) * c.height;
        clone.save();
        if (stroke.healing) {
          const patch = document.createElement("canvas"); patch.width = Math.max(2, Math.ceil(radius * 2)); patch.height = patch.width;
          const px = patch.getContext("2d")!;
          px.filter = "blur(1.2px)";
          px.drawImage(sample, ox - radius, oy - radius, radius * 2, radius * 2, 0, 0, patch.width, patch.height);
          px.filter = "none";
          const feather = document.createElement("canvas"); feather.width = patch.width; feather.height = patch.height;
          const fx = feather.getContext("2d")!;
          const gradient = fx.createRadialGradient(radius, radius, radius * 0.48, radius, radius, radius);
          gradient.addColorStop(0, "rgba(255,255,255,1)");
          gradient.addColorStop(0.78, "rgba(255,255,255,.92)");
          gradient.addColorStop(1, "rgba(255,255,255,0)");
          fx.fillStyle = gradient; fx.fillRect(0, 0, feather.width, feather.height);
          px.globalCompositeOperation = "destination-in"; px.drawImage(feather, 0, 0);
          clone.drawImage(patch, dx - radius, dy - radius);
        } else {
          clone.beginPath(); clone.arc(dx, dy, radius, 0, Math.PI * 2); clone.clip();
          clone.drawImage(sample, ox - radius, oy - radius, radius * 2, radius * 2, dx - radius, dy - radius, radius * 2, radius * 2);
        }
        clone.restore();
      }
    }
  }
  if (paintStrokes.length) {
    x.save(); x.lineCap = "round"; x.lineJoin = "round";
    for (const stroke of paintStrokes) { if (!stroke.points.length) continue; x.save(); x.shadowColor = stroke.color; x.shadowBlur = stroke.size * (1 - (stroke.hardness ?? 1)) * 0.35; x.beginPath(); x.strokeStyle = stroke.color; x.lineWidth = stroke.size; x.moveTo(stroke.points[0].x * c.width, stroke.points[0].y * c.height); for (const point of stroke.points.slice(1)) x.lineTo(point.x * c.width, point.y * c.height); if (stroke.points.length === 1) { x.lineTo(stroke.points[0].x * c.width + .1, stroke.points[0].y * c.height + .1); } x.stroke(); x.restore(); }
    x.restore();
  }
  if (maskStrokes.length) {
    x.save(); x.globalCompositeOperation = "source-over"; x.strokeStyle = "rgba(124, 92, 255, 0.48)"; x.fillStyle = "rgba(124, 92, 255, 0.48)"; x.lineCap = "round"; x.lineJoin = "round";
    for (const stroke of maskStrokes) {
      if (!stroke.points.length) continue;
      x.lineWidth = stroke.size;
      x.beginPath(); x.moveTo(stroke.points[0].x * c.width, stroke.points[0].y * c.height);
      for (const point of stroke.points.slice(1)) x.lineTo(point.x * c.width, point.y * c.height);
      if (stroke.points.length === 1) { x.lineTo(stroke.points[0].x * c.width + .1, stroke.points[0].y * c.height + .1); }
      x.stroke();
    }
    x.restore();
  }
  for (const layer of layers) {
    if (!layer.visible) continue;
    x.save(); x.globalAlpha = Math.max(0, Math.min(1, layer.opacity / 100));
    if (layer.kind === "image" && layer.src) { try { const bitmap = await createImageBitmap(await (await fetch(layer.src)).blob()); const w = c.width * (layer.width ?? 30) / 100, h = w * bitmap.height / bitmap.width; x.drawImage(bitmap, c.width * layer.x / 100 - w / 2, c.height * layer.y / 100 - h / 2, w, h); bitmap.close(); } catch { /* skip an unavailable linked image */ } }
    else if (layer.kind === "text") { x.font = "800 " + layer.size + "px system-ui, sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillStyle = layer.color; x.fillText(layer.text.slice(0, 100), c.width * layer.x / 100, c.height * layer.y / 100, c.width * .9); }
    else { x.fillStyle = layer.color; const w = c.width * .22, h = c.height * .14, px = c.width * layer.x / 100, py = c.height * layer.y / 100; if (layer.shape === "circle") { x.beginPath(); x.ellipse(px, py, w / 2, h / 2, 0, 0, Math.PI * 2); x.fill(); } else x.fillRect(px - w / 2, py - h / 2, w, h); }
    x.restore();
  }
  if (s.cropLeft || s.cropTop || s.cropWidth < 100 || s.cropHeight < 100) {
    const left = Math.min(s.cropLeft, 100 - s.cropWidth), top = Math.min(s.cropTop, 100 - s.cropHeight);
    const sx = Math.round(c.width * left / 100), sy = Math.round(c.height * top / 100);
    const sw = Math.max(1, Math.round(c.width * s.cropWidth / 100)), sh = Math.max(1, Math.round(c.height * s.cropHeight / 100));
    const temp = document.createElement("canvas"); temp.width = sw; temp.height = sh;
    temp.getContext("2d")!.drawImage(c, sx, sy, sw, sh, 0, 0, sw, sh);
    c.width = sw; c.height = sh; c.getContext("2d")!.drawImage(temp, 0, 0);
  }
  if (s.borderWidth > 0) {
    const ctx = c.getContext("2d")!; const inset = s.borderWidth / 2;
    ctx.strokeStyle = s.borderColor; ctx.lineWidth = s.borderWidth;
    ctx.strokeRect(inset, inset, Math.max(0, c.width - s.borderWidth), Math.max(0, c.height - s.borderWidth));
  }
}

async function exportImage(c: HTMLCanvasElement, s: S): Promise<Blob> {
  const maxSide = Math.max(0, Number(s.maxSide) || 0);
  const k = maxSide ? Math.min(1, maxSide / Math.max(c.width, c.height)) : 1;
  const o = document.createElement("canvas");
  o.width = Math.max(1, Math.round(c.width * k)); o.height = Math.max(1, Math.round(c.height * k));
  const x = o.getContext("2d");
  if (!x) throw new Error("Could not prepare the export canvas.");
  const mime = s.format === "jpeg" ? "image/jpeg" : s.format === "webp" ? "image/webp" : "image/png";
  if (mime === "image/jpeg") { x.fillStyle = "#fff"; x.fillRect(0, 0, o.width, o.height); }
  x.imageSmoothingEnabled = true; x.imageSmoothingQuality = "high";
  x.drawImage(c, 0, 0, o.width, o.height);
  const blob = await new Promise<Blob | null>((resolve) => o.toBlob(resolve, mime, Math.max(.5, Math.min(1, s.quality))));
  if (!blob) throw new Error("Your browser could not create this image format. Try PNG instead.");
  return blob;
}

export default function Editor({ base, flat, bg }: { base: Blob; flat: boolean; bg: Bg }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const magicPreviewRef = useRef<HTMLCanvasElement>(null);
  const [s, setS] = useState<S>(DEFAULTS);
  const [templateSearch, setTemplateSearch] = useState("");
  const [exportFileName, setExportFileName] = useState("my-design");
  const [showAllTemplates, setShowAllTemplates] = useState(false);
  const [templateCategory, setTemplateCategory] = useState("All");
  const [favoriteTemplates, setFavoriteTemplates] = useState<string[]>([]);
  const [favoritesLoaded, setFavoritesLoaded] = useState(false);
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("cutline-template-favorites");
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (Array.isArray(parsed)) setFavoriteTemplates(parsed.filter((item): item is string => typeof item === "string"));
      }
    } catch { /* Ignore unavailable or invalid local preferences. */ }
    setFavoritesLoaded(true);
  }, []);
  useEffect(() => {
    if (!favoritesLoaded) return;
    try { window.localStorage.setItem("cutline-template-favorites", JSON.stringify(favoriteTemplates)); }
    catch { /* Favourites still work for this editing session if storage is unavailable. */ }
  }, [favoriteTemplates, favoritesLoaded]);
  const [editorBg, setEditorBg] = useState<Bg>(bg);
  const [history, setHistory] = useState<S[]>([]);
  const [future, setFuture] = useState<S[]>([]);
  const [showOriginal, setShowOriginal] = useState(false);
  const [sourceBlob, setSourceBlob] = useState<Blob>(base);
  const [hasAiResult, setHasAiResult] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiProgress, setAiProgress] = useState(0);
  const [aiStage, setAiStage] = useState("");
  const [exportBusy, setExportBusy] = useState(false);
  const [aiError, setAiError] = useState("");
  const [layers, setLayers] = useState<DesignLayer[]>([]);
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null);
  const [draggingLayer, setDraggingLayer] = useState(false);
  const [maskMode, setMaskMode] = useState(false);
  const [brushSize, setBrushSize] = useState(36);
  const [maskStrokes, setMaskStrokes] = useState<MaskStroke[]>([]);
  const [magicWandMode, setMagicWandMode] = useState(false);
  const [magicSeed, setMagicSeed] = useState<{ x: number; y: number } | null>(null);
  const [magicTolerance, setMagicTolerance] = useState(42);
  const maskDrawing = useRef(false);
  const [paintMode, setPaintMode] = useState(false);
  const [paintColor, setPaintColor] = useState("#70e9ba");
  const [brushHardness, setBrushHardness] = useState(100);
  const paintDrawing = useRef(false);
  const [paintStrokes, setPaintStrokes] = useState<PaintStroke[]>([]);
  const [selectionTool, setSelectionTool] = useState<"off" | "rect" | "lasso">("off");
  const [selection, setSelection] = useState<Selection | null>(null);
  const [pendingBackdrop, setPendingBackdrop] = useState<string | null>(null);
  const [edgeFeather, setEdgeFeather] = useState(3);
  const selectionDrawing = useRef(false);
  const [cloneMode, setCloneMode] = useState(false);
  const [healingMode, setHealingMode] = useState(false);
  const [cloneSource, setCloneSource] = useState<{ x: number; y: number } | null>(null);
  const [cloneStrokes, setCloneStrokes] = useState<{ points: { x: number; y: number }[]; source: { x: number; y: number }; size: number }[]>([]);
  const cloneDrawing = useRef(false);
  const [zoom, setZoom] = useState(100);
  const [projectNotice, setProjectNotice] = useState("");
  const projectInput = useRef<HTMLInputElement>(null);
  const imageLayerInput = useRef<HTMLInputElement>(null);
  const set = (k: keyof S, v: string | number | boolean) => { setHistory((h) => [...h.slice(-19), s]); setFuture([]); setS((p) => ({ ...p, [k]: v })); };
  const applyPreset = (values: Partial<S>) => { setHistory((h) => [...h.slice(-19), s]); setFuture([]); setS((p) => ({ ...p, ...values })); };
  const undo = () => { const previous = history[history.length - 1]; if (!previous) return; setFuture((f) => [s, ...f].slice(0, 20)); setS(previous); setHistory((h) => h.slice(0, -1)); };
  const redo = () => { const next = future[0]; if (!next) return; setHistory((h) => [...h, s].slice(-20)); setS(next); setFuture((f) => f.slice(1)); };

  // Keyboard shortcuts make the editor faster without hiding essential actions.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = !!target && (target.isContentEditable || /INPUT|TEXTAREA|SELECT/.test(target.tagName));
      if (typing) return;
      const mod = event.ctrlKey || event.metaKey;
      if (mod && event.key.toLowerCase() === "z") { event.preventDefault(); event.shiftKey ? redo() : undo(); }
      else if (mod && event.key.toLowerCase() === "y") { event.preventDefault(); redo(); }
      else if (mod && event.key.toLowerCase() === "s") { event.preventDefault(); void download(); }
      else if (event.key === "0") setZoom(100);
      else if (event.key === "+" || event.key === "=") setZoom((v) => Math.min(200, v + 10));
      else if (event.key === "-") setZoom((v) => Math.max(25, v - 10));
      else if (event.key === "Escape") { setMaskMode(false); setPaintMode(false); setMagicWandMode(false); setCloneMode(false); setHealingMode(false); setSelectionTool("off"); setSelectedLayer(null); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  useEffect(() => {
    setEditorBg(bg); setSourceBlob(base); setHasAiResult(false); setS(DEFAULTS); setHistory([]); setFuture([]); setShowOriginal(false); setLayers([]); setSelectedLayer(null); setMaskStrokes([]); setPaintStrokes([]); setSelection(null); setCloneStrokes([]);
  }, [base]);

  useEffect(() => {
    if (!ref.current) return;
    if (showOriginal) { void render(ref.current, base, flat, { kind: "none" }, DEFAULTS, [], [], [], []); }
    else if (hasAiResult) { void render(ref.current, sourceBlob, true, editorBg, s, layers, maskStrokes, paintStrokes, cloneStrokes); }
    else { void render(ref.current, base, flat, editorBg, s, layers, maskStrokes, paintStrokes, cloneStrokes); }
  }, [base, sourceBlob, hasAiResult, flat, editorBg, s, showOriginal, layers, maskStrokes, paintStrokes, cloneStrokes]);

  useEffect(() => {
    const source = ref.current;
    const overlay = magicPreviewRef.current;
    if (!source || !overlay) return;
    overlay.width = source.width;
    overlay.height = source.height;
    const ctx = overlay.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, overlay.width, overlay.height);
    if (!magicSeed || !source.width || !source.height) return;
    try {
      const pixels = source.getContext("2d")!.getImageData(0, 0, source.width, source.height).data;
      const width = source.width, height = source.height, total = width * height;
      const sx = Math.max(0, Math.min(width - 1, Math.round(magicSeed.x * (width - 1))));
      const sy = Math.max(0, Math.min(height - 1, Math.round(magicSeed.y * (height - 1))));
      const start = (sy * width + sx) * 4;
      const sr = pixels[start], sg = pixels[start + 1], sb = pixels[start + 2];
      const seen = new Uint8Array(total), queue = new Int32Array(total);
      const preview = ctx.createImageData(width, height);
      let head = 0, tail = 0, selected = 0;
      queue[tail++] = sy * width + sx; seen[sy * width + sx] = 1;
      const threshold = magicTolerance * 2.2;
      while (head < tail) {
        const index = queue[head++], p = index * 4;
        const dr = pixels[p] - sr, dg = pixels[p + 1] - sg, db = pixels[p + 2] - sb;
        if (Math.sqrt(dr * dr + dg * dg + db * db) > threshold) continue;
        const out = p;
        preview.data[out] = 80; preview.data[out + 1] = 225; preview.data[out + 2] = 185; preview.data[out + 3] = 105;
        selected++;
        const x = index % width, y = Math.floor(index / width);
        const neighbors = [x > 0 ? index - 1 : -1, x < width - 1 ? index + 1 : -1, y > 0 ? index - width : -1, y < height - 1 ? index + width : -1];
        for (const next of neighbors) if (next >= 0 && !seen[next]) { seen[next] = 1; queue[tail++] = next; }
      }
      ctx.putImageData(preview, 0, 0);
      if (!selected) return;
    } catch { /* Canvas may be temporarily unavailable while the image is rendering. */ }
  }, [magicSeed, magicTolerance, base, sourceBlob, hasAiResult, flat, bg, s, showOriginal, layers, maskStrokes, paintStrokes, cloneStrokes]);

  function saveProject() {
    const payload = { app: "Cutline", version: 3, settings: s, layers, maskStrokes, paintStrokes, selection, cloneStrokes };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
    const a = document.createElement("a"); a.href = url; a.download = "cutline-project.json"; a.click(); URL.revokeObjectURL(url);
    setProjectNotice("Project settings saved. Keep the original image separately; it is not embedded in this file.");
  }
  async function loadProject(file: File) {
    try {
      const data = JSON.parse(await file.text());
      if (data.app !== "Cutline" || !data.settings || !Array.isArray(data.layers) || !Array.isArray(data.maskStrokes)) throw new Error("Invalid Cutline project file.");
      setS({ ...DEFAULTS, ...data.settings }); setLayers(data.layers); setMaskStrokes(data.maskStrokes); setPaintStrokes(Array.isArray(data.paintStrokes) ? data.paintStrokes : []); setSelection(data.selection ?? null); setCloneStrokes(Array.isArray(data.cloneStrokes) ? data.cloneStrokes : []); setSelectedLayer(data.layers[0]?.id ?? null); setHistory([]); setFuture([]); setShowOriginal(false);
      setProjectNotice("Project loaded. Open the matching original image to restore the full design.");
    } catch (error) { setProjectNotice(error instanceof Error ? error.message : "Could not open project."); }
  }

  function autoEnhance() {
    const canvas = ref.current;
    if (!canvas || !canvas.width || !canvas.height) return;
    try {
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      const sample = document.createElement("canvas");
      const w = 96, h = Math.max(1, Math.round(96 * canvas.height / canvas.width));
      sample.width = w; sample.height = h;
      sample.getContext("2d")!.drawImage(canvas, 0, 0, w, h);
      const pixels = sample.getContext("2d")!.getImageData(0, 0, w, h).data;
      let luminance = 0, luminanceSq = 0, saturation = 0, count = 0;
      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i] / 255, g = pixels[i + 1] / 255, b = pixels[i + 2] / 255;
        const y = (0.2126 * r + 0.7152 * g + 0.0722 * b) * 255;
        luminance += y; luminanceSq += y * y;
        saturation += Math.max(r, g, b) - Math.min(r, g, b); count++;
      }
      if (!count) return;
      const mean = luminance / count;
      const deviation = Math.sqrt(Math.max(0, luminanceSq / count - mean * mean));
      const averageSaturation = saturation / count;
      const next = {
        brightness: Math.round(Math.max(88, Math.min(118, 100 + (128 - mean) * 0.16))),
        contrast: Math.round(Math.max(92, Math.min(132, 100 + (48 - deviation) * 0.55))),
        saturation: Math.round(Math.max(88, Math.min(125, 100 + (0.22 - averageSaturation) * 45))),
        fade: 0,
        vignette: 8,
      };
      setHistory((old) => [...old.slice(-19), s]); setFuture([]);
      setS((old) => ({ ...old, ...next }));
      setProjectNotice("Auto enhance applied. Fine-tune the sliders or undo to compare.");
    } catch {
      setProjectNotice("Auto enhance could not analyse this image. Try a preset instead.");
    }
  }

  async function download() {
    if (!ref.current || exportBusy) return;
    setExportBusy(true);
    try {
      const blob = await exportImage(ref.current, showOriginal ? DEFAULTS : s);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url;
      const safeName = exportFileName.trim().replace(/[^a-zA-Z0-9-_ ]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "my-design";
      a.download = `${safeName}.${s.format === "jpeg" ? "jpg" : s.format}`; a.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setProjectNotice("Export failed. Please try again.");
    } finally {
      setExportBusy(false);
    }
  }


  async function runAiEdit() {
    if (!ref.current || !aiPrompt.trim() || aiBusy) return;
    if (!maskStrokes.length && !magicSeed) { setAiError("Tap Select background and choose a point on the background, or use the mask brush."); return; }
    setAiBusy(true); setAiProgress(4); setAiStage("Preparing your image…"); setAiError("");
    try {
      const sourceCanvas = document.createElement("canvas");
      await render(sourceCanvas, hasAiResult ? sourceBlob : base, hasAiResult ? true : flat, hasAiResult ? { kind: "none" } : bg, s, layers, [], paintStrokes, cloneStrokes);
      setAiProgress(15); setAiStage("Preparing image and selection…");
      const resize = Math.min(1, 768 / sourceCanvas.width, 768 / sourceCanvas.height);
      // Stable Diffusion's VAE requires both dimensions to be divisible by 8.
      // Round down while keeping the image and its selection mask on the same canvas.
      const width = Math.max(256, Math.floor((sourceCanvas.width * resize) / 8) * 8);
      const height = Math.max(256, Math.floor((sourceCanvas.height * resize) / 8) * 8);
      const imageCanvas = document.createElement("canvas"); imageCanvas.width = width; imageCanvas.height = height;
      const imageCtx = imageCanvas.getContext("2d")!; imageCtx.drawImage(sourceCanvas, 0, 0, width, height);
      const imageDataUrl = imageCanvas.toDataURL("image/png");
      const maskCanvas = document.createElement("canvas"); maskCanvas.width = width; maskCanvas.height = height;
      const maskCtx = maskCanvas.getContext("2d")!;
      maskCtx.fillStyle = "#000"; maskCtx.fillRect(0, 0, width, height);
      maskCtx.strokeStyle = "#fff"; maskCtx.fillStyle = "#fff"; maskCtx.lineCap = "round"; maskCtx.lineJoin = "round";
      for (const stroke of maskStrokes) {
        if (!stroke.points.length) continue;
        maskCtx.lineWidth = Math.max(1, stroke.size * width / sourceCanvas.width);
        maskCtx.beginPath(); maskCtx.moveTo(stroke.points[0].x * width, stroke.points[0].y * height);
        for (const p of stroke.points.slice(1)) maskCtx.lineTo(p.x * width, p.y * height);
        if (stroke.points.length === 1) { maskCtx.lineTo(stroke.points[0].x * width + .1, stroke.points[0].y * height + .1); }
        maskCtx.stroke();
      }
      if (magicSeed) {
        const sourcePixels = imageCtx.getImageData(0, 0, width, height).data;
        const sx = Math.max(0, Math.min(width - 1, Math.round(magicSeed.x * (width - 1))));
        const sy = Math.max(0, Math.min(height - 1, Math.round(magicSeed.y * (height - 1))));
        const start = (sy * width + sx) * 4;
        const sr = sourcePixels[start], sg = sourcePixels[start + 1], sb = sourcePixels[start + 2];
        const seen = new Uint8Array(width * height), queue = new Int32Array(width * height);
        let head = 0, tail = 0; const first = sy * width + sx;
        queue[tail++] = first; seen[first] = 1;
        const threshold = magicTolerance * 2.2;
        while (head < tail) {
          const index = queue[head++], p = index * 4;
          const dr = sourcePixels[p] - sr, dg = sourcePixels[p + 1] - sg, db = sourcePixels[p + 2] - sb;
          if (Math.sqrt(dr * dr + dg * dg + db * db) > threshold) continue;
          const px = index % width, py = Math.floor(index / width);
          maskCtx.fillRect(px, py, 1, 1);
          const neighbors = [px > 0 ? index - 1 : -1, px < width - 1 ? index + 1 : -1, py > 0 ? index - width : -1, py < height - 1 ? index + width : -1];
          for (const next of neighbors) if (next >= 0 && !seen[next]) { seen[next] = 1; queue[tail++] = next; }
        }
      }
      // Cloudflare expects encoded PNG bytes for the mask image, not flat grayscale pixels.
      const maskBlob = await new Promise<Blob>((resolve, reject) => {
        maskCanvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Could not prepare the AI selection mask.")), "image/png");
      });
      const maskBytes = Array.from(new Uint8Array(await maskBlob.arrayBuffer()));
      setAiProgress(30); setAiStage("Sending image securely to AI…");
      const response = await fetch("/api/inpaint", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ imageData: imageDataUrl.split(",")[1], mask: maskBytes, width, height, prompt: aiPrompt.trim() }), signal: AbortSignal.timeout(65_000) });
      setAiProgress(88); setAiStage("AI finished. Applying your edit…");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "AI inpainting failed.");
      const edited = await fetch(data.image).then((r) => r.blob());
      setAiProgress(98); setAiStage("Finishing your image…");
      setSourceBlob(edited); setHasAiResult(true); setS(DEFAULTS); setHistory([]); setFuture([]); setShowOriginal(false); setLayers([]); setSelectedLayer(null); setAiPrompt(""); setMaskStrokes([]); setMagicSeed(null);
    } catch (error) { setAiError(error instanceof Error ? error.message : "AI inpainting failed."); }
    finally { setAiBusy(false); setAiProgress(0); setAiStage(""); }
  }


  const addImageLayer = async (file: File) => { if (!file.type.startsWith("image/")) return; const reader = new FileReader(); reader.onload = () => { const src = String(reader.result); const layer: DesignLayer = { id: "image-" + Date.now(), name: file.name.slice(0, 24) || "Image layer", kind: "image", text: "", color: "#ffffff", x: 50, y: 50, size: 64, opacity: 100, visible: true, shape: "rect", src, width: 32 }; setLayers((old) => [...old, layer]); setSelectedLayer(layer.id); }; reader.readAsDataURL(file); };
  const addLayer = (kind: "text" | "shape", shape: "rect" | "circle" = "rect") => {
    const value = kind === "text" ? window.prompt("Enter text for this layer", "Your text") : "";
    if (kind === "text" && !value?.trim()) return;
    const layer: DesignLayer = { id: "layer-" + Date.now(), name: kind === "text" ? value!.trim().slice(0, 22) : (shape === "circle" ? "Circle shape" : "Rectangle shape"), kind, text: value?.trim().slice(0, 100) || "", color: kind === "text" ? "#ffffff" : "#70e9ba", x: 50, y: 50, size: 64, opacity: kind === "text" ? 100 : 35, visible: true, shape };
    setLayers((old) => [...old, layer]); setSelectedLayer(layer.id);
  };
  const applyDesignTemplate = (template: string) => {
    const id = () => "template-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7);
    const presets: Record<string, { aspect: string; background: Bg; headline: string; sub: string; color: string; accent: string }> = {
      "Product feature": { aspect:"1:1", background:{kind:"gradient",color:"#f3eee4",color2:"#a5b7ae"}, headline:"MADE TO STAND OUT", sub:"OBJECTS WITH INTENTION · 2026", color:"#172c27", accent:"#d58b52" },
      "Luxury product": { aspect:"1:1", background:{kind:"gradient",color:"#1c1916",color2:"#806348"}, headline:"THE QUIET LUXURY", sub:"CRAFTED BEYOND EXPECTATION", color:"#fff0d4", accent:"#d8b47b" },
      "Social story": { aspect:"9:16", background:{kind:"gradient",color:"#f3a4a0",color2:"#6d4c91"}, headline:"MAKE YOUR MOMENT", sub:"A STORY WORTH SHARING", color:"#ffffff", accent:"#ffd66b" },
      "Sale announcement": { aspect:"1:1", background:{kind:"gradient",color:"#ff6c43",color2:"#8f173d"}, headline:"UP TO 50% OFF", sub:"THE BIGGEST DROP OF THE SEASON", color:"#ffffff", accent:"#ffe16b" },
      "Editorial cover": { aspect:"4:5", background:{kind:"gradient",color:"#d9d0bd",color2:"#555c50"}, headline:"FORM / FEEL / FUNCTION", sub:"THE MODERN CULTURE ISSUE · NO. 08", color:"#fffaf0", accent:"#d6a66e" },
      "Beauty campaign": { aspect:"4:5", background:{kind:"gradient",color:"#f4c7c2",color2:"#8e5368"}, headline:"OWN YOUR GLOW", sub:"SKIN THAT FEELS LIKE YOU", color:"#fff9f3", accent:"#f5df9b" },
      "Fashion lookbook": { aspect:"4:5", background:{kind:"gradient",color:"#d9d2c5",color2:"#4a504c"}, headline:"AFTER HOURS", sub:"THE AUTUMN / WINTER LOOKBOOK", color:"#fffaf0", accent:"#d3a06c" },
      "Travel postcard": { aspect:"4:5", background:{kind:"gradient",color:"#2c7380",color2:"#e0a36e"}, headline:"TAKE THE LONG WAY", sub:"SOMEWHERE NEW · ALWAYS", color:"#ffffff", accent:"#f5d88d" },
      "Music poster": { aspect:"4:5", background:{kind:"gradient",color:"#100e24",color2:"#8a3d70"}, headline:"TURN IT ALL THE WAY UP", sub:"ONE NIGHT · NO REPLAY", color:"#ffffff", accent:"#f7c95c" },
      "Food menu": { aspect:"4:5", background:{kind:"gradient",color:"#49291e",color2:"#c27b42"}, headline:"A TASTE OF SOMETHING", sub:"FRESHLY MADE · BEAUTIFULLY SERVED", color:"#fff3df", accent:"#e9c47c" },
      "Real estate": { aspect:"16:9", background:{kind:"gradient",color:"#173d42",color2:"#a4b9a9"}, headline:"SPACE TO LIVE WELL", sub:"ARCHITECTURE · LIGHT · LIFESTYLE", color:"#ffffff", accent:"#d7b77b" },
      "Event flyer": { aspect:"4:5", background:{kind:"gradient",color:"#191c36",color2:"#b14d67"}, headline:"THE NIGHT IS YOURS", sub:"DRESS UP · SHOW UP · STAY LATE", color:"#ffffff", accent:"#f4ce76" },
      "Podcast cover": { aspect:"1:1", background:{kind:"gradient",color:"#152d3c",color2:"#b47a50"}, headline:"OFF THE RECORD", sub:"REAL TALK · NEW EPISODES", color:"#ffffff", accent:"#e9c77c" },
      "YouTube thumbnail": { aspect:"16:9", background:{kind:"gradient",color:"#111b35",color2:"#e15d46"}, headline:"YOU NEED TO SEE THIS", sub:"THE STORY EVERYONE'S TALKING ABOUT", color:"#ffffff", accent:"#ffda62" },
      "Profile portrait": { aspect:"4:5", background:{kind:"gradient",color:"#d9c7b8",color2:"#6f7d83"}, headline:"THIS IS ME", sub:"A LITTLE MORE PERSONAL", color:"#ffffff", accent:"#e6bd7c" },
      "Graduation": { aspect:"4:5", background:{kind:"gradient",color:"#102a4c",color2:"#b28a4d"}, headline:"THE WORLD IS NEXT", sub:"CLASS OF 2026 · WE MADE IT", color:"#ffffff", accent:"#f4d98b" },
      "Birthday": { aspect:"4:5", background:{kind:"gradient",color:"#f6b6a2",color2:"#a83c70"}, headline:"ANOTHER YEAR ICONIC", sub:"MAKE A WISH · MAKE IT COUNT", color:"#ffffff", accent:"#ffe28a" },
      "Minimal quote": { aspect:"1:1", background:{kind:"gradient",color:"#e8e2d5",color2:"#a3ada5"}, headline:"MAKE ROOM TO BECOME", sub:"A NOTE TO YOUR FUTURE SELF", color:"#26352e", accent:"#bd7956" },
      "Sports promo": { aspect:"16:9", background:{kind:"gradient",color:"#102e28",color2:"#9caa43"}, headline:"NO DAYS GIVEN", sub:"BUILT BY WORK · DEFINED BY RESULTS", color:"#ffffff", accent:"#f2d46b" },
      "Tech launch": { aspect:"1:1", background:{kind:"gradient",color:"#081b30",color2:"#087e91"}, headline:"THE NEXT ERA STARTS NOW", sub:"BUILT FOR WHAT COMES NEXT", color:"#ffffff", accent:"#50e4d0" },
      "Skincare drop": { aspect:"4:5", background:{kind:"gradient",color:"#f3d8c8",color2:"#b46d65"}, headline:"SKIN, BUT BETTER", sub:"YOUR DAILY GLOW RITUAL", color:"#4a2928", accent:"#bd8b65" },
      "Sneaker campaign": { aspect:"4:5", background:{kind:"gradient",color:"#171b27",color2:"#d05a37"}, headline:"BUILT TO MOVE", sub:"THE STREET EDIT · NEW SEASON", color:"#ffffff", accent:"#f5c65c" },
      "Coffee brand": { aspect:"1:1", background:{kind:"gradient",color:"#2b1b16",color2:"#b77c4d"}, headline:"SLOW MORNINGS", sub:"ROASTED FRESH · BREWED RIGHT", color:"#fff0d9", accent:"#e4bd83" },
      "Wedding invitation": { aspect:"4:5", background:{kind:"gradient",color:"#eee5d6",color2:"#b9a58c"}, headline:"TO HAVE & TO HOLD", sub:"A CELEBRATION OF LOVE · 2026", color:"#453b32", accent:"#b28c61" },
      "Restaurant special": { aspect:"4:5", background:{kind:"gradient",color:"#3b1d18",color2:"#d47a3d"}, headline:"SERVED WITH PASSION", sub:"A LITTLE TASTE OF SOMETHING GREAT", color:"#fff3df", accent:"#f4ce77" },
      "App promotion": { aspect:"9:16", background:{kind:"gradient",color:"#101d3c",color2:"#7458d8"}, headline:"YOUR LIFE, IN SYNC", sub:"ONE APP · ENDLESS POSSIBILITIES", color:"#ffffff", accent:"#8ef1df" },
      "Fitness challenge": { aspect:"4:5", background:{kind:"gradient",color:"#102d28",color2:"#91a83c"}, headline:"EARN YOUR STRONG", sub:"30 DAYS · ONE BIG TRANSFORMATION", color:"#ffffff", accent:"#e5ef7d" },
      "Summer collection": { aspect:"4:5", background:{kind:"gradient",color:"#f4b66e",color2:"#e56f67"}, headline:"CHASE THE SUN", sub:"THE SUMMER COLLECTION", color:"#fffaf0", accent:"#ffe69a" },
      "Car showcase": { aspect:"16:9", background:{kind:"gradient",color:"#101923",color2:"#536879"}, headline:"ENGINEERED TO EXCITE", sub:"POWER · PRECISION · PRESENCE", color:"#ffffff", accent:"#8ed5ed" },
      "Online course": { aspect:"16:9", background:{kind:"gradient",color:"#1b2450",color2:"#6955a8"}, headline:"LEVEL UP YOUR SKILLS", sub:"LEARN SMARTER · GO FURTHER", color:"#ffffff", accent:"#f0cf70" },
      "Beauty sale": { aspect:"4:5", background:{kind:"gradient",color:"#e8b8c7",color2:"#96506d"}, headline:"A LITTLE SELF LOVE", sub:"YOUR FAVOURITES · NOW ON OFFER", color:"#fffaf5", accent:"#ffe2a5" },
      "LinkedIn banner": { aspect:"16:9", background:{kind:"gradient",color:"#102b42",color2:"#347c86"}, headline:"BUILD WHAT'S NEXT", sub:"IDEAS · PEOPLE · PROGRESS", color:"#ffffff", accent:"#8de4d0" },
      "Instagram post": { aspect:"1:1", background:{kind:"gradient",color:"#4c245f",color2:"#e17e80"}, headline:"A MOMENT TO REMEMBER", sub:"LITTLE DETAILS · BIG FEELINGS", color:"#ffffff", accent:"#ffd58a" },
      "Brand announcement": { aspect:"1:1", background:{kind:"gradient",color:"#17251e",color2:"#8b9b69"}, headline:"SOMETHING NEW IS HERE", sub:"A FRESH CHAPTER STARTS TODAY", color:"#ffffff", accent:"#d9e68d" },
      "Business card": { aspect:"16:9", background:{kind:"gradient",color:"#111a25",color2:"#566b72"}, headline:"YOUR NAME / YOUR WORK", sub:"DESIGN · STRATEGY · CONTACT", color:"#ffffff", accent:"#d4b77a" },
      "Property listing": { aspect:"16:9", background:{kind:"gradient",color:"#1b3736",color2:"#b7b8a1"}, headline:"FIND YOUR PLACE", sub:"SPACE · COMFORT · POSSIBILITY", color:"#ffffff", accent:"#e2cf9c" },
      "Restaurant menu": { aspect:"4:5", background:{kind:"gradient",color:"#2e1b17",color2:"#a76b42"}, headline:"THE MENU", sub:"FRESH FLAVOURS · MADE WITH CARE", color:"#fff2df", accent:"#e8c17d" },
      "Product carousel": { aspect:"1:1", background:{kind:"gradient",color:"#e9e4d9",color2:"#8eaaa0"}, headline:"THE DETAILS MATTER", sub:"DISCOVER THE COLLECTION", color:"#24352e", accent:"#b66d4e" },
      "Stream overlay": { aspect:"16:9", background:{kind:"gradient",color:"#15152d",color2:"#7544a0"}, headline:"LIVE RIGHT NOW", sub:"JOIN THE COMMUNITY · LET'S GO", color:"#ffffff", accent:"#8ff0dc" },
      "Creative portfolio": { aspect:"4:5", background:{kind:"gradient",color:"#202a32",color2:"#b66d4e"}, headline:"IDEAS MADE VISIBLE", sub:"SELECTED WORKS · CREATIVE STUDIO", color:"#ffffff", accent:"#e6bd8a" },
    };
    const chosen = presets[template]; if (!chosen) return;
    // Templates should be one-tap: never force users into a manual lasso workflow.
    setHistory((h) => [...h.slice(-19), s]); setFuture([]);
    setPendingBackdrop(null); setSelectionTool("off"); setSelection(null);
    setS((old) => ({ ...old, aspect: chosen.aspect }));
    setEditorBg(chosen.background);
    const next: DesignLayer[] = [
      { id:id(), name:"Template accent", kind:"shape", text:"", color:chosen.accent, x:50, y:73, size:1, opacity:95, visible:true, shape:"rect" },
      { id:id(), name:"Template headline", kind:"text", text:chosen.headline, color:chosen.color, x:50, y:82, size:48, opacity:100, visible:true, shape:"rect" },
      { id:id(), name:"Template subtitle", kind:"text", text:chosen.sub, color:chosen.color, x:50, y:92, size:15, opacity:95, visible:true, shape:"rect" }
    ];
    setLayers((old) => [...old, ...next]); setSelectedLayer(next[0].id);
    setProjectNotice(flat ? "Template added in one tap. Your photo and editable text are in place. To show the template backdrop behind your subject, remove the photo background first, then tap a template again." : "Template applied in one tap. Edit its headline and subtitle in Layers.");
  };
  const addSticker = (label: string, _emoji: string) => {
    const id = "sticker-"+Date.now()+"-"+Math.random().toString(36).slice(2,6);
    const art: Record<string, string> = {
      "Moustache": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 240"><defs><linearGradient id="h" x2="0" y2="1"><stop stop-color="#6a4029"/><stop offset=".42" stop-color="#24150f"/><stop offset="1" stop-color="#090706"/></linearGradient><filter id="s"><feGaussianBlur stdDeviation="2"/></filter></defs><path d="M300 111 C260 54 197 25 120 45 C53 62 28 123 54 165 C82 210 152 205 207 174 C250 151 276 126 300 111 C324 126 350 151 393 174 C448 205 518 210 546 165 C572 123 547 62 480 45 C403 25 340 54 300 111Z" fill="url(#h)" stroke="#160d09" stroke-width="7"/><g fill="none" stroke="#b27a4f" stroke-opacity=".38" stroke-width="4"><path d="M65 113 Q155 62 272 116 M76 143 Q167 91 277 129 M535 113 Q445 62 328 116 M524 143 Q433 91 323 129"/></g></svg>',
      "Beard": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 560"><defs><linearGradient id="b" x2="0" y2="1"><stop stop-color="#70462f"/><stop offset=".35" stop-color="#2a1a12"/><stop offset="1" stop-color="#090706"/></linearGradient></defs><path d="M68 35 Q155 75 300 78 Q445 75 532 35 L566 205 Q544 360 425 480 Q356 552 300 545 Q244 552 175 480 Q56 360 34 205Z" fill="url(#b)" stroke="#160d09" stroke-width="9"/><path d="M105 126 Q170 170 220 146 M495 126 Q430 170 380 146" fill="none" stroke="#b27a4f" stroke-opacity=".34" stroke-width="8"/><g stroke="#b27a4f" stroke-opacity=".28" stroke-width="3" fill="none"><path d="M90 180 Q150 260 200 390 M130 150 Q180 260 230 430 M510 180 Q450 260 400 390 M470 150 Q420 260 370 430 M250 180 Q270 340 300 500 M350 180 Q330 340 300 500"/></g></svg>',
      "Goatee": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 400"><defs><linearGradient id="g" x2="0" y2="1"><stop stop-color="#68432e"/><stop offset="1" stop-color="#100a07"/></linearGradient></defs><path d="M80 30 Q210 90 340 30 L325 205 Q300 335 210 380 Q120 335 95 205Z" fill="url(#g)" stroke="#160d09" stroke-width="8"/><g stroke="#b27a4f" stroke-opacity=".3" stroke-width="4"><path d="M120 100 Q170 220 210 330 M300 100 Q250 220 210 330"/></g></svg>'
    };
    const svg = art[label];
    if (!svg) return;
    const src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    const layer: DesignLayer = { id, name:label+" · realistic overlay", kind:"image", text:"", color:"#ffffff", x:50, y:48, size:1, opacity:100, visible:true, shape:"rect", src, width:label==="Beard"?48:label==="Goatee"?27:36 };
    setLayers((old)=>[...old,layer]); setSelectedLayer(layer.id);
    setProjectNotice(label+" overlay added. Drag it into position and resize it in Layers. It is a realistic-style illustrated overlay; align it carefully for the best fit.");
  };

  const activeLayer = layers.find((layer) => layer.id === selectedLayer) ?? null;
  const updateLayer = (id: string, patch: Partial<DesignLayer>) => setLayers((old) => old.map((layer) => layer.id === id ? { ...layer, ...patch } : layer));
  const moveLayerOnCanvas = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!draggingLayer || !activeLayer || activeLayer.locked || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    updateLayer(activeLayer.id, { x: Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100)), y: Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100)) });
  };

  const paintOnCanvas = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!paintMode || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const point = { x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)), y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)) };
    setPaintStrokes((old) => { const next = [...old]; if (!paintDrawing.current || !next.length) next.push({ points: [point], size: brushSize, color: paintColor, hardness: brushHardness / 100 }); else next[next.length - 1] = { ...next[next.length - 1], points: [...next[next.length - 1].points, point] }; return next; });
  };
  const canvasPoint = (event: React.PointerEvent<HTMLCanvasElement>) => { if (!ref.current) return { x: 0, y: 0 }; const rect = ref.current.getBoundingClientRect(); return { x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)), y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)) }; };
  const paintMask = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!maskMode || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const point = { x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)), y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)) };
    setMaskStrokes((old) => {
      const next = [...old];
      if (!maskDrawing.current || !next.length) next.push({ points: [point], size: brushSize });
      else next[next.length - 1] = { ...next[next.length - 1], points: [...next[next.length - 1].points, point] };
      return next;
    });
  };
  const beginSelection = (event: React.PointerEvent<HTMLCanvasElement>) => { const p = canvasPoint(event); selectionDrawing.current = true; setSelection({ kind: selectionTool === "lasso" ? "lasso" : "rect", points: [p, p] }); };
  const extendSelection = (event: React.PointerEvent<HTMLCanvasElement>) => { if (!selectionDrawing.current || !selection) return; const p = canvasPoint(event); setSelection((old) => { if (!old) return old; if (old.kind === "rect") return { ...old, points: [old.points[0], p] }; return { ...old, points: [...old.points, p] }; }); };
  const applySelectionCrop = async () => {
    if (!selection?.points || selection.points.length < 3) return;
    if (pendingBackdrop) {
      try {
        const image = await createImageBitmap(base);
        const cutout = document.createElement("canvas"); cutout.width = image.width; cutout.height = image.height;
        const ctx = cutout.getContext("2d"); if (!ctx) throw new Error("Could not prepare image");
        const alphaMask = document.createElement("canvas"); alphaMask.width=image.width; alphaMask.height=image.height;
        const maskCtx=alphaMask.getContext("2d"); if(!maskCtx) throw new Error("Could not prepare edge mask");
        maskCtx.save(); maskCtx.filter=edgeFeather>0 ? "blur("+edgeFeather+"px)" : "none";
        maskCtx.fillStyle="#fff"; maskCtx.beginPath();
        selection.points.forEach((p,i)=>{const x=p.x*image.width,y=p.y*image.height;if(i===0)maskCtx.moveTo(x,y);else maskCtx.lineTo(x,y);});
        maskCtx.closePath(); maskCtx.fill(); maskCtx.restore();
        ctx.drawImage(image,0,0); ctx.globalCompositeOperation="destination-in"; ctx.drawImage(alphaMask,0,0); ctx.globalCompositeOperation="source-over";
        const blob = await new Promise<Blob>((resolve,reject)=>cutout.toBlob(b=>b?resolve(b):reject(new Error("Could not create cut-out")),"image/png"));
        const presets: Record<string,Bg> = {
          "Product feature":{kind:"gradient",color:"#e7e2d7",color2:"#9eaaa4"},"Luxury product":{kind:"gradient",color:"#d5c3a3",color2:"#554638"},
          "Social story":{kind:"gradient",color:"#d8d8ec",color2:"#7d86a9"},"Sale announcement":{kind:"gradient",color:"#f4d6c7",color2:"#b95c4c"},
          "Editorial cover":{kind:"gradient",color:"#d6d0c3",color2:"#646d68"},"Beauty campaign":{kind:"gradient",color:"#f1d8d8",color2:"#b77c85"},
          "Fashion lookbook":{kind:"gradient",color:"#e4dfd4",color2:"#85877c"},"Travel postcard":{kind:"gradient",color:"#a9c8d0",color2:"#e7c79b"},
          "Music poster":{kind:"gradient",color:"#28233d",color2:"#865d83"},"Food menu":{kind:"gradient",color:"#e8d7bd",color2:"#9b7554"},
          "Real estate":{kind:"gradient",color:"#d8e2e0",color2:"#829b96"},"Event flyer":{kind:"gradient",color:"#252b42",color2:"#a66d69"},
          "Podcast cover":{kind:"gradient",color:"#2c3942",color2:"#b08b68"},"YouTube thumbnail":{kind:"gradient",color:"#27394b",color2:"#477d85"},
          "Profile portrait":{kind:"gradient",color:"#d5e2df",color2:"#8da9a3"},"Graduation":{kind:"gradient",color:"#172d4d",color2:"#b69b6a"},
          "Birthday":{kind:"gradient",color:"#f3d3c5",color2:"#b77d9a"},"Minimal quote":{kind:"gradient",color:"#e8e5dc",color2:"#b6c1ba"},
          "Sports promo":{kind:"gradient",color:"#243c35",color2:"#a2a85d"},"Tech launch":{kind:"gradient",color:"#17283b",color2:"#347c83"}
        };
        const chosen=presets[pendingBackdrop] ?? presets["Product feature"];
        setEditorBg(chosen); setSourceBlob(blob); setHasAiResult(true); setS(DEFAULTS); setLayers([]); setSelectedLayer(null);
        setProjectNotice("Subject cut out using your outline. The selected template is now behind it. Use Refine edges for hair and fine details.");
        setPendingBackdrop(null); setSelection(null); setSelectionTool("off"); setHistory([]); setFuture([]);
        image.close();
      } catch(error) { setProjectNotice(error instanceof Error?error.message:"Could not apply backdrop."); }
      return;
    }
    const xs=selection.points.map(p=>p.x),ys=selection.points.map(p=>p.y),left=Math.min(...xs),top=Math.min(...ys),right=Math.max(...xs),bottom=Math.max(...ys);
    if(right-left<.01||bottom-top<.01)return;
    applyPreset({cropLeft:Math.round(left*100),cropTop:Math.round(top*100),cropWidth:Math.max(1,Math.round((right-left)*100)),cropHeight:Math.max(1,Math.round((bottom-top)*100))});
    setSelection(null);setSelectionTool("off");
  };
  const clearSelection = () => { setSelection(null); setSelectionTool("off"); selectionDrawing.current = false; };
  const setClonePoint = (event: React.PointerEvent<HTMLCanvasElement>) => { const p = canvasPoint(event); if (!cloneSource) { setCloneSource(p); return; } cloneDrawing.current = true; setCloneStrokes(old => [...old, { points: [p], source: cloneSource, size: brushSize, healing: healingMode }]); };
  const extendClone = (event: React.PointerEvent<HTMLCanvasElement>) => { if (!cloneDrawing.current) return; const p = canvasPoint(event); setCloneStrokes(old => { const next=[...old]; if(next.length) next[next.length-1]={...next[next.length-1],points:[...next[next.length-1].points,p]}; return next; }); };
  const Range = ({ label, k, min, max, step = 1 }: { label: string; k: NumKey; min: number; max: number; step?: number }) => (
    <label className="rng"><span>{label} <b>{s[k]}</b></span>
      <input type="range" min={min} max={max} step={step} value={s[k]} onChange={(e) => set(k, Number(e.target.value))} />
    </label>
  );

  return (
    <div className="editor pro-editor">
      <div className="pro-editor-topbar">
        <div className="pro-document"><span className="pro-doc-icon">▧</span><span><b>Untitled design</b><small>{showOriginal ? "Original preview" : "Live editing session"}</small></span></div>
        <div className="pro-top-actions">
          <button type="button" className="chip" onClick={undo} disabled={!history.length}>↶ Undo</button>
          <button type="button" className="chip" onClick={redo} disabled={!future.length}>↷ Redo</button>
          <button type="button" className="chip" onClick={() => setShowOriginal((v) => !v)}>{showOriginal ? "Show edit" : "Compare"}</button>
          <button type="button" className="chip" onClick={saveProject}>Save project</button><button type="button" className="chip" onClick={() => projectInput.current?.click()}>Open project</button><input ref={projectInput} type="file" accept="application/json,.json" hidden onChange={(e) => { const file = e.target.files?.[0]; if (file) void loadProject(file); e.currentTarget.value = ""; }} /><button type="button" className={`pro-export${exportBusy ? " is-loading" : ""}`} onClick={() => void download()} disabled={exportBusy}>{exportBusy ? <><span className="btn-spinner" aria-hidden="true" /> Preparing export…</> : "Export ↗"}</button>
        </div>
      </div>
      <aside className="pro-tool-rail" aria-label="Editing tools">
        <span>TOOLS</span>
        <button type="button" title="Enhance image" onClick={() => applyPreset({ blur: 0, contrast: 118, brightness: 104 })}>✧</button>
        <button type="button" title="Crop image" onClick={() => applyPreset({ cropLeft: 8, cropTop: 8, cropWidth: 84, cropHeight: 84 })}>▣</button>
        <button type="button" title="Blur" onClick={() => applyPreset({ blur: 2 })}>◌</button>
        <button type="button" title="Add text" onClick={() => { const value = window.prompt("Text to add to image"); if (value !== null) set("caption", value.slice(0, 90)); }}>T</button>
        <button type="button" title="Black and white" onClick={() => applyPreset({ grayscale: 100, saturation: 0 })}>◐</button>
        <button type="button" title="Add frame" onClick={() => applyPreset({ borderWidth: 18, borderColor: "#ffffff" })}>▢</button>
      </aside>
      <div className="editor-stage">
        <div className="editor-stage-head"><span>{showOriginal ? "ORIGINAL PREVIEW" : "LIVE CANVAS"}</span><div><button type="button" className="chip" onClick={undo} disabled={!history.length}>↶ Undo</button><button type="button" className="chip" onClick={redo} disabled={!future.length}>↷ Redo</button><button type="button" className="chip" onClick={() => setShowOriginal((v) => !v)}>{showOriginal ? "Show edit" : "Before"}</button></div></div>
        <div className="canvas-zoom-bar"><button type="button" className="chip" onClick={() => setZoom((v) => Math.max(25, v - 10))}>−</button><span>{zoom}%</span><button type="button" className="chip" onClick={() => setZoom((v) => Math.min(200, v + 10))}>＋</button><button type="button" className="chip" onClick={() => setZoom(100)}>100%</button><button type="button" className="chip" onClick={() => setZoom(75)}>Fit view</button><button type="button" className="chip" onClick={() => set("rotate", (s.rotate + 90) % 360)}>Rotate 90°</button><button type="button" className="chip" onClick={() => set("flip", !s.flip)}>Flip H</button><button type="button" className="chip" onClick={() => set("flipY", !s.flipY)}>Flip V</button></div>{projectNotice && <p className="editor-hint project-notice">{projectNotice}</p>}<div className="checker"><canvas ref={ref} onPointerDown={(event) => { if (magicWandMode) { setMagicSeed(canvasPoint(event)); setMagicWandMode(false); setAiError(""); } else if (selectionTool !== "off") { event.currentTarget.setPointerCapture(event.pointerId); beginSelection(event); } else if (cloneMode || healingMode) { event.currentTarget.setPointerCapture(event.pointerId); setClonePoint(event); } else if (maskMode || paintMode) { event.currentTarget.setPointerCapture(event.pointerId); if (maskMode) { maskDrawing.current = true; paintMask(event); } else { paintDrawing.current = true; paintOnCanvas(event); } } else if (activeLayer) { setDraggingLayer(true); event.currentTarget.setPointerCapture(event.pointerId); } }} onPointerMove={(event) => { if (event.currentTarget.hasPointerCapture(event.pointerId) && selectionTool !== "off") extendSelection(event); else if (event.currentTarget.hasPointerCapture(event.pointerId) && (cloneMode || healingMode)) extendClone(event); else if (event.currentTarget.hasPointerCapture(event.pointerId) && maskMode) paintMask(event); else if (event.currentTarget.hasPointerCapture(event.pointerId) && paintMode) paintOnCanvas(event); else moveLayerOnCanvas(event); }} onPointerUp={() => { setDraggingLayer(false); paintDrawing.current = false; maskDrawing.current = false; selectionDrawing.current = false; cloneDrawing.current = false; }} onPointerCancel={() => { setDraggingLayer(false); paintDrawing.current = false; maskDrawing.current = false; selectionDrawing.current = false; cloneDrawing.current = false; }} style={{ touchAction: magicWandMode || maskMode || paintMode || cloneMode || healingMode || selectionTool !== "off" || activeLayer ? "none" : "auto", cursor: magicWandMode || maskMode || paintMode || cloneMode || healingMode || selectionTool !== "off" ? "crosshair" : activeLayer ? "move" : "default", transform: `scale(${zoom / 100})`, transformOrigin: "center center" }} /><canvas ref={magicPreviewRef} className="magic-selection-preview" aria-hidden="true" style={{ transform: `scale(${zoom / 100})`, transformOrigin: "center center" }} />{magicSeed && <div className="magic-wand-point" style={{ left: `${magicSeed.x * 100}%`, top: `${magicSeed.y * 100}%` }} aria-label="Selected background point">✦</div>}{selection && <svg className="selection-overlay" viewBox="0 0 1000 1000" preserveAspectRatio="none">{selection.kind === "rect" && selection.points.length > 1 ? <rect x={Math.min(selection.points[0].x, selection.points[1].x)*1000} y={Math.min(selection.points[0].y, selection.points[1].y)*1000} width={Math.abs(selection.points[1].x-selection.points[0].x)*1000} height={Math.abs(selection.points[1].y-selection.points[0].y)*1000} fill="rgba(105,230,181,.10)" stroke="#69e6b5" strokeWidth="3" strokeDasharray="10 7" /> : <polygon points={selection.points.map(p => `${p.x*1000},${p.y*1000}`).join(" ")} fill="rgba(105,230,181,.10)" stroke="#69e6b5" strokeWidth="3" strokeDasharray="10 7" />}</svg>}</div>
        <p className="editor-hint">Changes preview live. Export when your image is ready.</p>
      </div>
      <div className="ctrls">
        <div className="quick-tools">
          <div><span className="tool-kicker">QUICK EDIT</span><b>Make it yours</b><small>Tap a tool to start editing</small></div>
          <div className="quick-tool-grid">
            <button type="button" onClick={() => applyPreset({ blur: 2 })}><span>◌</span>Blur</button>
            <button type="button" onClick={() => applyPreset({ blur: 0, contrast: 118, brightness: 104 })}><span>✧</span>Enhance</button>
            <button type="button" onClick={() => applyPreset({ grayscale: 100, saturation: 0 })}><span>◐</span>B&amp;W</button>
            <button type="button" onClick={() => applyPreset({ vignette: 42 })}><span>◉</span>Focus</button>
            <button type="button" onClick={() => applyPreset({ cropLeft: 8, cropTop: 8, cropWidth: 84, cropHeight: 84 })}><span>▣</span>Crop</button>
            <button type="button" onClick={() => applyPreset({ borderWidth: 18, borderColor: "#ffffff" })}><span>▢</span>Frame</button>
            <button type="button" onClick={() => applyPreset({ brightness: 100, contrast: 100, saturation: 100, warmth: 0, tint: 0, fade: 0, blur: 0, vignette: 0, hue: 0, grayscale: 0, sepia: 0, invert: 0, grain: 0 })}><span>↺</span>Reset colour</button>
            <button type="button" onClick={() => applyPreset({ cropLeft: 0, cropTop: 0, cropWidth: 100, cropHeight: 100, aspect: "orig" })}><span>⤢</span>Original size</button>
          </div>
        </div>
        <details open className="history-panel"><summary>Editing history <span className="history-count">{history.length + 1} steps</span></summary>
          <div className="history-list">
            <button type="button" className="history-item current" disabled><i /> <span><b>Current version</b><small>Live preview</small></span><em>NOW</em></button>
            {[...history].reverse().map((snapshot, index) => <button type="button" className="history-item" key={history.length - index} onClick={() => { setFuture((f) => [s, ...f].slice(0, 20)); setS(snapshot); setHistory((h) => h.slice(0, history.length - index - 1)); }}><i /> <span><b>Previous edit {history.length - index}</b><small>Restore this version</small></span><em>↶</em></button>)}
            {!history.length && <p className="editor-hint">Your changes will appear here as you edit.</p>}
          </div>
        </details>


        <details open className="retouch-panel"><summary>Healing &amp; clone retouch</summary>
          <p className="editor-hint">For small spots and blemishes: choose a clean source area, then brush over the mark. Healing uses a softened, feathered sample patch; it is not AI content-aware reconstruction.</p>
          <button type="button" className={healingMode ? "go" : "chip"} onClick={() => { setHealingMode(v => !v); setCloneMode(false); setPaintMode(false); setMaskMode(false); setSelectedLayer(null); setProjectNotice(cloneSource ? "Healing brush ready — paint over a small blemish." : "Tap a clean area of the photo to set the healing source."); }}>{healingMode ? "Healing brush active · tap photo" : "Activate healing brush ✦"}</button>
          <button type="button" className={cloneMode ? "go" : "chip"} onClick={() => { setCloneMode(v => !v); setHealingMode(false); setPaintMode(false); setMaskMode(false); setSelectedLayer(null); }}>{cloneMode ? "Clone stamp active · tap photo" : "Activate clone stamp"}</button>
          <label className="rng">Retouch brush size <input type="range" min="5" max="120" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} /></label>
          <p className="editor-hint">{cloneSource ? "Source point set. Reset it to choose another clean area." : "First tap on the photo sets the source point; the next stroke retouches."}</p>
          <button type="button" className="chip" onClick={() => { setCloneSource(null); setCloneStrokes([]); }}>Reset source &amp; clear retouch</button>
        </details>
        <details className="retouch-panel"><summary>Clone stamp setup</summary><label className="rng">Retouch brush size <input type="range" min="5" max="120" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} /></label><button type="button" className="chip" onClick={() => { setCloneSource(null); setCloneStrokes([]); }}>Reset clone source &amp; strokes</button></details>
        <details open className="paint-panel"><summary>Paint &amp; retouch brush</summary><p className="editor-hint">Paint directly onto the image. Brush strokes are included in exports and saved project files.</p><button type="button" className={paintMode ? "go" : "chip"} onClick={() => { setPaintMode((v) => !v); setMaskMode(false); setSelectedLayer(null); }}>{paintMode ? "Paint brush active · tap to stop" : "Activate paint brush"}</button><label className="rng">Brush colour <input type="color" value={paintColor} onChange={(e) => setPaintColor(e.target.value)} /></label><label className="rng">Brush size <input type="range" min="2" max="120" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} /></label><label className="rng">Brush hardness <b>{brushHardness}%</b><input type="range" min="0" max="100" value={brushHardness} onChange={(e) => setBrushHardness(Number(e.target.value))} /></label><button type="button" className="chip" onClick={() => setPaintStrokes((old) => old.slice(0, -1))} disabled={!paintStrokes.length}>Undo last paint stroke</button><button type="button" className="chip" onClick={() => setPaintStrokes([])} disabled={!paintStrokes.length}>Clear paint</button></details>
        <details open className="mask-panel"><summary>Selection, masks &amp; retouch</summary><p className="editor-hint">Make a rectangular or freehand lasso selection, then crop to its bounds. The brush marks the area AI is allowed to replace.</p><div className="layer-actions"><button type="button" className={selectionTool === "rect" ? "go" : "chip"} onClick={() => { setSelectionTool(selectionTool === "rect" ? "off" : "rect"); setMaskMode(false); setPaintMode(false); setCloneMode(false); }}>▣ Rectangle select</button><button type="button" className={selectionTool === "lasso" ? "go" : "chip"} onClick={() => { setSelectionTool(selectionTool === "lasso" ? "off" : "lasso"); setMaskMode(false); setPaintMode(false); setCloneMode(false); }}>〰 Lasso select</button>{pendingBackdrop && <><p className="editor-hint">Template: <b>{pendingBackdrop}</b>. Trace around the subject, then soften the edge for a natural blend.</p><label className="rng"><span>Edge softness <b>{edgeFeather}px</b></span><input type="range" min="0" max="24" step="1" value={edgeFeather} onChange={(e)=>setEdgeFeather(Number(e.target.value))}/></label><button type="button" className="go" disabled={!selection || selection.points.length<3} onClick={() => void applySelectionCrop()}>Apply subject &amp; template</button><button type="button" className="chip" onClick={() => {setPendingBackdrop(null);clearSelection();}}>Cancel</button></>}</div>{selection && <><p className="editor-hint">Selection ready. Crop uses the selection bounding box.</p><button type="button" className="go" onClick={applySelectionCrop}>Crop to selection</button><button type="button" className="chip" onClick={clearSelection}>Clear selection</button></>}<button type="button" className={cloneMode ? "go" : "chip"} onClick={() => { setCloneMode(v => !v); setCloneSource(null); setSelectionTool("off"); setMaskMode(false); setPaintMode(false); }}>{cloneMode ? "Clone stamp active · tap source then paint" : "Clone stamp"}</button>{cloneMode && <p className="editor-hint">{cloneSource ? "Source selected. Tap or drag to stamp from that point." : "Tap the image to choose the source point."}</p>}<p className="editor-hint">AI masking is managed in the dedicated AI image editor below, so the brush controls stay in one place.</p></details>
        <details open className="layer-panel"><summary>Layers <span className="history-count">{layers.length} added</span></summary>
          <div className="layer-actions"><button type="button" onClick={() => imageLayerInput.current?.click()}>＋ Image</button><input ref={imageLayerInput} type="file" accept="image/*" hidden onChange={(e) => { const file = e.target.files?.[0]; if (file) void addImageLayer(file); e.currentTarget.value = ""; }} /><button type="button" onClick={() => addLayer("text")}>＋ Text</button><button type="button" onClick={() => addLayer("shape", "rect")}>＋ Rectangle</button><button type="button" onClick={() => addLayer("shape", "circle")}>＋ Circle</button></div>
          <div className="layer-list"><button type="button" className="layer-row base-layer" onClick={() => setSelectedLayer(null)}><span>▧</span><b>Photo / base image</b><small>BASE</small></button>
            {[...layers].reverse().map((layer) => <div className={"layer-row " + (selectedLayer === layer.id ? "selected" : "")} key={layer.id}><button type="button" className="layer-select" onClick={() => setSelectedLayer(layer.id)}><span>{layer.kind === "image" ? "▧" : layer.kind === "text" ? "T" : layer.shape === "circle" ? "◯" : "▱"}</span><b>{layer.name}</b></button><button type="button" className="layer-visibility" aria-label={layer.visible ? "Hide layer" : "Show layer"} title={layer.visible ? "Hide layer" : "Show layer"} onClick={() => updateLayer(layer.id, { visible: !layer.visible })}>{layer.visible ? "◉" : "○"}</button><button type="button" className="layer-lock" aria-label={layer.locked ? "Unlock layer" : "Lock layer"} title={layer.locked ? "Unlock layer" : "Lock layer"} onClick={() => updateLayer(layer.id, { locked: !layer.locked })}>{layer.locked ? "🔒" : "🔓"}</button></div>)}
            {!layers.length && <p className="editor-hint">Add text or shapes, select a layer, then drag it directly on the canvas.</p>}</div>
          {activeLayer && <div className="layer-properties"><b>Selected: {activeLayer.name} {activeLayer.locked ? "· Locked" : ""}</b>
            {activeLayer.kind === "image" && <label className="rng">Image width <input type="range" min="5" max="100" value={activeLayer.width ?? 32} onChange={(e) => updateLayer(activeLayer.id, { width: Number(e.target.value) })} /></label>}{activeLayer.kind === "text" && <><label className="rng">Text <input value={activeLayer.text} maxLength={100} onChange={(e) => updateLayer(activeLayer.id, { text: e.target.value, name: e.target.value.slice(0, 22) || "Text layer" })} /></label><label className="rng">Font size <input type="range" min="12" max="180" value={activeLayer.size} onChange={(e) => updateLayer(activeLayer.id, { size: Number(e.target.value) })} /></label></>}
            <label className="rng">Colour <input type="color" value={activeLayer.color} onChange={(e) => updateLayer(activeLayer.id, { color: e.target.value })} /></label><label className="rng">Opacity <input type="range" min="0" max="100" value={activeLayer.opacity} onChange={(e) => updateLayer(activeLayer.id, { opacity: Number(e.target.value) })} /></label><label className="rng">Horizontal <input type="range" min="0" max="100" value={activeLayer.x} onChange={(e) => updateLayer(activeLayer.id, { x: Number(e.target.value) })} /></label><label className="rng">Vertical <input type="range" min="0" max="100" value={activeLayer.y} onChange={(e) => updateLayer(activeLayer.id, { y: Number(e.target.value) })} /></label>
            <div className="layer-order-actions"><button type="button" className="chip" onClick={() => updateLayer(activeLayer.id, { locked: !activeLayer.locked })}>{activeLayer.locked ? "Unlock layer" : "Lock layer"}</button><button type="button" className="chip" disabled={activeLayer.locked} onClick={() => setLayers((old) => { const i = old.findIndex((item) => item.id === activeLayer.id); if (i < 0 || i === old.length - 1) return old; const next = [...old]; [next[i], next[i + 1]] = [next[i + 1], next[i]]; return next; })}>Bring forward ↑</button><button type="button" className="chip" disabled={activeLayer.locked} onClick={() => setLayers((old) => { const i = old.findIndex((item) => item.id === activeLayer.id); if (i <= 0) return old; const next = [...old]; [next[i], next[i - 1]] = [next[i - 1], next[i]]; return next; })}>Send backward ↓</button><button type="button" className="chip" disabled={activeLayer.locked} onClick={() => { const copy = { ...activeLayer, locked: false, id: "layer-" + Date.now(), name: activeLayer.name + " copy", x: Math.min(95, activeLayer.x + 4), y: Math.min(95, activeLayer.y + 4) }; setLayers((old) => [...old, copy]); setSelectedLayer(copy.id); }}>Duplicate</button><button type="button" className="chip" disabled={activeLayer.locked} onClick={() => { setLayers((old) => old.filter((item) => item.id !== activeLayer.id)); setSelectedLayer(null); }}>Delete layer</button></div></div>}</details>
        <section className="ai-workflow-panel">
          <div className="ai-workflow-heading"><span className="tool-kicker">GENERATIVE EDITING</span><h3>AI image editor</h3><p className="editor-hint">Describe the result first. Then mark the exact part of the photo that AI should replace.</p></div>
          <div className="ai-step-card">
            <div className="ai-step-title"><span>01</span><b>Write your AI prompt</b></div>
            <textarea aria-label="AI image edit prompt" rows={4} maxLength={700} placeholder="Describe what should appear in the selected area… e.g. Replace the background with a clean warm photography studio. Keep the person and their clothing unchanged." value={aiPrompt} onChange={(e) => { setAiPrompt(e.target.value); setAiError(""); }} />
            <small>Be specific about lighting, colours, style and what must stay unchanged.</small>
          </div>
          <div className="ai-step-card">
            <div className="ai-step-title"><span>02</span><b>Paint the replacement area</b></div>
            <p className="editor-hint">Tap the background once to select connected areas of similar colour. Use the brush only to refine missed spots.</p><button type="button" className={magicWandMode ? "go" : "chip"} onClick={() => { setMagicWandMode(v => !v); setMaskMode(false); setPaintMode(false); setCloneMode(false); setSelectionTool("off"); setSelectedLayer(null); setAiError(""); }}>{magicWandMode ? "✦ Magic wand active — tap the photo" : "✦ Select background (magic wand)"}</button><p className="editor-hint" role="status">{magicWandMode ? "Now tap once on the background in the large photo preview above." : magicSeed ? "✓ Background point selected. Tap the photo again with the wand active to change it." : "Tap the button, then tap the background in the photo preview above."}</p>{magicSeed && <button type="button" className="chip" onClick={() => { setMagicSeed(null); setAiError(""); }}>Clear wand selection</button>}<label className="rng"><span>Selection tolerance <b>{magicTolerance}</b></span><input type="range" min="10" max="100" value={magicTolerance} onChange={e => setMagicTolerance(Number(e.target.value))} /></label>{magicSeed && <p className="editor-hint">Background point selected. Generate to apply the connected colour selection.</p>}
            <button type="button" className={maskMode ? "go" : "chip"} onClick={() => { setMaskMode((v) => !v); maskDrawing.current = false; setPaintMode(false); setCloneMode(false); setSelectionTool("off"); setSelectedLayer(null); setAiError(""); }}>{maskMode ? "Mask brush active · tap to finish" : "Activate AI mask brush"}</button>
            <label className="rng"><span>Mask brush size <b>{brushSize}px</b></span><input type="range" min="8" max="160" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} /></label>
            <div className="layer-actions"><button type="button" className="chip" onClick={() => setMaskStrokes((old) => old.slice(0, -1))} disabled={!maskStrokes.length}>Undo stroke</button><button type="button" className="chip" onClick={() => setMaskStrokes([])} disabled={!maskStrokes.length}>Clear mask</button></div>
            <small>{maskStrokes.length ? `${maskStrokes.length} mask stroke(s) painted` : magicSeed ? "Background point selected" : "No area selected yet"}</small>
          </div>
          <div className="ai-step-card ai-apply-card">
            <div className="ai-step-title"><span>03</span><b>Generate your edit</b></div>
            {aiBusy && <div className="ai-progress" role="status" aria-live="polite"><div className="ai-progress-heading"><b>{aiStage}</b><strong>{aiProgress}%</strong></div><div className="ai-progress-track"><span style={{ width: `${aiProgress}%` }} /></div><small>Stage-based progress · generation time depends on the AI service</small></div>}
            <button className={`go${aiBusy ? " is-loading" : ""}`} type="button" disabled={aiBusy || !aiPrompt.trim() || (!maskStrokes.length && !magicSeed)} onClick={() => void runAiEdit()}>{aiBusy ? <><span className="btn-spinner" aria-hidden="true" /> AI is editing…</> : "Generate AI edit ✨"}</button>
            {aiError && <p role="alert" className="editor-error">{aiError}</p>}
            <small>Cloudflare Workers AI · Up to 5 image edits per day.</small>
          </div>
        </section>
        <section className="design-template-panel">
          <div className="design-template-heading"><div><span className="tool-kicker">DESIGN LIBRARY</span><h3>40 ready-to-customize templates</h3><p className="editor-hint">Start with a professional layout, then make every word, colour and layer your own.</p><div className="template-howto"><span><b>1</b> Choose a design and aspect ratio.</span><span><b>2</b> Replace the sample copy in Layers.</span><span><b>3</b> Add your own image, logo or shapes.</span><span><b>4</b> Save the project or export your design.</span></div></div><span className="template-count">40 DESIGNS</span></div>
          {projectNotice && <p className="editor-hint" role="status">{projectNotice}</p>}
          <div className="template-library-toolbar">
            <label className="template-search-wrap"><span aria-hidden="true">⌕</span><input type="search" value={templateSearch} onChange={(event) => { setTemplateSearch(event.target.value); setShowAllTemplates(true); }} placeholder="Search by design, industry or style…" aria-label="Search templates" /></label>
            <div className="template-library-meta"><span>{favoriteTemplates.length} FAVOURITES</span><span>{40} TOTAL DESIGNS</span></div>
          </div>
          <div className="template-category-filters" role="group" aria-label="Filter templates by category">
            {["All","Saved","Product","Social","Business","Editorial","Beauty","Fashion","Events","Food","Music","Travel","Sports","Technology","Portrait","Automotive","Education","Creative"].map((category) => <button type="button" key={category} className={templateCategory === category ? "active" : ""} onClick={() => { setTemplateCategory(category); setShowAllTemplates(true); }}>{category}</button>)}
          </div>
          <div className="template-library-meta template-results-meta"><span>{templateSearch.trim() || templateCategory !== "All" ? "FILTERED RESULTS" : showAllTemplates ? "ALL TEMPLATES" : "POPULAR TEMPLATES"}</span><span>40 DESIGNS</span></div>
          <div className="design-template-grid">
            {(() => {
              const catalog = [["Product feature","Product feature","Product","01"],["Luxury product","Luxury product","Product","02"],["Social story","Social story","Social","03"],["Sale announcement","Sale announcement","Business","04"],["Editorial cover","Editorial cover","Editorial","05"],["Beauty campaign","Beauty campaign","Beauty","06"],["Fashion lookbook","Fashion lookbook","Fashion","07"],["Travel postcard","Travel postcard","Travel","08"],["Music poster","Music poster","Music","09"],["Food menu","Food menu","Food","10"],["Real estate","Real estate","Business","11"],["Event flyer","Event flyer","Events","12"],["Podcast cover","Podcast cover","Music","13"],["YouTube thumbnail","YouTube thumbnail","Social","14"],["Profile portrait","Profile portrait","Portrait","15"],["Graduation","Graduation","Events","16"],["Birthday","Birthday","Events","17"],["Minimal quote","Minimal quote","Editorial","18"],["Sports promo","Sports promo","Sports","19"],["Tech launch","Tech launch","Technology","20"],["Skincare drop","Skincare drop","Beauty","21"],["Sneaker campaign","Sneaker campaign","Fashion","22"],["Coffee brand","Coffee brand","Food","23"],["Wedding invitation","Wedding invitation","Events","24"],["Restaurant special","Restaurant special","Food","25"],["App promotion","App promotion","Technology","26"],["Fitness challenge","Fitness challenge","Sports","27"],["Summer collection","Summer collection","Fashion","28"],["Car showcase","Car showcase","Automotive","29"],["Online course","Online course","Education","30"],["Beauty sale","Beauty sale","Beauty","31"],["Creative portfolio","Creative portfolio","Creative","32"],["LinkedIn banner","LinkedIn banner","Business","33"],["Instagram post","Instagram post","Social","34"],["Brand announcement","Brand announcement","Business","35"],["Business card","Business card","Business","36"],["Property listing","Property listing","Business","37"],["Restaurant menu","Restaurant menu","Food","38"],["Product carousel","Product carousel","Product","39"],["Stream overlay","Stream overlay","Social","40"]];
              const filtered = catalog.filter(([key,label,category]) => (!templateSearch.trim() || (key+" "+label+" "+category).toLowerCase().includes(templateSearch.trim().toLowerCase())) && (templateCategory === "All" || (templateCategory === "Saved" ? favoriteTemplates.includes(key) : category === templateCategory)));
              const visible = showAllTemplates || templateSearch.trim() || templateCategory !== "All" ? filtered : filtered.slice(0,12);
              return visible.map(([key,label,category,number]) => <div className="template-card-wrap" key={key}>
                <button type="button" className="template-favorite" aria-label={favoriteTemplates.includes(key) ? "Remove saved template" : "Save template"} aria-pressed={favoriteTemplates.includes(key)} onClick={() => setFavoriteTemplates((old) => old.includes(key) ? old.filter((item) => item !== key) : [...old,key])}>{favoriteTemplates.includes(key) ? "★" : "☆"}</button>
                <button type="button" className="design-template-card" data-category={category} onClick={() => applyDesignTemplate(key)}><span className="template-preview"><b>{label.toUpperCase()}</b><small>{category.toUpperCase()} DESIGN · {number}</small></span><strong>{label}</strong><small>{category} · Editable text, colours &amp; layers</small><span className="template-use-label">USE TEMPLATE ↗</span></button>
              </div>);
            })()}
            {(() => {
              const catalog = [["Product feature","Product feature","Product"],["Luxury product","Luxury product","Product"],["Social story","Social story","Social"],["Sale announcement","Sale announcement","Business"],["Editorial cover","Editorial cover","Editorial"],["Beauty campaign","Beauty campaign","Beauty"],["Fashion lookbook","Fashion lookbook","Fashion"],["Travel postcard","Travel postcard","Travel"],["Music poster","Music poster","Music"],["Food menu","Food menu","Food"],["Real estate","Real estate","Business"],["Event flyer","Event flyer","Events"],["Podcast cover","Podcast cover","Music"],["YouTube thumbnail","YouTube thumbnail","Social"],["Profile portrait","Profile portrait","Portrait"],["Graduation","Graduation","Events"],["Birthday","Birthday","Events"],["Minimal quote","Minimal quote","Editorial"],["Sports promo","Sports promo","Sports"],["Tech launch","Tech launch","Technology"],["Skincare drop","Skincare drop","Beauty"],["Sneaker campaign","Sneaker campaign","Fashion"],["Coffee brand","Coffee brand","Food"],["Wedding invitation","Wedding invitation","Events"],["Restaurant special","Restaurant special","Food"],["App promotion","App promotion","Technology"],["Fitness challenge","Fitness challenge","Sports"],["Summer collection","Summer collection","Fashion"],["Car showcase","Car showcase","Automotive"],["Online course","Online course","Education"],["Beauty sale","Beauty sale","Beauty"],["Creative portfolio","Creative portfolio","Creative"],["LinkedIn banner","LinkedIn banner","Business"],["Instagram post","Instagram post","Social"],["Brand announcement","Brand announcement","Business"],["Business card","Business card","Business"],["Property listing","Property listing","Business"],["Restaurant menu","Restaurant menu","Food"],["Product carousel","Product carousel","Product"],["Stream overlay","Stream overlay","Social"]];
              const hasMatches = catalog.some(([key,label,category]) => (!templateSearch.trim() || (key+" "+label+" "+category).toLowerCase().includes(templateSearch.trim().toLowerCase())) && (templateCategory === "All" || category === templateCategory));
              return !hasMatches ? <div className="template-empty-state"><strong>No templates found</strong><span>Try another category or search for product, social, beauty or events.</span></div> : null;
            })()}
          </div>
          {!templateSearch.trim() && templateCategory === "All" && !showAllTemplates && <button type="button" className="template-find-more" onClick={() => setShowAllTemplates(true)}>Explore all templates <span aria-hidden="true">→</span><small>Browse all 40 designs</small></button>}
          {showAllTemplates && <button type="button" className="template-find-more template-show-less" onClick={() => { setShowAllTemplates(false); setTemplateSearch(""); setTemplateCategory("All"); }}>Show popular templates <span aria-hidden="true">↑</span></button>}
        </section>
        <section className="design-template-panel face-sticker-panel">
          <div className="design-template-heading"><div><span className="tool-kicker">FACE ACCESSORIES</span><h3>Realistic facial overlays</h3><p className="editor-hint">Add a shaded moustache, beard or goatee as an image layer. Drag it into place and resize it to fit the face. These are realistic-style overlays, not automatic face tracking.</p></div></div>
          <div className="face-sticker-grid">
            <button type="button" onClick={() => addSticker("Moustache","")}><span>✦</span><small>Moustache</small></button>
            <button type="button" onClick={() => addSticker("Goatee","")}><span>✦</span><small>Goatee</small></button>
            <button type="button" onClick={() => addSticker("Sunglasses","😎")}><span>😎</span><small>Sunglasses</small></button>
            <button type="button" onClick={() => addSticker("Crown","👑")}><span>👑</span><small>Crown</small></button>
            <button type="button" onClick={() => addSticker("Makeup","💄")}><span>💄</span><small>Makeup</small></button>
            <button type="button" onClick={() => addSticker("Blush","🌸")}><span>🌸</span><small>Blush</small></button>
            <button type="button" onClick={() => addSticker("Freckles","✨")}><span>✨</span><small>Freckles</small></button>
            <button type="button" onClick={() => addSticker("Beard","")}><span>✦</span><small>Beard</small></button>
            <button type="button" onClick={() => addSticker("Halo","😇")}><span>😇</span><small>Halo</small></button>
            <button type="button" onClick={() => addSticker("Sparkles","💫")}><span>💫</span><small>Sparkles</small></button>
            <button type="button" onClick={() => addSticker("Flower","🌺")}><span>🌺</span><small>Flower</small></button>
            <button type="button" onClick={() => addSticker("Star","⭐")}><span>⭐</span><small>Star</small></button>
            <button type="button" onClick={() => addSticker("Cat ears","🐱")}><span>🐱</span><small>Cat ears</small></button>
            <button type="button" onClick={() => addSticker("Mask","🎭")}><span>🎭</span><small>Mask</small></button>
            <button type="button" onClick={() => addSticker("Bow","🎀")}><span>🎀</span><small>Bow</small></button>
            <button type="button" onClick={() => addSticker("Hearts","💗")}><span>💗</span><small>Hearts</small></button>
          </div>
        </section>
        <details open><summary>Creative samples &amp; looks</summary>
          <div className="sample-grid">{PRESETS.map((p) => <button type="button" className="sample-card" key={p.name} onClick={() => applyPreset(p.values)}><i style={{ background: p.swatch }} /><b>{p.name}</b><small>{p.note}</small></button>)}</div>
        </details>
        <details open><summary>Frame &amp; transform</summary>
          <div className="chips">{["orig", "1:1", "4:5", "16:9", "9:16"].map((a) => <button type="button" key={a} className={s.aspect === a ? "on" : ""} onClick={() => set("aspect", a)}>{a === "orig" ? "Original" : a}</button>)}</div>
          <div className="chips"><button type="button" onClick={() => set("rotate", (s.rotate + 90) % 360)}>Rotate 90°</button><button type="button" className={s.flip ? "on" : ""} onClick={() => set("flip", !s.flip)}>Flip horizontal</button><button type="button" className={s.flipY ? "on" : ""} onClick={() => set("flipY", !s.flipY)}>Flip vertical</button></div>
          <Range label="Straighten" k="rotate" min={-45} max={45} step={0.5} />
        </details>
        {!flat && <details open><summary>Subject positioning</summary><Range label="Scale" k="scale" min={40} max={160} /><Range label="Horizontal position" k="offX" min={-50} max={50} /><Range label="Vertical position" k="offY" min={-50} max={50} /><Range label="Drop shadow" k="shadow" min={0} max={100} /></details>}
        {bg.kind === "image" && <details open><summary>Background controls</summary><Range label="Background blur" k="bgBlur" min={0} max={30} /></details>}
        <details open><summary>Light &amp; colour</summary><div className="editor-tool-actions"><button type="button" className="go" onClick={autoEnhance}>✦ Auto enhance</button><button type="button" className="chip" onClick={() => applyPreset({ brightness: 100, contrast: 100, saturation: 100, warmth: 0, tint: 0, fade: 0, vignette: 0 })}>Reset colour</button></div><p className="editor-hint">Auto enhance analyses a small preview and applies a balanced starting grade. You can still adjust every setting below.</p><Range label="Exposure / brightness" k="brightness" min={50} max={150} /><Range label="Contrast" k="contrast" min={50} max={160} /><Range label="Saturation" k="saturation" min={0} max={200} /><Range label="Warmth" k="warmth" min={-50} max={100} /><Range label="Tint" k="tint" min={-60} max={60} /><Range label="Fade" k="fade" min={0} max={60} /><Range label="Soft focus" k="blur" min={0} max={5} step={0.5} /><Range label="Vignette" k="vignette" min={0} max={85} /></details>
        <details><summary>Precision crop</summary>
          <p className="editor-hint">Trim the image by adjusting the crop boundaries. These changes are included in export.</p>
          <Range label="Crop from left" k="cropLeft" min={0} max={100 - s.cropWidth} />
          <Range label="Crop from top" k="cropTop" min={0} max={100 - s.cropHeight} />
          <Range label="Crop width" k="cropWidth" min={50} max={100 - s.cropLeft} />
          <Range label="Crop height" k="cropHeight" min={50} max={100 - s.cropTop} />
          <button type="button" className="chip" onClick={() => applyPreset({ cropLeft: 0, cropTop: 0, cropWidth: 100, cropHeight: 100 })}>Reset crop</button>
        </details>
        <details><summary>Advanced colour effects</summary>
          <Range label="Hue shift" k="hue" min={-180} max={180} />
          <Range label="Grayscale" k="grayscale" min={0} max={100} />
          <Range label="Sepia tone" k="sepia" min={0} max={100} />
          <Range label="Colour invert" k="invert" min={0} max={100} />
          <Range label="Film grain" k="grain" min={0} max={100} />
        </details>
        <details><summary>Frames &amp; borders</summary>
          <Range label="Border thickness" k="borderWidth" min={0} max={80} />
          <label className="rng">Border colour <input aria-label="Border colour" type="color" value={s.borderColor} onChange={(e) => set("borderColor", e.target.value)} /></label>
          <button type="button" className="chip" onClick={() => applyPreset({ borderWidth: 0 })}>Remove border</button>
        </details>
        <details><summary>Text &amp; watermark</summary><input aria-label="Overlay text" placeholder="Add a title, label or watermark…" maxLength={90} value={s.caption} onChange={(e) => set("caption", e.target.value)} /><div className="chips"><label className="rng">Text colour <input aria-label="Text colour" type="color" value={s.captionColor} onChange={(e) => set("captionColor", e.target.value)} /></label></div><Range label="Text size" k="captionSize" min={18} max={120} /><Range label="Vertical position" k="captionY" min={5} max={95} /></details>
        <details><summary>Export settings</summary><label className="export-filename-field">File name<input aria-label="Export file name" type="text" value={exportFileName} onChange={(e) => setExportFileName(e.target.value)} placeholder="Enter a file name" maxLength={80} /></label><select aria-label="Format" value={s.format} onChange={(e) => set("format", e.target.value)}><option value="png">PNG (transparent)</option><option value="jpeg">JPG</option><option value="webp">WebP</option></select><select aria-label="Size" value={s.maxSide} onChange={(e) => set("maxSide", Number(e.target.value))}><option value={0}>Full size</option><option value={4096}>Up to 4096 px</option><option value={2048}>Up to 2048 px</option><option value={1080}>Up to 1080 px</option></select>{s.format !== "png" && <Range label="Quality" k="quality" min={0.5} max={1} step={0.01} />}</details>
        <button className={`go${exportBusy ? " is-loading" : ""}`} type="button" disabled={exportBusy} onClick={() => void download()}>{exportBusy ? <><span className="btn-spinner" aria-hidden="true" /> Preparing export…</> : "Export image ↗"}</button>
        <button className="chip" type="button" onClick={() => { setHistory((h) => [...h.slice(-19), s]); setFuture([]); setS(DEFAULTS); }}>Reset all edits</button>
        <div className="editor-shortcuts"><b>Keyboard shortcuts</b><span><kbd>Ctrl</kbd> + <kbd>Z</kbd> Undo</span><span><kbd>Ctrl</kbd> + <kbd>Y</kbd> Redo</span><span><kbd>Ctrl</kbd> + <kbd>S</kbd> Export</span><span><kbd>+</kbd> / <kbd>−</kbd> Zoom · <kbd>0</kbd> Reset zoom</span><span><kbd>Esc</kbd> Exit active tool</span></div>
      </div>
    </div>
  );
}
