const KEY = "ditto.flow.v1";
const CLIENT_ID_KEY = "ditto.client-id.v1";

/**
 * Random per-browser identifier used only when the user opts in to history
 * (see `Preferences.historyEnabled`). Not tied to any account.
 */
export function getClientId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    let id = window.localStorage.getItem(CLIENT_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      window.localStorage.setItem(CLIENT_ID_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

export function loadFlow<T>(): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function saveFlow<T>(value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    // quota or private-mode failure — silently degrade
  }
}

export function clearFlow(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
