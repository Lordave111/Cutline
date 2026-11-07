import Studio from "@/components/Studio";
import AppShell from "@/components/AppShell";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

const tools = [
  { icon: "✂", title: "Background remover", text: "Create clean transparent cutouts.", href: "#studio", tone: "mint" },
  { icon: "✦", title: "AI photo editor", text: "Reimagine parts of an image with a prompt.", href: "#ai-help", tone: "violet" },
  { icon: "◐", title: "Color & filters", text: "Give every photo a distinct mood.", href: "#studio", tone: "blue" },
  { icon: "▧", title: "Design templates", text: "Start faster with ready-made layouts.", href: "#studio", tone: "orange" },
  { icon: "T", title: "Text & layers", text: "Build posters, stories and product art.", href: "#studio", tone: "pink" },
  { icon: "↗", title: "Export studio", text: "Prepare your finished creative.", href: "#studio", tone: "lime" },
];
const steps = [
  { number: "01", title: "Upload", text: "Bring in a portrait, product or any image." },
  { number: "02", title: "Create", text: "Use editing tools, templates and AI guidance." },
  { number: "03", title: "Export", text: "Fine-tune your design and save your result." },
];

export default function Home() {
  return (
    <main className="site-shell cutline-app" id="top">
      <AppShell />
      <div className="ambient ambient-one" /><div className="ambient ambient-two" />
      <header className="app-navbar">
        <a className="brand" href="#top" aria-label="Cutline home">
          <span className="brand-mark"><i /><i /><i /><i /></span>
          <span>CUTLINE<span className="brand-period">.</span><small>CREATIVE WORKSPACE</small></span>
        </a>
        <nav className="app-nav-links" aria-label="Main navigation">
          <a className="active" href="#top">Discover</a><a href="#studio">Studio</a><a href="#toolkit">Tools</a><a href="#ai-help">Help AI</a>
        </nav>
        <div className="app-nav-actions">
          <a className="nav-help-link" href="#help-center">Help centre</a>
          <SignedOut><SignInButton mode="modal"><button className="nav-signin">Sign in</button></SignInButton><a className="nav-cta" href="#studio">Start creating <span>↗</span></a></SignedOut>
          <SignedIn><a className="nav-cta" href="#studio">Open studio <span>↗</span></a><UserButton /></SignedIn>
        </div>
      </header>

      <section className="dashboard-welcome">
        <div className="welcome-copy">
          <div className="eyebrow"><span className="live-dot" /> YOUR CREATIVE SPACE</div>
          <h1>Ideas in. <span>Magic out.</span></h1>
          <p>Everything you need to turn ordinary photos into standout visuals. Pick a tool, ask your AI creative partner, and make something brilliant.</p>
          <div className="welcome-actions"><a className="primary-action" href="#studio">＋ Create new project <span>↗</span></a><a className="secondary-action" href="#toolkit">Explore tools ↓</a></div>
        </div>
        <div className="welcome-art" aria-hidden="true">
          <div className="welcome-orb orb-a" /><div className="welcome-orb orb-b" />
          <div className="welcome-art-card"><span className="art-card-label">CUTLINE / CREATIVE ENGINE</span><div className="art-collage"><i /><i /><i /><b>MAKE<br/>IT<br/>YOURS.</b></div><div className="art-card-footer"><span>✦ AI POWERED</span><span>✳ DESIGN TOOLS</span></div></div>
          <span className="welcome-float float-one">✦ CREATE</span><span className="welcome-float float-two">✳ EXPLORE</span>
        </div>
      </section>

      <section className="quick-start-strip">
        <div><span className="quick-start-icon">✧</span><span><b>Ready when you are</b><small>Start with a photo or explore the toolkit</small></span></div>
        <a href="#studio">Open your workspace <span>↗</span></a>
      </section>

      <section className="toolkit-section" id="toolkit">
        <div className="section-heading"><div><div className="eyebrow"><span className="section-index">01</span> THE CREATIVE TOOLKIT</div><h2>Pick your <span>superpower.</span></h2></div><p>A growing set of creative tools, all connected to one flexible editing workspace.</p></div>
        <div className="tool-launch-grid">
          {tools.map((tool) => <a className={`tool-launch-card tone-${tool.tone}`} href={tool.href} key={tool.title}><span className="tool-launch-icon">{tool.icon}</span><span className="tool-launch-arrow">↗</span><h3>{tool.title}</h3><p>{tool.text}</p><small>OPEN TOOL <b>→</b></small></a>)}
        </div>
      </section>

      <section className="workspace-intro" id="studio">
        <div className="section-heading"><div><div className="eyebrow"><span className="section-index">02</span> YOUR WORKSPACE</div><h2>Make it <span>happen.</span></h2></div><p>Upload an image to unlock the full editor, templates, layers, retouching and AI editing tools.</p></div>
        <Studio />
      </section>

      <section className="ai-promo-section" id="ai-help">
        <div className="ai-promo-copy"><span className="ai-promo-icon">✦</span><div className="eyebrow">YOUR CREATIVE PARTNER</div><h2>Stuck on an idea?<br/><span>Ask Cutline AI.</span></h2><p>Get help choosing edits, writing image prompts, planning a product shoot or finding the right creative direction.</p><a className="primary-action" href="#cutline-ai">Chat with AI <span>↗</span></a></div>
        <div className="ai-promo-orbit"><span>✦</span><b>AI</b><i>✧</i><small>IDEAS · PROMPTS · TIPS</small></div>
      </section>

      <section className="workflow-section" id="help-center">
        <div className="workflow-heading"><div className="eyebrow"><span className="section-index">03</span> QUICK HELP</div><h2>From first click to <span>final export.</span></h2><p>Three simple steps to get your next design moving.</p></div>
        <div className="workflow-grid">{steps.map((step) => <article className="workflow-step" key={step.number}><span>{step.number}</span><div><h3>{step.title}</h3><p>{step.text}</p></div><b>↗</b></article>)}</div>
        <div className="help-links"><a href="#studio">How do I start editing? <span>↗</span></a><a href="#ai-help">Get an idea from Cutline AI <span>↗</span></a><a href="#studio">Where are my templates? <span>↗</span></a></div>
      </section>

      <footer className="site-footer"><a className="brand footer-brand" href="#top"><span className="brand-mark"><i/><i/><i/><i/></span><span>CUTLINE<span className="brand-period">.</span><small>CREATIVE WORKSPACE</small></span></a><p>© {new Date().getFullYear()} CUTLINE STUDIO · CREATE WITHOUT LIMITS</p><a href="#top">BACK TO TOP ↑</a></footer>
    </main>
  );
}
