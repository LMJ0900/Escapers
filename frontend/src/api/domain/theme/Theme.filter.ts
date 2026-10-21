import type { GetThemesRequest } from "@/api/domain/theme/getThemes/request/GetThemesReq";
import { THEME_ACTIVITY, THEME_GENRE } from "@escapers/shared";

import { THEME_SORT } from "@/api/domain/theme/Theme.label";

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
  const sort = sortRaw && THEME_SORT.is(sortRaw) ? sortRaw : "POPULAR";

  return {
    brands: splitParam(searchParams.brands),
    regions: splitParam(searchParams.regions),
    genres: splitParam(searchParams.genres).filter(THEME_GENRE.is),
    activityLevels: splitParam(searchParams.activityLevels).filter(
      THEME_ACTIVITY.is
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
