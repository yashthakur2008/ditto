"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Container } from "@/components/layout/Container";
import { Field } from "@/components/form/Field";
import { TextInput } from "@/components/form/TextInput";
import { Combobox } from "@/components/form/Combobox";
import { Checkbox } from "@/components/form/Checkbox";
import { RadioGroup } from "@/components/form/RadioGroup";
import { Scale } from "@/components/form/Scale";
import { Toggle } from "@/components/form/Toggle";
import { FontScaleSlider } from "@/components/form/FontScaleSlider";
import { useFlow } from "@/components/flow/FlowProvider";
import { countries } from "@/lib/countries";
import {
  defaultPreferences,
  type DyslexiaSupport,
  type HearingNeed,
  type Preferences,
  type ReadingComplexity,
  type VisionNeed,
} from "@/lib/types";

const visionOptions: { value: VisionNeed; label: string; description: string }[] = [
  {
    value: "screen-reader",
    label: "I use a screen reader",
    description: "Pages will be structured for the best screen-reader experience.",
  },
  {
    value: "high-contrast",
    label: "I prefer higher contrast",
    description: "Text and surfaces will use stronger contrast.",
  },
  {
    value: "larger-text",
    label: "I prefer larger text",
    description: "Body text will be larger and spaced more generously.",
  },
  {
    value: "reduced-motion",
    label: "I prefer reduced motion",
    description: "Animations and transitions will be turned off.",
  },
  {
    value: "alt-text-descriptions",
    label: "Describe images in detail",
    description: "Images will get longer, more descriptive text alternatives.",
  },
];

const hearingOptions: { value: HearingNeed; label: string; description: string }[] = [
  {
    value: "captions",
    label: "Add captions to videos",
    description: "Spoken words will appear as text on the video.",
  },
  {
    value: "transcripts",
    label: "Provide transcripts",
    description: "Full text version of audio and video, so you can read it.",
  },
  {
    value: "visual-cues",
    label: "Add visual cues",
    description: "Important sounds and alerts will also show as visuals.",
  },
];

const dyslexiaOptions: { value: DyslexiaSupport; label: string; description: string }[] = [
  { value: "none", label: "Not needed", description: "Standard typography and pacing." },
  { value: "low", label: "A little", description: "Slightly wider letter and line spacing." },
  {
    value: "medium",
    label: "Moderate",
    description: "Wider spacing, shorter line length, plain language.",
  },
  {
    value: "high",
    label: "Strong support",
    description: "Maximum spacing, very short lines, sentences kept simple and chunked.",
  },
];

export default function SettingsPage() {
  const router = useRouter();
  const { state, hydrated, set } = useFlow();

  // Settings requires both authed + completed initial survey.
  useEffect(() => {
    if (!hydrated) return;
    if (!state.authed) {
      router.replace("/welcome");
    } else if (!state.preferences) {
      router.replace("/preferences");
    }
  }, [hydrated, state.authed, state.preferences, router]);

  if (!hydrated || !state.authed || !state.preferences) {
    return (
      <Container size="md">
        <p className="mt-24 text-[var(--color-ink-faint)]">Loading…</p>
      </Container>
    );
  }

  const prefs = { ...defaultPreferences, ...state.preferences };

  function update(partial: Partial<Preferences>) {
    set("preferences", { ...prefs, ...partial });
  }

  function toggle<T extends string>(arr: T[], value: T): T[] {
    return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
  }

  return (
    <Container size="md">
      <header className="mt-10 flex flex-col gap-3">
        <p className="font-[family-name:var(--font-display)] text-[var(--color-ink-muted)] text-sm uppercase tracking-[0.18em]">
          Settings
        </p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Your preferences
        </h1>
        <p className="prose-measure text-[var(--color-ink-soft)] leading-relaxed">
          Changes save automatically and apply to Ditto right away. You can
          also change them any time from this menu.
        </p>
      </header>

      <div className="mt-12 flex flex-col gap-12">
        <section
          aria-labelledby="about-you"
          className="flex flex-col gap-5"
        >
          <h2
            id="about-you"
            className="font-[family-name:var(--font-display)] text-[var(--color-ink)] text-xl font-semibold"
          >
            About you
          </h2>
          <Field
            label="What should we call you?"
            description="A first name or nickname is fine."
          >
            {(ids) => (
              <TextInput
                id={ids.inputId}
                type="text"
                autoComplete="given-name"
                value={prefs.name}
                onChange={(e) => update({ name: e.target.value })}
                aria-describedby={ids["aria-describedby"]}
              />
            )}
          </Field>
          <Combobox
            label="Where are you reading from?"
            description="Country or region — helps with language and local context."
            options={countries}
            value={prefs.country}
            onChange={(v) => update({ country: v })}
            autoComplete="country-name"
          />
          <Field
            label="Your age"
            description="Optional. Helps Ditto pick the right tone."
          >
            {(ids) => (
              <TextInput
                id={ids.inputId}
                type="number"
                inputMode="numeric"
                min={4}
                max={120}
                placeholder="e.g. 32"
                value={prefs.age === null ? "" : String(prefs.age)}
                onChange={(e) => {
                  const raw = e.target.value;
                  const n = raw === "" ? null : Number.parseInt(raw, 10);
                  update({
                    age: Number.isFinite(n as number) ? (n as number) : null,
                  });
                }}
                aria-describedby={ids["aria-describedby"]}
              />
            )}
          </Field>
        </section>

        <section className="flex flex-col gap-10">
          <h2 className="font-[family-name:var(--font-display)] text-[var(--color-ink)] text-xl font-semibold">
            Vision
          </h2>
          <div className="grid gap-2">
            {visionOptions.map((opt) => {
              const checked = prefs.vision.includes(opt.value);
              return (
                <div key={opt.value} className="flex flex-col">
                  <Checkbox
                    label={opt.label}
                    description={opt.description}
                    checked={checked}
                    onChange={() =>
                      update({ vision: toggle(prefs.vision, opt.value) })
                    }
                  />
                  {opt.value === "larger-text" && checked ? (
                    <FontScaleSlider
                      value={prefs.textScale}
                      onChange={(v) => update({ textScale: v })}
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>

        <section className="flex flex-col gap-5">
          <h2 className="font-[family-name:var(--font-display)] text-[var(--color-ink)] text-xl font-semibold">
            Hearing
          </h2>
          <div className="grid gap-2">
            {hearingOptions.map((opt) => (
              <Checkbox
                key={opt.value}
                label={opt.label}
                description={opt.description}
                checked={prefs.hearing.includes(opt.value)}
                onChange={() =>
                  update({ hearing: toggle(prefs.hearing, opt.value) })
                }
              />
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-10">
          <h2 className="font-[family-name:var(--font-display)] text-[var(--color-ink)] text-xl font-semibold">
            How you read
          </h2>
          <RadioGroup<DyslexiaSupport>
            legend="Dyslexia support"
            description="How much should Ditto adapt typography and language for dyslexic readers?"
            value={prefs.dyslexia}
            options={dyslexiaOptions}
            onChange={(v) => update({ dyslexia: v })}
          />
          <Scale
            legend="How simple should the writing feel?"
            description="1 means very simple. 5 means original complexity."
            min={1}
            max={5}
            minLabel="Very simple"
            maxLabel="Standard"
            value={prefs.complexity}
            onChange={(v) => update({ complexity: v as ReadingComplexity })}
          />
          <div className="grid gap-4">
            <Toggle
              label="Child-safe mode"
              description="Filter out adult themes, violence, and unsafe content."
              checked={prefs.childSafe}
              onChange={(v) => update({ childSafe: v })}
            />
            <Toggle
              label="Plain-language mode"
              description="Rewrite jargon and complicated phrasing into everyday words."
              checked={prefs.simplifyLanguage}
              onChange={(v) => update({ simplifyLanguage: v })}
            />
          </div>
        </section>

        <div className="flex flex-wrap items-center gap-4 border-t border-[var(--color-rule)] pt-8">
          <Link href="/chat" className="btn-primary">
            Back to chat
          </Link>
          <p className="text-[var(--color-ink-muted)] text-sm">
            Your changes are already saved.
          </p>
        </div>
      </div>
    </Container>
  );
}
