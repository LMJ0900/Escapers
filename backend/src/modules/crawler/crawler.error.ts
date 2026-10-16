// 크롤러 내부 에러. HTTP 응답으로 나가지 않으므로 AppException 대신 Error 를 쓴다.

/** 403 · 429 · CAPTCHA 등 차단 응답. 소스를 일시 중지해야 한다 (§6.3) */
export class CrawlBlockedError extends Error {
  constructor(
    readonly url: string,
    readonly status: number
  ) {
    super(`차단 응답을 받았습니다 (${status}): ${url}`);
    this.name = "CrawlBlockedError";
  }
}

/** robots.txt 가 금지한 경로 요청 */
export class CrawlDisallowedError extends Error {
  constructor(readonly url: string) {
    super(`robots.txt 가 금지한 경로입니다: ${url}`);
    this.name = "CrawlDisallowedError";
  }
}

/** 파서 출력이 스키마와 맞지 않음 → 사이트 구조 변경 신호 (CRAWL_PARSE_FAILED) */
export class CrawlParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CrawlParseError";
  }
}
