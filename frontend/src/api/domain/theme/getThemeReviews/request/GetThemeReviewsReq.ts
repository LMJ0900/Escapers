import type { ThemeReviewSort } from "@/api/domain/theme/Theme.type";

export interface GetThemeReviewsRequest {
  themeId: string;
  sort?: ThemeReviewSort;
  /** true 면 사진이 있는 후기만 내려준다. */
  photoOnly?: boolean;
  /** 다음 페이지를 가져올 때 이전 응답의 nextCursor를 그대로 전달한다. 첫 페이지는 생략. */
  cursor?: string;
  size?: number;
}
