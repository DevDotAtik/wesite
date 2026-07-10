import Link from "next/link";

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "24px",
        background:
          "radial-gradient(circle at top left, rgba(37,99,235,0.16), transparent 30%), radial-gradient(circle at bottom right, rgba(168,85,247,0.14), transparent 24%), var(--background)",
        color: "var(--foreground)",
      }}
    >
      <section
        style={{
          width: "min(560px, 100%)",
          borderRadius: "28px",
          border: "1px solid var(--border)",
          background: "var(--surface)",
          padding: "32px",
          boxShadow: "0 20px 70px rgba(0,0,0,0.08)",
        }}
      >
        <p style={{ margin: 0, fontSize: "12px", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--muted)" }}>
          Wesite
        </p>
        <h1 style={{ margin: "12px 0 0", fontSize: "36px", lineHeight: 1.1 }}>Page not found</h1>
        <p style={{ margin: "12px 0 0", color: "var(--muted)", lineHeight: 1.6 }}>
          The page you were looking for does not exist or was moved.
        </p>
        <div style={{ marginTop: "24px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <Link
            href="/"
            style={{
              borderRadius: "999px",
              padding: "12px 18px",
              background: "#2563eb",
              color: "white",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Go home
          </Link>
          <Link
            href="/settings"
            style={{
              borderRadius: "999px",
              padding: "12px 18px",
              border: "1px solid var(--border)",
              color: "var(--foreground)",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Settings
          </Link>
        </div>
      </section>
    </main>
  );
}
