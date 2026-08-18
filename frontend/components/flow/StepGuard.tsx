"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useFlow } from "./FlowProvider";
import type { Step } from "@/lib/types";

function earliestUnmet(state: ReturnType<typeof useFlow>["state"]): Step {
  if (!state.authed) return "welcome";
  if (!state.preferences) return "preferences";
  if (!state.rebuilt) return "chat";
  return "output";
}

export function StepGuard({
  require,
  children,
}: {
  require: Step;
  children: ReactNode;
}) {
  const router = useRouter();
  const { state, hydrated } = useFlow();

  useEffect(() => {
    if (!hydrated) return;
    const ordered: Step[] = ["welcome", "preferences", "chat", "output"];
    const target = earliestUnmet(state);
    if (ordered.indexOf(require) > ordered.indexOf(target)) {
      router.replace(`/${target}`);
    }
  }, [hydrated, state, require, router]);

  if (!hydrated) {
    return (
      <div
        aria-hidden="true"
        className="mx-auto mt-24 max-w-4xl px-6 text-[var(--color-ink-faint)]"
      >
        Loading…
      </div>
    );
  }
  return <>{children}</>;
}
