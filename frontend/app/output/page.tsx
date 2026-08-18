"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Container } from "@/components/layout/Container";
import { StepHeader } from "@/components/layout/StepHeader";
import { StepGuard } from "@/components/flow/StepGuard";
import { useFlow } from "@/components/flow/FlowProvider";
import { RebuiltFrame } from "@/components/output/RebuiltFrame";
import { AccessibilityScorePanel } from "@/components/output/AccessibilityScorePanel";
import { createShare, synthesizeSpeech, TransformError } from "@/lib/api";
import type { Rebuilt } from "@/lib/types";

export default function OutputPage() {
  return (
    <StepGuard require="output">
      <OutputContent />
    </StepGuard>
  );
}

function profileBlurb(d: string) {
  switch (d) {
    case "blind":
      return "Restructured for screen readers, with image descriptions and clear landmark roles.";
    case "dyslexia":
      return "Wider spacing, shorter lines, and plainer phrasing — typography that doesn't fight you.";
    case "deaf":
      return "Captions and transcripts surfaced where they were missing.";
    case "elderly":
      return "Larger type, calmer contrast, and clearer language.";
    case "low_vision":
      return "Higher contrast, larger type, and detailed image descriptions.";
    case "adhd":
      return "Shorter sections, clearer headings, and less visual clutter.";
    case "tremor":
      return "Larger tap targets and calmer interactions.";
    default:
      return "Adapted for easier, calmer reading.";
  }
}

function OutputContent() {
  const router = useRouter();
  const { state, patch, reset } = useFlow();
  const rebuilt = state.rebuilt;
  if (!rebuilt) return null;

  function tryAnother() {
    patch({
      messages: [],
      analysis: null,
      source: null,
      intent: "",
      rebuilt: null,
    });
    router.push("/chat");
  }

  return (
    <Container size="lg">
      <StepHeader current="output" />

      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        Here&rsquo;s your easier version.
      </h1>
      <p className="prose-measure mt-4 text-[var(--color-ink-soft)] text-lg leading-relaxed">
        {profileBlurb(rebuilt.profileApplied.disability)}
      </p>

      <div className="mt-8">
        <RebuiltFrame
          html={rebuilt.transformedHtml}
          originalUrl={rebuilt.originalUrl}
          originalHtml={rebuilt.originalHtml}
        />
      </div>

      <AccessibilityScorePanel
        before={rebuilt.beforeScore}
        after={rebuilt.afterScore}
      />

      <section
        aria-labelledby="summary"
        className="surface-soft mt-10 flex flex-col gap-3 p-6 sm:p-8"
      >
        <h2 id="summary" className="text-xl font-semibold">
          What Ditto did
        </h2>
        <dl className="grid gap-3 text-[var(--color-ink-soft)] sm:grid-cols-3">
          <div>
            <dt className="text-xs uppercase tracking-wider text-[var(--color-ink-muted)]">
              Profile sent
            </dt>
            <dd className="font-[family-name:var(--font-display)] mt-1 text-base font-semibold text-[var(--color-ink)]">
              {rebuilt.profileApplied.disability}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-[var(--color-ink-muted)]">
              Age
            </dt>
            <dd className="font-[family-name:var(--font-display)] mt-1 text-base font-semibold text-[var(--color-ink)]">
              {rebuilt.profileApplied.age}
            </dd>
          </div>
          <div className="break-all">
            <dt className="text-xs uppercase tracking-wider text-[var(--color-ink-muted)]">
              Original
            </dt>
            <dd className="mt-1">
              <a
                href={rebuilt.originalUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="text-[var(--color-accent-strong)] underline-offset-4 hover:underline"
              >
                {rebuilt.originalUrl}
              </a>
            </dd>
          </div>
        </dl>
      </section>

      <ReadAloudSection html={rebuilt.transformedHtml} />

      <ShareSection rebuilt={rebuilt} />

      <div className="mt-12 flex flex-wrap items-center gap-4 border-t border-[var(--color-rule)] pt-8">
        <button type="button" onClick={tryAnother} className="btn-primary">
          Try another page
        </button>
        <Link
          href="/settings"
          className="btn-quiet underline-offset-4 hover:underline"
        >
          Adjust my needs
        </Link>
        <button
          type="button"
          onClick={() => {
            reset();
            window.location.href = "/";
          }}
          className="btn-quiet ml-auto underline-offset-4 hover:underline"
        >
          Start over
        </button>
      </div>
    </Container>
  );
}

const MAX_NARRATION_CHARS = 4500;

function extractReadableText(html: string): string {
  if (typeof window === "undefined") return "";
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("script, style, noscript").forEach((el) => el.remove());
  const text = (doc.body?.textContent || "").replace(/\s+/g, " ").trim();
  return text.slice(0, MAX_NARRATION_CHARS);
}

function ReadAloudSection({ html }: { html: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "playing" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  const text = extractReadableText(html);
  const truncated = text.length >= MAX_NARRATION_CHARS;

  async function play() {
    if (!text) return;
    setStatus("loading");
    setError(null);
    try {
      const audio = await synthesizeSpeech(text);
      audioRef.current = audio;
      audio.addEventListener("ended", () => setStatus("idle"));
      await audio.play();
      setStatus("playing");
    } catch (err) {
      setStatus("error");
      setError(
        err instanceof TransformError
          ? err.message
          : "Couldn't start narration — is ELEVENLABS_API_KEY configured on the backend?",
      );
    }
  }

  function stop() {
    audioRef.current?.pause();
    if (audioRef.current) audioRef.current.currentTime = 0;
    setStatus("idle");
  }

  if (!text) return null;

  return (
    <section
      aria-labelledby="read-aloud"
      className="surface-soft mt-6 flex flex-col gap-3 p-6 sm:p-8"
    >
      <h2 id="read-aloud" className="text-xl font-semibold">
        Listen to this page
      </h2>
      <p className="text-[var(--color-ink-soft)] text-sm leading-relaxed">
        Ditto reads the rebuilt page aloud.
        {truncated ? " Narration covers the first portion of longer pages." : ""}
      </p>
      <div className="flex items-center gap-3">
        {status === "playing" ? (
          <button type="button" onClick={stop} className="btn-quiet self-start">
            Stop
          </button>
        ) : (
          <button
            type="button"
            onClick={play}
            disabled={status === "loading"}
            className="btn-quiet self-start"
          >
            {status === "loading" ? "Loading audio…" : "▶ Read aloud"}
          </button>
        )}
      </div>
      {error ? (
        <p role="alert" className="text-red-600 text-sm">
          {error}
        </p>
      ) : null}
    </section>
  );
}

function ShareSection({ rebuilt }: { rebuilt: Rebuilt }) {
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function share() {
    setBusy(true);
    setError(null);
    try {
      const id = await createShare(rebuilt.transformedHtml, rebuilt.originalUrl);
      const url = `${window.location.origin}/r/${id}`;
      setLink(url);
    } catch (err) {
      setError(
        err instanceof TransformError
          ? err.message
          : "Couldn't create a share link — please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard access denied — the link is still visible to copy manually */
    }
  }

  return (
    <section
      aria-labelledby="share"
      className="surface-soft mt-6 flex flex-col gap-3 p-6 sm:p-8"
    >
      <h2 id="share" className="text-xl font-semibold">
        Share this rebuild
      </h2>
      <p className="text-[var(--color-ink-soft)] text-sm leading-relaxed">
        Creates a public link to this rebuilt page only — not your profile or
        preferences — so someone else can view it without running Ditto
        themselves.
      </p>

      {link ? (
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            readOnly
            value={link}
            onFocus={(e) => e.currentTarget.select()}
            className="field-input min-w-0 flex-1 font-mono text-sm"
          />
          <button type="button" onClick={copy} className="btn-quiet shrink-0">
            {copied ? "Copied!" : "Copy link"}
          </button>
        </div>
      ) : (
        <button type="button" onClick={share} disabled={busy} className="btn-quiet self-start">
          {busy ? "Creating link…" : "Create share link"}
        </button>
      )}

      {error ? (
        <p role="alert" className="text-red-600 text-sm">
          {error}
        </p>
      ) : null}
    </section>
  );
}
