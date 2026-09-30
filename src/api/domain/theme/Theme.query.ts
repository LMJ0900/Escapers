import apiClient from "@/api/ApiClient";

import type { getActiveThemesResponse } from "@/api/domain/theme/getActiveThemes/response/getActiveThemesRes";
import type { getHorrorThemesResponse } from "@/api/domain/theme/getHorrorThemes/response/getHorrorThemesRes";
import type { getHotThemesResponse } from "@/api/domain/theme/getHotThemes/response/getHotThemesRes";

export class ThemeQuery {
  /**
   * 테마 목록 쿼리 키의 공통 접두사. 좋아요처럼 여러 목록에 동시에 반영돼야 하는
   * 변경은 이 접두사로 한 번에 갱신한다. 새 목록 쿼리 키도 반드시 이 아래에 둔다.
   */
  static readonly themeListQueryKey = ["theme", "list"] as const;
  static readonly getHotThemesQueryKey = [
    ...ThemeQuery.themeListQueryKey,
    "hot",
  ] as const;
  static readonly getHorrorThemesQueryKey = [
    ...ThemeQuery.themeListQueryKey,
    "horror",
  ] as const;
  static readonly getActiveThemesQueryKey = [
    ...ThemeQuery.themeListQueryKey,
    "active",
  ] as const;

  static getHotThemes(): Promise<getHotThemesResponse> {
    return apiClient<getHotThemesResponse>({
      urlPath: "/theme/hot",
      method: "GET",
    });
  }

  static getHorrorThemes(): Promise<getHorrorThemesResponse> {
    return apiClient<getHorrorThemesResponse>({
      urlPath: "/theme/horror",
      method: "GET",
    });
  }

  static getActiveThemes(): Promise<getActiveThemesResponse> {
    return apiClient<getActiveThemesResponse>({
      urlPath: "/theme/active",
      method: "GET",
    });
  }

  /**
   * 테마 목록 종류별 쿼리 키/함수. 서버 컴포넌트에서 클라이언트 컴포넌트로 함수를 넘길 수 없어,
   * 컴포넌트에는 목록 종류(ThemeListType)만 넘기고 여기서 찾아 쓴다.
   */
  static readonly themeLists = {
    hot: {
      queryKey: ThemeQuery.getHotThemesQueryKey,
      queryFn: ThemeQuery.getHotThemes,
    },
    horror: {
      queryKey: ThemeQuery.getHorrorThemesQueryKey,
      queryFn: ThemeQuery.getHorrorThemes,
    },
    active: {
      queryKey: ThemeQuery.getActiveThemesQueryKey,
      queryFn: ThemeQuery.getActiveThemes,
    },
  } as const;
}

export type ThemeListType = keyof typeof ThemeQuery.themeLists;
