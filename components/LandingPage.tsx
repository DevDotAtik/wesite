"use client";

import Link from "next/link";
import LandingBackground3D from "@/components/landing/LandingBackground3D";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/theme/ThemeToggle";
import {
  ArrowRight,
  CheckCircle2,
  Command,
  Compass,
  FileText,
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

export default function LandingPage({ onLaunchDemo }: LandingPageProps) {

  return (
    <div className="relative isolate min-h-screen overflow-hidden">
      <LandingBackground3D />

      {/* 1. Marketing Header */}
      <header className="sticky top-0 z-50 border-b-3" style={{ borderColor: "var(--nb-border)", background: "var(--nb-surface)" }}>
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo className="size-10" />
            <span className="text-xl font-bold tracking-tight" style={{ color: "var(--nb-fg)" }}>WeSite</span>
          </Link>

          <nav className="hidden items-center gap-2 text-sm font-semibold md:flex">
            <a href="#features" className="nb-btn nb-btn-ghost nb-btn-sm">Features</a>
            <a href="#pricing" className="nb-btn nb-btn-ghost nb-btn-sm">Pricing</a>
            <a href="#how-it-works" className="nb-btn nb-btn-ghost nb-btn-sm">How it Works</a>
            <a href="#field-guide" className="nb-btn nb-btn-ghost nb-btn-sm">Field Guide</a>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/dashboard" className="nb-btn nb-btn-surface nb-btn-sm hidden sm:inline-flex">
              Demo Workspace
            </Link>
            <Link href="/login" className="nb-btn nb-btn-ghost nb-btn-sm hidden sm:inline-flex">
              Sign In
            </Link>
            <Link href="/register" className="nb-btn nb-btn-primary nb-btn-sm">
              Sign Up
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24 lg:pt-24 lg:pb-32">
        <div className="absolute inset-0 nb-dot-bg opacity-30" />
        <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          {/* Announcement pill */}
    

          <h1 className="mx-auto max-w-4xl text-balance text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl" style={{ color: "var(--nb-fg)" }}>
            All your bookmarks{" "}
            <span style={{ color: "var(--nb-primary)" }}>in one place.</span>
          </h1>

          <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed sm:text-xl" style={{ color: "var(--nb-muted)" }}>
            Wesite is the modern curation workspace to save articles, design inspirations, videos, and code tools. Organize them into visual collections.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href="/register" className="nb-btn nb-btn-primary">
              Get Started for Free
              <ArrowRight className="size-4" />
            </Link>
            <Link href="/dashboard" className="nb-btn nb-btn-surface">
              View Demo Workspace
            </Link>
          </div>
          <div className="mt-7 flex justify-center">
            <span className="zine-stamp">Free forever · No card needed</span>
          </div>

          {/* Product UI Mockup */}
          <div className="nb-card-static relative mx-auto mt-16 max-w-5xl p-3" style={{ borderRadius: "20px" }}>
            <span className="zine-tape zine-tape-tl" aria-hidden="true" />
            <span className="zine-tape zine-tape-tr" aria-hidden="true" />
            <div className="flex items-center gap-2 border-b-3 px-4 pb-3 pt-2" style={{ borderColor: "var(--nb-border)" }}>
              <div className="flex gap-1.5">
                <span className="size-3.5 rounded-full" style={{ background: "var(--nb-danger)" }} />
                <span className="size-3.5 rounded-full" style={{ background: "var(--nb-warning)" }} />
                <span className="size-3.5 rounded-full" style={{ background: "var(--nb-success)" }} />
              </div>
              <div className="mx-auto flex h-8 max-w-md flex-1 items-center justify-center rounded-lg border-[3px] px-3 text-xs font-bold" style={{ borderColor: "var(--nb-border)", background: "var(--nb-surface-alt)" }}>
                https://wesite.app/workspace
              </div>
            </div>

            {/* Mockup Dashboard Preview */}
            <div className="overflow-hidden rounded-2xl p-4 text-left sm:p-6" style={{ background: "var(--nb-bg)" }}>
              <div className="mb-4 flex items-center justify-between border-b-3 pb-3" style={{ borderColor: "var(--nb-border)" }}>
                <div className="flex items-center gap-3">
                  <Logo className="size-9" />
                  <div>
                    <h3 className="text-sm font-bold" style={{ color: "var(--nb-fg)" }}>Design & Dev Stack</h3>
                    <p className="text-[11px]" style={{ color: "var(--nb-muted)" }}>128 bookmarks saved</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="nb-card-blue rounded-lg border-[3px] px-2.5 py-1 text-xs font-bold" style={{ borderColor: "var(--nb-border)" }}>
                    + Add Link
                  </span>
                </div>
              </div>

              {/* Sample Cards inside mockup */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                {[
                  {
                    title: "Figma: The Collaborative Interface Design Tool",
                    domain: "figma.com",
                    badge: "Design",
                    colorClass: "nb-card-purple",
                    desc: "Build better products as a team.",
                    tags: ["#design", "#ui"],
                  },
                  {
                    title: "Next.js 16 Documentation & App Router",
                    domain: "nextjs.org",
                    badge: "Code",
                    colorClass: "nb-card-blue",
                    desc: "The React Framework for the Web.",
                    tags: ["#react", "#nextjs"],
                  },
                  {
                    title: "Tailwind CSS — Utility-First Framework",
                    domain: "tailwindcss.com",
                    badge: "CSS",
                    colorClass: "nb-card-mint",
                    desc: "A utility-first CSS framework.",
                    tags: ["#css", "#frontend"],
                  },
                ].map((card, i) => (
                  <div
                    key={i}
                    className="nb-card-sm p-3.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold" style={{ color: "var(--nb-muted)" }}>{card.domain}</span>
                      <span className={`nb-tag text-[10px] ${card.colorClass}`}>
                        {card.badge}
                      </span>
                    </div>
                    <h4 className="mt-2 line-clamp-1 text-xs font-bold" style={{ color: "var(--nb-fg)" }}>
                      {card.title}
                    </h4>
                    <p className="mt-1 line-clamp-2 text-[11px]" style={{ color: "var(--nb-muted)" }}>{card.desc}</p>
                    <div className="mt-3 flex gap-1">
                      {card.tags.map((t) => (
                        <span key={t} className="nb-tag text-[10px]">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Platform Badges Bar */}
      <section className="border-y-3 py-8" style={{ borderColor: "var(--nb-border)", background: "var(--nb-surface)" }}>
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--nb-muted)" }}>
            GREAT FOR CONTENT FROM YOUR FAVORITE PLATFORMS
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-8 text-sm font-bold" style={{ color: "var(--nb-fg)" }}>
            {[
              { name: "Medium", icon: Newspaper, color: "var(--nb-success)" },
              { name: "YouTube", icon: Film, color: "var(--nb-danger)" },
              { name: "GitHub", icon: Globe, color: "var(--nb-primary)" },
              { name: "Pinterest", icon: ImageIcon, color: "var(--nb-bruto-pink)" },
              { name: "Reddit", icon: FileText, color: "var(--nb-warning)" },
            ].map((platform) => (
              <span key={platform.name} className="flex items-center gap-2 transition-colors hover:opacity-80">
                <platform.icon className="size-4" style={{ color: platform.color }} />
                {platform.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Feature Grid */}
      <section id="features" className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="zine-kicker">What&apos;s inside</span>
            <h2 className="mt-4 text-balance text-4xl font-extrabold sm:text-5xl" style={{ color: "var(--nb-fg)" }}>
              Built for serious curators
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm" style={{ color: "var(--nb-muted)" }}>
              Save fast, find faster. Organize research, inspiration, and references without the mess.
            </p>
          </div>

          <div className="mt-16 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {/* Card 1: Visual Collections */}
            <div className="nb-card-static p-6 lg:col-span-2" style={{ background: "var(--nb-surface-alt)" }}>
              <div className="nb-card-blue grid size-12 place-items-center rounded-2xl border-[3px]" style={{ borderColor: "var(--nb-border)" }}>
                <Layers className="size-6" />
              </div>
              <h3 className="mt-5 text-xl font-bold" style={{ color: "var(--nb-fg)" }}>Visual Collections</h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--nb-muted)" }}>
                Group bookmarks into nested folders, assign custom icons, and toggle between 4 views: Grid, Cards, List, and Headlines.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {["Grid View", "Masonry Cards", "List Rows", "Headlines"].map((mode) => (
                  <div key={mode} className="nb-card-sm p-3 text-center text-xs font-bold">
                    {mode}
                  </div>
                ))}
              </div>
            </div>

            {/* Card 2: Smart Search */}
            <div className="nb-card-static p-6" style={{ background: "var(--nb-primary)", color: "var(--nb-primary-fg)", borderColor: "var(--nb-border)" }}>
              <div className="grid size-12 place-items-center rounded-2xl border-[3px] bg-white/20" style={{ borderColor: "rgba(255,255,255,0.3)" }}>
                <Search className="size-6" />
              </div>
              <h3 className="mt-5 text-xl font-bold">Smart Search & Cmd+K</h3>
              <p className="mt-2 text-sm leading-relaxed opacity-80">
                Instant search across titles, URLs, descriptions, and tags. Access your full library in milliseconds.
              </p>
              <div className="mt-6 flex items-center justify-between rounded-xl border-[3px] bg-white/15 px-3 py-2.5 text-xs font-mono backdrop-blur-sm" style={{ borderColor: "rgba(255,255,255,0.2)" }}>
                <span className="font-bold">Press Cmd + K anytime</span>
                <Command className="size-4" />
              </div>
            </div>

            {/* Card 3: Batch Operations */}
            <div className="nb-card-static p-6" style={{ background: "var(--nb-surface)" }}>
              <div className="nb-card-purple grid size-12 place-items-center rounded-2xl border-[3px]" style={{ borderColor: "var(--nb-border)" }}>
                <CheckCircle2 className="size-6" />
              </div>
              <h3 className="mt-5 text-xl font-bold" style={{ color: "var(--nb-fg)" }}>Batch Operations</h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--nb-muted)" }}>
                Select multiple bookmarks at once to bulk move into collections, add tags, mark favorites, or clean up.
              </p>
            </div>

            {/* Card 4: Media Filtering */}
            <div className="nb-card-static p-6" style={{ background: "var(--nb-surface)" }}>
              <div className="nb-card-coral grid size-12 place-items-center rounded-2xl border-[3px]" style={{ borderColor: "var(--nb-border)" }}>
                <Film className="size-6" />
              </div>
              <h3 className="mt-5 text-xl font-bold" style={{ color: "var(--nb-fg)" }}>Media Type Classification</h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--nb-muted)" }}>
                Automatic filtering by media type: Articles, Images, Videos, and Documents.
              </p>
            </div>

            {/* Card 5: Privacy */}
            <div className="nb-card-static p-6" style={{ background: "var(--nb-surface)" }}>
              <div className="nb-card-mint grid size-12 place-items-center rounded-2xl border-[3px]" style={{ borderColor: "var(--nb-border)" }}>
                <Fingerprint className="size-6" />
              </div>
              <h3 className="mt-5 text-xl font-bold" style={{ color: "var(--nb-fg)" }}>Private & Isolated</h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--nb-muted)" }}>
                Your bookmarks remain strictly private under your account with trash recovery and export/import.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. How it Works */}
      <section id="how-it-works" className="py-20 lg:py-28" style={{ background: "var(--nb-surface)", borderTop: "3px solid var(--nb-border)", borderBottom: "3px solid var(--nb-border)" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-14 lg:grid-cols-12 lg:gap-10">
            {/* Sticky intro */}
            <div className="lg:col-span-5">
              <div className="lg:sticky lg:top-28">
                <span className="zine-kicker">How it works</span>
                <h2 className="mt-4 text-balance text-4xl font-extrabold sm:text-5xl" style={{ color: "var(--nb-fg)" }}>
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

            {/* Vertical steps */}
            <div className="relative lg:col-span-7">
              <div
                className="absolute bottom-4 left-8 top-4 hidden w-[3px] sm:block"
                style={{ background: "var(--nb-border)", opacity: 0.18 }}
                aria-hidden="true"
              />
              <div>
                {[
                  {
                    step: "1",
                    title: "Save",
                    desc: "Collect articles, design inspirations, code repositories, and videos instantly.",
                    icon: Plus,
                    colorClass: "nb-card-yellow",
                  },
                  {
                    step: "2",
                    title: "Organize",
                    desc: "Group bookmarks into nested collections, add custom tags, and set media types.",
                    icon: FolderPlus,
                    colorClass: "nb-card-blue",
                  },
                  {
                    step: "3",
                    title: "Find",
                    desc: "Locate any saved resource in milliseconds with search and command palette.",
                    icon: Compass,
                    colorClass: "nb-card-mint",
                  },
                ].map((item) => (
                  <div key={item.step} className="group flex gap-5 pb-12 last:pb-0">
                    <div
                      className={`${item.colorClass} relative z-10 grid size-16 shrink-0 place-items-center rounded-2xl border-3 text-xl font-extrabold transition-transform duration-200 group-hover:-translate-y-1 group-hover:-rotate-2`}
                      style={{ borderColor: "var(--nb-border)", boxShadow: "var(--nb-shadow-sm)" }}
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

      {/* 6. Field Guide — harm-reduction-zine revival: a pinned-up
          pocket zine. Peer-care tone, real steps, real links. */}
      <section id="field-guide" className="py-20 lg:py-28">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="zine-sheet p-6 sm:p-10">
            <span className="zine-tape zine-tape-tl" aria-hidden="true" />
            <span className="zine-tape zine-tape-tr" aria-hidden="true" />
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12">
              {/* Cover */}
              <div>
                <span className="zine-kicker">A pocket zine · Issue No. 01</span>
                <h2 className="zine-title mt-5 text-balance text-4xl font-extrabold tracking-tight sm:text-5xl">
                  The link-hoarder&apos;s field guide
                </h2>
                <p className="zine-note mt-5 max-w-sm text-base leading-relaxed">
                  — passed hand to hand by people with 47 open tabs who decided to change their ways.
                </p>
                <div className="mt-7">
                  <span className="zine-stamp">Save it · Shelve it · Find it</span>
                </div>
                <div className="zine-strip mt-8">
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--zine-muted)" }}>Start here:</span>
                  <Link href="/register">Start free</Link>
                  <Link href="/login">Sign in</Link>
                  <Link href="/dashboard">Open your library</Link>
                </div>
              </div>
              {/* Steps */}
              <div>
                <details className="zine-step" open>
                  <summary><span className="zine-step-num">1</span>Save it raw</summary>
                  <p className="zine-step-body">
                    Paste any URL. The title, description, and favicon are captured
                    automatically — fix anything by hand if the site is stingy with metadata.
                  </p>
                </details>
                <details className="zine-step">
                  <summary><span className="zine-step-num">2</span>Shelve it, then close the tab</summary>
                  <p className="zine-step-body">
                    Give it one folder and a few tags. Then close the tab with
                    confidence — the shelf remembers so your browser doesn&apos;t have to.
                  </p>
                </details>
                <details className="zine-step">
                  <summary><span className="zine-step-num">3</span>Find it in seconds</summary>
                  <p className="zine-step-body">
                    Search across titles, URLs, and tags, or press Cmd+K anywhere.
                    Nothing you saved stays lost.
                  </p>
                </details>
                <ul className="zine-check mt-6 text-sm font-semibold" style={{ color: "var(--zine-ink)" }}>
                  <li>No more bookmark graveyards</li>
                  <li>No more “which tab was that in?”</li>
                  <li>Trash with restore, in case of accidents</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Pricing Section */}
      <section id="pricing" className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="zine-kicker">Pricing</span>
            <h2 className="mt-4 text-balance text-4xl font-extrabold sm:text-5xl" style={{ color: "var(--nb-fg)" }}>
              Simple, transparent pricing
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm" style={{ color: "var(--nb-muted)" }}>
              Get full access to all curation tools with our generous free tier.
            </p>
          </div>

          <div className="mt-14 mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
            {/* Free Plan */}
            <div className="nb-card-static p-8" style={{ background: "var(--nb-surface)" }}>
              <h3 className="text-xl font-bold" style={{ color: "var(--nb-fg)" }}>Free Starter</h3>
              <p className="mt-1 text-xs" style={{ color: "var(--nb-muted)" }}>Perfect for individual bookmarking</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-5xl font-extrabold tabular-nums" style={{ color: "var(--nb-fg)" }}>$0</span>
                <span className="text-xs" style={{ color: "var(--nb-muted)" }}>/ forever</span>
              </div>
              <ul className="mt-6 space-y-3 text-xs font-semibold" style={{ color: "var(--nb-fg)" }}>
                {[
                  "Up to 500 bookmarks saved",
                  "4 View modes (Grid, Masonry, List, Headlines)",
                  "Nested collections & custom icons",
                  "Command Palette (Cmd+K)",
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 shrink-0" style={{ color: "var(--nb-success)" }} />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="nb-btn nb-btn-surface mt-8 block w-full text-center">
                Get Started Free
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="nb-card-static p-8 relative" style={{ background: "var(--nb-card)", borderWidth: "4px" }}>
              <div className="nb-tag nb-tag-primary absolute -top-4 right-6">
                Most Popular
              </div>
              <h3 className="text-xl font-bold" style={{ color: "var(--nb-fg)" }}>Pro Workspace</h3>
              <p className="mt-1 text-xs" style={{ color: "var(--nb-muted)" }}>For power users and researchers</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-5xl font-extrabold tabular-nums" style={{ color: "var(--nb-fg)" }}>$4.99</span>
                <span className="text-xs" style={{ color: "var(--nb-muted)" }}>/ month</span>
              </div>
              <ul className="mt-6 space-y-3 text-xs font-semibold" style={{ color: "var(--nb-fg)" }}>
                {[
                  "Unlimited bookmarks & collections",
                  "Automatic full-page metadata scraping",
                  "Batch Operations & tag management",
                  "Priority backup & JSON export",
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 shrink-0" style={{ color: "var(--nb-primary)" }} />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="nb-btn nb-btn-primary mt-8 block w-full text-center">
                Start 14-Day Free Trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 7. CTA Banner */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="nb-card-static px-6 py-14 text-center sm:px-14 sm:py-18" style={{ background: "var(--nb-primary)", color: "var(--nb-primary-fg)" }}>
            <h2 className="text-balance text-3xl font-extrabold sm:text-4xl">Ready to organize the web?</h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed opacity-80">
              Join thousands of creatives, researchers, and power users who have upgraded their digital curation workspace.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link href="/register" className="nb-btn nb-btn-accent">
                Start Curating Now
              </Link>
              <button
                type="button"
                onClick={onLaunchDemo}
                className="nb-btn nb-btn-surface"
              >
                Launch Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Footer */}
      <footer className="border-t-3 py-12" style={{ borderColor: "var(--nb-border)", background: "var(--nb-surface)" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2.5">
              <Logo className="size-8" />
              <span className="text-base font-bold" style={{ color: "var(--nb-fg)" }}>Wesite</span>
            </div>
            <div className="flex flex-wrap gap-4 text-xs font-semibold" style={{ color: "var(--nb-muted)" }}>
              <a href="#features" className="transition-colors" style={{ color: "var(--nb-fg)" }}>Features</a>
              <a href="#pricing" className="transition-colors" style={{ color: "var(--nb-fg)" }}>Pricing</a>
              <Link href="/login" className="transition-colors" style={{ color: "var(--nb-fg)" }}>Sign In</Link>
              <Link href="/register" className="transition-colors" style={{ color: "var(--nb-fg)" }}>Register</Link>
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
