import Studio from "@/components/Studio";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

const features = [
  { number: "01", icon: "◈", title: "Precision cutouts", description: "Remove image backgrounds and isolate the details that matter." },
  { number: "02", icon: "✳", title: "AI scene generation", description: "Describe the scene. Create a fresh setting for your subject." },
  { number: "03", icon: "⌁", title: "Creative control", description: "Fine-tune framing, colour, lighting, text and final exports." },
];

const workflow = [
  { number: "01", title: "Bring your image", description: "Upload a product, portrait or any image you want to transform." },
  { number: "02", title: "Make it yours", description: "Cut out, replace the background and shape every detail." },
  { number: "03", title: "Export your work", description: "Download a polished image ready for your next big idea." },
];

export default function Home() {
  return (
    <main className="site-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <nav className="topbar">
        <a className="brand" href="#" aria-label="Cutline home">
          <span className="brand-mark"><i /><i /><i /><i /></span>
          <span>CUTLINE<span className="brand-period">.</span><small>CREATIVE STUDIO</small></span>
        </a>
        <div className="nav-links">
          <a href="#studio">Studio</a>
          <a href="#features">Features</a>
          <a href="#workflow">How it works</a>
        </div>
        <div className="nav-actions">
          <SignedOut>
            <SignInButton mode="modal"><button className="nav-signin">Sign in</button></SignInButton>
            <a className="nav-cta" href="#studio">Open studio <span>↗</span></a>
          </SignedOut>
          <SignedIn>
            <a className="nav-cta" href="#studio">Open studio <span>↗</span></a>
            <UserButton />
          </SignedIn>
        </div>
      </nav>

      <section className="hero-shell">
        <div className="hero-copy">
          <div className="eyebrow"><span className="live-dot" /> THE NEXT GENERATION IMAGE WORKSPACE</div>
          <h1>Make every image<br />a <span>masterpiece.</span></h1>
          <p className="hero-description">A powerful creative studio for removing backgrounds, building new scenes and polishing every detail — all in one place.</p>
          <div className="hero-actions">
            <a className="primary-action" href="#studio">Start creating <span>↗</span></a>
            <a className="secondary-action" href="#features">Explore the studio <span>↓</span></a>
          </div>
          <div className="hero-proof">
            <div className="proof-avatars"><span>✦</span><span>◈</span><span>✳</span></div>
            <p><strong>One creative workspace.</strong><br />Your ideas, without the complicated workflow.</p>
          </div>
        </div>

        <div className="hero-art" aria-label="Abstract creative image editing preview">
          <div className="art-orbit orbit-a" />
          <div className="art-orbit orbit-b" />
          <div className="art-window">
            <div className="art-window-top"><span><i /> CUTLINE / CANVAS_01</span><span>LIVE PREVIEW</span></div>
            <div className="art-canvas">
              <div className="art-glow" />
              <div className="art-shape shape-back" />
              <div className="art-shape shape-front" />
              <div className="art-spark spark-one">✳</div>
              <div className="art-spark spark-two">✦</div>
              <div className="art-label label-top">OBJECT ISOLATED <b>✓</b></div>
              <div className="art-label label-bottom">LIGHT / 82% <span>●</span></div>
            </div>
            <div className="art-window-bottom"><span>01 — SUBJECT</span><span>BACKGROUND REMOVED</span><span>4K READY ↗</span></div>
          </div>
          <div className="float-card float-ai"><span className="float-icon">✳</span><div><b>AI assistant</b><small>Ready to create</small></div><span className="float-live" /></div>
          <div className="float-card float-export"><span className="export-icon">↗</span><div><b>Studio quality</b><small>Export ready</small></div></div>
        </div>
      </section>

      <div className="capability-strip">
        <span>BUILT FOR CREATORS</span><i /> BACKGROUND REMOVAL <i /> AI SCENES <i /> PHOTO EDITING <i /> CREATIVE EXPORTS
      </div>

      <section className="workspace-intro" id="studio">
        <div className="section-heading">
          <div><div className="eyebrow"><span className="section-index">01</span> YOUR CREATIVE WORKSPACE</div><h2>Everything starts <span>here.</span></h2></div>
          <p>Drop in an image and take control. Your editing tools, AI features and exports live in one focused workspace.</p>
        </div>
        <Studio />
      </section>

      <section className="feature-section" id="features">
        <div className="section-heading">
          <div><div className="eyebrow"><span className="section-index">02</span> BUILT TO DO MORE</div><h2>More than an <span>editor.</span></h2></div>
          <p>From the first cutout to the final creative, every tool is designed to keep your workflow moving.</p>
        </div>
        <div className="feature-grid">
          {features.map((feature) => (
            <article className="feature-card" key={feature.number}>
              <div className="feature-card-top"><span>{feature.number} / TOOL</span><b>{feature.icon}</b></div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
              <span className="feature-arrow">↗</span>
            </article>
          ))}
        </div>
      </section>

      <section className="workflow-section" id="workflow">
        <div className="workflow-heading"><div className="eyebrow"><span className="section-index">03</span> SIMPLE BY DESIGN</div><h2>From image to <span>impact.</span></h2><p>A clear creative flow that gives you more control and less busywork.</p></div>
        <div className="workflow-grid">
          {workflow.map((item) => (
            <article className="workflow-step" key={item.number}>
              <span>{item.number}</span><div><h3>{item.title}</h3><p>{item.description}</p></div><b>↗</b>
            </article>
          ))}
        </div>
      </section>

      <section className="closing-banner">
        <div><div className="eyebrow"><span className="live-dot" /> YOUR NEXT IDEA STARTS HERE</div><h2>Make something<br /><span>worth looking at.</span></h2></div>
        <a className="primary-action" href="#studio">Enter the studio <span>↗</span></a>
      </section>

      <footer className="site-footer">
        <a className="brand footer-brand" href="#"><span className="brand-mark"><i /><i /><i /><i /></span><span>CUTLINE<span className="brand-period">.</span><small>CREATIVE STUDIO</small></span></a>
        <p>© {new Date().getFullYear()} CUTLINE STUDIO. CREATE WITHOUT LIMITS.</p>
        <a href="#studio">BACK TO TOP ↑</a>
      </footer>
    </main>
  );
}
