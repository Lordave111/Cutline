import Studio from "@/components/Studio";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

const steps = [
  ["01", "Cut out", "Upload a photo and get a clean transparent PNG."],
  ["02", "Describe it", "Type the background you want and let AI build the scene."],
  ["03", "Bring your own", "Upload any image and your subject is placed on it."],
];

export default function Home() {
  return (
    <main className="wrap">
      <nav><span className="logo">&gt; CUTLINE<i>_</i></span><span><SignedOut><SignInButton mode="modal"><button className="link">Sign in</button></SignInButton></SignedOut><SignedIn><UserButton /></SignedIn></span></nav>
      <section className="hero">
        <p className="tag">IMAGE BACKGROUND ENGINE</p>
        <h1>Remove backgrounds.<br />Build new ones.</h1>
        <p className="sub">Cut out any subject in seconds, then place it on a color, your own image, or a scene you describe.</p>
      </section>
      <Studio />
      <section className="steps">
        {steps.map(([n, t, d]) => (
          <div className="panel" key={n}><span className="tag">{n}</span><h3>{t}</h3><p>{d}</p></div>
        ))}
      </section>
      <footer>© {new Date().getFullYear()} Cutline. Images are processed and not stored by this site.</footer>
    </main>
  );
}
