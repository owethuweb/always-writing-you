import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import logo from "@/assets/logo.png";
import { supabase } from "@/integrations/supabase/client";

type DbPost = {
  id: string;
  title: string;
  body: string;
  image_url: string | null;
  created_at: string;
};

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Still Writing — a love letter that doesn't stop" },
      {
        name: "description",
        content:
          "Still Writing — words I keep finding for you, and anyone who needs them. A love letter that doesn't stop.",
      },
      { property: "og:title", content: "Still Writing" },
      {
        property: "og:description",
        content: "A love letter that doesn't stop.",
      },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&family=Jost:wght@300;400;500&display=swap",
      },
    ],
  }),
});

function Index() {
  const [toast, setToast] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [email, setEmail] = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2400);
  };

  const [dbPosts, setDbPosts] = useState<DbPost[]>([]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModalOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    supabase
      .from("posts")
      .select("id, title, body, image_url, created_at")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setDbPosts(data as DbPost[]);
      });
  }, []);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

  const share = async (title: string, text: string) => {
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(`${text}\n\n${window.location.href}`);
        showToast("Link copied to share ✦");
      }
    } catch {
      /* dismissed */
    }
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast("Copied to your heart ♡");
    } catch {
      showToast("Couldn't copy");
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) {
      showToast("Pop your email in first ♡");
      return;
    }
    setModalOpen(false);
    setEmail("");
    showToast("You're in — watch your inbox ✦");
  };

  return (
    <>
      <style>{styles}</style>

      <header>
        <div className="header-inner">
          <a className="logo" href="#top">
            <img className="logo-mark" src={logo} alt="Still Writing" />
            <span className="logo-text">
              Still <span>Writing</span>
            </span>
          </a>
          <nav>
            <button className="nav-btn" onClick={() => setModalOpen(true)}>
              Notify me
            </button>
            <button className="subscribe-btn" onClick={() => setModalOpen(true)}>
              Follow along
            </button>
          </nav>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="hero-eyebrow">A love letter that doesn't stop</div>
        <h1 className="hero-title">
          Still <em>Writing</em>
        </h1>
        <p className="hero-tagline">
          words I keep finding for you, and anyone who needs them
        </p>
      </section>

      <div className="ornament">— ✦ —</div>

      <main className="posts">
        {dbPosts.map((p, i) => (
          <article className="post" key={p.id}>
            <div className="post-meta">
              <span className="post-number">
                No. {String(dbPosts.length + 2 - i).padStart(3, "0")}
              </span>
              <span className="post-divider" />
              <span className="post-date">{formatDate(p.created_at)}</span>
            </div>
            {p.image_url && (
              <img className="post-image" src={p.image_url} alt={p.title} />
            )}
            {p.title && <h2 className="post-title">{p.title}</h2>}
            <div className="post-body">
              {p.body.split(/\n\n+/).map((para, idx) => (
                <p key={idx} style={{ whiteSpace: "pre-wrap" }}>{para}</p>
              ))}
            </div>
            <div className="post-footer">
              <button
                className="action-btn"
                onClick={() => share(p.title || "Still Writing", p.body.slice(0, 140))}
              >
                Share this
              </button>
              <button className="action-btn" onClick={() => copy(p.body)}>
                Copy
              </button>
            </div>
          </article>
        ))}
        <article className="post">
          <div className="post-meta">
            <span className="post-number">No. 001</span>
            <span className="post-divider" />
            <span className="post-date">May 13, 2026</span>
          </div>
          <div className="post-body">
            <p>
              Thanks for letting me in, I see you. You opened a door in my heart
              to see myself more clearly.
            </p>
            <p>
              Everything you believe in starts with you — I operate from inside
              out too, not because you gave me a manual, but it's easier to send
              my love to you when I start within.
            </p>
            <div className="verse">
              If I was a poet I'd tell you:
              <br />
              <br />
              roses are red, violets are blue
              <br />
              These feelings I have for you are true
              <br />
              <br />
              Roses are red, violets are blu —
              <br />
              I've found a friend, bro and boo
            </div>
          </div>
          <div className="post-footer">
            <button
              className="action-btn"
              onClick={() =>
                share(
                  "Still Writing — No. 001",
                  "Thanks for letting me in, I see you.",
                )
              }
            >
              Share this
            </button>
            <button
              className="action-btn"
              onClick={() =>
                copy(
                  "Thanks for letting me in, I see you. You opened a door in my heart to see myself more clearly.",
                )
              }
            >
              Copy
            </button>
          </div>
        </article>

        <article className="post">
          <div className="post-meta">
            <span className="post-number">No. 002</span>
            <span className="post-divider" />
            <span className="post-date">May 13, 2026</span>
          </div>
          <div className="post-body">
            <p className="one-liner">
              You are the reason I believe
              <br />
              softness is a superpower.
            </p>
          </div>
          <div className="post-footer">
            <button
              className="action-btn"
              onClick={() =>
                share(
                  "Still Writing — No. 002",
                  "You are the reason I believe softness is a superpower.",
                )
              }
            >
              Share this
            </button>
            <button
              className="action-btn"
              onClick={() =>
                copy("You are the reason I believe softness is a superpower.")
              }
            >
              Copy
            </button>
          </div>
        </article>
      </main>

      <div
        className={`modal-overlay${modalOpen ? " open" : ""}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) setModalOpen(false);
        }}
      >
        <div className="modal">
          <button className="modal-close" onClick={() => setModalOpen(false)}>
            ✕
          </button>
          <img className="modal-logo" src={logo} alt="Still Writing" />
          <h2>Stay close</h2>
          <p>
            New letters land in your inbox whenever I write one. No noise, just
            love.
          </p>
          <form onSubmit={submit}>
            <input
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button type="submit" className="modal-submit">
              Follow along
            </button>
          </form>
        </div>
      </div>

      <a
        className="coffee-btn"
        href="https://buymeacoffee.com/stillwriting"
        target="_blank"
        rel="noreferrer"
      >
        <svg viewBox="0 0 24 24">
          <path d="M4 8h14a3 3 0 0 1 0 6h-1v1a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8zm14 2v2a1 1 0 0 0 0-2zM7 2h2v3H7zm4 0h2v3h-2zm4 0h2v3h-2z" />
        </svg>
        <span>Buy me a coffee</span>
      </a>

      <footer>
        <div className="footer-inner">
          <div className="footer-logo">Still Writing</div>
          <div className="footer-note">
            made with love · shared with everyone · written for one
          </div>
        </div>
      </footer>

      <div className={`toast${toast ? " show" : ""}`}>{toast}</div>
    </>
  );
}

const styles = `
  :root {
    --cream: #F7F2E8;
    --parchment: #EDE5D4;
    --ink: #2A1F17;
    --wine: #6B2737;
    --wine-light: #9B4455;
    --gold: #B8873A;
    --gold-light: #D4A55A;
    --muted: #7A6A5C;
    --border: rgba(42, 31, 23, 0.12);
  }
  html { scroll-behavior: smooth; }
  body {
    background: var(--cream);
    color: var(--ink);
    font-family: 'Jost', sans-serif;
    font-weight: 300;
    line-height: 1.7;
    min-height: 100vh;
  }
  header {
    position: sticky; top: 0; z-index: 100;
    background: var(--cream);
    border-bottom: 1px solid var(--border);
    padding: 0 2rem;
  }
  .header-inner {
    max-width: 860px; margin: 0 auto;
    display: flex; align-items: center; justify-content: space-between;
    min-height: 88px;
  }
  .logo {
    display: inline-flex; align-items: center; gap: 12px;
    text-decoration: none; min-width: 0; flex: 0 1 auto;
  }
  .logo-mark {
    width: clamp(56px, 10vw, 76px);
    height: clamp(56px, 10vw, 76px);
    aspect-ratio: 1 / 1;
    object-fit: contain; object-position: center;
    flex-shrink: 0; display: block;
  }
  .modal-logo {
    width: clamp(96px, 22vw, 128px);
    height: clamp(96px, 22vw, 128px);
    aspect-ratio: 1 / 1;
    object-fit: contain; object-position: center;
    margin: 0 auto 16px; display: block;
  }
  .logo-text {
    font-family: 'Cormorant Garamond', serif; font-weight: 500;
    font-size: 1.35rem; color: var(--ink); letter-spacing: 0.01em;
  }
  .logo-text span { color: var(--wine); font-style: italic; }
  nav { display: flex; align-items: center; gap: 0.5rem; }
  .nav-btn {
    background: none; border: none; cursor: pointer;
    padding: 8px 14px; border-radius: 40px;
    font-family: 'Jost', sans-serif; font-size: 0.82rem; font-weight: 400;
    letter-spacing: 0.06em; text-transform: uppercase;
    transition: all 0.2s; color: var(--muted);
  }
  .nav-btn:hover { color: var(--wine); background: rgba(107, 39, 55, 0.06); }
  .subscribe-btn {
    background: var(--wine); color: #fff; border: none; cursor: pointer;
    padding: 8px 20px; border-radius: 40px;
    font-family: 'Jost', sans-serif; font-size: 0.82rem; font-weight: 400;
    letter-spacing: 0.08em; text-transform: uppercase; transition: all 0.2s;
  }
  .subscribe-btn:hover { background: var(--wine-light); transform: translateY(-1px); }
  .hero { text-align: center; padding: 80px 2rem 60px; max-width: 700px; margin: 0 auto; }
  .hero-eyebrow {
    font-family: 'Jost', sans-serif; font-size: 0.75rem;
    letter-spacing: 0.18em; text-transform: uppercase;
    color: var(--gold); margin-bottom: 20px;
  }
  .hero-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(3.2rem, 8vw, 5.5rem); font-weight: 300;
    line-height: 1.05; color: var(--ink);
    letter-spacing: -0.01em; margin-bottom: 16px;
  }
  .hero-title em { font-style: italic; color: var(--wine); }
  .hero-tagline {
    font-family: 'Cormorant Garamond', serif; font-style: italic;
    font-size: 1.15rem; color: var(--muted); font-weight: 300;
  }
  .ornament {
    text-align: center; color: var(--gold); font-size: 1.1rem;
    letter-spacing: 0.5em; margin: 20px auto 48px; opacity: 0.6;
  }
  .posts { max-width: 660px; margin: 0 auto; padding: 0 2rem 120px; }
  .post {
    margin-bottom: 72px; padding-bottom: 72px;
    border-bottom: 1px solid var(--border);
    animation: fadeUp 0.6s ease both;
  }
  .post:last-child { border-bottom: none; }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .post-meta { display: flex; align-items: center; gap: 14px; margin-bottom: 24px; }
  .post-number {
    font-family: 'Cormorant Garamond', serif; font-size: 0.85rem;
    font-style: italic; color: var(--gold); letter-spacing: 0.04em;
  }
  .post-divider { flex: 1; height: 1px; background: var(--border); }
  .post-date {
    font-size: 0.75rem; letter-spacing: 0.1em;
    text-transform: uppercase; color: var(--muted);
  }
  .post-body {
    font-family: 'Cormorant Garamond', serif; font-size: 1.35rem;
    font-weight: 300; line-height: 1.75; color: var(--ink);
  }
  .post-body p { margin-bottom: 1.4em; }
  .post-body p:last-child { margin-bottom: 0; }
  .post-body .verse {
    font-style: italic; padding: 1.4em 0 1.4em 2em;
    border-left: 2px solid var(--gold-light);
    margin: 1.6em 0; color: var(--wine);
    font-size: 1.2rem; line-height: 1.9;
  }
  .post-body .one-liner {
    font-size: 1.65rem; font-style: italic; text-align: center;
    padding: 2rem 0; color: var(--wine); line-height: 1.4;
  }
  .post-footer { display: flex; align-items: center; gap: 12px; margin-top: 32px; }
  .action-btn {
    background: none; border: 1px solid var(--border); cursor: pointer;
    padding: 8px 16px; border-radius: 40px;
    font-family: 'Jost', sans-serif; font-size: 0.78rem; font-weight: 400;
    letter-spacing: 0.06em; text-transform: uppercase;
    transition: all 0.2s; color: var(--muted);
  }
  .action-btn:hover { border-color: var(--wine); color: var(--wine); }
  .action-btn:active { transform: scale(0.97); }
  .toast {
    position: fixed; bottom: 100px; left: 50%;
    transform: translateX(-50%) translateY(20px);
    background: var(--ink); color: var(--cream);
    padding: 12px 24px; border-radius: 40px;
    font-size: 0.82rem; letter-spacing: 0.05em;
    opacity: 0; transition: all 0.3s ease;
    pointer-events: none; white-space: nowrap; z-index: 200;
  }
  .toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
  .modal-overlay {
    position: fixed; inset: 0;
    background: rgba(42, 31, 23, 0.55);
    backdrop-filter: blur(4px);
    z-index: 300;
    display: flex; align-items: center; justify-content: center;
    padding: 2rem; opacity: 0; pointer-events: none;
    transition: opacity 0.3s;
  }
  .modal-overlay.open { opacity: 1; pointer-events: all; }
  .modal {
    background: var(--cream); border-radius: 16px;
    padding: 48px 44px; max-width: 440px; width: 100%;
    text-align: center; position: relative;
    transform: scale(0.95) translateY(10px);
    transition: transform 0.3s;
  }
  .modal-overlay.open .modal { transform: scale(1) translateY(0); }
  .modal-ornament { font-size: 2rem; margin-bottom: 16px; color: var(--gold); }
  .modal h2 {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.9rem; font-weight: 400; margin-bottom: 10px; color: var(--ink);
  }
  .modal p { color: var(--muted); font-size: 0.9rem; margin-bottom: 28px; line-height: 1.6; }
  .modal input[type="email"] {
    width: 100%; padding: 13px 18px;
    border: 1px solid var(--border); border-radius: 8px;
    background: #fff; font-family: 'Jost', sans-serif;
    font-size: 0.9rem; color: var(--ink);
    margin-bottom: 12px; outline: none; transition: border-color 0.2s;
  }
  .modal input[type="email"]:focus { border-color: var(--wine); }
  .modal-submit {
    width: 100%; padding: 13px;
    background: var(--wine); color: #fff; border: none; border-radius: 8px;
    font-family: 'Jost', sans-serif; font-size: 0.85rem; font-weight: 400;
    letter-spacing: 0.1em; text-transform: uppercase;
    cursor: pointer; transition: background 0.2s;
  }
  .modal-submit:hover { background: var(--wine-light); }
  .modal-close {
    position: absolute; top: 16px; right: 20px;
    background: none; border: none; cursor: pointer;
    color: var(--muted); font-size: 1.2rem; line-height: 1; padding: 4px 8px;
  }
  .coffee-btn {
    position: fixed; bottom: 28px; right: 28px;
    background: var(--gold); color: #fff; border: none;
    border-radius: 50px; padding: 12px 20px 12px 14px;
    display: flex; align-items: center; gap: 8px; cursor: pointer;
    font-family: 'Jost', sans-serif; font-size: 0.8rem; font-weight: 400;
    letter-spacing: 0.08em; text-transform: uppercase;
    box-shadow: 0 4px 24px rgba(184, 135, 58, 0.35);
    transition: all 0.2s; z-index: 150; text-decoration: none;
  }
  .coffee-btn:hover {
    background: var(--gold-light); transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(184, 135, 58, 0.45);
  }
  .coffee-btn svg { width: 20px; height: 20px; fill: #fff; }
  footer {
    border-top: 1px solid var(--border);
    padding: 32px 2rem; text-align: center;
  }
  .footer-inner { max-width: 660px; margin: 0 auto; }
  .footer-logo {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.1rem; font-style: italic;
    color: var(--muted); margin-bottom: 8px;
  }
  .footer-note {
    font-size: 0.78rem; color: var(--muted);
    letter-spacing: 0.04em; opacity: 0.7;
  }
  @media (max-width: 600px) {
    .header-inner { padding: 0; }
    .logo-text { font-size: 1.1rem; }
    .hero { padding: 56px 1.5rem 40px; }
    .posts { padding: 0 1.5rem 100px; }
    .modal { padding: 36px 24px; }
    .coffee-btn span { display: none; }
    .coffee-btn { padding: 12px; border-radius: 50%; }
  }
`;
