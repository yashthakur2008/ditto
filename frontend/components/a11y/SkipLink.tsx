export function SkipLink() {
  return (
    <a
      href="#main"
      className="sr-skip-link absolute left-3 top-3 z-50 -translate-y-24 rounded-md bg-[var(--color-accent-strong)] px-4 py-2 text-white opacity-0 transition focus-visible:translate-y-0 focus-visible:opacity-100"
    >
      Skip to main content
    </a>
  );
}
