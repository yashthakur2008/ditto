"use client";

import { useRouter } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { StepHeader } from "@/components/layout/StepHeader";
import { Field } from "@/components/form/Field";
import { TextInput } from "@/components/form/TextInput";
import { useFlow } from "@/components/flow/FlowProvider";
import { defaultPreferences } from "@/lib/types";

export default function WelcomePage() {
  const router = useRouter();
  const { state, patch } = useFlow();

  function destinationAfterAuth(): string {
    return state.onboardingComplete && state.preferences ? "/chat" : "/preferences";
  }

  function continueAsGuest(e: React.FormEvent) {
    e.preventDefault();
    patch({ authed: true });
    router.push(destinationAfterAuth());
  }

  return (
    <Container size="sm">
      <StepHeader current="welcome" />
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
        Welcome to Ditto.
      </h1>
      <p className="mt-5 max-w-prose text-[var(--color-ink-soft)] text-lg leading-relaxed">
        Ditto helps make websites easier to read, safer to navigate, and more
        accessible for everyone. Tell us a little about how you read, and we&rsquo;ll
        rebuild any page to suit you.
      </p>

      <div className="surface-soft mt-10 p-6">
        <p className="text-[var(--color-ink-soft)] leading-relaxed">
          <strong className="text-[var(--color-ink)]">Guest mode.</strong>{" "}
          No account needed. Your preferences are saved in this browser only.
          When you paste a link, Ditto sends the URL to our server to rebuild
          the page — we don&rsquo;t store your browsing history.
        </p>
      </div>

      <form onSubmit={continueAsGuest} className="mt-8 flex flex-col gap-5">
        <Field
          label="Your first name (optional)"
          description="So Ditto can greet you in the chat."
        >
          {(ids) => (
            <TextInput
              id={ids.inputId}
              type="text"
              autoComplete="given-name"
              defaultValue={state.preferences?.name ?? ""}
              onChange={(e) => {
                const name = e.target.value;
                patch({
                  preferences: {
                    ...(state.preferences ?? defaultPreferences),
                    name,
                  },
                });
              }}
              aria-describedby={ids["aria-describedby"]}
            />
          )}
        </Field>

        <button type="submit" className="btn-primary">
          Continue as guest
        </button>
      </form>
    </Container>
  );
}
