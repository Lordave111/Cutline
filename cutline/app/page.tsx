import Studio from "@/components/Studio";
import AppShell from "@/components/AppShell";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

const tools = [
  { icon: "✂", title: "Background studio", text: "Cut out subjects and build a cleaner scene.", tone: "mint", tag: "CUTOUTS" },
  { icon: "✦", title: "AI image editing", text: "Describe the change. Paint exactly where it belongs.", tone: "violet", tag: "GENERATIVE" },
  { icon: "◐", title: "Color lab", text: "Shape the mood with precise color controls.", tone: "blue", tag: "ADJUSTMENTS" },
  { icon: "▧", title: "Ready-made designs", text: "Start a social post, product visual or campaign.", tone: "orange", tag: "TEMPLATES" },
  { icon: "T", title: "Type & composition", text: "Give your image a clear visual hierarchy.", tone: "pink", tag: "DESIGN" },
  { icon: "↗", title: "Export desk", text: "Finish your image and download your result.", tone: "lime", tag: "OUTPUT" },
];

export default function Home() {
  return (
    <main className="site-shell cutline-app" id="top">
      <AppShell />
      <div className="ambient ambient-one" /><div className="ambient ambient-two" />
      <header className="app-navbar">
        <a className="brand" href="#top" aria-label="Cutline home">
          <span className="brand-mark"><i /><i /><i /><i /></span>
          <span>CUTLINE<span className="brand-period">.</span><small>IMAGE WORKSPACE</small></span>
        </a>
        <nav className="app-nav-links" aria-label="Main navigation">
          <a className="active" href="#top">Overview</a><a href="#studio">Editor</a><a href="#toolkit">Explore tools</a><a href="#cutline-ai">AI assistant</a>
        </nav>
        <div className="app-nav-actions">
          <a className="nav-help-link" href="#help-center">Help</a>
          <SignedOut><SignInButton mode="modal"><button className="nav-signin">Sign in</button></SignInButton><a className="nav-cta" href="#studio">Open workspace <span>↗</span></a></SignedOut>
          <SignedIn><a className="nav-cta" href="#studio">Open workspace <span>↗</span></a><UserButton /></SignedIn>
        </div>
      </header>

      <section className="dashboard-welcome">
        <div className="welcome-copy">
          <div className="eyebrow"><span className="live-dot" /> THE CREATIVE WORKSPACE</div>
          <h1>Make the image<br/><span>you imagined.</span></h1>
          <p>Cut out, retouch, rework and redesign your photos in one focused studio. Start with an image — then take it wherever your idea leads.</p>
          <div className="welcome-actions"><a className="primary-action" href="#studio">＋ Start creating <span>↗</span></a><a className="secondary-action" href="#toolkit">Explore the tools <span>↓</span></a></div>
          <div className="welcome-proof"><span>01 / UPLOAD</span><i/><span>02 / CREATE</span><i/><span>03 / EXPORT</span></div>
        </div>
        <div className="welcome-art" aria-label="Abstract Cutline editing preview">
          <div className="welcome-orb orb-a" /><div className="welcome-orb orb-b" />
          <div className="welcome-art-card"><div className="art-card-label"><span>✳ CUTLINE CANVAS</span><span>LIVE CONCEPT / 01</span></div><div className="art-collage"><i/><i/><i/><b>FORM<br/>MEETS<br/>FEELING.</b><span className="art-corner">✦</span></div><div className="art-card-footer"><span>SUBJECT / ISOLATED</span><span>COLOR / GRADED</span></div></div>
          <span className="welcome-float float-one">✦ CREATIVE CONTROL</span><span className="welcome-float float-two">◈ READY TO EXPORT</span>
        </div>
      </section>

      <section className="quick-start-strip">
        <div><span className="quick-start-icon">↗</span><span><b>Your next idea starts here</b><small>Upload a photo to open the full editing workspace.</small></span></div>
        <a href="#studio">Go to editor <span>↗</span></a>
      </section>

      <section className="workspace-intro" id="studio">
        <div className="section-heading"><div><div className="eyebrow"><span className="section-index">01</span> THE EDITOR</div><h2>Your canvas. <span>Your rules.</span></h2></div><p>Bring in a photo to unlock the editing canvas, background controls, templates and AI-assisted edits.</p></div>
        <Studio />
      </section>

      <section className="toolkit-section" id="toolkit">
        <div className="section-heading"><div><div className="eyebrow"><span className="section-index">02</span> EXPLORE THE WORKSPACE</div><h2>A tool for every <span>idea.</span></h2></div><p>Choose a starting point. Every tool leads into the same creative workflow.</p></div>
        <div className="tool-launch-grid">
          {tools.map((tool) => <a className={`tool-launch-card tone-${tool.tone}`} href={tool.title === "AI image editing" ? "#cutline-ai" : "#studio"} key={tool.title}><span className="tool-launch-icon">{tool.icon}</span><span className="tool-launch-arrow">↗</span><small className="tool-tag">{tool.tag}</small><h3>{tool.title}</h3><p>{tool.text}</p><span className="tool-open">EXPLORE TOOL <b>↗</b></span></a>)}
        </div>
      </section>

      <section className="ai-promo-section" id="ai-help">
        <div className="ai-promo-copy"><span className="ai-promo-icon">✦</span><div className="eyebrow">CREATIVE COPILOT</div><h2>Good ideas deserve<br/><span>a great starting point.</span></h2><p>Ask Cutline AI for editing advice, image prompts, product-photo concepts or help choosing the right creative direction.</p><a className="primary-action" href="#cutline-ai">Talk to Cutline AI <span>↗</span></a></div>
        <div className="ai-promo-orbit"><span>✦</span><b>AI</b><i>✧</i><small>IDEAS / PROMPTS / GUIDANCE</small></div>
      </section>

      <section className="workflow-section" id="help-center">
        <div className="workflow-heading"><div className="eyebrow"><span className="section-index">03</span> A SIMPLE WORKFLOW</div><h2>From raw photo to <span>finished work.</span></h2><p>No complicated setup. Just a clear path from upload to export.</p></div>
        <div className="workflow-grid"><article className="workflow-step"><span>01</span><div><h3>Bring your image</h3><p>Upload a portrait, product shot or any photo you want to transform.</p></div><b>↗</b></article><article className="workflow-step"><span>02</span><div><h3>Make it yours</h3><p>Adjust the background, refine the image and explore creative tools.</p></div><b>↗</b></article><article className="workflow-step"><span>03</span><div><h3>Take it with you</h3><p>Review your result and download your finished creative.</p></div><b>↗</b></article></div>
      </section>

      <footer className="site-footer"><a className="brand footer-brand" href="#top"><span className="brand-mark"><i/><i/><i/><i/></span><span>CUTLINE<span className="brand-period">.</span><small>IMAGE WORKSPACE</small></span></a><p>© {new Date().getFullYear()} CUTLINE · MADE FOR THE DETAILS</p><a href="#top">BACK TO TOP ↑</a></footer>
    </main>
  );
}
