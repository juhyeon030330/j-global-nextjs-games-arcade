const STORAGE_KEY = "savedGames";
export const SAVED_GAMES_EVENT = "savedGamesChange";

export function getSavedGames(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function isGameSaved(slug: string): boolean {
  return getSavedGames().includes(slug);
}

export function toggleSavedGame(slug: string): string[] {
  const current = getSavedGames();
  const next = current.includes(slug)
    ? current.filter((s) => s !== slug)
    : [...current, slug];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(SAVED_GAMES_EVENT));
  return next;
}
