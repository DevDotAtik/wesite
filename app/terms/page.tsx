import Link from "next/link";

const sections = [
  {
    title: "Using the service",
    body: "Wesite is a personal bookmark and curation workspace. You are responsible for the content you save and for keeping your login credentials secure. Use the service lawfully, and do not attempt to disrupt or abuse the infrastructure.",
  },
  {
    title: "Your account",
    body: "You must provide accurate account details. You may delete your account at any time from Settings, which permanently removes your stored content. We may suspend accounts that violate these terms or that place the service at risk.",
  },
  {
    title: "Content ownership",
    body: "The bookmarks and notes you save remain yours. We claim no ownership over content you add. You grant us a limited license to store and process that content so we can display it back to you.",
  },
  {
    title: "Free tier and subscriptions",
    body: "The free tier is available without charge and may be changed over time. Paid plans are billed on a recurring basis; you can cancel at any time, and access continues until the end of the current period.",
  },
  {
    title: "Availability and liability",
    body: "We work to keep the service reliable, but we do not guarantee uninterrupted availability. The service is provided as-is. To the fullest extent permitted by law, our liability is limited to the amount you paid us in the previous twelve months.",
  },
  {
    title: "Changes",
    body: "We may update these terms as the service evolves. Material changes will be communicated in-app before they take effect. Continued use after a change means you accept the updated terms.",
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen" style={{ background: "var(--nb-bg)" }}>
      <section className="py-16 lg:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Link href="/" className="nb-btn nb-btn-ghost nb-btn-sm">← Back to home</Link>
          <h1 className="mt-8 text-balance text-4xl font-extrabold sm:text-5xl" style={{ color: "var(--nb-fg)" }}>
            Terms of Service
          </h1>
          <p className="mt-3 text-sm" style={{ color: "var(--nb-muted)" }}>
            Last updated: August 2026
          </p>
          <p className="mt-8 max-w-2xl text-sm leading-relaxed" style={{ color: "var(--nb-fg)" }}>
            By using Wesite, you agree to these terms. They keep the service predictable for everyone.
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