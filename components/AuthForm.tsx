"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff, Loader2, ShieldCheck, Sparkles } from "lucide-react";

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

    window.location.href = "/";
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.28),_transparent_32%),linear-gradient(140deg,_#111827,_#0f172a_55%,_#050816)] p-8 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.03),transparent_35%,rgba(255,255,255,0.02)_68%,transparent)]" />
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="grid size-10 place-items-center rounded-2xl bg-white/10 text-sm font-bold backdrop-blur">W</span>
            <span className="text-lg font-semibold">Wesite</span>
          </Link>
          <div className="mt-16 max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-sm text-white/80 backdrop-blur">
              <Sparkles className="size-4 text-blue-300" />
              Private bookmarks, smarter workflows
            </div>
            <h1 className="mt-6 text-4xl font-semibold leading-tight">
              Keep bookmarks, tasks, and history in one calm workspace.
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-6 text-white/70">
              Wesite gives you quick access to folders, trash recovery, visited history, tasks, and theme controls without the usual clutter.
            </p>
          </div>
        </div>
        <div className="relative z-10 grid max-w-xl gap-3 sm:grid-cols-3">
          {[
            ["Privacy-first", "Your data stays tied to your account."],
            ["Auto theme", "Matches your device preference when set to system."],
            ["Task-aware", "Assign todos directly to bookmarks."],
          ].map(([title, description]) => (
            <div key={title} className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
              <div className="flex items-center gap-2 text-sm font-medium">
                <ShieldCheck className="size-4 text-blue-300" />
                {title}
              </div>
              <p className="mt-2 text-sm text-white/65">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid place-items-center px-4 py-10 sm:px-6">
        <form onSubmit={submit} className="w-full max-w-md rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.08)] sm:p-8">
          <div className="mb-6">
            <div className="mb-4 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2">
                <span className="grid size-9 place-items-center rounded-2xl bg-blue-600 font-bold text-white shadow-sm">W</span>
                <span className="font-semibold">Wesite</span>
              </Link>
              <span className="rounded-full border border-[color:var(--border)] px-3 py-1 text-xs text-[color:var(--muted)]">
                {isRegister ? "Create account" : "Sign in"}
              </span>
            </div>
            <h1 className="text-2xl font-semibold">{isRegister ? "Create your workspace" : "Welcome back"}</h1>
            <p className="mt-2 text-sm text-[color:var(--muted)]">
              {isRegister ? "Set up your private library in a minute." : "Sign in to jump straight back into your bookmarks."}
            </p>
          </div>

          <div className="space-y-4">
            {isRegister ? (
              <label className="block text-sm font-medium">
                Name
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="mt-2 h-11 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 outline-none focus:border-blue-500"
                />
              </label>
            ) : null}
            <label className="block text-sm font-medium">
              Email
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                className="mt-2 h-11 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 outline-none focus:border-blue-500"
              />
            </label>
            <label className="block text-sm font-medium">
              Password
              <div className="relative mt-2">
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type={showPassword ? "text" : "password"}
                  className="h-11 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 pr-11 outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-[color:var(--muted)] hover:bg-black/5 dark:hover:bg-white/10"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </label>
          </div>

          {error ? <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-300">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-medium text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
            {isRegister ? "Create account" : "Login"}
          </button>

          <div className="mt-5 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-4 text-sm text-[color:var(--muted)]">
            <p className="font-medium text-[color:var(--foreground)]">Try the demo</p>
            <p className="mt-1">Email: demo@wesite.local</p>
            <p>Password: password123</p>
          </div>

          <p className="mt-4 text-center text-sm text-[color:var(--muted)]">
            {isRegister ? "Already have an account?" : "New to Wesite?"}{" "}
            <Link className="font-medium text-blue-600 hover:underline" href={isRegister ? "/login" : "/register"}>
              {isRegister ? "Login" : "Register"}
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}
