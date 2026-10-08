"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import {
  ArrowRight,
  Bookmark,
  Command,
  Eye,
  EyeOff,
  Layers,
  Loader2,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

type AuthFormProps = {
  mode: "login" | "register";
};

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (options: Record<string, unknown>) => void;
          renderButton: (element: HTMLElement, options: Record<string, unknown>) => void;
          prompt: () => void;
        };
      };
    };
  }
}

type GisError = {
  type?: string;
  detail?: string;
};

function describeGisError(err: GisError, origin: string): string {
  const detail = `${err.type ?? ""} ${err.detail ?? ""}`.toLowerCase();
  // The exact Google popup text "doesn't comply with Google's OAuth 2.0
  // policy" almost always means the current origin is not allowlisted for
  // this Client ID (or the Client ID is the wrong application type).
  if (
    detail.includes("valid origin") ||
    detail.includes("origin_mismatch") ||
    detail.includes("idpiframe_initialization_failed") ||
    detail.includes("redirect_uri_mismatch")
  ) {
    return (
      `Google blocked sign-in: this origin (${origin}) is not an Authorized JavaScript origin ` +
      `for this Client ID. In Google Cloud Console → APIs & Services → Credentials, open the ` +
      `Web-application OAuth client and add "${origin}" (exact scheme + host + port, no trailing slash) ` +
      `to Authorized JavaScript origins, then reload.`
    );
  }
  if (detail.includes("popup") && (detail.includes("closed") || detail.includes("failed"))) {
    return "The Google sign-in popup was closed before finishing. Allow popups for this site and try again.";
  }
  if (detail.includes("cookie") || detail.includes("fedcm") || detail.includes("third-party")) {
    return "Google sign-in was blocked by the browser (third-party cookies / FedCM). Allow third-party cookies for accounts.google.com, turn off Incognito blocking, and try again.";
  }
  if (detail.includes("access_denied") || detail.includes("cancel")) {
    return "Google sign-in was cancelled. Please try again.";
  }
  return (
    `Google blocked sign-in (${err.type || "unknown error"}). This usually means the OAuth client ` +
    `is misconfigured: Client ID must be a "Web application" type, "${origin}" must be in its ` +
    `Authorized JavaScript origins, and your account must be a test user while the consent screen is in Testing mode.`
  );
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
const GIS_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

export default function AuthForm({ mode }: AuthFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const isRegister = mode === "register";

  const handleGoogleCredential = useCallback(async (credential: string) => {
    setGoogleLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: credential }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        const message = payload?.error ?? "Google sign-in failed";
        setError(message);
        toast.error(message);
        return;
      }

      toast.success("Signed in with Google");
      window.location.href = "/dashboard";
    } catch {
      const message = "Google sign-in failed. Please try again.";
      setError(message);
      toast.error(message);
    } finally {
      setGoogleLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      return;
    }

    let cancelled = false;

    function initGoogleButton() {
      if (cancelled || !window.google?.accounts?.id || !googleButtonRef.current) {
        return;
      }

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response: { credential?: string }) => {
          if (response?.credential) {
            void handleGoogleCredential(response.credential);
          }
        },
        // Surfaces Google-side blocks (e.g. origin not allowlisted → the
        // "doesn't comply with Google's OAuth 2.0 policy" popup) as readable
        // in-app errors instead of a silent dead button.
        error_callback: (err: GisError) => {
          if (cancelled) return;
          const message = describeGisError(err, window.location.origin);
          setError(message);
          toast.error(message);
        },
        ux_mode: "popup",
        auto_select: false,
        itp_support: true,
      });

      googleButtonRef.current.innerHTML = "";
      // Measure the visible container so the Google button fits narrow screens
      // (Google clamps widths to 200–400px).
      const measuredWidth = googleButtonRef.current.clientWidth || 320;
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        width: Math.max(200, Math.min(400, Math.floor(measuredWidth))),
        text: isRegister ? "signup_with" : "signin_with",
      });
      setGoogleReady(true);
    }

    if (window.google?.accounts?.id) {
      initGoogleButton();
      return () => {
        cancelled = true;
      };
    }

    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${GIS_SCRIPT_SRC}"]`,
    );

    if (existing) {
      existing.addEventListener("load", initGoogleButton);
      return () => {
        cancelled = true;
        existing.removeEventListener("load", initGoogleButton);
      };
    }

    const script = document.createElement("script");
    script.src = GIS_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = initGoogleButton;
    script.onerror = () => {
      if (!cancelled) {
        toast.error("Could not load Google sign-in. Check your connection.");
      }
    };
    document.head.appendChild(script);

    return () => {
      cancelled = true;
      script.onload = null;
    };
  }, [handleGoogleCredential, isRegister]);

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

  function handleGoogleFallbackClick() {
    if (!GOOGLE_CLIENT_ID) {
      toast.error("Google sign-in is not configured. Please sign in with email and password.");
      return;
    }

    if (!googleReady) {
      toast.info("Loading Google sign-in...");
    }
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
      {/* Left Panel — Hero with animated developer showcase */}
      <section className="relative hidden overflow-hidden p-8 lg:flex lg:flex-col lg:justify-between bg-[#0b0f19] border-r-3" style={{ borderColor: "var(--nb-border)" }}>
        {/* Animated glowing mesh orbs */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl nb-pulse-glow" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-amber-500/15 blur-3xl nb-pulse-glow [animation-delay:2.5s]" />

        {/* Grid and dot patterns */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#33415518_1px,transparent_1px),linear-gradient(to_bottom,#33415518_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,#000_60%,transparent_100%)]" />
        <div className="pointer-events-none absolute inset-0 nb-dot-bg opacity-15" />

        {/* Top Header */}
        <div className="relative z-10 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <Logo tone="inverse" className="size-11 transition-transform group-hover:scale-105" title="Wesite home" />
            <div>
              <span className="text-xl font-bold tracking-tight text-white block">Wesite</span>
              <span className="text-[10px] font-mono text-slate-400">Developer Library & Wire</span>
            </div>
          </Link>

          {/* Live system status pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-mono text-emerald-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Live Indexing
          </div>
        </div>

        {/* Center: Hero Copy + Animated Floating Showcase Cards */}
        <div className="relative z-10 my-auto py-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-lg border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-xs font-mono font-medium text-indigo-300 backdrop-blur-sm">
              <Sparkles className="size-3.5 text-amber-400" />
              Your personal library of the web
            </div>
            <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-white xl:text-4xl">
              Every link you keep, shelved and searchable.
            </h1>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-slate-300">
              Save links in seconds, track breaking dev news, and query thousands of resources with sub-millisecond keyboard search.
            </p>
          </div>

          {/* Animated Floating Preview Cards Stack */}
          <div className="mt-8 space-y-3.5 max-w-lg">
            {/* Card 1: Fast Command Palette Simulation (Floats slowly) */}
            <div className="nb-float-slow rounded-xl border border-slate-700/80 bg-slate-900/90 p-4 shadow-2xl backdrop-blur-md transition-transform hover:scale-[1.01]">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                  <Search className="size-3.5 text-indigo-400" />
                  <span className="font-mono text-slate-300">⌘K search</span>
                  <span className="text-slate-600">|</span>
                  <span className="text-[11px] text-slate-400">Next.js, Tailwind, System Design…</span>
                </div>
                <span className="rounded bg-indigo-500/20 border border-indigo-500/30 px-1.5 py-0.5 text-[10px] font-mono font-bold text-indigo-300">
                  0.3ms
                </span>
              </div>
              <div className="mt-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-7 items-center justify-center rounded-lg border border-indigo-500/30 bg-indigo-500/20 text-indigo-300 font-bold text-xs">
                    N
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Next.js 16 Documentation</div>
                    <div className="text-[10px] font-mono text-slate-400">nextjs.org/docs • App Router</div>
                  </div>
                </div>
                <span className="rounded border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-300">
                  ★ SAVED
                </span>
              </div>
            </div>

            {/* Card 2: Live Dev Wire Simulation (Floats reverse with slight angle) */}
            <div className="nb-float-reverse rounded-xl border border-slate-700/70 bg-slate-900/80 p-4 shadow-xl backdrop-blur-md transition-transform hover:scale-[1.01] -rotate-1 hover:rotate-0">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-300">
                  <Zap className="size-3 text-amber-400" />
                  DEV WIRE
                </span>
                <span className="text-[10px] font-mono text-slate-400">2h ago</span>
              </div>
              <div className="mt-2 text-xs font-semibold text-slate-200">
                Tailwind CSS v4 & React 19: Architecture teardown and benchmarks
              </div>
              <div className="mt-2.5 flex items-center gap-3 text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <TrendingUp className="size-3 text-indigo-400" /> 680 upvotes
                </span>
                <span className="flex items-center gap-1">
                  <Bookmark className="size-3 text-amber-400" /> 245 saves
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Feature Strip */}
        <div className="relative z-10 border-t border-slate-800/80 pt-5">
          <div className="grid grid-cols-3 gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 shrink-0 text-emerald-400" />
              <span className="text-xs font-medium text-slate-300">Private by default</span>
            </div>
            <div className="flex items-center gap-2">
              <Command className="size-4 shrink-0 text-amber-400" />
              <span className="text-xs font-medium text-slate-300">Keyboard first</span>
            </div>
            <div className="flex items-center gap-2">
              <Layers className="size-4 shrink-0 text-indigo-400" />
              <span className="text-xs font-medium text-slate-300">Curated feeds</span>
            </div>
          </div>
        </div>
      </section>

      {/* Right Panel — Form */}
      <section className="grid place-items-center px-4 py-10 sm:px-6" style={{ background: "var(--nb-bg)" }}>
        <form onSubmit={submit} className="nb-card-static nb-card-enter relative w-full max-w-md p-6 sm:p-8">
          <span className="zine-tape zine-tape-tl" aria-hidden="true" />
          <span className="zine-tape zine-tape-tr" aria-hidden="true" />
          <div className="mb-6">
            <div className="mb-5 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2">
                <Logo className="size-9" />
                <span className="font-bold" style={{ color: "var(--nb-fg)" }}>Wesite</span>
              </Link>
              <span className="nb-tag">
                {isRegister ? "Create account" : "Sign in"}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold" style={{ color: "var(--nb-fg)" }}>{isRegister ? "Create your library" : "Welcome back"}</h1>
            <p className="mt-1.5 text-xs" style={{ color: "var(--nb-muted)" }}>
              {isRegister ? "One account, every bookmark you'll ever keep." : "Pick up right where you left off."}
            </p>
          </div>



          {/* Google sign-in */}
          <div className="mb-5">
            {/* NOTE: the fallback and the Google container must stay siblings.
                The Google script owns everything inside googleButtonRef, so
                React must not render children there — otherwise React tries
                to remove nodes the script already replaced (removeChild crash). */}
            {!googleReady ? (
              <button
                type="button"
                onClick={handleGoogleFallbackClick}
                disabled={googleLoading}
                className="nb-btn nb-btn-surface nb-btn-sm w-full text-[11px] disabled:opacity-70"
              >
                {googleLoading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <svg className="size-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" /></svg>
                )}
                {GOOGLE_CLIENT_ID ? "Loading Google sign-in..." : "Continue with Google (Optional)"}
              </button>
            ) : null}
            <div
              ref={googleButtonRef}
              className={googleReady ? "flex justify-center" : ""}
            />
          </div>

          <div className="relative mb-5 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t-[3px]" style={{ borderColor: "var(--nb-border)" }} />
            </div>
            <span className="relative px-3 text-[11px] font-semibold" style={{ background: "var(--nb-card)", color: "var(--nb-muted)" }}>
              or continue with email
            </span>
          </div>

          <div className="space-y-4">
            {isRegister ? (
              <label htmlFor="auth-name" className="block text-xs font-bold" style={{ color: "var(--nb-fg)" }}>
                Name
                <input
                  id="auth-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your name"
                  required
                  minLength={2}
                  maxLength={80}
                  autoComplete="name"
                  aria-invalid={Boolean(error)}
                  className="nb-input mt-1.5"
                />
              </label>
            ) : null}
            <label htmlFor="auth-email" className="block text-xs font-bold" style={{ color: "var(--nb-fg)" }}>
              Email
              <input
                id="auth-email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                required
                autoComplete="email"
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "auth-error" : undefined}
                placeholder="name@example.com"
                className="nb-input mt-1.5"
              />
            </label>
            <label htmlFor="auth-password" className="block text-xs font-bold" style={{ color: "var(--nb-fg)" }}>
              Password
              <div className="relative mt-1.5">
                <input
                  id="auth-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={isRegister ? 8 : 1}
                  autoComplete={isRegister ? "new-password" : "current-password"}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? "auth-error" : undefined}
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
            <p id="auth-error" role="alert" className="nb-tag nb-tag-danger mt-4 w-full text-center">
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

          {!isRegister ? (
            <p className="mt-3 text-center text-xs" style={{ color: "var(--nb-muted)" }}>
              <Link className="font-bold underline-offset-2 hover:underline" href="/forgot-password" style={{ color: "var(--nb-primary)" }}>
                Forgot your password?
              </Link>
            </p>
          ) : null}

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
