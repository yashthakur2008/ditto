"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  defaultPreferences,
  initialFlow,
  type FlowState,
} from "@/lib/types";
import { clearFlow, loadFlow, saveFlow } from "@/lib/storage";
import { applyPreferencesToDocument } from "@/lib/applyPrefs";

type FlowContextValue = {
  state: FlowState;
  hydrated: boolean;
  set: <K extends keyof FlowState>(key: K, value: FlowState[K]) => void;
  patch: (partial: Partial<FlowState>) => void;
  reset: () => void;
};

const FlowContext = createContext<FlowContextValue | null>(null);

export function FlowProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FlowState>(initialFlow);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = loadFlow<FlowState>();
    if (stored) {
      const merged: FlowState = { ...initialFlow, ...stored };
      // Ensure preferences always has every field, even if stored from an older schema.
      if (merged.preferences) {
        merged.preferences = { ...defaultPreferences, ...merged.preferences };
      }
      setState(merged);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveFlow(state);
  }, [state, hydrated]);

  // Keep <html> data-* attrs in sync with current preferences.
  useEffect(() => {
    if (!hydrated) return;
    applyPreferencesToDocument(state.preferences);
  }, [hydrated, state.preferences]);

  const set = useCallback(
    <K extends keyof FlowState>(key: K, value: FlowState[K]) => {
      setState((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const patch = useCallback((partial: Partial<FlowState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  const reset = useCallback(() => {
    clearFlow();
    setState(initialFlow);
  }, []);

  const value = useMemo(
    () => ({ state, hydrated, set, patch, reset }),
    [state, hydrated, set, patch, reset],
  );

  return <FlowContext.Provider value={value}>{children}</FlowContext.Provider>;
}

export function useFlow() {
  const ctx = useContext(FlowContext);
  if (!ctx) throw new Error("useFlow must be used inside FlowProvider");
  return ctx;
}
