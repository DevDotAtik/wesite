import Link from "next/link";

const sections = [
  {
    title: "What we collect",
    body: "We store only what is required to run the service: your account details (name, email, password hash), the websites you save, and the folders and tags you organize them into. We do not sell or rent this data to anyone.",
  },
  {
    title: "How we use it",
    body: "Your saved content is used to display your library, power search, and keep your workspace in sync. Usage is scoped to your account. Anonymous, aggregated metrics help us understand which features matter.",
  },
  {
    title: "Cookies and local storage",
    body: "We use local storage to remember your theme preference and keep you signed in between visits. We do not run third-party advertising trackers.",
  },
  {
    title: "Data retention and deletion",
    body: "Deleted bookmarks stay in a recoverable trash state until you empty it, after which they are permanently removed. You can export your data at any time or delete your account from Settings, which removes your stored content.",
  },
  {
    title: "Security",
    body: "Passwords are hashed before storage. Connections are encrypted in transit. If you believe your account is compromised, sign out of all sessions and reset your password immediately.",
  },
  {
    title: "Contact",
    body: "For privacy questions, reach out through the settings page. We respond to every request.",
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-[100dvh]" style={{ background: "var(--nb-bg)" }}>
      <section className="py-16 lg:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Link href="/" className="nb-btn nb-btn-ghost nb-btn-sm">← Back to home</Link>
          <h1 className="mt-8 text-balance text-4xl font-extrabold sm:text-5xl" style={{ color: "var(--nb-fg)" }}>
            Privacy Policy
          </h1>
          <p className="mt-3 text-sm" style={{ color: "var(--nb-muted)" }}>
            Last updated: August 2026
          </p>
          <p className="mt-8 max-w-2xl text-sm leading-relaxed" style={{ color: "var(--nb-fg)" }}>
            Your bookmarks are private to your account. This policy explains what we collect, why, and how you stay in control.
          </p>
          <div className="mt-12 space-y-8">
            {sections.map((section) => (
              <section key={section.title} className="nb-card-static p-6 sm:p-8">
                <h2 className="text-lg font-bold" style={{ color: "var(--nb-fg)" }}>{section.title}</h2>
                <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--nb-muted)" }}>{section.body}</p>
              </section>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}