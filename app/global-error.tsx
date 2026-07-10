"use client";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
          background: "linear-gradient(135deg, #0f172a, #020617 65%)",
          color: "#f8fafc",
        }}
      >
        <main
          style={{
            width: "min(640px, calc(100vw - 2rem))",
            borderRadius: "24px",
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(15, 23, 42, 0.76)",
            padding: "32px",
            boxShadow: "0 20px 80px rgba(0,0,0,0.35)",
          }}
        >
          <p style={{ margin: 0, fontSize: "12px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#93c5fd" }}>
            Wesite error boundary
          </p>
          <h1 style={{ margin: "12px 0 0", fontSize: "32px", lineHeight: 1.1 }}>Something stopped the app</h1>
          <p style={{ margin: "12px 0 0", color: "rgba(255,255,255,0.72)", lineHeight: 1.6 }}>
            The global error boundary caught an unexpected issue while rendering the app shell.
          </p>
          <pre
            style={{
              marginTop: "20px",
              overflow: "auto",
              borderRadius: "16px",
              background: "rgba(255,255,255,0.06)",
              padding: "16px",
              color: "#fecaca",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {error.message}
          </pre>
          <p style={{ marginTop: "24px", color: "rgba(255,255,255,0.72)" }}>
            Refresh the page or return to the home screen after the app recovers.
          </p>
        </main>
      </body>
    </html>
  );
}
