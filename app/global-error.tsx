"use client";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  return (
    <html lang="en" data-theme="dark">
      <body style={{ margin: 0, background: "var(--nb-bg, #0f0f1a)", color: "var(--nb-fg, #f0f0f5)", fontFamily: "'Space Grotesk', sans-serif" }}>
        <main className="grid min-h-screen place-items-center p-6">
          <section className="w-full max-w-lg rounded-2xl border-3 p-8" style={{ borderColor: "var(--nb-border, #e2e8f0)", background: "var(--nb-card, #1a1a2e)", boxShadow: "12px 12px 0 0 rgba(226,232,240,0.15)" }}>
            <div className="mb-6 grid size-16 place-items-center rounded-2xl border-3 text-2xl font-extrabold" style={{ background: "var(--nb-danger, #fb7185)", borderColor: "var(--nb-border, #e2e8f0)", color: "#ffffff", boxShadow: "5px 5px 0 0 rgba(226,232,240,0.2)" }}>
              !
            </div>
            <h1 className="text-3xl font-extrabold" style={{ color: "var(--nb-fg, #f0f0f5)" }}>Something stopped the app</h1>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--nb-muted, #9ca3af)" }}>
              The global error boundary caught an unexpected issue while rendering the app shell.
            </p>
            <pre
              className="mt-5 overflow-auto rounded-xl border-[3px] p-4 text-sm font-mono"
              style={{ borderColor: "var(--nb-border, #e2e8f0)", background: "var(--nb-surface, #1a1a2e)", color: "var(--nb-danger, #fb7185)", whiteSpace: "pre-wrap", wordBreak: "break-word" }}
            >
              {error.message}
            </pre>
            <p className="mt-6 text-sm" style={{ color: "var(--nb-muted, #9ca3af)" }}>
              Refresh the page or return to the home screen after the app recovers.
            </p>
          </section>
        </main>
      </body>
    </html>
  );
}
