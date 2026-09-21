"use client";

import Image from "next/image";
import Link from "next/link";
import LandingBackground3D from "@/components/landing/LandingBackground3D";
import {
  ArrowRight,
  CheckCircle2,
  Command,
  Compass,
  Film,
  Fingerprint,
  FolderPlus,
  Globe,
  ImageIcon,
  Layers,
  Newspaper,
  Plus,
  Search,
} from "lucide-react";

type LandingPageProps = {
  onLaunchDemo?: () => void;
};

const heroInlineImages = [
  {
    seed: "wesite-hero-desk",
    alt: "A moodboard of saved design links",
  },
  {
    seed: "wesite-hero-shelf",
    alt: "A tidy shelf of organized resources",
  },
];

export default function LandingPage({ onLaunchDemo }: LandingPageProps) {
  return (
    <div className="relative isolate min-h-[100dvh] overflow-hidden">
      <LandingBackground3D />

      {/* 1. Marketing Header */}
      <header
        className="sticky top-0 z-50 border-b backdrop-blur-xl"
        style={{ borderColor: "var(--nb-border)", background: "color-mix(in srgb, var(--nb-bg) 80%, transparent)" }}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <span
              className="grid size-9 place-items-center rounded-xl border font-extrabold"
              style={{ background: "var(--nb-primary)", color: "var(--nb-primary-fg)", borderColor: "transparent" }}
            >
              W
            </span>
            <span className="text-lg font-bold tracking-tight" style={{ color: "var(--nb-fg)" }}>Wesite</span>
          </Link>

          <nav className="hidden items-center gap-1 text-sm font-medium md:flex">
            {[
              { href: "#features", label: "Features" },
              { href: "#method", label: "Method" },
              { href: "#pricing", label: "Pricing" },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2 transition-colors"
                style={{ color: "var(--nb-muted)" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "var(--nb-fg)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "var(--nb-muted)"; }}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/login" className="nb-btn nb-btn-ghost nb-btn-sm hidden sm:inline-flex">
              Sign in
            </Link>
            <Link href="/register" className="nb-btn nb-btn-primary nb-btn-sm">
              Get started
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section — asymmetric split */}
      <section className="relative overflow-hidden pt-16 pb-24 lg:pt-24 lg:pb-32">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-14 lg:grid-cols-12 lg:gap-8">
            {/* Left — copy */}
            <div className="max-w-xl lg:col-span-6">
              <div className="nb-animate-slide-up">
                <span className="nb-tag">
                  <span className="size-1.5 rounded-full" style={{ background: "var(--nb-success)" }} />
                  Curation workspace
                </span>
              </div>

              <h1
                className="nb-animate-slide-up mt-6 text-balance text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl"
                style={{ color: "var(--nb-fg)", animationDelay: "80ms" }}
              >
                All your{" "}
                <span className="relative mx-1 hidden h-[0.95em] w-[1.45em] overflow-hidden rounded-lg align-[-0.12em] sm:inline-block">
                  <Image
                    src={`https://picsum.photos/seed/${heroInlineImages[0].seed}/800/600`}
                    alt={heroInlineImages[0].alt}
                    fill
                    sizes="5rem"
                    className="object-cover"
                  />
                </span>
                bookmarks in one{" "}
                <span className="relative mx-1 hidden h-[0.95em] w-[1.45em] overflow-hidden rounded-lg align-[-0.12em] sm:inline-block">
                  <Image
                    src={`https://picsum.photos/seed/${heroInlineImages[1].seed}/800/600`}
                    alt={heroInlineImages[1].alt}
                    fill
                    sizes="5rem"
                    className="object-cover"
                  />
                </span>
                place.
              </h1>

              <p
                className="nb-animate-slide-up mt-6 max-w-[65ch] text-lg leading-relaxed"
                style={{ color: "var(--nb-muted)", animationDelay: "160ms" }}
              >
                Wesite is the modern curation workspace to save articles, design inspirations, videos, and code tools. Organize them into visual collections.
              </p>

              <div className="nb-animate-slide-up mt-10" style={{ animationDelay: "240ms" }}>
                <Link href="/register" className="nb-btn nb-btn-primary px-7 py-3.5 text-base">
                  Start curating free
                  <ArrowRight className="size-5" />
                </Link>
              </div>
            </div>

            {/* Right — product visual */}
            <div className="lg:col-span-6 lg:pl-6">
              <div className="nb-float">
                <div className="nb-card-static p-3" style={{ borderRadius: "20px" }}>
                  <div className="flex items-center gap-2 border-b px-4 pb-3 pt-2" style={{ borderColor: "var(--nb-border)" }}>
                    <div className="flex gap-1.5">
                      <span className="size-2.5 rounded-full" style={{ background: "var(--nb-danger)" }} />
                      <span className="size-2.5 rounded-full" style={{ background: "var(--nb-warning)" }} />
                      <span className="size-2.5 rounded-full" style={{ background: "var(--nb-success)" }} />
                    </div>
                    <div className="mx-auto flex h-8 max-w-md flex-1 items-center justify-center rounded-lg border px-3 text-xs font-mono" style={{ borderColor: "var(--nb-border)", background: "var(--nb-surface-alt)" }}>
                      wesite.app/workspace
                    </div>
                  </div>

                  <div className="rounded-xl p-4 text-left sm:p-5" style={{ background: "var(--nb-surface-alt)" }}>
                    <div className="mb-4 flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--nb-border)" }}>
                      <div className="flex items-center gap-3">
                        <span
                          className="grid size-9 place-items-center rounded-xl border text-sm font-bold"
                          style={{ background: "color-mix(in srgb, var(--nb-primary) 12%, var(--nb-surface))", color: "var(--nb-primary)", borderColor: "var(--nb-border)" }}
                        >
                          W
                        </span>
                        <div>
                          <h3 className="text-sm font-bold" style={{ color: "var(--nb-fg)" }}>Design & Dev Stack</h3>
                          <p className="text-xs" style={{ color: "var(--nb-muted)" }}>128 bookmarks saved</p>
                        </div>
                      </div>
                      <span className="nb-tag nb-tag-primary text-xs">+ Add link</span>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      {[
                        {
                          title: "Figma — collaborative design",
                          domain: "figma.com",
                          badge: "Design",
                          colorClass: "nb-card-purple",
                          tags: ["#design", "#ui"],
                        },
                        {
                          title: "Next.js 16 documentation",
                          domain: "nextjs.org",
                          badge: "Code",
                          colorClass: "nb-card-blue",
                          tags: ["#react", "#nextjs"],
                        },
                        {
                          title: "Tailwind CSS utility framework",
                          domain: "tailwindcss.com",
                          badge: "CSS",
                          colorClass: "nb-card-mint",
                          tags: ["#css", "#frontend"],
                        },
                      ].map((card, i) => (
                        <div key={i} className="nb-card-sm p-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-semibold" style={{ color: "var(--nb-muted)" }}>{card.domain}</span>
                            <span className={`nb-tag text-[10px] ${card.colorClass}`}>{card.badge}</span>
                          </div>
                          <h4 className="mt-2 line-clamp-1 text-xs font-bold" style={{ color: "var(--nb-fg)" }}>{card.title}</h4>
                          <div className="mt-3 flex gap-1">
                            {card.tags.map((tag) => (
                              <span key={tag} className="nb-tag text-[10px]">{tag}</span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Platform Bar */}
      <section className="border-y py-8" style={{ borderColor: "var(--nb-border)", background: "var(--nb-surface)" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--nb-muted)" }}>
            Save content from your favorite platforms
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-8 text-sm font-semibold" style={{ color: "var(--nb-muted)" }}>
            {[
              { name: "Medium", icon: Newspaper },
              { name: "YouTube", icon: Film },
              { name: "GitHub", icon: Globe },
              { name: "Pinterest", icon: ImageIcon },
              { name: "Reddit", icon: Search },
            ].map((platform) => (
              <span key={platform.name} className="flex items-center gap-2 transition-colors hover:opacity-80">
                <platform.icon className="size-4" />
                {platform.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Feature Bento */}
      <section id="features" className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--nb-primary)" }}>
                Features
              </p>
              <h2 className="mt-3 text-balance text-4xl font-extrabold tracking-tight sm:text-5xl" style={{ color: "var(--nb-fg)" }}>
                Built for serious curators
              </h2>
              <p className="mt-4 max-w-[65ch] text-sm leading-relaxed" style={{ color: "var(--nb-muted)" }}>
                Save fast, find faster. Organize research, inspiration, and references without the mess.
              </p>
            </div>
          </div>

          {/* Bento: Row 1 — 3 columns */}
          <div className="mt-14 grid gap-5 lg:grid-cols-3">
            <div className="nb-card-static p-6 transition-transform duration-300 hover:-translate-y-1">
              <div className="nb-float grid size-12 place-items-center rounded-2xl border" style={{ background: "color-mix(in srgb, var(--nb-primary) 10%, var(--nb-surface))", color: "var(--nb-primary)" }}>
                <Layers className="size-6" />
              </div>
              <h3 className="mt-5 text-xl font-bold" style={{ color: "var(--nb-fg)" }}>Visual collections</h3>
              <p className="mt-2 max-w-[60ch] text-sm leading-relaxed" style={{ color: "var(--nb-muted)" }}>
                Group bookmarks into nested folders, assign custom icons, and switch between Grid, Cards, List, and Headlines.
              </p>
            </div>

            <div className="nb-card-static p-6 transition-transform duration-300 hover:-translate-y-1">
              <div className="nb-float grid size-12 place-items-center rounded-2xl border" style={{ background: "color-mix(in srgb, var(--nb-secondary) 10%, var(--nb-surface))", color: "var(--nb-secondary)", animationDelay: "600ms" }}>
                <Search className="size-6" />
              </div>
              <h3 className="mt-5 text-xl font-bold" style={{ color: "var(--nb-fg)" }}>Smart search, Cmd+K</h3>
              <p className="mt-2 max-w-[60ch] text-sm leading-relaxed" style={{ color: "var(--nb-muted)" }}>
                Instant search across titles, URLs, descriptions, and tags. Your full library in milliseconds.
              </p>
              <div className="mt-5 flex items-center justify-between rounded-xl border px-3 py-2.5 text-xs font-mono" style={{ borderColor: "var(--nb-border)", background: "var(--nb-surface-alt)" }}>
                <span className="font-semibold">Press Cmd + K anytime</span>
                <Command className="size-4" style={{ color: "var(--nb-muted)" }} />
              </div>
            </div>

            <div className="nb-card-static p-6 transition-transform duration-300 hover:-translate-y-1">
              <div className="nb-float grid size-12 place-items-center rounded-2xl border" style={{ background: "color-mix(in srgb, var(--nb-bruto-cyan) 14%, var(--nb-surface))", color: "var(--nb-bruto-cyan)", animationDelay: "1200ms" }}>
                <Film className="size-6" />
              </div>
              <h3 className="mt-5 text-xl font-bold" style={{ color: "var(--nb-fg)" }}>Media classification</h3>
              <p className="mt-2 max-w-[60ch] text-sm leading-relaxed" style={{ color: "var(--nb-muted)" }}>
                Automatic filtering by media type — Articles, Images, Videos, and Documents — so the right kind of content always surfaces.
              </p>
            </div>
          </div>

          {/* Bento: Row 2 — 70/30 split */}
          <div className="mt-5 grid gap-5 lg:grid-cols-3">
            <div className="nb-card-static p-6 transition-transform duration-300 hover:-translate-y-1 lg:col-span-2" style={{ background: "var(--nb-surface)" }}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-md">
                  <div className="nb-float grid size-12 place-items-center rounded-2xl border" style={{ background: "color-mix(in srgb, var(--nb-bruto-orange) 14%, var(--nb-surface))", color: "var(--nb-bruto-orange)" }}>
                    <CheckCircle2 className="size-6" />
                  </div>
                  <h3 className="mt-5 text-xl font-bold" style={{ color: "var(--nb-fg)" }}>Batch operations</h3>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--nb-muted)" }}>
                    Select multiple bookmarks at once to bulk move into collections, add tags, mark favorites, or clean up.
                  </p>
                </div>
                <div className="grid w-full max-w-xs grid-cols-2 gap-2">
                  {["Move", "Tag", "Favorite", "Trash"].map((action) => (
                    <div key={action} className="nb-card-sm px-3 py-3 text-center text-xs font-semibold">{action}</div>
                  ))}
                </div>
              </div>
            </div>

            <div className="nb-card-static p-6 transition-transform duration-300 hover:-translate-y-1" style={{ background: "color-mix(in srgb, var(--nb-primary) 8%, var(--nb-surface))" }}>
              <div className="nb-float grid size-12 place-items-center rounded-2xl border" style={{ background: "color-mix(in srgb, var(--nb-bruto-mint) 16%, var(--nb-surface))", color: "var(--nb-bruto-mint)" }}>
                <Fingerprint className="size-6" />
              </div>
              <h3 className="mt-5 text-xl font-bold" style={{ color: "var(--nb-fg)" }}>Private & isolated</h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--nb-muted)" }}>
                Your bookmarks stay strictly private under your account, with trash recovery and export/import.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Method */}
      <section id="method" className="py-20 lg:py-28" style={{ background: "var(--nb-surface)", borderTop: "1px solid var(--nb-border)", borderBottom: "1px solid var(--nb-border)" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-14 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-5">
              <div className="lg:sticky lg:top-28">
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--nb-primary)" }}>
                  Method
                </p>
                <h2 className="mt-3 text-balance text-4xl font-extrabold tracking-tight sm:text-5xl" style={{ color: "var(--nb-fg)" }}>
                  Curate in seconds
                </h2>
                <p className="mt-4 max-w-sm text-sm leading-relaxed" style={{ color: "var(--nb-muted)" }}>
                  From a raw web link to an organized visual collection in three simple steps.
                </p>
                <div className="mt-8 flex flex-wrap gap-2">
                  {["Save", "Organize", "Find"].map((label) => (
                    <span key={label} className="nb-tag nb-tag-secondary">{label}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="relative lg:col-span-7">
              <div
                className="absolute bottom-4 left-8 top-4 hidden w-px sm:block"
                style={{ background: "var(--nb-border)" }}
                aria-hidden="true"
              />
              <div>
                {[
                  { step: "1", title: "Save", desc: "Collect articles, design inspirations, code repositories, and videos instantly.", icon: Plus },
                  { step: "2", title: "Organize", desc: "Group bookmarks into nested collections, add custom tags, and set media types.", icon: FolderPlus },
                  { step: "3", title: "Find", desc: "Locate any saved resource in milliseconds with search and command palette.", icon: Compass },
                ].map((item) => (
                  <div key={item.step} className="group flex gap-5 pb-12 last:pb-0">
                    <div
                      className="relative z-10 grid size-16 shrink-0 place-items-center rounded-2xl border text-xl font-bold transition-transform duration-300 group-hover:-translate-y-1"
                      style={{ background: "var(--nb-surface)", color: "var(--nb-primary)", borderColor: "var(--nb-border)", boxShadow: "var(--nb-shadow-md)" }}
                    >
                      {item.step}
                    </div>
                    <div className="pt-1">
                      <div className="flex items-center gap-2.5">
                        <item.icon className="size-5" style={{ color: "var(--nb-primary)" }} />
                        <h3 className="text-2xl font-bold" style={{ color: "var(--nb-fg)" }}>{item.title}</h3>
                      </div>
                      <p className="mt-2 max-w-md text-sm leading-relaxed" style={{ color: "var(--nb-muted)" }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Pricing */}
      <section id="pricing" className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-balance text-4xl font-extrabold tracking-tight sm:text-5xl" style={{ color: "var(--nb-fg)" }}>
              Simple, transparent pricing
            </h2>
            <p className="mx-auto mt-4 max-w-[65ch] text-sm" style={{ color: "var(--nb-muted)" }}>
              Full access to all curation tools with a generous free tier.
            </p>
          </div>

          <div className="mx-auto mt-14 grid max-w-4xl gap-8 md:grid-cols-2">
            <div className="nb-card-static p-8">
              <h3 className="text-xl font-bold" style={{ color: "var(--nb-fg)" }}>Free Starter</h3>
              <p className="mt-1 text-xs" style={{ color: "var(--nb-muted)" }}>For individual bookmarking</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-5xl font-extrabold tabular-nums tracking-tight" style={{ color: "var(--nb-fg)" }}>$0</span>
                <span className="text-xs" style={{ color: "var(--nb-muted)" }}>/ forever</span>
              </div>
              <ul className="mt-6 space-y-3 text-sm" style={{ color: "var(--nb-fg)" }}>
                {[
                  "Up to 500 bookmarks saved",
                  "4 view modes — Grid, Masonry, List, Headlines",
                  "Nested collections & custom icons",
                  "Command palette (Cmd+K)",
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 shrink-0" style={{ color: "var(--nb-success)" }} />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="nb-btn nb-btn-surface mt-8 block w-full text-center">
                Get started free
              </Link>
            </div>

            <div
              className="relative rounded-3xl border p-8"
              style={{ borderColor: "color-mix(in srgb, var(--nb-primary) 40%, var(--nb-border))", background: "color-mix(in srgb, var(--nb-primary) 6%, var(--nb-surface))", boxShadow: "var(--nb-shadow-lg)" }}
            >
              <span className="nb-tag nb-tag-primary absolute -top-3 right-8">Recommended</span>
              <h3 className="text-xl font-bold" style={{ color: "var(--nb-fg)" }}>Pro Workspace</h3>
              <p className="mt-1 text-xs" style={{ color: "var(--nb-muted)" }}>For power users and researchers</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-5xl font-extrabold tabular-nums tracking-tight" style={{ color: "var(--nb-fg)" }}>$4.99</span>
                <span className="text-xs" style={{ color: "var(--nb-muted)" }}>/ month</span>
              </div>
              <ul className="mt-6 space-y-3 text-sm" style={{ color: "var(--nb-fg)" }}>
                {[
                  "Unlimited bookmarks & collections",
                  "Automatic full-page metadata scraping",
                  "Batch operations & tag management",
                  "Priority backup & JSON export",
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 shrink-0" style={{ color: "var(--nb-primary)" }} />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="nb-btn nb-btn-primary mt-8 block w-full text-center">
                Start 14-day free trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 7. CTA Banner */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div
            className="rounded-[2rem] px-6 py-14 text-center sm:px-14"
            style={{ background: "var(--nb-primary)", color: "var(--nb-primary-fg)", boxShadow: "var(--nb-shadow-lg)" }}
          >
            <h2 className="text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">Ready to organize the web?</h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed opacity-85">
              Join the researchers and power users who have upgraded their digital curation workspace.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link href="/register" className="nb-btn nb-btn-secondary px-7 py-3">
                Start curating now
              </Link>
              <button
                type="button"
                onClick={onLaunchDemo}
                className="nb-btn nb-btn-surface px-7 py-3"
              >
                Launch demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Footer */}
      <footer className="border-t py-12" style={{ borderColor: "var(--nb-border)", background: "var(--nb-surface)" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2.5">
              <span
                className="grid size-8 place-items-center rounded-lg border font-bold"
                style={{ background: "var(--nb-primary)", color: "var(--nb-primary-fg)", borderColor: "transparent" }}
              >
                W
              </span>
              <span className="text-base font-bold" style={{ color: "var(--nb-fg)" }}>Wesite</span>
            </div>
            <div className="flex flex-wrap gap-4 text-xs font-medium" style={{ color: "var(--nb-muted)" }}>
              <a href="#features" className="transition-colors" style={{ color: "var(--nb-fg)" }}>Features</a>
              <a href="#pricing" className="transition-colors" style={{ color: "var(--nb-fg)" }}>Pricing</a>
              <Link href="/privacy" className="transition-colors" style={{ color: "var(--nb-fg)" }}>Privacy</Link>
              <Link href="/terms" className="transition-colors" style={{ color: "var(--nb-fg)" }}>Terms</Link>
            </div>
            <p className="text-xs" style={{ color: "var(--nb-muted)" }}>
              &copy; {new Date().getFullYear()} Wesite. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}