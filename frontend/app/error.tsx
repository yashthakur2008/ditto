"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-start justify-center gap-4 px-6 py-16">
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="text-[var(--color-ink-soft)] leading-relaxed">
        {error.message || "An unexpected error occurred."}
      </p>
      <button type="button" onClick={reset} className="btn-primary">
        Try again
      </button>
    </main>
  );
}
