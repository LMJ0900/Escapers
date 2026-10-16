import { Module } from "@nestjs/common";
import { AdapterRegistry } from "./adapters/adapter.registry";
import { PoliteFetcher } from "./http/polite-fetcher";
import { ThemeCrawlService } from "./theme-crawl.service";

// 크롤러 모듈 (백엔드 명세서 §6). 지금은 CLI(src/crawl.ts)에서 수동 실행하고,
// BullMQ 도입 시 워커의 crawl:themes 프로세서가 ThemeCrawlService 를 호출한다.
@Module({
  providers: [AdapterRegistry, PoliteFetcher, ThemeCrawlService],
  exports: [AdapterRegistry, ThemeCrawlService],
})
export class CrawlerModule {}
