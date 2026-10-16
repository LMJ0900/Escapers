import type { ThemeSortOption } from "@/api/domain/theme/Theme.type";

export interface GetThemesRequest {
  brands?: string[];
  regions?: string[];
  /** 서버가 아는 장르 코드만 실제로 매칭되고, 그 외 값은 결과에 영향 없이 무시된다. */
  genres?: string[];
  /** 서버가 아는 활동성 코드만 실제로 매칭되고, 그 외 값은 결과에 영향 없이 무시된다. */
  activityLevels?: string[];
  sort?: ThemeSortOption;
  /** 다음 페이지를 가져올 때 이전 응답의 nextCursor를 그대로 전달한다. 첫 페이지는 생략. */
  cursor?: string;
  size?: number;
}
