"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFlow } from "@/components/flow/FlowProvider";

export function HeaderActions() {
  const pathname = usePathname();
  const { state, hydrated, reset } = useFlow();

  // Hide auth chrome on the auth page itself, the reset page, and inside
  // the settings page (which has its own affordances).
  if (
    pathname === "/welcome" ||
    pathname === "/reset" ||
    pathname === "/settings"
  )
    return null;

  // Authed: show a quiet greeting + settings + sign out.
  if (hydrated && state.authed) {
    const first = state.preferences?.name?.trim().split(/\s+/)[0];
    return (
      <div className="flex items-center gap-1 text-sm sm:gap-2">
        {first ? (
          <span className="hidden text-[var(--color-ink-muted)] sm:inline sm:mr-2">
            Hi, {first}
          </span>
        ) : null}
        {state.preferences ? (
          <Link
            href="/settings"
            className="rounded-md px-3 py-2 font-[family-name:var(--font-display)] font-semibold text-[var(--color-ink-soft)] hover:bg-[var(--color-paper-soft)] hover:text-[var(--color-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent-strong)]"
          >
            Settings
          </Link>
        ) : null}
        <button
          type="button"
          onClick={() => {
            reset();
            window.location.href = "/";
          }}
          className="rounded-md px-3 py-2 text-[var(--color-ink-soft)] hover:bg-[var(--color-paper-soft)] hover:text-[var(--color-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent-strong)]"
        >
          Sign out
        </button>
      </div>
    );
  }

  // Default (pre-hydration or not authed): Sign in + Sign up.
  return (
    <div className="flex items-center gap-2 text-sm">
      <Link
        href="/welcome"
        className="rounded-md px-3 py-2 font-[family-name:var(--font-display)] font-semibold text-[var(--color-ink-soft)] hover:bg-[var(--color-paper-soft)] hover:text-[var(--color-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent-strong)]"
      >
        Sign in
      </Link>
      <Link
        href="/welcome"
        className="rounded-md border border-[var(--color-ink)] bg-[var(--color-ink)] px-4 py-2 font-[family-name:var(--font-display)] font-semibold text-[var(--color-paper)] transition hover:bg-[var(--color-ink-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent-strong)] focus-visible:outline-offset-2"
      >
        Sign up
      </Link>
    </div>
  );
}
