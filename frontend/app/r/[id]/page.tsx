"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { Container } from "@/components/layout/Container";
import { fetchShare, type SharedPage } from "@/lib/api";
import { DittoMark } from "@/components/identity/DittoMark";

export default function SharedPageRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [page, setPage] = useState<SharedPage | null | undefined>(undefined);

  useEffect(() => {
    fetchShare(id).then(setPage);
  }, [id]);

  if (page === undefined) {
    return (
      <Container size="lg">
        <p className="mt-24 text-[var(--color-ink-faint)]">Loading…</p>
      </Container>
    );
  }

  if (page === null) {
    return (
      <Container size="md">
        <div className="mt-24 flex flex-col items-center gap-4 text-center">
          <DittoMark size={40} />
          <h1 className="text-2xl font-bold">This link doesn&rsquo;t work anymore.</h1>
          <p className="text-[var(--color-ink-soft)]">
            The shared page may have been removed, or the link is incomplete.
          </p>
          <Link href="/welcome" className="btn-primary mt-2">
            Try Ditto yourself
          </Link>
        </div>
      </Container>
    );
  }

  let host = page.original_url;
  try {
    host = new URL(page.original_url).host;
  } catch {
    /* leave as-is */
  }

  return (
    <Container size="lg">
      <header className="mt-10 flex flex-wrap items-center justify-between gap-4 border-b border-[var(--color-rule)] pb-6">
        <div className="flex items-center gap-3">
          <DittoMark size={32} />
          <div>
            <p className="font-[family-name:var(--font-display)] text-[var(--color-ink-muted)] text-xs uppercase tracking-wider">
              Rebuilt by Ditto
            </p>
            <p className="font-[family-name:var(--font-display)] text-[var(--color-ink)] text-sm font-semibold">
              {host}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={page.original_url}
            target="_blank"
            rel="noreferrer noopener"
            className="btn-quiet text-sm underline-offset-4 hover:underline"
          >
            View original ↗
          </a>
          <Link href="/welcome" className="btn-primary text-sm">
            Rebuild your own page
          </Link>
        </div>
      </header>

      <div className="mt-8">
        <iframe
          title={`Rebuilt version of ${host}`}
          srcDoc={page.transformed_html}
          sandbox="allow-scripts allow-same-origin"
          className="block h-[min(85vh,900px)] w-full rounded-[var(--radius-lg)] border border-[var(--color-rule)] bg-white"
        />
      </div>
    </Container>
  );
}
