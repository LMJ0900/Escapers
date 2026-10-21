export interface SearchThemesRequest {
  /** 테마명·장르·지점에서 찾을 검색어. 공백으로 나누면 모든 단어가 어딘가에 포함된 테마만 남는다. */
  keyword: string;
}
