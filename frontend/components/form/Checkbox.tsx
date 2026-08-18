"use client";

import type { ReactNode } from "react";
import { useId } from "react";

type Props = {
  label: ReactNode;
  description?: ReactNode;
  checked: boolean;
  onChange: (next: boolean) => void;
  name?: string;
  value?: string;
};

export function Checkbox({ label, description, checked, onChange, name, value }: Props) {
  const id = useId();
  const descId = description ? `${id}-desc` : undefined;
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-start gap-3 rounded-[var(--radius-md)] border border-[var(--color-rule)] bg-white p-3 transition hover:border-[var(--color-ink-muted)] has-[:focus-visible]:border-[var(--color-accent-strong)] has-[:focus-visible]:shadow-[0_0_0_3px_var(--color-accent-soft)]"
    >
      <input
        id={id}
        type="checkbox"
        name={name}
        value={value}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        aria-describedby={descId}
        className="mt-1 h-5 w-5 cursor-pointer accent-[var(--color-accent-strong)]"
      />
      <span className="flex flex-col gap-1">
        <span className="font-[family-name:var(--font-display)] text-[var(--color-ink)] text-[0.95rem] font-semibold">
          {label}
        </span>
        {description ? (
          <span
            id={descId}
            className="text-[var(--color-ink-muted)] text-sm leading-relaxed"
          >
            {description}
          </span>
        ) : null}
      </span>
    </label>
  );
}
