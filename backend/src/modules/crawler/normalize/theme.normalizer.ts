import type { ThemeGenre } from "../../../generated/prisma/client";

// 사이트마다 다른 원본 표기를 우리 값으로 바꾸는 순수 함수 모음.
// 매칭 규칙은 위에서부터 먼저 맞는 것을 쓴다 ("코믹로맨스" → COMEDY 가 ROMANCE 보다 먼저).
const GENRE_RULES: [RegExp, ThemeGenre][] = [
  [/공포|호러|오컬트/, "HORROR"],
  [/스릴러|서스펜스/, "THRILLER"],
  [/추리|미스터리|미스테리|수사/, "MYSTERY"],
  [/SF|에스에프|우주/i, "SF"],
  [/코믹|코미디|개그/, "COMEDY"],
  [/로맨스|연애|감성/, "ROMANCE"],
  [/판타지|동화/, "FANTASY"],
  [/어드벤처|어드벤쳐|모험|미션|challenge/i, "ADVENTURE"],
  [/드라마|감동|극/, "DRAMA"],
  [/이머시브|잠입/, "IMMERSIVE"],
  [/야외/, "OUTDOOR"],
];

export function normalizeGenre(raw: string | undefined): ThemeGenre {
  if (!raw) return "ETC";
  return GENRE_RULES.find(([pattern]) => pattern.test(raw))?.[1] ?? "ETC";
}

/** "3", "Lv.3", "난이도 3", "★★★☆☆" → 1~5. 해석할 수 없으면 null */
export function normalizeDifficulty(raw: string | undefined): number | null {
  if (!raw) return null;
  const stars = (raw.match(/★/g) ?? []).length;
  const value = stars > 0 ? stars : Number(/\d+(\.\d+)?/.exec(raw)?.[0]);
  if (!Number.isFinite(value)) return null;
  return Math.min(5, Math.max(1, Math.round(value)));
}

/** "2–4인", "2~5", "2인", "2-6명" → { min, max } */
export function normalizePlayers(raw: string | undefined): {
  minPlayers: number | null;
  maxPlayers: number | null;
} {
  const numbers = (raw?.match(/\d+/g) ?? []).map(Number);
  if (numbers.length === 0) return { minPlayers: null, maxPlayers: null };
  return {
    minPlayers: Math.min(...numbers),
    maxPlayers: Math.max(...numbers),
  };
}

/** "60분", "1시간 10분", "70" → 분 */
export function normalizePlayTime(raw: string | undefined): number | null {
  if (!raw) return null;
  const hours = Number(/(\d+)\s*시간/.exec(raw)?.[1] ?? 0);
  const minutes = Number(/(\d+)\s*분/.exec(raw)?.[1] ?? 0);
  if (hours || minutes) return hours * 60 + minutes;
  const plain = Number(/\d+/.exec(raw)?.[0]);
  return Number.isFinite(plain) ? plain : null;
}

/** "2인 44,000원 / 3인 60,000원" → 1인 기준 최저가 */
export function normalizePriceFrom(raw: string | undefined): number | null {
  if (!raw) return null;
  const perPerson = [...raw.matchAll(/(\d+)\s*인\s*([\d,]+)\s*원/g)].map(
    ([, people, price]) => Number(price.replace(/,/g, "")) / Number(people)
  );
  if (perPerson.length > 0) return Math.round(Math.min(...perPerson));
  const price = /([\d,]+)\s*원/.exec(raw)?.[1];
  return price ? Number(price.replace(/,/g, "")) : null;
}

/** "서울 광진구 자양동 17-5" → "서울 광진구". 시/도 + 시/군/구 */
export function normalizeRegion(address: string): string {
  const [province, city] = address.trim().split(/\s+/);
  return [province, city].filter(Boolean).join(" ");
}
