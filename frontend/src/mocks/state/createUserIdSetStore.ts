/**
 * 계정(email)별로 id 집합을 기억하는 목 스토어를 만든다. (좋아요한 테마, "도움이 돼요"를 누른 후기 등)
 * 새로고침해도 유지되도록 브라우저에서는 localStorage 의 `storageKey` 에 저장한다.
 */
export function createUserIdSetStore(storageKey: string) {
  const idsByEmail = load();

  function load(): Map<string, Set<string>> {
    if (typeof localStorage === "undefined") return new Map();

    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return new Map();

      const entries = JSON.parse(raw) as [string, string[]][];
      return new Map(entries.map(([email, ids]) => [email, new Set(ids)]));
    } catch {
      return new Map();
    }
  }

  function persist(): void {
    if (typeof localStorage === "undefined") return;
    const entries = [...idsByEmail].map(
      ([email, ids]) => [email, [...ids]] as [string, string[]]
    );
    localStorage.setItem(storageKey, JSON.stringify(entries));
  }

  return {
    has: (email: string, id: string): boolean =>
      idsByEmail.get(email)?.has(id) ?? false,

    set: (email: string, id: string, on: boolean): void => {
      const ids = idsByEmail.get(email) ?? new Set<string>();
      if (on) {
        ids.add(id);
      } else {
        ids.delete(id);
      }
      idsByEmail.set(email, ids);
      persist();
    },
  };
}
