/** 테마 목록(핫한 테마, 장르별 테마 등)에서 카드 한 장으로 표시되는 테마 요약 정보. */
export interface ThemeSummary {
  id: string;
  rank: number;
  name: string;
  branchName: string;
  liked: boolean;
}
