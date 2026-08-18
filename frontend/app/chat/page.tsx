"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Container } from "@/components/layout/Container";
import { StepHeader } from "@/components/layout/StepHeader";
import { StepGuard } from "@/components/flow/StepGuard";
import { useFlow } from "@/components/flow/FlowProvider";
import {
  BACKEND_URL,
  dittoChat,
  fetchHistory,
  preferencesToChatContext,
  preferencesToProfile,
  transform,
  TransformError,
} from "@/lib/api";
import { getClientId } from "@/lib/storage";
import type { ChatMessage, HistoryItem, Rebuilt } from "@/lib/types";
import { DittoMark } from "@/components/identity/DittoMark";

export default function ChatPage() {
  return (
    <StepGuard require="chat">
      <ChatContent />
    </StepGuard>
  );
}

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

function extractUrl(text: string): string | null {
  const explicit = text.match(/https?:\/\/\S+/i);
  if (explicit) return explicit[0].replace(/[.,!?)]+$/, "");
  const domain = text.match(/\b([\w-]+(?:\.[\w-]+)+)(\/\S*)?\b/);
  if (domain) {
    const candidate = domain[0];
    try {
      const u = new URL(`https://${candidate}`);
      if (u.hostname.includes(".")) return `https://${candidate}`;
    } catch {
      return null;
    }
  }
  return null;
}

function ChatContent() {
  const router = useRouter();
  const { state, patch } = useFlow();
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const logRef = useRef<HTMLOListElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const historyEnabled = Boolean(state.preferences?.historyEnabled);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Load recent pages when history is opted in.
  useEffect(() => {
    if (!historyEnabled) {
      setHistory([]);
      return;
    }
    const uid = getClientId();
    if (!uid) return;
    fetchHistory(uid).then(setHistory);
  }, [historyEnabled]);

  // Seed greeting on first arrival.
  useEffect(() => {
    if (state.messages.length === 0) {
      const first = state.preferences?.name?.trim().split(/\s+/)[0];
      const greeting: ChatMessage = {
        id: makeId(),
        role: "assistant",
        text:
          (first ? `Hi ${first} — I'm Ditto. ` : "Hi — I'm Ditto. ") +
          "Paste any web link and I'll rebuild the page around how you read. " +
          "You can also tell me anything specific you want me to focus on.",
      };
      patch({ messages: [greeting] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll new messages into view.
  useEffect(() => {
    const log = logRef.current;
    if (!log) return;
    const last = log.querySelector<HTMLElement>("li:last-child");
    if (last) last.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [state.messages.length, busy]);

  useEffect(() => () => abortRef.current?.abort(), []);

  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault();
    const text = draft.trim();
    if (!text || busy) return;

    setDraft("");
    const userMsg: ChatMessage = { id: makeId(), role: "user", text };
    const url = extractUrl(text);

    if (!url) {
      setBusy(true);
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      const messagesWithUser = [...state.messages, userMsg];
      patch({ messages: messagesWithUser, intent: state.intent ? `${state.intent}\n${text}` : text });

      try {
        const reply = await dittoChat(
          messagesWithUser.map((m) => ({ role: m.role, text: m.text })),
          preferencesToChatContext(state.preferences),
          abortRef.current.signal,
        );
        patch({
          messages: [
            ...messagesWithUser,
            { id: makeId(), role: "assistant", text: reply },
          ],
        });
      } finally {
        setBusy(false);
        composerRef.current?.focus();
      }
      return;
    }

    // We have a URL — call the backend.
    const messagesWithUser = [...state.messages, userMsg];
    patch({ messages: messagesWithUser, source: { mode: "url", url } });
    setBusy(true);

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    const profile = preferencesToProfile(state.preferences);
    const uid = historyEnabled ? getClientId() : null;
    try {
      const data = await transform(url, profile, abortRef.current.signal, uid);
      if (uid) fetchHistory(uid).then(setHistory);
      const rebuilt: Rebuilt = {
        transformedHtml: data.transformed_html,
        originalUrl: url,
        originalHtml: data.original_html as string | undefined,
        profileApplied: profile,
        beforeScore: data.before_score as Rebuilt["beforeScore"],
        afterScore:  data.after_score  as Rebuilt["afterScore"],
        contentLevel: data.content_level as Rebuilt["contentLevel"],
      };
      const done: ChatMessage = {
        id: makeId(),
        role: "assistant",
        text:
          "Done — I rebuilt the page around your needs. " +
          `(Sent your profile as ${profileLabel(profile.disability)}, age ${profile.age}.)`,
        offerRebuild: true,
      };
      patch({ messages: [...messagesWithUser, done], rebuilt });
    } catch (err) {
      const msg =
        err instanceof TransformError
          ? `Something went wrong while reaching the rebuilder. ${err.message}`
          : "Something went wrong while reaching the rebuilder. " +
            "Please check that the link is reachable and try again.";
      patch({
        messages: [
          ...messagesWithUser,
          { id: makeId(), role: "assistant", text: msg },
        ],
      });
    } finally {
      setBusy(false);
      composerRef.current?.focus();
    }
  }

  function openImproved() {
    if (state.rebuilt) router.push("/output");
  }

  async function reopenFromHistory(url: string) {
    if (busy) return;
    const userMsg: ChatMessage = { id: makeId(), role: "user", text: url };
    const messagesWithUser = [...state.messages, userMsg];
    patch({ messages: messagesWithUser, source: { mode: "url", url } });
    setBusy(true);
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    const profile = preferencesToProfile(state.preferences);
    const uid = historyEnabled ? getClientId() : null;
    try {
      const data = await transform(url, profile, abortRef.current.signal, uid);
      if (uid) fetchHistory(uid).then(setHistory);
      const rebuilt: Rebuilt = {
        transformedHtml: data.transformed_html,
        originalUrl: url,
        originalHtml: data.original_html as string | undefined,
        profileApplied: profile,
        beforeScore: data.before_score as Rebuilt["beforeScore"],
        afterScore: data.after_score as Rebuilt["afterScore"],
        contentLevel: data.content_level as Rebuilt["contentLevel"],
      };
      const done: ChatMessage = {
        id: makeId(),
        role: "assistant",
        text: "Rebuilt that page again for you.",
        offerRebuild: true,
      };
      patch({ messages: [...messagesWithUser, done], rebuilt });
    } catch (err) {
      const msg =
        err instanceof TransformError
          ? `Something went wrong while reaching the rebuilder. ${err.message}`
          : "Something went wrong while reaching the rebuilder.";
      patch({ messages: [...messagesWithUser, { id: makeId(), role: "assistant", text: msg }] });
    } finally {
      setBusy(false);
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }

  function resetConversation() {
    abortRef.current?.abort();
    patch({
      messages: [
        {
          id: makeId(),
          role: "assistant",
          text:
            "Fresh start. Paste a link to any page you'd like me to rebuild.",
        },
      ],
      analysis: null,
      source: null,
      intent: "",
      rebuilt: null,
    });
  }

  const canOpen = Boolean(state.rebuilt);

  return (
    <Container size="md">
      <StepHeader current="chat" />
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Talk to Ditto.
          </h1>
          <p className="prose-measure mt-3 text-[var(--color-ink-soft)] text-lg leading-relaxed">
            Paste a link and I&rsquo;ll rebuild the page around how you read.
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          {state.messages.length > 1 ? (
            <button
              type="button"
              onClick={resetConversation}
              className="btn-quiet underline-offset-4 hover:underline"
            >
              Start new chat
            </button>
          ) : null}
          <Link href="/batch" className="btn-quiet text-sm underline-offset-4 hover:underline">
            Rebuild multiple pages →
          </Link>
        </div>
      </header>

      {historyEnabled && history.length > 0 ? (
        <section aria-labelledby="recent-pages" className="mt-6">
          <h2
            id="recent-pages"
            className="text-[var(--color-ink-muted)] text-xs font-semibold uppercase tracking-wide"
          >
            Recent pages
          </h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {history.slice(0, 6).map((item) => (
              <li key={`${item.url}-${item.created_at}`}>
                <button
                  type="button"
                  onClick={() => reopenFromHistory(item.url)}
                  disabled={busy}
                  className="btn-quiet rounded-full border border-[var(--color-rule)] px-3 py-1 text-xs hover:bg-[var(--color-accent-soft)] disabled:opacity-50"
                  title={item.url}
                >
                  {new URL(item.url).hostname.replace(/^www\./, "")}
                </button>
              </li>
            ))}
          </ul>
          <a
            href={`${BACKEND_URL}/history/${encodeURIComponent(getClientId() ?? "")}/report`}
            className="mt-2 inline-block text-[var(--color-ink-muted)] text-xs underline-offset-4 hover:underline"
          >
            Download report (CSV)
          </a>
        </section>
      ) : null}

      <ol
        ref={logRef}
        aria-label="Conversation with Ditto"
        className="mt-10 flex flex-col gap-4 pb-44"
      >
        {state.messages.map((msg) => (
          <Bubble key={msg.id} message={msg} onOpen={openImproved} canOpen={canOpen} />
        ))}
        {busy ? <ThinkingBubble label="Ditto is working…" /> : null}
      </ol>

      <div aria-live="polite" aria-atomic="true" className="sr-only" role="status">
        {busy ? "Ditto is reading and rebuilding the page." : ""}
      </div>

      <form
        onSubmit={handleSend}
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-rule)] bg-[color-mix(in_oklab,var(--color-paper)_92%,transparent)] backdrop-blur"
        aria-label="Send a message"
      >
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-3 px-6 py-4 sm:px-8">
          <label htmlFor="composer" className="sr-only">
            Type a message
          </label>
          <div className="flex items-end gap-3">
            <textarea
              id="composer"
              ref={composerRef}
              rows={1}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKey}
              placeholder={
                state.rebuilt
                  ? "Paste another link, or tell me what to focus on…"
                  : "Paste a link, or ask me anything…"
              }
              className="field-input min-h-[3rem] flex-1 resize-none"
              disabled={busy}
            />
            <button
              type="submit"
              className="btn-primary shrink-0"
              disabled={!draft.trim() || busy}
            >
              Send
            </button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[var(--color-ink-muted)] text-xs">
              Enter to send · Shift + Enter for a new line · Talking to{" "}
              <span className="font-mono">
                {new URL(BACKEND_URL).host}
              </span>
            </p>
            {canOpen ? (
              <button
                type="button"
                onClick={openImproved}
                className="rounded-[var(--radius-md)] border border-[var(--color-grow)] bg-[var(--color-grow-soft)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-white"
              >
                Open the improved page →
              </button>
            ) : null}
          </div>
        </div>
      </form>
    </Container>
  );
}

function profileLabel(d: string) {
  switch (d) {
    case "blind":
      return "screen-reader friendly";
    case "dyslexia":
      return "dyslexia-friendly";
    case "deaf":
      return "captions and transcripts";
    case "low_vision":
      return "low-vision friendly";
    case "adhd":
      return "focus-friendly";
    case "tremor":
      return "motor-friendly";
    case "elderly":
      return "easier-to-read";
    default:
      return "plain";
  }
}

function Bubble({
  message,
  onOpen,
  canOpen,
}: {
  message: ChatMessage;
  onOpen: () => void;
  canOpen: boolean;
}) {
  const isUser = message.role === "user";
  if (isUser) {
    return (
      <li className="flex w-full justify-end">
        <div className="flex max-w-[42rem] flex-col gap-3 rounded-[var(--radius-lg)] rounded-br-sm bg-[var(--color-accent-soft)] px-5 py-4 text-[var(--color-ink)]">
          <p className="sr-only">You said:</p>
          <div className="whitespace-pre-wrap leading-relaxed">
            {message.text}
          </div>
        </div>
      </li>
    );
  }
  return (
    <li className="flex w-full justify-start gap-3">
      <div
        aria-hidden="true"
        className="mt-1 shrink-0 text-[var(--color-ink-soft)]"
      >
        <DittoMark size={32} />
      </div>
      <div className="flex max-w-[42rem] flex-col gap-3 rounded-[var(--radius-lg)] rounded-tl-sm border border-[var(--color-rule)] bg-white px-5 py-4 text-[var(--color-ink)]">
        <p className="sr-only">Ditto said:</p>
        <div className="whitespace-pre-wrap leading-relaxed">{message.text}</div>
        {message.offerRebuild && canOpen ? (
          <div>
            <button
              type="button"
              onClick={onOpen}
              className="mt-1 rounded-[var(--radius-md)] border border-[var(--color-grow)] bg-[var(--color-grow-soft)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-white"
            >
              Open the improved page →
            </button>
          </div>
        ) : null}
      </div>
    </li>
  );
}

function ThinkingBubble({ label }: { label: string }) {
  return (
    <li className="flex w-full justify-start gap-3" aria-hidden="true">
      <div className="mt-1 shrink-0 text-[var(--color-ink-faint)]">
        <DittoMark size={32} />
      </div>
      <div className="flex items-center gap-2 rounded-[var(--radius-lg)] rounded-tl-sm border border-[var(--color-rule)] bg-white px-5 py-3 text-[var(--color-ink-muted)] italic">
        <span className="inline-flex gap-1">
          <Dot delay={0} />
          <Dot delay={150} />
          <Dot delay={300} />
        </span>
        <span>{label}</span>
      </div>
    </li>
  );
}

function Dot({ delay }: { delay: number }) {
  return (
    <span
      className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-ink-faint)]"
      style={{ animationDelay: `${delay}ms` }}
    />
  );
}
