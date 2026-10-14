import type { GetThemesRequest } from "@/api/domain/theme/getThemes/request/GetThemesReq";
import type {
  ThemeActivityLevel,
  ThemeGenre,
  ThemeSortOption,
} from "@/api/domain/theme/Theme.type";

/** 테마 카드(캐러셀·모든 테마 공통)에 쓰는 장르/활동성 표시 라벨. */
export const GENRE_LABEL: Record<ThemeGenre, string> = {
  HORROR: "공포",
  IMMERSIVE: "이머시브",
  MYSTERY: "추리",
  SF: "SF",
  COMEDY: "코미디",
};

export const ACTIVITY_LABEL: Record<ThemeActivityLevel, string> = {
  HIGH: "활동 높음",
  MEDIUM: "활동 보통",
  LOW: "활동 적음",
};

export const THEME_SORT_OPTIONS: { value: ThemeSortOption; label: string }[] = [
  { value: "POPULAR", label: "인기순" },
  { value: "NEWEST", label: "최신순" },
  { value: "PRICE_ASC", label: "가격 낮은 순" },
  { value: "PRICE_DESC", label: "가격 높은 순" },
  { value: "DIFFICULTY_DESC", label: "난이도 높은순" },
  { value: "DIFFICULTY_ASC", label: "난이도 낮은순" },
];

const SORT_VALUES = THEME_SORT_OPTIONS.map((option) => option.value);
const GENRE_VALUES = ["HORROR", "IMMERSIVE", "MYSTERY", "SF", "COMEDY"];
const ACTIVITY_VALUES = ["HIGH", "MEDIUM", "LOW"];

export type ThemeFilterState = Required<
  Pick<GetThemesRequest, "brands" | "regions" | "genres" | "activityLevels">
> &
  Required<Pick<GetThemesRequest, "sort">>;

function splitParam(value: string | string[] | undefined): string[] {
  if (!value) return [];
  const raw = Array.isArray(value) ? value.join(",") : value;
  return raw.split(",").filter(Boolean);
}

/**
 * URL searchParams(서버 컴포넌트의 await된 값, 또는 클라이언트 URLSearchParams를
 * Object.fromEntries 한 값)을 필터 상태로 바꾼다. 모르는 값은 조용히 무시한다.
 */
export function parseThemeSearchParams(
  searchParams: Record<string, string | string[] | undefined>
): ThemeFilterState {
  const sortRaw = Array.isArray(searchParams.sort)
    ? searchParams.sort[0]
    : searchParams.sort;
  const sort = SORT_VALUES.includes(sortRaw as ThemeSortOption)
    ? (sortRaw as ThemeSortOption)
    : "POPULAR";

  return {
    brands: splitParam(searchParams.brands),
    regions: splitParam(searchParams.regions),
    genres: splitParam(searchParams.genres).filter((genre) =>
      GENRE_VALUES.includes(genre)
    ),
    activityLevels: splitParam(searchParams.activityLevels).filter((activity) =>
      ACTIVITY_VALUES.includes(activity)
    ),
    sort,
  };
}

/** 필터 상태를 URL 쿼리 문자열로 바꾼다. 비어있거나 기본값인 항목은 생략한다. */
export function themeFilterStateToSearchParams(
  filters: ThemeFilterState
): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.brands.length > 0) params.set("brands", filters.brands.join(","));
  if (filters.regions.length > 0)
    params.set("regions", filters.regions.join(","));
  if (filters.genres.length > 0) params.set("genres", filters.genres.join(","));
  if (filters.activityLevels.length > 0)
    params.set("activityLevels", filters.activityLevels.join(","));
  if (filters.sort !== "POPULAR") params.set("sort", filters.sort);
  return params;
}

export function isThemeFilterEmpty(filters: ThemeFilterState): boolean {
  return (
    filters.brands.length === 0 &&
    filters.regions.length === 0 &&
    filters.genres.length === 0 &&
    filters.activityLevels.length === 0
  );
}
