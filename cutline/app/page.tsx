"use client";

import Studio from "@/components/Studio";
import AppShell from "@/components/AppShell";
import VideoStudioLauncher from "@/components/VideoStudioLauncher";
import Assistant from "@/components/Assistant";
import PointsStore from "@/components/PointsStore";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

const projectTools = [
  { icon: "◈", name: "Media", hint: "Import photos and video", target: "#media-tools" },
  { icon: "✂", name: "Trim & split", hint: "Shape your clips", target: "#trim-tools" },
  { icon: "♫", name: "Audio", hint: "Music and sound layers", target: "#audio-tools" },
  { icon: "T", name: "Text & captions", hint: "Titles and subtitles", target: "#caption-tools" },
  { icon: "◉", name: "Effects", hint: "Colour and visual looks", target: "#effect-tools" },
  { icon: "✧", name: "AI tools", hint: "Generate captions and ideas", target: "#ai-tools" },
];

export default function Home() {
  return (
    <main className="site-shell cutline-app reference-studio" id="top">
      <AppShell />
      <header className="cutline-main-nav"><a className="cutline-nav-brand" href="#top"><span>✦</span> CUTLINE</a><nav aria-label="Main navigation"><a href="#video-editor">Video editor</a><a href="#photo-editor">Photo editor</a><a href="#templates">Templates</a><a href="#points">Buy points</a></nav><a className="cutline-nav-points" href="#points">✦ Get points</a></header>
      <aside className="studio-rail" aria-label="Workspace navigation">
        <a className="rail-brand" href="#top" aria-label="Cutline home"><span>c</span></a>
        <nav>
          <a href="#top" className="rail-link"><i>⌂</i><span>Home</span></a>
          <a href="#video-editor" className="rail-link selected"><i>▣</i><span>Video editor</span></a><a href="#photo-editor" className="rail-link"><i>▧</i><span>Photo editor</span></a><a href="#points" className="rail-link"><i>✦</i><span>Points</span></a>
          <a href="#templates" className="rail-link"><i>✦</i><span>Templates</span></a>
          <a href="#text-tools" className="rail-link"><i>T</i><span>Text</span></a>
          <a href="#effect-tools" className="rail-link"><i>◉</i><span>Effects</span></a>
          <a href="#audio-tools" className="rail-link"><i>♫</i><span>Audio</span></a>
        </nav>
        <a className="rail-help" href="#help-center" aria-label="Help">?</a>
        <span className="rail-bottom-mark">✳</span>
      </aside>

      <div className="studio-main">
        <header className="studio-topbar" id="project">
          <div className="project-identity"><span className="project-back">‹</span><div><small>PROJECT / VIDEO EDITOR</small><b>Untitled project</b></div><button type="button" className="project-rename" aria-label="Project options">⌄</button></div>
          <div className="topbar-status"><span className="save-indicator"><i/> Local editing</span><a href="#preview" className="topbar-quiet">▷ Preview</a><button type="button" className="topbar-quiet" onClick={() => { if (navigator.share) void navigator.share({ title: "Cutline Studio", url: location.href }); else void navigator.clipboard?.writeText(location.href); }}>♧ Share</button><a href="#export-tools" className="topbar-render">✦ Render</a><SignedOut><SignInButton mode="modal"><button className="topbar-signin">Sign in</button></SignInButton></SignedOut><SignedIn><UserButton/></SignedIn></div>
        </header>

        <section className="editor-workspace" id="video-editor" aria-label="Video editing workspace">
          <aside className="project-tools-panel">
            <div className="panel-title-row"><b>Project tools</b><span>▦</span></div>
            <label className="tool-search"><span>⌕</span><input placeholder="Search tools and filters" aria-label="Search tools"/></label>
            <div className="tool-filter-tabs"><span>All</span><span>Video</span><span>Audio</span><span>AI</span></div>
            <div className="project-tool-list">
              {projectTools.map((tool) => <a href={tool.target} className="project-tool" key={tool.name}><i>{tool.icon}</i><span><b>{tool.name}</b><small>{tool.hint}</small></span><em>＋</em></a>)}
            </div>
            <div className="tool-panel-tip"><span>✦ QUICK TIP</span><p>Your media stays on your device while you edit. Add clips and audio to build your project.</p></div>
          </aside>

          <div className="editor-center-column">
            <div className="canvas-toolbar"><span>33% <i>⌄</i></span><span>◉ &nbsp; Adjust</span><b>Preview canvas</b><span>HD <i>⌄</i></span></div>
            <div id="preview"><VideoStudioLauncher/></div>
          </div>

          <aside className="ai-generator-panel" id="ai-tools">
            <div className="ai-panel-heading"><span>✦</span><div><b>AI Content Assistant</b><small>Creative help, captions & ideas</small></div><i>●</i></div>
            <Assistant embedded/>
            <div className="ai-panel-foot"><span>✧</span><p>Describe your goal and get help with captions, hooks, prompts and editing ideas.</p></div>
          </aside>
        </section>

        <section className="points-workspace-section" id="points"><PointsStore/></section>
        <section className="photo-workspace-section" id="photo-editor">
          <div className="photo-workspace-heading"><div><small>PHOTO EDITOR</small><h2>Photo editor & design workspace</h2><p>Retouch photos, remove backgrounds, build designs and work with layers.</p></div><span>✦ FULL PHOTO STUDIO</span></div>
          <div className="photo-workspace-inner"><Studio/></div>
        </section>

        <footer className="studio-footer" id="help-center"><span>CUTLINE STUDIO <i>●</i> YOUR CREATIVE WORKSPACE</span><span>Need a hand? <a href="#ai-tools">Ask Cutline AI ↗</a></span></footer>
      </div>
    </main>
  );
}
