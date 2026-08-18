"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Container } from "@/components/layout/Container";
import { useFlow } from "@/components/flow/FlowProvider";
import {
  preferencesToProfile,
  transformBatch,
  TransformError,
  type BatchTransformResult,
} from "@/lib/api";

const MAX_URLS = 10;

export default function BatchPage() {
  const router = useRouter();
  const { state, hydrated } = useFlow();

  // Same guard pattern as /settings — batch mode needs a saved profile.
  useEffect(() => {
    if (!hydrated) return;
    if (!state.authed) router.replace("/welcome");
    else if (!state.preferences) router.replace("/preferences");
  }, [hydrated, state.authed, state.preferences, router]);

  const [raw, setRaw] = useState("");
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<BatchTransformResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!hydrated || !state.authed || !state.preferences) {
    return (
      <Container size="md">
        <p className="mt-24 text-[var(--color-ink-faint)]">Loading…</p>
      </Container>
    );
  }

  const urls = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const tooMany = urls.length > MAX_URLS;

  async function run(e: React.FormEvent) {
    e.preventDefault();
    if (urls.length === 0 || tooMany || busy) return;
    setBusy(true);
    setError(null);
    setResults(null);
    try {
      const profile = preferencesToProfile(state.preferences);
      const data = await transformBatch(urls, profile);
      setResults(data);
    } catch (err) {
      setError(
        err instanceof TransformError
          ? err.message
          : "Something went wrong reaching the rebuilder.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Container size="md">
      <header className="mt-10 flex flex-col gap-3">
        <p className="font-[family-name:var(--font-display)] text-[var(--color-ink-muted)] text-sm uppercase tracking-[0.18em]">
          Batch mode
        </p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Rebuild several pages at once.
        </h1>
        <p className="prose-measure text-[var(--color-ink-soft)] leading-relaxed">
          Paste up to {MAX_URLS} links, one per line — useful for auditing every
          key page on a site. Ditto rebuilds each with your current profile.
        </p>
      </header>

      <form onSubmit={run} className="mt-8 flex flex-col gap-4">
        <label htmlFor="urls" className="sr-only">
          URLs, one per line
        </label>
        <textarea
          id="urls"
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder={"https://example.com/\nhttps://example.com/about\nhttps://example.com/contact"}
          rows={6}
          className="field-input resize-y font-mono text-sm"
          disabled={busy}
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className={`text-xs ${tooMany ? "text-red-600" : "text-[var(--color-ink-muted)]"}`}>
            {urls.length} URL{urls.length === 1 ? "" : "s"}
            {tooMany ? ` — limit is ${MAX_URLS}` : ""}
          </p>
          <button
            type="submit"
            className="btn-primary"
            disabled={busy || urls.length === 0 || tooMany}
          >
            {busy ? "Rebuilding…" : "Rebuild all"}
          </button>
        </div>
      </form>

      {error ? (
        <p role="alert" className="mt-6 text-red-600 text-sm">
          {error}
        </p>
      ) : null}

      {results ? (
        <ol className="mt-10 flex flex-col gap-4">
          {results.map((r) => (
            <li key={r.url}>
              <ResultCard result={r} />
            </li>
          ))}
        </ol>
      ) : null}

      <div className="mt-12 border-t border-[var(--color-rule)] pt-8">
        <Link href="/chat" className="btn-quiet underline-offset-4 hover:underline">
          ← Back to chat
        </Link>
      </div>
    </Container>
  );
}

function ResultCard({ result }: { result: BatchTransformResult }) {
  const [open, setOpen] = useState(false);
  let host = result.url;
  try {
    host = new URL(result.url).host;
  } catch {
    /* leave as-is */
  }

  const beforeTotal = (result.before_score as { total?: number } | undefined)?.total;
  const afterTotal = (result.after_score as { total?: number } | undefined)?.total;

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-rule)] bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
        <div className="flex flex-col">
          <p className="font-[family-name:var(--font-display)] text-[var(--color-ink)] text-sm font-semibold">
            {host}
          </p>
          <p className="text-[var(--color-ink-muted)] text-xs break-all">{result.url}</p>
        </div>
        <div className="flex items-center gap-2">
          {result.success ? (
            <>
              {typeof beforeTotal === "number" && typeof afterTotal === "number" ? (
                <span className="rounded-full border border-[var(--color-rule)] bg-[var(--color-grow-soft)] px-3 py-1 text-xs font-semibold text-[var(--color-ink)]">
                  {beforeTotal} → {afterTotal}
                </span>
              ) : null}
              <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="rounded-[var(--radius-md)] border border-[var(--color-rule)] bg-white px-3 py-1.5 text-xs text-[var(--color-ink-soft)] hover:bg-[var(--color-paper-soft)]"
                aria-expanded={open}
              >
                {open ? "Hide" : "View"}
              </button>
            </>
          ) : (
            <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
              Failed
            </span>
          )}
        </div>
      </div>
      {!result.success && result.error ? (
        <p className="border-t border-[var(--color-rule)] px-5 py-3 text-red-700 text-xs">
          {result.error}
        </p>
      ) : null}
      {result.success && open ? (
        <iframe
          title={`Rebuilt version of ${host}`}
          srcDoc={result.transformed_html}
          sandbox="allow-scripts allow-same-origin"
          className="block h-[min(60vh,600px)] w-full border-t border-[var(--color-rule)]"
        />
      ) : null}
    </div>
  );
}
