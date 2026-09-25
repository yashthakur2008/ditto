"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Container } from "@/components/layout/Container";
import { StepHeader } from "@/components/layout/StepHeader";
import { CheckboxGroup } from "@/components/form/CheckboxGroup";
import { Checkbox } from "@/components/form/Checkbox";
import { RadioGroup } from "@/components/form/RadioGroup";
import { Scale } from "@/components/form/Scale";
import { Toggle } from "@/components/form/Toggle";
import { Field } from "@/components/form/Field";
import { TextInput } from "@/components/form/TextInput";
import { Combobox } from "@/components/form/Combobox";
import { FontScaleSlider } from "@/components/form/FontScaleSlider";
import { StepGuard } from "@/components/flow/StepGuard";
import { useFlow } from "@/components/flow/FlowProvider";
import { applyPreferencesToDocument } from "@/lib/applyPrefs";
import { countries } from "@/lib/countries";
import {
  defaultPreferences,
  type DyslexiaSupport,
  type HearingNeed,
  type Preferences,
  type ReadingComplexity,
  type ThemeMode,
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
  {
    value: "low",
    label: "A little",
    description: "Slightly wider letter and line spacing.",
  },
  {
    value: "medium",
    label: "Moderate",
    description: "Wider spacing, shorter line length, plain language.",
  },
  {
    value: "high",
    label: "Strong support",
    description:
      "Maximum spacing, very short lines, sentences kept simple and chunked.",
  },
];

type SubStep = 0 | 1 | 2 | 3;

const themeOptions: { value: ThemeMode; label: string; description: string }[] = [
  { value: "light", label: "Light", description: "Warm light mode." },
  { value: "dark", label: "Dark", description: "Low-light dark mode." },
  { value: "auto", label: "Auto", description: "Match this device automatically." },
];

const subSteps: { id: SubStep; label: string }[] = [
  { id: 0, label: "About you" },
  { id: 1, label: "Your senses" },
  { id: 2, label: "Appearance" },
  { id: 3, label: "How you read" },
];

export default function PreferencesPage() {
  return (
    <StepGuard require="preferences">
      <PreferencesContent />
    </StepGuard>
  );
}

function PreferencesContent() {
  const router = useRouter();
  const { state, set } = useFlow();
  const [prefs, setPrefs] = useState<Preferences>(() => ({
    ...defaultPreferences,
    ...(state.preferences ?? {}),
  }));
  const [step, setStep] = useState<SubStep>(0);
  const [nameErr, setNameErr] = useState<string | undefined>();
  const [countryErr, setCountryErr] = useState<string | undefined>();

  useEffect(() => {
    if (state.preferences) {
      setPrefs({ ...defaultPreferences, ...state.preferences });
    }
  }, [state.preferences]);

  // Live preview: apply current edits to <html> data-* attrs immediately.
  // On unmount or when prefs change, the next effect run re-applies.
  // On unmount without saving, restore the global preferences.
  useEffect(() => {
    applyPreferencesToDocument(prefs);
    return () => {
      applyPreferencesToDocument(state.preferences);
    };
  }, [prefs, state.preferences]);

  function toggle<T extends string>(arr: T[], value: T): T[] {
    return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
  }

  function validateAboutYou(): boolean {
    let ok = true;
    if (!prefs.name.trim()) {
      setNameErr("Please tell us what to call you.");
      ok = false;
    } else {
      setNameErr(undefined);
    }
    if (!prefs.country.trim()) {
      setCountryErr("Please choose the country you're reading from.");
      ok = false;
    } else {
      setCountryErr(undefined);
    }
    return ok;
  }

  function next() {
    if (step === 0 && !validateAboutYou()) return;
    if (step < 3) setStep((s) => ((s + 1) as SubStep));
    else finish();
  }

  function back() {
    if (step > 0) setStep((s) => ((s - 1) as SubStep));
  }

  function finish() {
    set("preferences", {
      ...prefs,
      name: prefs.name.trim(),
      country: prefs.country.trim(),
    });
    router.push("/chat");
  }

  return (
    <Container size="md">
      <StepHeader current="preferences" />
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        How do you like to read?
      </h1>
      <p className="prose-measure mt-4 text-[var(--color-ink-soft)] text-lg leading-relaxed">
        Welcome. Let&rsquo;s set Ditto up for the first time on this device. A
        few quick questions so Ditto can shape every page around you. Saved
        locally in your browser — only the link you paste is sent to Ditto when
        you rebuild a page.
      </p>

      <SubStepIndicator current={step} />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          next();
        }}
        className="mt-8 flex flex-col gap-10"
        noValidate
      >
        {step === 0 ? (
          <AboutYou
            prefs={prefs}
            setPrefs={setPrefs}
            nameErr={nameErr}
            countryErr={countryErr}
          />
        ) : null}

        {step === 1 ? <Senses prefs={prefs} setPrefs={setPrefs} toggle={toggle} /> : null}

        {step === 2 ? <Appearance prefs={prefs} setPrefs={setPrefs} /> : null}

        {step === 3 ? (
          <Reading prefs={prefs} setPrefs={setPrefs} />
        ) : null}

        <div className="mt-2 flex flex-wrap items-center gap-3 border-t border-[var(--color-rule)] pt-6">
          {step > 0 ? (
            <button
              type="button"
              onClick={back}
              className="btn-quiet underline-offset-4 hover:underline"
            >
              ← Back
            </button>
          ) : null}
          <button type="submit" className="btn-primary ml-auto">
            {step < 3 ? "Continue" : "Save and start chatting"}
          </button>
        </div>
      </form>

      {step !== 0 ? (
        <p className="prose-measure mt-8 text-[var(--color-ink-muted)] text-sm">
          You can change any of these any time from the menu.
        </p>
      ) : null}
    </Container>
  );
}

function SubStepIndicator({ current }: { current: SubStep }) {
  return (
    <nav
      aria-label="Survey steps"
      className="mt-6 flex flex-wrap items-center gap-2"
    >
      {subSteps.map((s, i) => {
        const isHere = s.id === current;
        const isDone = i < current;
        return (
          <span
            key={s.id}
            aria-current={isHere ? "step" : undefined}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs sm:text-sm ${
              isHere
                ? "border-[var(--color-accent-strong)] bg-[var(--color-accent-soft)] text-[var(--color-accent-strong)] font-semibold"
                : isDone
                  ? "border-[var(--color-rule)] bg-white text-[var(--color-ink-muted)]"
                  : "border-[var(--color-rule)] bg-transparent text-[var(--color-ink-faint)]"
            }`}
          >
            <span className="font-[family-name:var(--font-display)] font-semibold">
              {i + 1}
            </span>
            {s.label}
          </span>
        );
      })}
    </nav>
  );
}

function AboutYou({
  prefs,
  setPrefs,
  nameErr,
  countryErr,
}: {
  prefs: Preferences;
  setPrefs: (p: Preferences) => void;
  nameErr: string | undefined;
  countryErr: string | undefined;
}) {
  return (
    <section aria-labelledby="about-you" className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h2
          id="about-you"
          className="font-[family-name:var(--font-display)] text-[var(--color-ink)] text-xl font-semibold"
        >
          About you
        </h2>
        <p className="text-[var(--color-ink-muted)] text-sm leading-relaxed">
          Just two quick basics, so Ditto can greet you and tailor language to
          where you read from.
        </p>
      </header>
      <Field
        label="What should we call you?"
        description="A first name or nickname is fine."
        required
        error={nameErr}
      >
        {(ids) => (
          <TextInput
            id={ids.inputId}
            type="text"
            autoComplete="given-name"
            value={prefs.name}
            onChange={(e) => setPrefs({ ...prefs, name: e.target.value })}
            aria-describedby={ids["aria-describedby"]}
            aria-invalid={ids["aria-invalid"]}
          />
        )}
      </Field>
      <Combobox
        label="Where are you reading from?"
        description="Country or region — this helps with language and local context."
        required
        options={countries}
        value={prefs.country}
        onChange={(v) => setPrefs({ ...prefs, country: v })}
        error={countryErr}
        autoComplete="country-name"
      />
      <Field
        label="Your age"
        description="Optional. Helps Ditto pick the right tone — kid-friendly, plain adult, or supportive for older readers."
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
              setPrefs({
                ...prefs,
                age: Number.isFinite(n as number) ? (n as number) : null,
              });
            }}
            aria-describedby={ids["aria-describedby"]}
          />
        )}
      </Field>
      <Field
        label="What brings you to Ditto?"
        description="Optional. A short note helps Ditto respond with more useful context in chat."
      >
        {(ids) => (
          <textarea
            id={ids.inputId}
            className="field-input min-h-24 resize-y"
            maxLength={240}
            placeholder="e.g. I want news articles to feel calmer and easier to scan."
            value={prefs.reason}
            onChange={(e) => setPrefs({ ...prefs, reason: e.target.value })}
            aria-describedby={ids["aria-describedby"]}
          />
        )}
      </Field>
    </section>
  );
}

function Senses({
  prefs,
  setPrefs,
  toggle,
}: {
  prefs: Preferences;
  setPrefs: (p: Preferences) => void;
  toggle: <T extends string>(arr: T[], v: T) => T[];
}) {
  return (
    <section className="flex flex-col gap-10">
      <header className="flex flex-col gap-2">
        <h2 className="font-[family-name:var(--font-display)] text-[var(--color-ink)] text-xl font-semibold">
          Your senses
        </h2>
        <p className="text-[var(--color-ink-muted)] text-sm leading-relaxed">
          Tell Ditto what works for you. Changes apply to this app right away
          &mdash; you&rsquo;ll see them on the next step.
        </p>
      </header>
      <CheckboxGroup
        legend="Vision"
        description="Choose any that apply. Leave blank if none do."
      >
        {visionOptions.map((opt) => {
          const checked = prefs.vision.includes(opt.value);
          return (
            <div key={opt.value} className="flex flex-col">
              <Checkbox
                label={opt.label}
                description={opt.description}
                checked={checked}
                onChange={() =>
                  setPrefs({ ...prefs, vision: toggle(prefs.vision, opt.value) })
                }
              />
              {opt.value === "larger-text" && checked ? (
                <FontScaleSlider
                  value={prefs.textScale}
                  onChange={(v) => setPrefs({ ...prefs, textScale: v })}
                />
              ) : null}
            </div>
          );
        })}
      </CheckboxGroup>
      <CheckboxGroup
        legend="Hearing"
        description="If a page has audio or video, Ditto will adapt it for you."
      >
        {hearingOptions.map((opt) => (
          <Checkbox
            key={opt.value}
            label={opt.label}
            description={opt.description}
            checked={prefs.hearing.includes(opt.value)}
            onChange={() =>
              setPrefs({ ...prefs, hearing: toggle(prefs.hearing, opt.value) })
            }
          />
        ))}
      </CheckboxGroup>
    </section>
  );
}

function Appearance({
  prefs,
  setPrefs,
}: {
  prefs: Preferences;
  setPrefs: (p: Preferences) => void;
}) {
  return (
    <section className="motion-card flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h2 className="font-[family-name:var(--font-display)] text-[var(--color-ink)] text-xl font-semibold">
          Appearance
        </h2>
        <p className="text-[var(--color-ink-muted)] text-sm leading-relaxed">
          Pick Light, Dark, or Auto. Auto follows this device so Ditto feels natural the first time you return.
        </p>
      </header>
      <RadioGroup<ThemeMode>
        legend="Theme"
        description="You can change this later in settings."
        value={prefs.themeMode}
        options={themeOptions}
        onChange={(v) => setPrefs({ ...prefs, themeMode: v })}
      />
    </section>
  );
}

function Reading({
  prefs,
  setPrefs,
}: {
  prefs: Preferences;
  setPrefs: (p: Preferences) => void;
}) {
  return (
    <section className="flex flex-col gap-10">
      <header className="flex flex-col gap-2">
        <h2 className="font-[family-name:var(--font-display)] text-[var(--color-ink)] text-xl font-semibold">
          How you read
        </h2>
        <p className="text-[var(--color-ink-muted)] text-sm leading-relaxed">
          These last few questions shape pacing, spacing, and language across
          everything Ditto rebuilds.
        </p>
      </header>
      <RadioGroup<DyslexiaSupport>
        legend="Dyslexia support"
        description="How much should Ditto adapt typography and language for dyslexic readers?"
        value={prefs.dyslexia}
        options={dyslexiaOptions}
        onChange={(v) => setPrefs({ ...prefs, dyslexia: v })}
      />
      <Scale
        legend="How simple should the writing feel?"
        description="1 means very simple. 5 means original complexity."
        min={1}
        max={5}
        minLabel="Very simple"
        maxLabel="Standard"
        value={prefs.complexity}
        onChange={(v) =>
          setPrefs({ ...prefs, complexity: v as ReadingComplexity })
        }
      />
      <div className="grid gap-4">
        <Toggle
          label="Child-safe mode"
          description="Filter out adult themes, violence, and unsafe content."
          checked={prefs.childSafe}
          onChange={(v) => setPrefs({ ...prefs, childSafe: v })}
        />
        <Toggle
          label="Plain-language mode"
          description="Rewrite jargon and complicated phrasing into everyday words."
          checked={prefs.simplifyLanguage}
          onChange={(v) => setPrefs({ ...prefs, simplifyLanguage: v })}
        />
        <Toggle
          label="Remember my recent pages"
          description="Save the links you rebuild to this browser's history so you can reopen them later. Off by default — nothing is stored unless you turn this on."
          checked={prefs.historyEnabled}
          onChange={(v) => setPrefs({ ...prefs, historyEnabled: v })}
        />
      </div>
    </section>
  );
}
