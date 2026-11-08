"use client";
import dynamic from "next/dynamic";
import {useState} from "react";
const VideoStudio=dynamic(()=>import("./VideoStudio"),{ssr:false,loading:()=> <div className="video-loading">Preparing the motion studio…</div>});
export default function VideoStudioLauncher(){
 const [open,setOpen]=useState(false);
 return <section className="motion-section" id="motion">
  <div className="motion-feature">
   <div className="motion-feature-copy">
    <div className="eyebrow"><span className="section-index">02</span> CUTLINE MOTION STUDIO</div>
    <h2>Video editing.<br/><span>Right here in Cutline.</span></h2>
    <p>Trim clips, combine footage, add music and sound, style your video, create captions and export — all from one simple workspace.</p>
    <div className="motion-feature-actions">
     <button className="motion-launch-primary" type="button" onClick={()=>setOpen(v=>!v)}>{open?"Close video editor":"Open video editor"} <span>↗</span></button>
     <a className="motion-feature-secondary" href="#studio">Go to photo editor</a>
    </div>
    <div className="motion-feature-points"><span>✦ Multi-clip tools</span><span>♫ Audio &amp; captions</span><span>↗ Browser-based export</span></div>
   </div>
   <div className="motion-feature-art" aria-hidden="true"><div className="motion-screen"><div className="motion-screen-top"><i/><i/><i/><span> CUTLINE / MOTION</span></div><div className="motion-screen-preview"><b>MAKE<br/>IT MOVE.</b><span>▶</span></div><div className="motion-screen-tracks"><i/><i/><i/></div></div><span className="motion-art-label">VIDEO / 01</span></div>
  </div>
  {open&&<VideoStudio/>}
 </section>;
}
