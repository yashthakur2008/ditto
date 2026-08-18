"use client";

import type { ReactNode } from "react";

type Props = {
  legend: string;
  description?: ReactNode;
  children: ReactNode;
};

export function CheckboxGroup({ legend, description, children }: Props) {
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
      <div className="grid gap-2">{children}</div>
    </fieldset>
  );
}
