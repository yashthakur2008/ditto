"use client";

import { useId } from "react";

type Props = {
  value: number;
  onChange: (next: number) => void;
};

const MIN = 1.0;
const MAX = 1.5;
const STEP = 0.05;

function labelFor(v: number): string {
  if (v < 1.05) return "Standard";
  if (v < 1.15) return "Slightly larger";
  if (v < 1.25) return "Larger";
  if (v < 1.35) return "Quite a bit larger";
  if (v < 1.45) return "Much larger";
  return "Maximum";
}

/**
 * Inline slider that controls --text-scale via the bound `value`. Native
 * <input type="range"> for built-in keyboard support and screen-reader
 * value announcements.
 */
export function FontScaleSlider({ value, onChange }: Props) {
  const reactId = useId();
  const sliderId = `font-scale-${reactId}`;
  const previewId = `${sliderId}-preview`;
  const percent = Math.round(value * 100);

  return (
    <div className="mt-3 flex flex-col gap-3 rounded-[var(--radius-md)] border border-[var(--color-accent)] bg-[var(--color-accent-soft)] p-4">
      <div className="flex items-baseline justify-between gap-3">
        <label
          htmlFor={sliderId}
          className="font-[family-name:var(--font-display)] text-sm font-semibold text-[var(--color-ink)]"
        >
          Text size
        </label>
        <span
          aria-live="polite"
          aria-atomic="true"
          className="font-[family-name:var(--font-display)] text-sm font-semibold text-[var(--color-accent-strong)]"
        >
          {labelFor(value)} · {percent}%
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="text-xs text-[var(--color-ink-muted)]"
          style={{ fontSize: "0.75rem" }}
        >
          A
        </span>
        <input
          id={sliderId}
          type="range"
          min={MIN}
          max={MAX}
          step={STEP}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          aria-describedby={previewId}
          aria-valuetext={`${labelFor(value)}, ${percent} percent`}
          className="flex-1 accent-[var(--color-accent-strong)]"
        />
        <span
          aria-hidden="true"
          className="text-[var(--color-ink-muted)]"
          style={{ fontSize: "1.25rem", lineHeight: 1 }}
        >
          A
        </span>
      </div>
      <p
        id={previewId}
        className="text-[var(--color-ink-muted)] text-xs"
      >
        Drag to adjust. Headings, body text, and spacing all grow at the same
        rate. Changes apply live to the whole app.
      </p>
    </div>
  );
}
