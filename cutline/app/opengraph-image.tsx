import { ImageResponse } from "next/og";

export const alt = "Cutline — AI Photo Editor and Creative Studio";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "66px 76px",
          background: "linear-gradient(135deg, #0b1114 0%, #13251f 55%, #263d35 100%)",
          color: "#f5f8f3",
          fontFamily: "Arial, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", right: "-100px", top: "-190px", width: "650px", height: "650px", borderRadius: "50%", background: "radial-gradient(circle, rgba(194,255,105,.22), rgba(194,255,105,0) 68%)" }} />
        <div style={{ display: "flex", alignItems: "center", gap: "18px", fontSize: 26, fontWeight: 800, letterSpacing: "5px" }}>
          <div style={{ width: 54, height: 54, borderRadius: 16, background: "#d5ff62", color: "#101610", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>✦</div>
          CUTLINE<span style={{ color: "#d5ff62" }}>.</span>
          <span style={{ color: "#aab9ae", fontSize: 14, letterSpacing: "3px", marginLeft: 8 }}>CREATIVE STUDIO</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 780, position: "relative" }}>
          <div style={{ color: "#d5ff62", fontSize: 17, letterSpacing: "5px", marginBottom: 24 }}>YOUR IMAGE. YOUR CREATIVE CONTROL.</div>
          <div style={{ fontSize: 76, lineHeight: 1.04, fontWeight: 800, letterSpacing: "-3px" }}>Make the image</div>
          <div style={{ fontSize: 76, lineHeight: 1.04, fontWeight: 800, letterSpacing: "-3px", color: "#d5ff62" }}>you imagined.</div>
          <div style={{ color: "#c1cec5", fontSize: 24, marginTop: 26 }}>Remove backgrounds · Retouch · Reimagine · Export</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid rgba(255,255,255,.2)", paddingTop: 22, color: "#aab9ae", fontSize: 16, letterSpacing: "2px" }}>
          <span>PHOTO EDITING, REFINED.</span>
          <span style={{ color: "#d5ff62" }}>CUTLINE-GAMMA.VERCEL.APP ↗</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
