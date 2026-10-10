import { Command, ExternalLink, FileText, Heart, Info, ShieldCheck } from "lucide-react";
import Logo from "@/components/Logo";
import SectionCard from "./SectionCard";

const shortcuts = [
  { keys: ["Ctrl", "K"], label: "Open command palette" },
  { keys: ["/"], label: "Jump to search (on dashboard)" },
  { keys: ["Esc"], label: "Close dialogs and palettes" },
];

const links = [
  { href: "/terms", label: "Terms of service", icon: FileText },
  { href: "/privacy", label: "Privacy policy", icon: ShieldCheck },
];

export default function AboutSection() {
  return (
    <div className="space-y-5">
      <SectionCard
        icon={Info}
        title="About Wesite"
        description="A bold, privacy-friendly bookmark manager."
        action={<span className="nb-tag nb-tag-primary">v0.1.0</span>}
      >
        <div className="flex flex-col items-center gap-4 rounded-xl border-3 p-6 text-center" style={{ borderColor: "var(--nb-border)", background: "var(--nb-surface-alt)" }}>
          <Logo className="size-14" />
          <div>
            <h3 className="text-lg font-extrabold" style={{ color: "var(--nb-fg)" }}>
              Wesite
            </h3>
            <p className="mt-1 max-w-md text-sm leading-relaxed" style={{ color: "var(--nb-muted)" }}>
              Save, organize, monitor and automate the websites you care about — all in one neo-brutalist
              workspace. Your bookmarks, folders, monitors and automations live in your account.
            </p>
          </div>
        </div>
      </SectionCard>

      <SectionCard icon={Command} title="Keyboard shortcuts" description="Move faster without touching the mouse.">
        <div className="rounded-xl border-3" style={{ borderColor: "var(--nb-border)" }}>
          {shortcuts.map((shortcut, index) => (
            <div
              key={shortcut.label}
              className="flex items-center justify-between gap-4 p-3"
              style={index === 0 ? undefined : { borderTop: "3px solid var(--nb-border)" }}
            >
              <span className="text-sm" style={{ color: "var(--nb-fg)" }}>
                {shortcut.label}
              </span>
              <span className="flex items-center gap-1">
                {shortcut.keys.map((key) => (
                  <kbd
                    key={key}
                    className="rounded-lg border-3 px-2 py-0.5 font-mono text-[10px] font-bold"
                    style={{ borderColor: "var(--nb-border)", background: "var(--nb-surface)", color: "var(--nb-fg)" }}
                  >
                    {key}
                  </kbd>
                ))}
              </span>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard icon={Heart} title="Legal" description="The boring but important stuff.">
        <div className="flex flex-wrap gap-2">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <a key={link.href} href={link.href} className="nb-btn nb-btn-surface nb-btn-sm">
                <Icon className="size-3.5" />
                {link.label}
                <ExternalLink className="size-3" />
              </a>
            );
          })}
        </div>
      </SectionCard>
    </div>
  );
}