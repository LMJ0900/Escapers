import apiClient from "@/api/ApiClient";

import type {
  ThemeCollectionType,
  ThemeReviewSort,
} from "@/api/domain/theme/Theme.type";
import type { getThemeCollectionResponse } from "@/api/domain/theme/getThemeCollection/response/getThemeCollectionRes";
import type { getThemeDetailResponse } from "@/api/domain/theme/getThemeDetail/response/getThemeDetailRes";
import type { GetThemeReviewsRequest } from "@/api/domain/theme/getThemeReviews/request/GetThemeReviewsReq";
import type { getThemeReviewsResponse } from "@/api/domain/theme/getThemeReviews/response/getThemeReviewsRes";
import type { getThemeSlotsResponse } from "@/api/domain/theme/getThemeSlots/response/getThemeSlotsRes";
import type { GetThemesRequest } from "@/api/domain/theme/getThemes/request/GetThemesReq";
import type { getThemesResponse } from "@/api/domain/theme/getThemes/response/getThemesRes";
import type { SearchThemesRequest } from "@/api/domain/theme/searchThemes/request/SearchThemesReq";
import type { searchThemesResponse } from "@/api/domain/theme/searchThemes/response/searchThemesRes";

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

  /**
   * 헤더 검색 결과 쿼리 키. 목록 쿼리 키 아래에 둬서 좋아요 변경이 검색 결과에도 함께 반영된다.
   * 응답이 `{ items }` 모양이라 useThemeLike 의 캐시 갱신도 그 모양을 알고 있어야 한다.
   */
  static readonly searchThemesQueryKey = (keyword: string) =>
    [...ThemeQuery.themeListQueryKey, "search", keyword] as const;

  static searchThemes({
    keyword,
  }: SearchThemesRequest): Promise<searchThemesResponse> {
    return apiClient<searchThemesResponse>({
      urlPath: "/theme/search",
      method: "GET",
      params: { keyword },
    });
  }

  /**
   * 테마 상세 쿼리 키. 목록 쿼리 키(themeListQueryKey) 아래에 두지 않는다 —
   * 좋아요 같은 목록 갱신 로직이 배열/페이지 모양만 가정하고 있어서, 상세는 따로 갱신한다.
   */
  static readonly getThemeDetailQueryKey = (themeId: string) =>
    ["theme", "detail", themeId] as const;

  static getThemeDetail(themeId: string): Promise<getThemeDetailResponse> {
    return apiClient<getThemeDetailResponse>({
      urlPath: `/theme/${themeId}`,
      method: "GET",
    });
  }

  static readonly getThemeSlotsQueryKey = (themeId: string) =>
    ["theme", "slots", themeId] as const;

  static getThemeSlots(themeId: string): Promise<getThemeSlotsResponse> {
    return apiClient<getThemeSlotsResponse>({
      urlPath: `/theme/${themeId}/slots`,
      method: "GET",
    });
  }

  /** 한 테마의 후기 목록 쿼리 키 접두사. 정렬·필터와 관계없이 이 테마의 후기 캐시를 한 번에 갱신할 때 쓴다. */
  static readonly themeReviewsQueryKey = (themeId: string) =>
    ["theme", "reviews", themeId] as const;

  /** 후기 목록 쿼리 키. 정렬·사진 후기 필터가 바뀌면 이 아래에서 새 키가 만들어진다. */
  static readonly getThemeReviewsQueryKey = (
    themeId: string,
    options: { sort: ThemeReviewSort; photoOnly: boolean }
  ) => [...ThemeQuery.themeReviewsQueryKey(themeId), options] as const;

  static getThemeReviews({
    themeId,
    sort,
    photoOnly,
    cursor,
    size,
  }: GetThemeReviewsRequest): Promise<getThemeReviewsResponse> {
    return apiClient<getThemeReviewsResponse>({
      urlPath: `/theme/${themeId}/reviews`,
      method: "GET",
      params: {
        sort: sort ?? "HELPFUL",
        size: size ?? 5,
        ...(photoOnly && { photoOnly: "true" }),
        ...(cursor && { cursor }),
      },
    });
  }
}
