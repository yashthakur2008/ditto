import type { HistoryItem, Preferences } from "./types";

const DEFAULT_BACKEND = "http://localhost:8080";

/**
 * Where the backend lives. Set NEXT_PUBLIC_BACKEND_URL in `.env.local` to
 * point at your Cloud Run deployment in production.
 */
export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") || DEFAULT_BACKEND;

/** Shape the backend expects on `/transform`. */
export type BackendProfile = {
  disability:
    | "blind"
    | "dyslexia"
    | "deaf"
    | "elderly"
    | "adhd"
    | "low_vision"
    | "tremor"
    | "none";
  age: number;
  country: string;
  name: string;
  simplify_language: boolean;
  complexity: number;
};

/** Shape the backend returns. Only `transformed_html` is guaranteed. */
export type TransformResponse = {
  transformed_html: string;
  // Anything else the backend chooses to add later (findings, summary) is
  // forwarded through but optional from the frontend's perspective.
  [extra: string]: unknown;
};

/**
 * Collapse the user's richer Preferences into the profile the backend expects.
 * Sends country, complexity, and simplify_language alongside the primary
 * disability axis.
 */
export function preferencesToProfile(prefs: Preferences | null): BackendProfile {
  const age = prefs?.age ?? (prefs?.childSafe ? 10 : 30);
  const country = prefs?.country?.trim() || "US";
  const name = prefs?.name?.trim() || "";
  const simplify_language = prefs?.simplifyLanguage ?? false;
  const complexity = prefs?.complexity ?? 3;

  if (!prefs) {
    return {
      disability: "none",
      age,
      country,
      name,
      simplify_language,
      complexity,
    };
  }

  // Hearing needs take priority — captions/transcripts require deaf adaptations.
  if (prefs.hearing.length > 0) {
    return { disability: "deaf", age, country, name, simplify_language, complexity };
  }

  if (prefs.vision.includes("screen-reader")) {
    return { disability: "blind", age, country, name, simplify_language, complexity };
  }

  if (prefs.dyslexia !== "none") {
    return { disability: "dyslexia", age, country, name, simplify_language, complexity };
  }

  if (
    prefs.vision.includes("alt-text-descriptions") ||
    (prefs.vision.includes("high-contrast") && prefs.vision.includes("larger-text"))
  ) {
    return { disability: "low_vision", age, country, name, simplify_language, complexity };
  }

  if (prefs.simplifyLanguage && prefs.complexity <= 2) {
    return { disability: "adhd", age, country, name, simplify_language, complexity };
  }

  if (prefs.vision.includes("reduced-motion")) {
    return { disability: "tremor", age, country, name, simplify_language, complexity };
  }

  if (
    prefs.vision.includes("larger-text") ||
    prefs.vision.includes("high-contrast")
  ) {
    return { disability: "elderly", age, country, name, simplify_language, complexity };
  }

  return { disability: "none", age, country, name, simplify_language, complexity };
}

/** Preferences dict for /chat — includes human-readable fields for context. */
export function preferencesToChatContext(
  prefs: Preferences | null,
): Record<string, unknown> {
  const profile = preferencesToProfile(prefs);
  return {
    ...profile,
    child_safe: prefs?.childSafe ?? false,
  };
}

/** Send conversation to Gemini via /chat, returns Ditto's reply. */
export async function dittoChat(
  messages: { role: string; text: string }[],
  preferences: Record<string, unknown> | null,
  signal?: AbortSignal,
): Promise<string> {
  const res = await fetch(`${BACKEND_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, preferences: preferences ?? {} }),
    signal,
  });
  if (!res.ok) return "I'm having trouble thinking right now — try again in a moment.";
  const data = await res.json() as { reply?: string };
  return data.reply ?? "I'm not sure how to respond to that — try pasting a link!";
}

/**
 * Play text via ElevenLabs TTS through the backend.
 * Fetches /voice/tts and plays the MP3 through the browser AudioContext.
 */
export async function speakText(text: string): Promise<void> {
  try {
    const res = await fetch(`${BACKEND_URL}/voice/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.onended = () => URL.revokeObjectURL(url);
    await audio.play();
  } catch {
    // TTS failure is non-fatal — silently skip
  }
}

/**
 * Fetch TTS audio and return a ready-to-play `<audio>` element, so callers
 * can control playback (pause/stop) instead of fire-and-forget like `speakText`.
 * Throws if the backend call fails, so callers can show an error state.
 */
export async function synthesizeSpeech(text: string): Promise<HTMLAudioElement> {
  const res = await fetch(`${BACKEND_URL}/voice/tts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new TransformError(`Text-to-speech failed (${res.status}). ${detail.slice(0, 200)}`.trim(), res.status);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  audio.addEventListener("ended", () => URL.revokeObjectURL(url), { once: true });
  return audio;
}

/** Friendly error wrapper so callers can show a message. */
export class TransformError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/**
 * Hit the backend's `/transform` endpoint with the user's URL + profile.
 * Throws `TransformError` on non-2xx so chat can render a friendly message.
 */
export async function transform(
  url: string,
  profile: BackendProfile,
  signal?: AbortSignal,
  uid?: string | null,
): Promise<TransformResponse> {
  let res: Response;
  try {
    res = await fetch(`${BACKEND_URL}/transform`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(uid ? { url, profile, uid } : { url, profile }),
      signal,
    });
  } catch (err) {
    throw new TransformError(
      err instanceof Error ? err.message : "Could not reach the backend.",
      0,
    );
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new TransformError(
      `The backend returned ${res.status}. ${detail.slice(0, 240)}`.trim(),
      res.status,
    );
  }

  const data = (await res.json()) as TransformResponse;
  if (typeof data.transformed_html !== "string") {
    throw new TransformError(
      "The backend reply was missing `transformed_html`.",
      res.status,
    );
  }
  return data;
}

export type BatchTransformResult = {
  url: string;
  success: boolean;
  error?: string;
  transformed_html: string;
  content_level: "safe" | "mild" | "hardcore";
  before_score: Record<string, unknown>;
  after_score: Record<string, unknown>;
};

/**
 * Rebuild several URLs with one profile in a single request. The backend
 * caps this at 10 URLs and runs them with bounded concurrency.
 */
export async function transformBatch(
  urls: string[],
  profile: BackendProfile,
  signal?: AbortSignal,
): Promise<BatchTransformResult[]> {
  const res = await fetch(`${BACKEND_URL}/transform/batch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ urls, profile }),
    signal,
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new TransformError(`The backend returned ${res.status}. ${detail.slice(0, 240)}`.trim(), res.status);
  }
  const data = (await res.json()) as { results: BatchTransformResult[] };
  return data.results;
}

/** Persist a rebuilt page and get back a short id others can view at `/r/{id}`. */
export async function createShare(
  transformedHtml: string,
  originalUrl: string,
): Promise<string> {
  const res = await fetch(`${BACKEND_URL}/share`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transformed_html: transformedHtml, original_url: originalUrl }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new TransformError(`The backend returned ${res.status}. ${detail.slice(0, 240)}`.trim(), res.status);
  }
  const data = (await res.json()) as { id: string };
  return data.id;
}

export type SharedPage = {
  transformed_html: string;
  original_url: string;
  created_at: number;
};

/** Load a previously shared rebuilt page by id. Returns null if it doesn't exist. */
export async function fetchShare(id: string): Promise<SharedPage | null> {
  const res = await fetch(`${BACKEND_URL}/share/${encodeURIComponent(id)}`);
  if (!res.ok) return null;
  return (await res.json()) as SharedPage;
}

/** Recent transforms for this client, newest first. Returns [] on any failure. */
export async function fetchHistory(uid: string): Promise<HistoryItem[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/history/${encodeURIComponent(uid)}`);
    if (!res.ok) return [];
    return (await res.json()) as HistoryItem[];
  } catch {
    return [];
  }
}
