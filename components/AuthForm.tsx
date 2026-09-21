"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";

type AuthFormProps = {
  mode: "login" | "register";
};

export default function AuthForm({ mode }: AuthFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isRegister = mode === "register";

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isRegister ? { name, email, password } : { email, password }),
    });

    setLoading(false);

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setError(payload?.error ?? "Authentication failed");
      return;
    }

    window.location.href = "/dashboard";
  }

  function handleSocialLogin(provider: string) {
    toast.info(`Connecting to ${provider}... Using demo login.`);
    setEmail("demo@wesite.local");
    setPassword("password123");
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
      {/* Left Panel — Hero */}
      <section className="relative hidden overflow-hidden p-8 text-white lg:flex lg:flex-col lg:justify-between" style={{ background: "var(--nb-primary)" }}>
        <div className="absolute inset-0 nb-dot-bg opacity-10" />
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <span className="grid size-11 place-items-center rounded-2xl border-3 bg-white/15 text-base font-extrabold backdrop-blur-sm" style={{ borderColor: "rgba(255,255,255,0.3)" }}>W</span>
            <span className="text-xl font-bold tracking-tight">Wesite</span>
          </Link>
          <div className="mt-16 max-w-xl">
            <div className="nb-tag inline-flex border-white/25 bg-white/10 text-white/90 backdrop-blur-sm" style={{ borderColor: "rgba(255,255,255,0.25)" }}>
              <Sparkles className="size-3.5" />
              Raindrop-Inspired Digital Asset Workspace
            </div>
            <h1 className="mt-7 text-4xl font-extrabold leading-tight tracking-tight">
              Organize articles, tools, and inspirations with effortless elegance.
            </h1>
            <p className="mt-5 max-w-lg text-sm leading-6 text-white/75">
              Wesite gives you instant search, media filtering, flexible card views, bulk operations, and custom collections for your bookmarks.
            </p>
          </div>
        </div>
        <div className="relative z-10 grid max-w-xl gap-3 sm:grid-cols-3">
          {[
            ["Privacy-First", "Your collection is locked securely."],
            ["Flexible Views", "Grid, Card, List, and Headlines."],
            ["Batch Operations", "Tag, move, or clean up in bulk."],
          ].map(([title, description]) => (
            <div key={title} className="rounded-2xl border-[3px] border-white/15 bg-white/10 p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-sm font-medium">
                <ShieldCheck className="size-4 text-white/80" />
                {title}
              </div>
              <p className="mt-2 text-xs text-white/60 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Right Panel — Form */}
      <section className="grid place-items-center px-4 py-10 sm:px-6" style={{ background: "var(--nb-bg)" }}>
        <form onSubmit={submit} className="nb-card-static w-full max-w-md p-6 sm:p-8">
          <div className="mb-6">
            <div className="mb-5 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2">
                <span className="nb-card-yellow grid size-9 place-items-center rounded-xl border-[3px] font-extrabold text-sm" style={{ borderColor: "var(--nb-border)", boxShadow: "var(--nb-shadow-sm)" }}>W</span>
                <span className="font-bold" style={{ color: "var(--nb-fg)" }}>Wesite</span>
              </Link>
              <span className="nb-tag">
                {isRegister ? "Create account" : "Sign in"}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold" style={{ color: "var(--nb-fg)" }}>{isRegister ? "Create your workspace" : "Welcome back"}</h1>
            <p className="mt-1.5 text-xs" style={{ color: "var(--nb-muted)" }}>
              {isRegister ? "Set up your personal bookmark hub." : "Sign in to access your collections."}
            </p>
          </div>

          {/* Social Auth Buttons */}
          <div className="mb-5 grid grid-cols-3 gap-2">
            <button type="button" onClick={() => handleSocialLogin("Google")} className="nb-btn nb-btn-surface nb-btn-sm text-[11px]">
              <svg className="size-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" /></svg>
              Google
            </button>
            <button type="button" onClick={() => handleSocialLogin("Apple")} className="nb-btn nb-btn-surface nb-btn-sm text-[11px]">
              <svg className="size-4 fill-current" viewBox="0 0 24 24"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.34c.66-.8 1.11-1.92.99-3.04-.96.04-2.12.64-2.8 1.44-.6.7-1.13 1.84-.99 2.94 1.07.08 2.15-.54 2.8-1.34" /></svg>
              Apple
            </button>
            <button type="button" onClick={() => handleSocialLogin("GitHub")} className="nb-btn nb-btn-surface nb-btn-sm text-[11px]">
              <svg className="size-4 fill-current" viewBox="0 0 24 24"><path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" /></svg>
              GitHub
            </button>
          </div>

          <div className="relative mb-5 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t-[3px]" style={{ borderColor: "var(--nb-border)" }} />
            </div>
            <span className="relative px-3 text-[11px] font-bold uppercase tracking-wider" style={{ background: "var(--nb-card)", color: "var(--nb-muted)" }}>
              or continue with email
            </span>
          </div>

          <div className="space-y-4">
            {isRegister ? (
              <label className="block text-xs font-bold" style={{ color: "var(--nb-fg)" }}>
                Name
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your Name"
                  className="nb-input mt-1.5"
                />
              </label>
            ) : null}
            <label className="block text-xs font-bold" style={{ color: "var(--nb-fg)" }}>
              Email
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                placeholder="name@example.com"
                className="nb-input mt-1.5"
              />
            </label>
            <label className="block text-xs font-bold" style={{ color: "var(--nb-fg)" }}>
              Password
              <div className="relative mt-1.5">
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="nb-input pr-10"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((current) => !current)}
                  className="nb-btn nb-btn-ghost nb-btn-icon nb-btn-sm absolute right-1 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </label>
          </div>

          {error ? (
            <p className="nb-tag nb-tag-danger mt-4 w-full text-center">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="nb-btn nb-btn-primary mt-6 w-full"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
            {isRegister ? "Create workspace" : "Sign In"}
          </button>

          <div className="nb-card-sm mt-5 p-3.5" style={{ background: "var(--nb-surface-alt)" }}>
            <p className="text-xs font-extrabold" style={{ color: "var(--nb-fg)" }}>Demo Account Credentials:</p>
            <p className="mt-1 text-xs" style={{ color: "var(--nb-muted)" }}>Email: <code className="font-mono font-bold" style={{ color: "var(--nb-primary)" }}>demo@wesite.local</code></p>
            <p className="text-xs" style={{ color: "var(--nb-muted)" }}>Password: <code className="font-mono font-bold" style={{ color: "var(--nb-primary)" }}>password123</code></p>
          </div>

          <p className="mt-4 text-center text-xs" style={{ color: "var(--nb-muted)" }}>
            {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
            <Link className="font-bold underline-offset-2 hover:underline" href={isRegister ? "/login" : "/register"} style={{ color: "var(--nb-primary)" }}>
              {isRegister ? "Sign in" : "Create one"}
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}
