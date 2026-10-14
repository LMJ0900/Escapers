export type ThemeGenre = "HORROR" | "IMMERSIVE" | "MYSTERY" | "SF" | "COMEDY";

export type ThemeActivityLevel = "HIGH" | "MEDIUM" | "LOW";

/** 홈 화면 캐러셀에 보여주는 테마 묶음 종류. 각 묶음의 선정 기준은 서버가 정한다. */
export type ThemeCollectionType = "hot" | "horror" | "active";

export type ThemeSortOption =
  | "POPULAR"
  | "NEWEST"
  | "PRICE_ASC"
  | "PRICE_DESC"
  | "DIFFICULTY_DESC"
  | "DIFFICULTY_ASC";

/**
 * 테마 카드 한 장으로 표시되는 정보. "모든 테마" 목록과 홈 화면 캐러셀이 공통으로 쓴다.
 * `rank`는 홈 화면 캐러셀(핫한 테마 등 순위가 있는 목록)에만 있고, "모든 테마"에는 없다.
 */
export interface ThemeListItem {
  id: string;
  rank?: number;
  name: string;
  brandName: string;
  branchName: string;
  region: string;
  genre: ThemeGenre;
  /** 1~5 */
  difficulty: number;
  priceFrom: number;
  activityLevel: ThemeActivityLevel;
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
