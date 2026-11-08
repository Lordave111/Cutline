import Studio from "@/components/Studio";
import AppShell from "@/components/AppShell";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

const tools = [
  { icon: "✂", title: "Background studio", text: "Remove a background and create a cleaner scene.", tone: "mint", tag: "CUTOUTS" },
  { icon: "✦", title: "AI image editing", text: "Describe the change. Paint exactly where it belongs.", tone: "violet", tag: "GENERATIVE" },
  { icon: "◐", title: "Color lab", text: "Give every image its own tone, depth and mood.", tone: "blue", tag: "ADJUSTMENTS" },
  { icon: "▧", title: "Design templates", text: "Build product visuals, social posts and campaigns.", tone: "orange", tag: "TEMPLATES" },
  { icon: "T", title: "Type & composition", text: "Bring clarity and hierarchy to every design.", tone: "pink", tag: "DESIGN" },
  { icon: "↗", title: "Export desk", text: "Polish the details and take your work anywhere.", tone: "lime", tag: "OUTPUT" },
];

export default function Home() {
  return (
    <main className="site-shell cutline-app" id="top">
      <AppShell />
      <div className="ambient ambient-one" /><div className="ambient ambient-two" />
      <header className="app-navbar">
        <a className="brand" href="#top" aria-label="Cutline home">
          <span className="brand-mark"><i /><i /><i /><i /></span>
          <span>CUTLINE<span className="brand-period">.</span><small>CREATIVE IMAGE STUDIO</small></span>
        </a>
        <nav className="app-nav-links" aria-label="Main navigation">
          <a className="active" href="#top">Home</a><a href="#studio">Workspace</a><a href="#toolkit">Tools</a><a href="#help-center">How it works</a>
        </nav>
        <div className="app-nav-actions">
          <a className="nav-help-link" href="#help-center">Support</a>
          <SignedOut><SignInButton mode="modal"><button className="nav-signin">Sign in</button></SignInButton><a className="nav-cta" href="#studio">Open studio <span>↗</span></a></SignedOut>
          <SignedIn><a className="nav-cta" href="#studio">Open studio <span>↗</span></a><UserButton /></SignedIn>
        </div>
      </header>

      <section className="dashboard-welcome">
        <div className="welcome-copy">
          <div className="eyebrow"><span className="live-dot" /> YOUR CREATIVE SPACE, REIMAGINED</div>
          <h1>Make every image<br/><span>feel intentional.</span></h1>
          <p>From clean cutouts to thoughtful retouching and AI-powered edits, Cutline gives you the tools to turn a good photo into work worth sharing.</p>
          <div className="welcome-actions"><a className="primary-action" href="#studio">＋ Start creating <span>↗</span></a><a className="secondary-action" href="#toolkit">Discover the tools <span>↓</span></a></div>
          <div className="welcome-proof"><span>01 / UPLOAD</span><i/><span>02 / CREATE</span><i/><span>03 / EXPORT</span></div>
        </div>
        <div className="welcome-art" aria-label="Cutline creative workspace preview">
          <div className="welcome-orb orb-a" /><div className="welcome-orb orb-b" />
          <div className="welcome-art-card">
            <div className="art-card-label"><span>✳ THE CUTLINE STUDIO</span><span>CREATIVE PREVIEW / 01</span></div>
            <div className="art-collage"><i/><i/><i/><b>MAKE<br/>IT<br/>MATTER.</b><span className="art-corner">✦</span></div>
            <div className="art-card-footer"><span>SUBJECT / REFINED</span><span>FINISH / YOURS</span></div>
          </div>
          <span className="welcome-float float-one">✦ AI-POWERED EDITING</span><span className="welcome-float float-two">◈ READY WHEN YOU ARE</span>
        </div>
      </section>

      <section className="quick-start-strip">
        <div><span className="quick-start-icon">↗</span><span><b>A better edit is one upload away</b><small>Bring in a photo and make the workspace your own.</small></span></div>
        <a href="#studio">Enter the workspace <span>↗</span></a>
      </section>

      <section className="workspace-intro" id="studio">
        <div className="section-heading"><div><div className="eyebrow"><span className="section-index">01</span> THE CREATIVE WORKSPACE</div><h2>Everything starts <span>on your canvas.</span></h2></div><p>Upload a photo to unlock the full editor, from background tools and precise adjustments to AI-assisted changes and export.</p></div>
        <Studio />
      </section>

      <section className="toolkit-section" id="toolkit">
        <div className="section-heading"><div><div className="eyebrow"><span className="section-index">02</span> BUILT FOR YOUR IDEAS</div><h2>More than a quick <span>touch-up.</span></h2></div><p>A considered set of creative tools, brought together in one focused workflow.</p></div>
        <div className="tool-launch-grid">
          {tools.map((tool) => <a className={`tool-launch-card tone-${tool.tone}`} href={tool.title === "AI image editing" ? "#cutline-ai" : "#studio"} key={tool.title}><span className="tool-launch-icon">{tool.icon}</span><span className="tool-launch-arrow">↗</span><small className="tool-tag">{tool.tag}</small><h3>{tool.title}</h3><p>{tool.text}</p><span className="tool-open">EXPLORE TOOL <b>↗</b></span></a>)}
        </div>
      </section>

      <section className="ai-promo-section" id="ai-help">
        <div className="ai-promo-copy"><span className="ai-promo-icon">✦</span><div className="eyebrow">YOUR CREATIVE COPILOT</div><h2>When inspiration hits,<br/><span>make something of it.</span></h2><p>Talk through an idea, get help shaping an image prompt or find a new direction for your next edit with Cutline AI.</p><a className="primary-action" href="#cutline-ai">Meet Cutline AI <span>↗</span></a></div>
        <div className="ai-promo-orbit"><span>✦</span><b>AI</b><i>✧</i><small>IDEAS / PROMPTS / GUIDANCE</small></div>
      </section>

      <section className="workflow-section" id="help-center">
        <div className="workflow-heading"><div className="eyebrow"><span className="section-index">03</span> A CLEAR CREATIVE FLOW</div><h2>From first upload to <span>final finish.</span></h2><p>Powerful tools should feel simple. Cutline keeps the process clear, so you can focus on the image.</p></div>
        <div className="workflow-grid"><article className="workflow-step"><span>01</span><div><h3>Start with a photo</h3><p>Upload a portrait, product shot or any image you want to improve.</p></div><b>↗</b></article><article className="workflow-step"><span>02</span><div><h3>Shape the details</h3><p>Refine the subject, change the scene and bring your idea to life.</p></div><b>↗</b></article><article className="workflow-step"><span>03</span><div><h3>Make it yours</h3><p>Review your work, export the result and share it with confidence.</p></div><b>↗</b></article></div>
      </section>

      <footer className="site-footer"><a className="brand footer-brand" href="#top"><span className="brand-mark"><i/><i/><i/><i/></span><span>CUTLINE<span className="brand-period">.</span><small>CREATIVE IMAGE STUDIO</small></span></a><p>© {new Date().getFullYear()} CUTLINE · MADE FOR THE DETAILS</p><a href="#top">BACK TO TOP ↑</a></footer>
    </main>
  );
}
