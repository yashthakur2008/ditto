"use client";

import type { ReactNode } from "react";
import { useId } from "react";

type FieldProps = {
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  children: (ids: {
    inputId: string;
    descriptionId: string | undefined;
    errorId: string | undefined;
    "aria-describedby": string | undefined;
    "aria-invalid": boolean | undefined;
  }) => ReactNode;
};

export function Field({
  label,
  description,
  error,
  required,
  children,
}: FieldProps) {
  const reactId = useId();
  const inputId = `field-${reactId}`;
  const descriptionId = description ? `${inputId}-desc` : undefined;
  const errorId = error ? `${inputId}-err` : undefined;
  const describedBy =
    [descriptionId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={inputId}
        className="font-[family-name:var(--font-display)] text-[var(--color-ink)] text-[0.95rem] font-semibold"
      >
        {label}
        {required ? (
          <span className="ml-2 text-[var(--color-ink-muted)] text-sm font-normal">
            (Required)
          </span>
        ) : null}
      </label>
      {description ? (
        <p
          id={descriptionId}
          className="text-[var(--color-ink-muted)] text-sm leading-relaxed"
        >
          {description}
        </p>
      ) : null}
      {children({
        inputId,
        descriptionId,
        errorId,
        "aria-describedby": describedBy,
        "aria-invalid": error ? true : undefined,
      })}
      {error ? (
        <p
          id={errorId}
          role="alert"
          className="text-[var(--color-alert)] text-sm"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
