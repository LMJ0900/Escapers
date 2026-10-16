const STORAGE_KEY = "msw-mock-theme-likes-v1";

function loadLikes(): Map<string, Set<string>> {
  if (typeof localStorage === "undefined") return new Map();

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Map();

    const entries = JSON.parse(raw) as [string, string[]][];
    return new Map(entries.map(([email, ids]) => [email, new Set(ids)]));
  } catch {
    return new Map();
  }
}

function persist(): void {
  if (typeof localStorage === "undefined") return;
  const entries = [...likesByEmail].map(
    ([email, ids]) => [email, [...ids]] as [string, string[]]
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

const likesByEmail = loadLikes();

export const themeLikeStore = {
  isLiked: (email: string, themeId: string): boolean =>
    likesByEmail.get(email)?.has(themeId) ?? false,

  setLiked: (email: string, themeId: string, liked: boolean): void => {
    const ids = likesByEmail.get(email) ?? new Set<string>();
    if (liked) {
      ids.add(themeId);
    } else {
      ids.delete(themeId);
    }
    likesByEmail.set(email, ids);
    persist();
  },
};
