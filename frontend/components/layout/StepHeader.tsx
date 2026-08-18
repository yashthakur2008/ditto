import Link from "next/link";
import type { Step } from "@/lib/types";

const steps: { id: Step; label: string; path: string }[] = [
  { id: "welcome", label: "Welcome", path: "/welcome" },
  { id: "preferences", label: "Your needs", path: "/preferences" },
  { id: "chat", label: "Conversation", path: "/chat" },
  { id: "output", label: "Improved version", path: "/output" },
];

export function StepHeader({ current }: { current: Step }) {
  const currentIndex = steps.findIndex((s) => s.id === current);
  return (
    <nav aria-label="Progress" className="mt-8 mb-10">
      <ol className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
        {steps.map((step, i) => {
          const done = i < currentIndex;
          const here = i === currentIndex;
          return (
            <li key={step.id} className="flex items-center gap-3">
              {done ? (
                <Link
                  href={step.path}
                  className="text-[var(--color-ink-muted)] underline-offset-4 hover:text-[var(--color-ink)] hover:underline"
                >
                  <span aria-hidden="true">{i + 1}. </span>
                  {step.label}
                </Link>
              ) : (
                <span
                  aria-current={here ? "step" : undefined}
                  className={
                    here
                      ? "font-[family-name:var(--font-display)] font-semibold text-[var(--color-ink)]"
                      : "text-[var(--color-ink-faint)]"
                  }
                >
                  <span aria-hidden="true">{i + 1}. </span>
                  {step.label}
                </span>
              )}
              {i < steps.length - 1 ? (
                <span aria-hidden="true" className="text-[var(--color-ink-faint)]">
                  ·
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
