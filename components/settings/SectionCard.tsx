import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type SectionCardProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
};

export default function SectionCard({ icon: Icon, title, description, children, action }: SectionCardProps) {
  return (
    <div className="nb-card-static nb-card-enter p-5 sm:p-6" style={{ background: "var(--nb-surface)" }}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b-3 pb-4" style={{ borderColor: "var(--nb-border)" }}>
        <div className="flex items-center gap-3">
          <span
            className="flex size-9 items-center justify-center rounded-xl border-3"
            style={{ background: "var(--nb-primary)", color: "var(--nb-primary-fg)", borderColor: "var(--nb-border)" }}
          >
            <Icon className="size-4" />
          </span>
          <div>
            <h2 className="text-sm font-extrabold leading-tight" style={{ color: "var(--nb-fg)" }}>
              {title}
            </h2>
            {description ? (
              <p className="mt-0.5 max-w-2xl text-xs leading-relaxed" style={{ color: "var(--nb-muted)" }}>
                {description}
              </p>
            ) : null}
          </div>
        </div>
        {action}
      </div>
      <div className="pt-4">{children}</div>
    </div>
  );
}