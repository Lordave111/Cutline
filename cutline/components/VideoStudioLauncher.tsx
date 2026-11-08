"use client";
import dynamic from "next/dynamic";
const VideoStudio=dynamic(()=>import("./VideoStudio"),{ssr:false,loading:()=> <div className="video-loading">Preparing your editing workspace…</div>});
export default function VideoStudioLauncher(){
 return <section className="motion-section reference-motion" id="motion"><VideoStudio/></section>;
}
