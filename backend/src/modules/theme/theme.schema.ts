import { z } from "zod";
import {
  ThemeActivityLevel,
  ThemeGenre,
} from "../../generated/prisma/enums";

// 요청 검증 규칙. 프론트 src/api/domain/theme/** 와 같은 계약을 유지한다 (shared 이관 전까지 중복 정의).

export const THEME_SORT_OPTIONS = [
  "POPULAR",
  "NEWEST",
  "PRICE_ASC",
  "PRICE_DESC",
  "DIFFICULTY_DESC",
  "DIFFICULTY_ASC",
] as const;
export type ThemeSortOption = (typeof THEME_SORT_OPTIONS)[number];

export const THEME_COLLECTION_TYPES = ["hot", "horror", "active"] as const;
export type ThemeCollectionType = (typeof THEME_COLLECTION_TYPES)[number];

/** `a,b,c` 또는 같은 키 반복(`?a=1&a=2`)을 문자열 배열로 받는다. 비어있으면 undefined. */
const csvSchema = z.preprocess((value) => {
  if (value === undefined) return undefined;
  const raw = Array.isArray(value) ? value.join(",") : value;
  if (typeof raw !== "string") return raw;
  const items = raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length > 0 ? items : undefined;
}, z.array(z.string()).optional());

/**
 * 모르는 코드는 매칭에서 빠진다 (프론트 GetThemesRequest 주석).
 * 모르는 값만 보냈다면 빈 배열이 되어 결과도 비어있다 — 목 동작과 같다.
 */
const knownCodesSchema = <T extends string>(codes: readonly T[]) =>
  csvSchema.transform((values) =>
    values?.filter((value): value is T => codes.includes(value as T))
  );

export const getThemesQuerySchema = z.object({
  brands: csvSchema,
  regions: csvSchema,
  genres: knownCodesSchema(Object.values(ThemeGenre)),
  activityLevels: knownCodesSchema(Object.values(ThemeActivityLevel)),
  sort: z.enum(THEME_SORT_OPTIONS).default("POPULAR"),
  cursor: z.string().min(1).optional(),
  size: z.coerce.number().int().min(1).max(50).default(20),
});
export type GetThemesQuery = z.infer<typeof getThemesQuerySchema>;

export const putThemeLikeSchema = z.object({
  liked: z.boolean(),
});
export type PutThemeLikeRequest = z.infer<typeof putThemeLikeSchema>;

/**
 * 테마 카드 한 장. 프론트 ThemeListItem 과 같은 형태.
 * difficulty · priceFrom · activityLevel · imageUrl 은 크롤링 소스에 정보가 없으면 null 이다.
 */
export interface ThemeListItem {
  id: string;
  rank?: number;
  name: string;
  brandName: string;
  branchName: string;
  region: string;
  genre: ThemeGenre;
  difficulty: number | null;
  priceFrom: number | null;
  activityLevel: ThemeActivityLevel | null;
  /** 크롤링한 원본 포스터 URL. 프론트가 Next 이미지 최적화를 거쳐 표시한다. */
  imageUrl: string | null;
  liked: boolean;
}

export interface ThemeFacetOption {
  value: string;
  label: string;
  count: number;
}

export interface ThemeFacets {
  brands: ThemeFacetOption[];
  regions: ThemeFacetOption[];
  genres: ThemeFacetOption[];
  activityLevels: ThemeFacetOption[];
}

export interface GetThemesResponse {
  items: ThemeListItem[];
  nextCursor: string | null;
  totalCount: number;
  facets: ThemeFacets;
}

export interface PutThemeLikeResponse {
  liked: boolean;
}
