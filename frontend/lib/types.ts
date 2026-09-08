export type Step = "welcome" | "preferences" | "chat" | "output";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  /** When the assistant offers to create the improved version, render an inline CTA. */
  offerRebuild?: boolean;
};

export type VisionNeed =
  | "screen-reader"
  | "high-contrast"
  | "larger-text"
  | "reduced-motion"
  | "alt-text-descriptions";

export type HearingNeed = "captions" | "transcripts" | "visual-cues";

export type DyslexiaSupport = "none" | "low" | "medium" | "high";

export type ReadingComplexity = 1 | 2 | 3 | 4 | 5;

export type Preferences = {
  name: string;
  country: string;
  /** Optional self-reported age. Backend uses this to tune language complexity. */
  age: number | null;
  /** Optional goal/context for why the user uses Ditto, shared with chat for better replies. */
  reason: string;
  vision: VisionNeed[];
  hearing: HearingNeed[];
  dyslexia: DyslexiaSupport;
  complexity: ReadingComplexity;
  childSafe: boolean;
  simplifyLanguage: boolean;
  /** Text-scale multiplier (1.0 = default). Only applied when "larger-text" is in vision[]. */
  textScale: number;
  /** Opt-in: save recent transformed URLs server-side so they can be revisited. */
  historyEnabled: boolean;
};

export type HistoryItem = {
  url: string;
  disability: string;
  content_level: "safe" | "mild" | "hardcore";
  created_at: number;
};

export type SiteScore = {
  readability: number;   // 0-100
  accessibility: number; // 0-100
};

export type AccessibilityScore = {
  total: number;
  images:      { score: number; note: string };
  structure:   { score: number; note: string };
  readability: { score: number; note: string };
  interactive: { score: number; note: string };
  clarity:     { score: number; note: string };
};

export type Rebuilt = {
  /** Raw HTML from the backend `/transform` endpoint, rendered via iframe srcdoc. */
  transformedHtml: string;
  /** Original page URL, used for "view original" link-out. */
  originalUrl: string;
  /** Cleaned source content (scripts/ads stripped) for the side-by-side compare view. */
  originalHtml?: string;
  /** Which backend profile we sent — kept for the summary panel. */
  profileApplied: { disability: string; age: number };
  /** Accessibility scores before and after the rebuild. */
  beforeScore?: AccessibilityScore;
  afterScore?: AccessibilityScore;
  originalScore?: SiteScore;
  improvedScore?: SiteScore;
  contentLevel?: "safe" | "mild" | "hardcore";
};

export type FlowState = {
  authed: boolean;
  preferences: Preferences | null;
  source: { mode: "url" | "capture"; url?: string } | null;
  /** Legacy mock field, kept on state for now so existing localStorage stays compatible. */
  analysis: unknown | null;
  intent: string;
  messages: ChatMessage[];
  rebuilt: Rebuilt | null;
};

export const defaultPreferences: Preferences = {
  name: "",
  country: "",
  age: null,
  reason: "",
  vision: [],
  hearing: [],
  dyslexia: "none",
  complexity: 3,
  childSafe: false,
  simplifyLanguage: false,
  textScale: 1.2,
  historyEnabled: false,
};

export const initialFlow: FlowState = {
  authed: false,
  preferences: null,
  source: null,
  analysis: null,
  intent: "",
  messages: [],
  rebuilt: null,
};
