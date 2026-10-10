"use client";

import { useId } from "react";

type SwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  id?: string;
};

export default function Switch({ checked, onChange, label, description, disabled, id }: SwitchProps) {
  const generatedId = useId();
  const switchId = id ?? generatedId;

  return (
    <div className="flex items-center justify-between gap-4">
      {label || description ? (
        <div className="min-w-0">
          {label ? (
            <span className="block text-sm font-bold" style={{ color: "var(--nb-fg)" }}>
              {label}
            </span>
          ) : null}
          {description ? (
            <span className="mt-0.5 block text-xs leading-relaxed" style={{ color: "var(--nb-muted)" }}>
              {description}
            </span>
          ) : null}
        </div>
      ) : null}
      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`nb-switch shrink-0 ${checked ? "nb-switch-on" : ""}`}
      >
        <span className="nb-switch-knob" aria-hidden="true" />
      </button>
    </div>
  );
}