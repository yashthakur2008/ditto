"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFlow } from "@/components/flow/FlowProvider";

export default function ResetPage() {
  const router = useRouter();
  const { reset, hydrated } = useFlow();

  useEffect(() => {
    if (!hydrated) return;
    reset();
    router.replace("/welcome");
  }, [hydrated, reset, router]);

  return (
    <div className="mx-auto mt-24 max-w-4xl px-6">
      <p className="text-[var(--color-ink-muted)]">Starting fresh…</p>
    </div>
  );
}
