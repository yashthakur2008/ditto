"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type Tone = "polite" | "assertive";

export function LiveRegion({
  message,
  tone = "polite",
}: {
  message: string;
  tone?: Tone;
}) {
  return (
    <div
      aria-live={tone}
      aria-atomic="true"
      style={{
        position: "absolute",
        width: 1,
        height: 1,
        padding: 0,
        margin: -1,
        overflow: "hidden",
        clip: "rect(0,0,0,0)",
        whiteSpace: "nowrap",
        border: 0,
      }}
    >
      {message}
    </div>
  );
}

export function StatusText({
  children,
  tone = "polite",
}: {
  children: ReactNode;
  tone?: Tone;
}) {
  return (
    <p
      aria-live={tone}
      aria-atomic="true"
      className="text-[var(--color-ink-muted)] text-sm"
    >
      {children}
    </p>
  );
}

export function useAnnouncer() {
  const [msg, setMsg] = useState("");
  const counter = useRef(0);
  return {
    message: msg,
    announce(text: string) {
      counter.current += 1;
      setMsg(`${text}${" ".repeat(counter.current % 2)}`);
    },
  };
}

export function FocusOnMount({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const h1 = node.querySelector<HTMLElement>("h1");
    if (h1) {
      h1.setAttribute("tabindex", "-1");
      h1.focus({ preventScroll: false });
      const blur = () => h1.removeAttribute("tabindex");
      h1.addEventListener("blur", blur, { once: true });
    }
  }, []);
  return <div ref={ref}>{children}</div>;
}
