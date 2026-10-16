import { Logger, Module } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppConfigModule } from "./config/config.module";
import { PrismaModule } from "./infra/prisma/prisma.module";
import { AdapterRegistry } from "./modules/crawler/adapters/adapter.registry";
import { CrawlerModule } from "./modules/crawler/crawler.module";
import {
  ThemeCrawlService,
  type ThemeCrawlReason,
} from "./modules/crawler/theme-crawl.service";

// 테마 수집 수동 실행 CLI (백엔드 명세서 §7.3 "소스 등록 시 1회 · 관리자 수동 실행").
//   node dist/crawl <adapterKey | all> [INITIAL|MANUAL]
@Module({ imports: [AppConfigModule, PrismaModule, CrawlerModule] })
class CrawlCliModule {}

async function main() {
  const logger = new Logger("Crawl");
  const [target, reasonArg] = process.argv.slice(2);
  const app = await NestFactory.createApplicationContext(CrawlCliModule, {
    logger: ["log", "warn", "error"],
  });

  try {
    const registry = app.get(AdapterRegistry);
    const crawler = app.get(ThemeCrawlService);
    if (!target) {
      logger.error(
        `대상을 지정하세요: npm run crawl -- <${[...registry.keys(), "all"].join(" | ")}>`
      );
      process.exitCode = 1;
      return;
    }

    const keys = target === "all" ? registry.keys() : [target];
    for (const key of keys) {
      const source = await crawler.ensureSource(key);
      const reason = (reasonArg ??
        (source.lastSuccessAt ? "MANUAL" : "INITIAL")) as ThemeCrawlReason;
      logger.log(`[${key}] 테마 수집 시작 (${reason})`);
      const stats = await crawler.crawl(source, reason);
      logger.log(`[${key}] 완료 ${JSON.stringify(stats)}`);
    }
  } catch (error) {
    logger.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}
void main();
