"use client";
import dynamic from "next/dynamic";
import {useState} from "react";
const VideoStudio=dynamic(()=>import("./VideoStudio"),{ssr:false,loading:()=> <div className="video-loading">Preparing the motion studio…</div>});
export default function VideoStudioLauncher(){const [open,setOpen]=useState(false);return <section className="motion-section" id="motion"><div className="section-heading"><div><div className="eyebrow"><span className="section-index">02</span> CUTLINE MOTION STUDIO</div><h2>Bring your ideas <span>to life.</span></h2></div><p>Trim clips, control playback speed, add a look and place a title. Open the video editor only when you need it.</p></div>{open?<VideoStudio/>:<button className="motion-launch" onClick={()=>setOpen(true)}><span>▶</span><b>Open video editor</b><small>Lightweight workspace · browser-based processing</small><i>↗</i></button>}</section>}
