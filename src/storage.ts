// localStorage can throw (private mode, blocked site data) — never let it break the app.

export const KEYS = {
  messages: "yaphook:messages",
  targets: "yaphook:targets",
};

export function load<T>(key: string): T | null {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : null;
  } catch {
    return null;
  }
}

export function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked */
  }
}
