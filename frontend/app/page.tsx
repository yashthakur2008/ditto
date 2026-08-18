"use client";

import Link from "next/link";
import { useFlow } from "@/components/flow/FlowProvider";
import { Container } from "@/components/layout/Container";
import { DittoMark } from "@/components/identity/DittoMark";

function nextStepHref(state: ReturnType<typeof useFlow>["state"]): string {
  if (!state.authed) return "/welcome";
  if (!state.preferences) return "/preferences";
  if (!state.rebuilt) return "/chat";
  return "/output";
}

function ctaLabel(state: ReturnType<typeof useFlow>["state"]): string {
  if (!state.authed) return "Get started";
  if (!state.preferences) return "Continue setup";
  if (!state.rebuilt) return "Open the chat";
  return "Open your improved page";
}

export default function HomePage() {
  const { state, hydrated } = useFlow();
  const href = hydrated ? nextStepHref(state) : "/welcome";
  const label = hydrated ? ctaLabel(state) : "Get started";

  return (
    <>
      {/* Hero */}
      <section className="border-b border-[var(--color-rule)]">
        <Container size="lg">
          <div className="grid gap-12 py-20 sm:py-28 md:grid-cols-[1.4fr_1fr] md:items-center">
            <div className="flex flex-col gap-6">
              <p className="font-[family-name:var(--font-display)] text-[var(--color-ink-muted)] text-sm uppercase tracking-[0.18em]">
                For everyone who reads differently
              </p>
              <h1 className="text-5xl font-bold tracking-tight text-[var(--color-ink)] sm:text-6xl md:text-[4.25rem]">
                The web,
                <br />
                the way you read.
              </h1>
              <p className="prose-measure text-lg text-[var(--color-ink-soft)] leading-relaxed sm:text-xl">
                Ditto reads any web page and rebuilds it around you — clearer
                language, calmer typography, structure that makes sense to
                screen readers, captions where they were missing.
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-4">
                <Link href={href} className="btn-primary text-base">
                  {label}
                </Link>
                <a
                  href="#how"
                  className="btn-quiet underline-offset-4 hover:underline"
                >
                  How it works
                </a>
              </div>
            </div>

            <aside
              aria-label="A quiet illustration of Ditto's idea"
              className="surface-soft hidden flex-col gap-5 p-8 md:flex"
            >
              <div className="flex items-center gap-3 text-[var(--color-ink-soft)]">
                <DittoMark size={36} />
                <p className="font-[family-name:var(--font-display)] font-semibold text-[var(--color-ink)]">
                  ditto.
                </p>
              </div>
              <div className="grid gap-3 text-sm">
                <div className="rounded-[var(--radius-md)] border border-[var(--color-rule)] bg-white px-4 py-3 text-[var(--color-ink-muted)]">
                  <p className="text-xs uppercase tracking-wider">Original</p>
                  <p className="mt-1 text-[var(--color-ink)]">
                    “Elevate your epicurean ambitions with our category-defining
                    intersection of hydroponic innovation…”
                  </p>
                </div>
                <div className="flex items-center justify-center text-[var(--color-ink-faint)]">
                  ↓
                </div>
                <div className="rounded-[var(--radius-md)] border border-[var(--color-grow)] bg-[var(--color-grow-soft)] px-4 py-3">
                  <p className="text-xs uppercase tracking-wider text-[var(--color-ink-soft)]">
                    With Ditto
                  </p>
                  <p className="mt-1 text-[var(--color-ink)]">
                    A small device that grows fresh herbs on your kitchen
                    counter. Works all year.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </Container>
      </section>

      {/* How it works */}
      <section id="how" className="border-b border-[var(--color-rule)]">
        <Container size="lg">
          <div className="py-16 sm:py-24">
            <p className="font-[family-name:var(--font-display)] text-[var(--color-ink-muted)] text-sm uppercase tracking-[0.18em]">
              How it works
            </p>
            <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight text-[var(--color-ink)] sm:text-4xl">
              Three small steps, then any page is yours.
            </h2>

            <ol className="mt-12 grid gap-8 md:grid-cols-3">
              {howSteps.map((s) => (
                <li
                  key={s.n}
                  className="surface flex flex-col gap-3 p-6 sm:p-7"
                >
                  <span className="font-[family-name:var(--font-display)] text-[var(--color-ink-faint)] text-sm font-semibold">
                    Step {s.n}
                  </span>
                  <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--color-ink)]">
                    {s.title}
                  </h3>
                  <p className="text-[var(--color-ink-soft)] leading-relaxed">
                    {s.body}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </Container>
      </section>

      {/* Who it's for */}
      <section className="border-b border-[var(--color-rule)]">
        <Container size="lg">
          <div className="py-16 sm:py-24">
            <p className="font-[family-name:var(--font-display)] text-[var(--color-ink-muted)] text-sm uppercase tracking-[0.18em]">
              Who Ditto is for
            </p>
            <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight text-[var(--color-ink)] sm:text-4xl">
              The people the web often forgets.
            </h2>
            <ul className="mt-10 grid gap-5 sm:grid-cols-2">
              {audiences.map((a) => (
                <li
                  key={a.title}
                  className="surface-soft flex flex-col gap-2 p-6"
                >
                  <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--color-ink)]">
                    {a.title}
                  </h3>
                  <p className="text-[var(--color-ink-soft)] leading-relaxed">
                    {a.body}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </section>

      {/* Closing CTA */}
      <section>
        <Container size="lg">
          <div className="flex flex-col items-start gap-6 py-20 sm:py-28">
            <h2 className="max-w-3xl text-3xl font-bold tracking-tight text-[var(--color-ink)] sm:text-5xl">
              When you&rsquo;re ready, the web will be too.
            </h2>
            <p className="prose-measure text-lg text-[var(--color-ink-soft)] leading-relaxed">
              Your preferences stay in this browser. When you rebuild a page,
              Ditto sends the link to our server — not your full browsing history.
            </p>
            <Link href={href} className="btn-primary text-base">
              {label}
            </Link>
          </div>
        </Container>
      </section>
    </>
  );
}

const howSteps = [
  {
    n: 1,
    title: "Tell Ditto how you read.",
    body: "A short, calm survey about how you see, hear, and read best. Saved locally in your browser.",
  },
  {
    n: 2,
    title: "Share any web page.",
    body: "Paste a link in the chat. Ditto reads the page carefully and tells you what it found.",
  },
  {
    n: 3,
    title: "Get a clearer version.",
    body: "Switch between Original, Simplified, and Screen-reader friendly views. Read it the way that works for you.",
  },
];

const audiences = [
  {
    title: "Blind and low-vision readers",
    body: "Pages restructured for screen readers. Image descriptions written, never skipped.",
  },
  {
    title: "Dyslexic readers",
    body: "Wider spacing, shorter lines, plainer language. Typography that doesn't fight you.",
  },
  {
    title: "Deaf and hard-of-hearing readers",
    body: "Captions and transcripts surfaced or generated where they were missing.",
  },
  {
    title: "Children and new readers",
    body: "Adult themes filtered. Sentences kept short and warm.",
  },
];
