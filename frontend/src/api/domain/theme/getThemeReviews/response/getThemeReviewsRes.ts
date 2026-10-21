import type {
  ThemeReview,
  ThemeReviewSummary,
} from "@/api/domain/theme/Theme.type";

export interface getThemeReviewsResponse {
  items: ThemeReview[];
  nextCursor: string | null;
  /** 필터(사진 후기만)와 관계없이 테마 전체 후기 기준의 평점 요약 */
  summary: ThemeReviewSummary;
}
