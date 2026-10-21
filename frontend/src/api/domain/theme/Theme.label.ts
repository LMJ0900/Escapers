import { defineLabeledEnum } from "@escapers/shared";

import type {
  ThemeActivityLevel,
  ThemeReviewSort,
  ThemeSortOption,
} from "@/api/domain/theme/Theme.type";

// 응답값 → 화면 문구 매핑 중 프론트에서만 쓰는 것을 모은다.
/** 테마 목록 정렬. 선언 순서가 곧 메뉴 순서다. */
export const THEME_SORT = defineLabeledEnum({
  POPULAR: "인기순",
  NEWEST: "최신순",
  PRICE_ASC: "가격 낮은 순",
  PRICE_DESC: "가격 높은 순",
  DIFFICULTY_DESC: "난이도 높은순",
  DIFFICULTY_ASC: "난이도 낮은순",
} satisfies Record<ThemeSortOption, string>);

/** 테마 상세 후기 정렬 */
export const REVIEW_SORT = defineLabeledEnum({
  HELPFUL: "도움순",
  NEWEST: "최신순",
  RATING_DESC: "평점 높은순",
  RATING_ASC: "평점 낮은순",
} satisfies Record<ThemeReviewSort, string>);

/** 테마 상세의 활동성 단계별 복장 안내 문구 */
export const ACTIVITY_NOTICE: Record<ThemeActivityLevel, string> = {
  HIGH: "격한 움직임이 예상됩니다. 편한 복장을 준비해주세요",
  MEDIUM: "활동성이 조금 있어요 무리 없이 걸을 수 있는 복장을 추천드려요",
  LOW: "활동성이 낮습니다. 평소 복장 그대로 편하게 오시면 됩니다",
};
