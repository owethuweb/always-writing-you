import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  head: () => ({
    meta: [
      { title: "Admin — Still Writing" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

type Post = {
  id: string;
  title: string;
  body: string;
  image_url: string | null;
  created_at: string;
};

function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s) checkAdmin(s.user.id);
      else setIsAdmin(null);
    });
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s) checkAdmin(s.user.id);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const checkAdmin = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    setIsAdmin(!!data);
  };

  const flash = (m: string) => {
    setMsg(m);
    window.setTimeout(() => setMsg(null), 3000);
  };

  if (loading) {
    return <Shell><p>Loading…</p></Shell>;
  }

  if (!session) {
    return <Shell><AuthForm onMsg={flash} /></Shell>;
  }

  if (isAdmin === false) {
    return (
      <Shell>
        <p style={{ color: "#6B2737" }}>
          This account isn't authorized. Sign out and log in with the admin email.
        </p>
        <button
          className="adm-btn"
          onClick={() => supabase.auth.signOut()}
          style={{ marginTop: 16 }}
        >
          Sign out
        </button>
      </Shell>
    );
  }

  if (isAdmin) {
    return (
      <Shell>
        <Dashboard email={session.user.email ?? ""} onMsg={flash} />
      </Shell>
    );
  }

  return <Shell><p>Checking access…</p></Shell>;

  function Shell({ children }: { children: React.ReactNode }) {
    return (
      <>
        <style>{adminStyles}</style>
        <div className="adm-wrap">
          <div className="adm-card">
            <h1>Still Writing — Admin</h1>
            {children}
          </div>
          {msg && <div className="adm-toast">{msg}</div>}
        </div>
      </>
    );
  }
}

function AuthForm({ onMsg }: { onMsg: (m: string) => void }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/admin` },
      });
      if (error) onMsg(error.message);
      else onMsg("Check your email to confirm your account.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) onMsg(error.message);
    }
    setBusy(false);
  };

  return (
    <form onSubmit={submit}>
      <p className="adm-sub">
        {mode === "login" ? "Sign in to post." : "Create your admin account."}
      </p>
      <input
        className="adm-input"
        type="email"
        placeholder="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        className="adm-input"
        type="password"
        placeholder="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={6}
      />
      <button className="adm-btn primary" type="submit" disabled={busy}>
        {busy ? "…" : mode === "login" ? "Sign in" : "Sign up"}
      </button>
      <button
        type="button"
        className="adm-link"
        onClick={() => setMode(mode === "login" ? "signup" : "login")}
      >
        {mode === "login" ? "First time? Create account" : "Have an account? Sign in"}
      </button>
    </form>
  );
}

function Dashboard({ email, onMsg }: { email: string; onMsg: (m: string) => void }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);

  const load = async () => {
    const { data } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setPosts(data as Post[]);
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return onMsg("Write something first.");
    setBusy(true);
    let image_url: string | null = null;
    if (file) {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("post-images")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) {
        onMsg("Image upload failed: " + upErr.message);
        setBusy(false);
        return;
      }
      const { data: pub } = supabase.storage.from("post-images").getPublicUrl(path);
      image_url = pub.publicUrl;
    }
    const { error } = await supabase
      .from("posts")
      .insert({ title: title.trim(), body: body.trim(), image_url });
    if (error) onMsg(error.message);
    else {
      onMsg("Posted ✦");
      setTitle("");
      setBody("");
      setFile(null);
      (document.getElementById("file-input") as HTMLInputElement | null)?.value &&
        ((document.getElementById("file-input") as HTMLInputElement).value = "");
      load();
    }
    setBusy(false);
  };

  const remove = async (id: string) => {
    if (!window.confirm("Delete this post?")) return;
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) onMsg(error.message);
    else {
      onMsg("Deleted");
      load();
    }
  };

  return (
    <>
      <div className="adm-row">
        <span className="adm-sub">Signed in as {email}</span>
        <button className="adm-btn" onClick={() => supabase.auth.signOut()}>
          Sign out
        </button>
      </div>

      <form onSubmit={submit} className="adm-form">
        <input
          className="adm-input"
          placeholder="Title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
        />
        <textarea
          className="adm-input adm-textarea"
          placeholder="Write your poem or letter… (use blank lines to split paragraphs)"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          rows={10}
        />
        <label className="adm-file">
          <span>{file ? file.name : "Attach an image (optional)"}</span>
          <input
            id="file-input"
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>
        <button className="adm-btn primary" type="submit" disabled={busy}>
          {busy ? "Publishing…" : "Publish"}
        </button>
      </form>

      <h2 className="adm-h2">Your posts</h2>
      <ul className="adm-list">
        {posts.length === 0 && <li className="adm-sub">Nothing yet.</li>}
        {posts.map((p) => (
          <li key={p.id} className="adm-list-item">
            <div>
              <strong>{p.title || "(untitled)"}</strong>
              <div className="adm-sub">
                {new Date(p.created_at).toLocaleString()}
              </div>
              <p className="adm-preview">{p.body.slice(0, 120)}…</p>
            </div>
            <button className="adm-btn danger" onClick={() => remove(p.id)}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

const adminStyles = `
  .adm-wrap {
    min-height: 100vh;
    background: #F7F2E8;
    padding: 48px 20px;
    font-family: 'Jost', system-ui, sans-serif;
    color: #2A1F17;
  }
  .adm-card {
    max-width: 720px; margin: 0 auto;
    background: #fff; border-radius: 16px;
    padding: 40px; box-shadow: 0 8px 32px rgba(42, 31, 23, 0.08);
  }
  .adm-card h1 {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.8rem; font-weight: 500; margin-bottom: 8px;
  }
  .adm-h2 {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.3rem; margin: 32px 0 12px;
  }
  .adm-sub { color: #7A6A5C; font-size: 0.9rem; }
  .adm-row { display: flex; justify-content: space-between; align-items: center; margin: 16px 0; }
  .adm-form { display: flex; flex-direction: column; gap: 12px; margin-top: 20px; }
  .adm-input {
    width: 100%; padding: 12px 14px; border: 1px solid rgba(42,31,23,0.15);
    border-radius: 8px; font-family: inherit; font-size: 0.95rem;
    background: #fff; outline: none;
  }
  .adm-input:focus { border-color: #6B2737; }
  .adm-textarea { resize: vertical; min-height: 180px; line-height: 1.6; }
  .adm-file {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 14px; border: 1px dashed rgba(42,31,23,0.25);
    border-radius: 8px; cursor: pointer; color: #7A6A5C; font-size: 0.9rem;
  }
  .adm-file input { display: none; }
  .adm-btn {
    padding: 10px 18px; border-radius: 40px; border: 1px solid rgba(42,31,23,0.15);
    background: #fff; cursor: pointer; font-family: inherit;
    font-size: 0.82rem; letter-spacing: 0.06em; text-transform: uppercase;
    color: #7A6A5C; transition: all 0.15s;
  }
  .adm-btn:hover { color: #2A1F17; border-color: #2A1F17; }
  .adm-btn.primary {
    background: #6B2737; color: #fff; border-color: #6B2737;
  }
  .adm-btn.primary:hover { background: #9B4455; border-color: #9B4455; color: #fff; }
  .adm-btn.primary:disabled { opacity: 0.6; cursor: not-allowed; }
  .adm-btn.danger { color: #6B2737; }
  .adm-btn.danger:hover { background: #6B2737; color: #fff; border-color: #6B2737; }
  .adm-link {
    background: none; border: none; cursor: pointer; color: #6B2737;
    font-family: inherit; font-size: 0.85rem; margin-top: 8px; padding: 4px;
    text-align: center;
  }
  .adm-list { list-style: none; padding: 0; margin: 0; }
  .adm-list-item {
    display: flex; justify-content: space-between; align-items: flex-start;
    gap: 16px; padding: 16px 0; border-bottom: 1px solid rgba(42,31,23,0.08);
  }
  .adm-preview { color: #7A6A5C; font-size: 0.9rem; margin-top: 6px; }
  .adm-toast {
    position: fixed; bottom: 24px; left: 50%;
    transform: translateX(-50%);
    background: #2A1F17; color: #F7F2E8;
    padding: 12px 24px; border-radius: 40px; font-size: 0.85rem;
  }
`;
