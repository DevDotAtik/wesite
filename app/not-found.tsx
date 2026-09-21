import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-[100dvh] place-items-center p-6" style={{ background: "var(--nb-bg)" }}>
      <section className="nb-card-static w-full max-w-md p-8 text-center">
        <div className="nb-card-coral mx-auto mb-6 grid size-16 place-items-center rounded-2xl border-3 text-2xl font-extrabold" style={{ borderColor: "var(--nb-border)", boxShadow: "var(--nb-shadow-md)" }}>
          404
        </div>
        <h1 className="text-3xl font-extrabold" style={{ color: "var(--nb-fg)" }}>Page not found</h1>
        <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--nb-muted)" }}>
          The page you were looking for does not exist or was moved.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/" className="nb-btn nb-btn-primary">
            Go home
          </Link>
          <Link href="/settings" className="nb-btn nb-btn-surface">
            Settings
          </Link>
        </div>
      </section>
    </main>
  );
}
