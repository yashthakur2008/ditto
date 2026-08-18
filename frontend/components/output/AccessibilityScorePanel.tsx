"use client";

import type { AccessibilityScore } from "@/lib/types";

const AXES = [
  { key: "images", label: "Images & media" },
  { key: "structure", label: "Structure" },
  { key: "readability", label: "Readability" },
  { key: "interactive", label: "Interactive" },
  { key: "clarity", label: "Clarity" },
] as const;

export function AccessibilityScorePanel({
  before,
  after,
}: {
  before?: AccessibilityScore;
  after?: AccessibilityScore;
}) {
  if (!before && !after) return null;

  return (
    <section
      aria-labelledby="scores-heading"
      className="surface-soft mt-10 flex flex-col gap-6 p-6 sm:p-8"
    >
      <div>
        <h2 id="scores-heading" className="text-xl font-semibold">
          Accessibility scores
        </h2>
        <p className="mt-2 text-[var(--color-ink-soft)] leading-relaxed">
          Ditto scores each page 0–100 across five WCAG-aligned axes before and
          after rebuilding.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {before ? <ScoreCard title="Before" score={before} /> : null}
        {after ? <ScoreCard title="After Ditto" score={after} highlight /> : null}
      </div>

      {before && after ? (
        <p className="text-sm text-[var(--color-ink-muted)]">
          Overall: {before.total} → {after.total}
          {after.total > before.total
            ? ` (+${after.total - before.total})`
            : ""}
        </p>
      ) : null}
    </section>
  );
}

function ScoreCard({
  title,
  score,
  highlight = false,
}: {
  title: string;
  score: AccessibilityScore;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-[var(--radius-md)] border p-5 ${
        highlight
          ? "border-[var(--color-grow)] bg-[var(--color-grow-soft)]"
          : "border-[var(--color-rule)] bg-white"
      }`}
    >
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="font-semibold text-[var(--color-ink)]">{title}</h3>
        <span className="font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--color-ink)]">
          {score.total}
        </span>
      </div>
      <dl className="mt-4 flex flex-col gap-3">
        {AXES.map(({ key, label }) => {
          const axis = score[key];
          if (!axis) return null;
          return (
            <div key={key}>
              <dt className="flex justify-between text-sm text-[var(--color-ink-muted)]">
                <span>{label}</span>
                <span>{axis.score}/20</span>
              </dt>
              <dd className="mt-1 text-sm text-[var(--color-ink-soft)] leading-relaxed">
                {axis.note}
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
