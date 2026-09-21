"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const [token, setToken] = useState(searchParams.get("token") ?? "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: token.trim(), password }),
    });

    setLoading(false);

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setError(payload?.error ?? "Could not reset password");
      return;
    }

    window.location.href = "/login";
  }

  return (
    <div className="nb-card-static w-full max-w-md p-6 sm:p-8">
      <Link href="/login" className="nb-btn nb-btn-ghost nb-btn-sm mb-5">
        <ArrowLeft className="size-4" />
        Back to login
      </Link>
      <h1 className="text-2xl font-extrabold" style={{ color: "var(--nb-fg)" }}>Choose a new password</h1>
      <p className="mt-1.5 text-xs" style={{ color: "var(--nb-muted)" }}>
        Paste your reset token and pick a password of at least 8 characters.
      </p>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <label htmlFor="reset-token" className="block text-xs font-bold" style={{ color: "var(--nb-fg)" }}>
          Reset token
          <input
            id="reset-token"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            required
            minLength={16}
            autoComplete="off"
            placeholder="Paste the token from your reset link"
            className="nb-input mt-1.5 font-mono"
          />
        </label>
        <label htmlFor="reset-password" className="block text-xs font-bold" style={{ color: "var(--nb-fg)" }}>
          New password
          <input
            id="reset-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            required
            minLength={8}
            maxLength={128}
            autoComplete="new-password"
            aria-invalid={Boolean(error)}
            placeholder="••••••••"
            className="nb-input mt-1.5"
          />
        </label>

        {error ? (
          <p role="alert" className="nb-tag nb-tag-danger w-full text-center">
            {error}
          </p>
        ) : null}

        <button type="submit" disabled={loading} className="nb-btn nb-btn-primary w-full">
          {loading ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
          Set new password
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="grid min-h-[100dvh] place-items-center px-4 py-10" style={{ background: "var(--nb-bg)" }}>
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}
