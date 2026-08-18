"use client";

import type { ReactNode } from "react";
import { useId } from "react";

type Option<T extends string> = {
  value: T;
  label: ReactNode;
  description?: ReactNode;
};

type Props<T extends string> = {
  legend: string;
  description?: ReactNode;
  value: T;
  options: Option<T>[];
  onChange: (next: T) => void;
  name?: string;
};

export function RadioGroup<T extends string>({
  legend,
  description,
  value,
  options,
  onChange,
  name,
}: Props<T>) {
  const reactId = useId();
  const groupName = name ?? `radio-${reactId}`;
  return (
    <fieldset className="flex flex-col gap-3 border-0 p-0">
      <legend className="mb-1 font-[family-name:var(--font-display)] text-[var(--color-ink)] text-lg font-semibold">
        {legend}
      </legend>
      {description ? (
        <p className="-mt-2 mb-1 text-[var(--color-ink-muted)] text-sm leading-relaxed">
          {description}
        </p>
      ) : null}
      <div className="grid gap-2">
        {options.map((opt) => {
          const id = `${groupName}-${opt.value}`;
          const descId = opt.description ? `${id}-desc` : undefined;
          const selected = value === opt.value;
          return (
            <label
              key={opt.value}
              htmlFor={id}
              className={`flex cursor-pointer items-start gap-3 rounded-[var(--radius-md)] border bg-white p-3 transition has-[:focus-visible]:border-[var(--color-accent-strong)] has-[:focus-visible]:shadow-[0_0_0_3px_var(--color-accent-soft)] ${selected ? "border-[var(--color-accent-strong)] bg-[var(--color-accent-soft)]" : "border-[var(--color-rule)] hover:border-[var(--color-ink-muted)]"}`}
            >
              <input
                id={id}
                type="radio"
                name={groupName}
                value={opt.value}
                checked={selected}
                onChange={() => onChange(opt.value)}
                aria-describedby={descId}
                className="mt-1 h-5 w-5 cursor-pointer accent-[var(--color-accent-strong)]"
              />
              <span className="flex flex-col gap-1">
                <span className="font-[family-name:var(--font-display)] text-[var(--color-ink)] text-[0.95rem] font-semibold">
                  {opt.label}
                </span>
                {opt.description ? (
                  <span
                    id={descId}
                    className="text-[var(--color-ink-muted)] text-sm leading-relaxed"
                  >
                    {opt.description}
                  </span>
                ) : null}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
