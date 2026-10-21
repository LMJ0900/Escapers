import type { ThemeListItem } from "@/api/domain/theme/Theme.type";

export interface searchThemesResponse {
  /** 검색어와 가장 잘 맞는 순서로 정렬된 테마 */
  items: ThemeListItem[];
  totalCount: number;
  /** 결과에서 뽑은 연관 검색어(장르·브랜드·지역). 검색어와 겹치는 값은 제외한다. */
  relatedKeywords: string[];
}
