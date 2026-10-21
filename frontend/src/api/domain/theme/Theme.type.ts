import type { ThemeActivityLevel, ThemeGenre } from "@escapers/shared";

/** 장르·활동성 값과 라벨은 @escapers/shared 에서 정의한다. */
export type { ThemeActivityLevel, ThemeGenre };

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
  /** 1~5. 크롤링 소스에 정보가 없으면 null */
  difficulty: number | null;
  priceFrom: number | null;
  activityLevel: ThemeActivityLevel | null;
  /** 크롤링한 원본 포스터 URL. 크롤링 소스에 이미지가 없으면 null */
  imageUrl: string | null;
  liked: boolean;
}

/** 테마 상세의 지점 정보. 크롤링 소스에 정보가 없는 항목은 null 이다. */
export interface ThemeBranchInfo {
  /** 화면에 보여줄 지점 이름 (예: "제로월드 강남점") */
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  /** 가는 길 안내 (예: "강남역 3번 출구 도보 5분") */
  transit: string | null;
  phone: string | null;
  openingHours: string | null;
  /** 지점의 외부 예약 페이지. 예약 대행은 범위 밖이라 이 링크로 이동시킨다. */
  bookingUrl: string | null;
}

/** 테마 상세 페이지에 보여주는 정보. 카드 정보(ThemeListItem)에 상세 항목을 더한다. */
export interface ThemeDetail extends Omit<ThemeListItem, "rank"> {
  likeCount: number;
  minPlayers: number | null;
  maxPlayers: number | null;
  /** 플레이 시간(분) */
  playMinutes: number | null;
  description: string | null;
  /** 리뷰가 없으면 null */
  ratingAvg: number | null;
  reviewCount: number;
  branch: ThemeBranchInfo;
}

export interface ThemeSlot {
  /** "HH:mm" */
  time: string;
  available: boolean;
}

export interface ThemeSlotDay {
  /** "YYYY-MM-DD" */
  date: string;
  slots: ThemeSlot[];
}

export type ThemeReviewSort =
  "HELPFUL" | "NEWEST" | "RATING_DESC" | "RATING_ASC";

export interface ThemeReview {
  id: string;
  nickname: string;
  /** 1~5 */
  rating: number;
  /** 작성일 "YYYY-MM-DD" */
  writtenAt: string;
  playerCount: number | null;
  cleared: boolean;
  /** 탈출 성공 시 남은 시간(초) */
  remainingSeconds: number | null;
  hintCount: number | null;
  content: string;
  photoUrls: string[];
  helpfulCount: number;
  helped: boolean;
}

export interface ThemeReviewSummary {
  /** 리뷰가 없으면 null */
  ratingAvg: number | null;
  reviewCount: number;
  /** 5점 → 1점 순서 */
  distribution: { rating: number; count: number }[];
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
