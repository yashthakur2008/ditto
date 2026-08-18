/**
 * Ditto's quiet identity mark — a small circle with two short parallel
 * strokes, alluding to the typographic ditto mark (〃) without imitating it.
 * Pure SVG, currentColor, no decoration beyond shape.
 */
export function DittoMark({
  size = 28,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      role="img"
      className={className}
    >
      <circle
        cx="16"
        cy="16"
        r="15"
        fill="var(--color-paper-soft)"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <line
        x1="11"
        y1="12"
        x2="11"
        y2="20"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <line
        x1="21"
        y1="12"
        x2="21"
        y2="20"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Wordmark used in the header. */
export function DittoWordmark({ className }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-2.5 ${className ?? ""}`}
      aria-label="Ditto"
    >
      <DittoMark size={26} />
      <span
        aria-hidden="true"
        className="font-[family-name:var(--font-display)] text-[var(--color-ink)] text-[1.35rem] font-extrabold tracking-[-0.04em] leading-none"
      >
        ditto.
      </span>
    </span>
  );
}
