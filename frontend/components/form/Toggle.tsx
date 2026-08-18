"use client";

import { useId } from "react";

type Props = {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
};

export function Toggle({ label, description, checked, onChange }: Props) {
  const reactId = useId();
  const id = `toggle-${reactId}`;
  const descId = description ? `${id}-desc` : undefined;
  return (
    <div className="flex items-start justify-between gap-4 rounded-[var(--radius-md)] border border-[var(--color-rule)] bg-white p-4">
      <div className="flex flex-col gap-1">
        <label
          htmlFor={id}
          className="font-[family-name:var(--font-display)] cursor-pointer text-[var(--color-ink)] text-[0.95rem] font-semibold"
        >
          {label}
        </label>
        {description ? (
          <p
            id={descId}
            className="text-[var(--color-ink-muted)] text-sm leading-relaxed"
          >
            {description}
          </p>
        ) : null}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={descId}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition ${checked ? "border-[var(--color-accent-strong)] bg-[var(--color-accent-strong)]" : "border-[var(--color-ink-faint)] bg-[var(--color-paper-deep)]"}`}
      >
        <span
          aria-hidden="true"
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition ${checked ? "translate-x-6" : "translate-x-1"}`}
        />
        <span className="sr-only">{checked ? "On" : "Off"}</span>
      </button>
    </div>
  );
}
