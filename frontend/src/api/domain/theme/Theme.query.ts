import apiClient from "@/api/ApiClient";

import type { ThemeCollectionType } from "@/api/domain/theme/Theme.type";
import type { getThemeCollectionResponse } from "@/api/domain/theme/getThemeCollection/response/getThemeCollectionRes";
import type { GetThemesRequest } from "@/api/domain/theme/getThemes/request/GetThemesReq";
import type { getThemesResponse } from "@/api/domain/theme/getThemes/response/getThemesRes";

/** 배열 필터는 선택 순서가 달라도 같은 쿼리 키를 가지도록 정렬해서 직렬화한다. */
function serializeThemeFilters(filters: Omit<GetThemesRequest, "cursor">) {
  return {
    brands: [...(filters.brands ?? [])].sort(),
    regions: [...(filters.regions ?? [])].sort(),
    genres: [...(filters.genres ?? [])].sort(),
    activityLevels: [...(filters.activityLevels ?? [])].sort(),
    sort: filters.sort ?? "POPULAR",
    size: filters.size ?? 20,
  };
}

/** 쿼리 파라미터로 보낼 배열 필터를 콤마 구분 문자열로 합친다. 빈 배열은 보내지 않는다. */
function toQueryParams({
  cursor,
  ...filters
}: GetThemesRequest): Record<string, string | number | undefined> {
  const joined = serializeThemeFilters(filters);
  return {
    ...(joined.brands.length > 0 && { brands: joined.brands.join(",") }),
    ...(joined.regions.length > 0 && { regions: joined.regions.join(",") }),
    ...(joined.genres.length > 0 && { genres: joined.genres.join(",") }),
    ...(joined.activityLevels.length > 0 && {
      activityLevels: joined.activityLevels.join(","),
    }),
    sort: joined.sort,
    size: joined.size,
    ...(cursor && { cursor }),
  };
}

export class ThemeQuery {
  /**
   * 테마 목록 쿼리 키의 공통 접두사. 좋아요처럼 여러 목록에 동시에 반영돼야 하는
   * 변경은 이 접두사로 한 번에 갱신한다. 새 목록 쿼리 키도 반드시 이 아래에 둔다.
   */
  static readonly themeListQueryKey = ["theme", "list"] as const;

  /**
   * 홈 화면 캐러셀용 테마 묶음 쿼리 키. 서버 컴포넌트에서 클라이언트 컴포넌트로 함수를 넘길 수
   * 없어서, 컴포넌트에는 묶음 종류(ThemeCollectionType)만 넘기고 키/함수는 여기서 만든다.
   */
  static readonly getThemeCollectionQueryKey = (type: ThemeCollectionType) =>
    [...ThemeQuery.themeListQueryKey, "collection", type] as const;

  static getThemeCollection(
    type: ThemeCollectionType
  ): Promise<getThemeCollectionResponse> {
    return apiClient<getThemeCollectionResponse>({
      urlPath: `/theme/collections/${type}`,
      method: "GET",
    });
  }

  /** "모든 테마" 목록 쿼리 키의 접두사. 필터/정렬이 바뀌면 이 아래에서 새 키가 만들어진다. */
  static readonly getThemesQueryKey = (
    filters: Omit<GetThemesRequest, "cursor">
  ) =>
    [
      ...ThemeQuery.themeListQueryKey,
      "all",
      serializeThemeFilters(filters),
    ] as const;

  static getThemes(params: GetThemesRequest): Promise<getThemesResponse> {
    return apiClient<getThemesResponse>({
      urlPath: "/theme",
      method: "GET",
      params: toQueryParams(params),
    });
  }
}
