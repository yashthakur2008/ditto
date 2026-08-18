import Link from "next/link";
import type { ReactNode } from "react";
import { SkipLink } from "@/components/a11y/SkipLink";
import { DittoWordmark } from "@/components/identity/DittoMark";
import { HeaderActions } from "@/components/layout/HeaderActions";

export function Shell({ children }: { children: ReactNode }) {
  return (
    <>
      <SkipLink />
      <header className="border-b border-[var(--color-rule)] bg-[var(--color-paper)]">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-6 py-4 sm:px-8 sm:py-5">
          <Link
            href="/"
            aria-label="Ditto — home"
            className="rounded-md text-[var(--color-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent-strong)] focus-visible:outline-offset-4"
          >
            <DittoWordmark />
          </Link>
          <HeaderActions />
        </div>
      </header>
      <main id="main" className="flex-1">
        {children}
      </main>
      <footer className="mt-16 border-t border-[var(--color-rule)]">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-6 py-8 text-sm text-[var(--color-ink-muted)] sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>
            Ditto is a research project exploring more accessible reading on the
            web.
          </p>
          <p>Built with care for everyone who uses the web differently.</p>
        </div>
      </footer>
    </>
  );
}
