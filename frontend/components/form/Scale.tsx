"use client";

import { useId } from "react";

type Props = {
  legend: string;
  description?: string;
  min: number;
  max: number;
  minLabel: string;
  maxLabel: string;
  value: number;
  onChange: (next: number) => void;
};

export function Scale({
  legend,
  description,
  min,
  max,
  minLabel,
  maxLabel,
  value,
  onChange,
}: Props) {
  const reactId = useId();
  const group = `scale-${reactId}`;
  const values: number[] = [];
  for (let i = min; i <= max; i++) values.push(i);
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
      <div
        role="radiogroup"
        aria-label={legend}
        className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-4"
      >
        <span className="text-right text-[var(--color-ink-muted)] text-sm">
          {minLabel}
        </span>
        <div className="flex items-center gap-1 sm:gap-2">
          {values.map((v) => {
            const id = `${group}-${v}`;
            const selected = value === v;
            return (
              <label
                key={v}
                htmlFor={id}
                className={`flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border text-sm font-semibold transition has-[:focus-visible]:shadow-[0_0_0_3px_var(--color-accent-soft)] ${selected ? "border-[var(--color-accent-strong)] bg-[var(--color-accent-strong)] text-white" : "border-[var(--color-rule)] bg-white text-[var(--color-ink-soft)] hover:border-[var(--color-ink-muted)]"}`}
              >
                <input
                  id={id}
                  type="radio"
                  name={group}
                  value={v}
                  checked={selected}
                  onChange={() => onChange(v)}
                  className="sr-only"
                />
                <span aria-hidden="true">{v}</span>
                <span className="sr-only">
                  {v} {v === min ? `(${minLabel})` : v === max ? `(${maxLabel})` : ""}
                </span>
              </label>
            );
          })}
        </div>
        <span className="text-[var(--color-ink-muted)] text-sm">{maxLabel}</span>
      </div>
    </fieldset>
  );
}
