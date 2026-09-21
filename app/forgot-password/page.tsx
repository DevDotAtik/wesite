"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Loader2, MailCheck } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [devToken, setDevToken] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const payload = await response.json().catch(() => null);
    setLoading(false);

    if (!response.ok) {
      setError(payload?.error ?? "Could not start password reset");
      return;
    }

    setSent(true);
    if (payload?.resetToken) {
      setDevToken(payload.resetToken);
    }
  }

  return (
    <main className="grid min-h-[100dvh] place-items-center px-4 py-10" style={{ background: "var(--nb-bg)" }}>
      <div className="nb-card-static w-full max-w-md p-6 sm:p-8">
        <Link href="/login" className="nb-btn nb-btn-ghost nb-btn-sm mb-5">
          <ArrowLeft className="size-4" />
          Back to login
        </Link>
        <h1 className="text-2xl font-extrabold" style={{ color: "var(--nb-fg)" }}>Reset your password</h1>
        <p className="mt-1.5 text-xs" style={{ color: "var(--nb-muted)" }}>
          Enter your account email and we&apos;ll generate a reset link token.
        </p>

        {sent ? (
          <div className="mt-6">
            <p role="status" className="nb-tag nb-tag-success w-full text-center">
              <MailCheck className="size-3.5" />
              If the account exists, a reset token was generated
            </p>
            {devToken ? (
              <Link
                href={`/reset-password?token=${encodeURIComponent(devToken)}`}
                className="nb-btn nb-btn-primary mt-4 w-full"
              >
                Continue to set a new password
                <ArrowRight className="size-4" />
              </Link>
            ) : (
              <p className="mt-4 text-xs" style={{ color: "var(--nb-muted)" }}>
                Check your email for the reset link. The link expires in 30 minutes.
              </p>
            )}
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6">
            <label htmlFor="reset-email" className="block text-xs font-bold" style={{ color: "var(--nb-fg)" }}>
              Email
              <input
                id="reset-email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                required
                autoComplete="email"
                aria-invalid={Boolean(error)}
                placeholder="name@example.com"
                className="nb-input mt-1.5"
              />
            </label>

            {error ? (
              <p role="alert" className="nb-tag nb-tag-danger mt-4 w-full text-center">
                {error}
              </p>
            ) : null}

            <button type="submit" disabled={loading} className="nb-btn nb-btn-primary mt-6 w-full">
              {loading ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
              Send reset link
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
