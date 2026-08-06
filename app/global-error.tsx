"use client";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  return (
    <html lang="en" data-theme="dark">
      <body style={{ margin: 0, background: "var(--nb-bg, #000000)", color: "var(--nb-fg, #ededed)", fontFamily: "'Space Grotesk', sans-serif" }}>
        <main className="grid min-h-screen place-items-center p-6">
          <section className="w-full max-w-lg rounded-2xl border-3 p-8" style={{ borderColor: "var(--nb-border, #262626)", background: "var(--nb-card, #0a0a0a)", boxShadow: "12px 12px 0 0 rgba(0,0,0,0.8)" }}>
            <div className="mb-6 grid size-16 place-items-center rounded-2xl border-3 text-2xl font-extrabold" style={{ background: "var(--nb-danger, #f43f5e)", borderColor: "var(--nb-border, #262626)", color: "#ffffff", boxShadow: "5px 5px 0 0 rgba(0,0,0,0.9)" }}>
              !
            </div>
            <h1 className="text-3xl font-extrabold" style={{ color: "var(--nb-fg, #ededed)" }}>Something stopped the app</h1>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--nb-muted, #8a8a8a)" }}>
              The global error boundary caught an unexpected issue while rendering the app shell.
            </p>
            <pre
              className="mt-5 overflow-auto rounded-xl border-[3px] p-4 text-sm font-mono"
              style={{ borderColor: "var(--nb-border, #262626)", background: "var(--nb-surface, #0a0a0a)", color: "var(--nb-danger, #f43f5e)", whiteSpace: "pre-wrap", wordBreak: "break-word" }}
            >
              {error.message}
            </pre>
            <p className="mt-6 text-sm" style={{ color: "var(--nb-muted, #8a8a8a)" }}>
              Refresh the page or return to the home screen after the app recovers.
            </p>
          </section>
        </main>
      </body>
    </html>
  );
}
